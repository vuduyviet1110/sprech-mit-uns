import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const migrationsDir = resolve(root, 'prisma/migrations')

const migrationDirs = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()

const readMigration = (name: string) =>
  readFileSync(resolve(migrationsDir, name, 'migration.sql'), 'utf8')

describe('migration SQL', () => {
  it('có ít nhất một migration', () => {
    expect(migrationDirs.length).toBeGreaterThan(0)
  })

  // Postgres dùng `--`, không phải `#`. Một file từng mở đầu bằng `#` khiến
  // `prisma migrate deploy` chết với `syntax error at or near "#"` trên DB sạch,
  // mà DB đang chạy không bao giờ chạm tới nên không ai phát hiện.
  it('không dòng nào bắt đầu bằng `#` (không phải comment của Postgres)', () => {
    for (const name of migrationDirs) {
      const lines = readMigration(name).split('\n')
      lines.forEach((line, i) => {
        expect(
          line.trimStart().startsWith('#'),
          `${name}/migration.sql:${i + 1} — dùng "--" thay cho "#"`,
        ).toBe(false)
      })
    }
  })

  it('tên thư mục migration theo dạng <timestamp>_<snake_case>', () => {
    for (const name of migrationDirs) {
      expect(name, name).toMatch(/^\d{14}_[a-z0-9_]+$/)
    }
  })

  // Migration ở repo này viết tay (không có `migrate dev`), nên "thêm model mà
  // quên migration" là kiểu lỗi dễ xảy ra nhất — và chỉ lộ ra khi deploy DB sạch.
  it('mọi model trong schema.prisma đều có CREATE TABLE tương ứng', () => {
    const schema = readFileSync(resolve(root, 'prisma/schema.prisma'), 'utf8')
    const models = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((m) => m[1])
    expect(models.length).toBeGreaterThan(0)

    const allSql = migrationDirs.map(readMigration).join('\n')
    for (const model of models) {
      expect(
        allSql.includes(`CREATE TABLE IF NOT EXISTS "${model}"`) ||
          allSql.includes(`CREATE TABLE "${model}"`),
        `model ${model} chưa có CREATE TABLE trong prisma/migrations/`,
      ).toBe(true)
    }
  })
})
