#!/bin/sh
set -e

echo "Running prisma migrate deploy..."
pnpm exec prisma migrate deploy

# Full `prisma db seed` needs server/ sources not present in the runner image.
# Only upsert the demo login when explicitly enabled.
if [ "${SMU_SEED_DEMO}" = "1" ] || [ "${SMU_ALLOW_DEMO}" = "1" ]; then
  echo "Ensuring demo user..."
  pnpm exec tsx prisma/ensure-demo-user.ts
fi

exec node .output/server/index.mjs
