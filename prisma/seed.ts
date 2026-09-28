import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { topicsDe, topicsCs } from './data/topics'
import { vocabDe } from './data/vocab-de'
import { vocabCs } from './data/vocab-cs'
import { generateQuestionsFromVocab } from '../server/utils/quiz-generate'
import { DEMO_EMAIL, isDemoAllowed } from '../server/utils/demo'

const prisma = new PrismaClient()

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function seedTopics(topics: typeof topicsDe) {
  for (const topicData of topics) {
    await prisma.topic.upsert({
      where: { slug: topicData.slug },
      update: topicData,
      create: topicData,
    })
    console.log(`✅ Topic: ${topicData.name}`)
  }
}

async function seedVocab(
  words: Array<{
    word: string
    meaning: string
    example: string
    type: string
    level: string
    topicSlug: string
    language: string
  }>,
) {
  for (const wordData of words) {
    const { topicSlug, ...wordFields } = wordData
    const existing = await prisma.vocabularyWord.findFirst({
      where: {
        word: wordFields.word,
        language: wordFields.language,
        level: wordFields.level,
      },
    })

    let word
    if (existing) {
      word = await prisma.vocabularyWord.update({
        where: { id: existing.id },
        data: wordFields,
      })
    } else {
      word = await prisma.vocabularyWord.create({ data: wordFields })
    }

    const topic = await prisma.topic.findUnique({ where: { slug: topicSlug } })
    if (topic) {
      await prisma.wordTopic.upsert({
        where: {
          wordId_topicId: { wordId: word.id, topicId: topic.id },
        },
        update: {},
        create: { wordId: word.id, topicId: topic.id },
      })
    }
  }
  console.log(`✅ Seeded ${words.length} vocabulary words`)
}

async function seedQuizzesForAllTopics() {
  const topics = await prisma.topic.findMany({
    include: {
      words: { include: { word: true } },
      quizQuestions: true,
    },
  })

  for (const topic of topics) {
    if (topic.quizQuestions.length >= 5) {
      console.log(`⏭ Quiz skip (exists): ${topic.slug}`)
      continue
    }

    const vocab = topic.words
      .map((wt) => wt.word)
      .filter(Boolean)
      .map((w) => ({
        word: w!.word,
        meaning: w!.meaning,
        example: w!.example,
        level: w!.level,
        language: w!.language,
      }))

    if (vocab.length < 4) continue

    // Clear thin old quizzes then regenerate
    if (topic.quizQuestions.length > 0 && topic.quizQuestions.length < 5) {
      await prisma.quizQuestion.deleteMany({ where: { topicId: topic.id } })
    }

    const drafts = generateQuestionsFromVocab(vocab, {
      maxQuestions: 8,
      level: topic.level,
      distractorPool: shuffle(vocab).slice(0, 20),
    })

    for (const draft of drafts) {
      await prisma.quizQuestion.create({
        data: {
          topicId: topic.id,
          text: draft.text,
          type: draft.type,
          level: draft.level || topic.level,
          targetSentence: draft.targetSentence || null,
          solution: draft.solution || null,
          scrambleWords: draft.scrambleWords || [],
          choices: draft.choices?.length
            ? {
                create: draft.choices.map((c, index) => ({
                  index,
                  text: c.text,
                  isCorrect: c.isCorrect,
                })),
              }
            : undefined,
        },
      })
    }
    console.log(`✅ Quiz generated (${drafts.length}): ${topic.slug}`)
  }
}

async function seedDemoUser() {
  if (!isDemoAllowed('seed')) {
    console.log('⏭ Skip demo user (production — set SMU_SEED_DEMO=1 to force)')
    return
  }
  const passwordHash = await bcrypt.hash('demo123', 10)
  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash },
    create: { email: DEMO_EMAIL, passwordHash },
  })
  console.log(`✅ Demo user: ${DEMO_EMAIL} / demo123`)
}

async function main() {
  console.log('🌱 Seeding Sprech Mit Uns curriculum...')
  await seedDemoUser()
  await seedTopics(topicsDe)
  await seedTopics(topicsCs)
  await seedVocab(vocabDe)
  await seedVocab(vocabCs)
  await seedQuizzesForAllTopics()
  console.log('🎉 Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
