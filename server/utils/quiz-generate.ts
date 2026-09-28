import type { QuizQuestionInput } from './quiz-validate'

export interface VocabWordForQuiz {
  word: string
  meaning: string
  example?: string | null
  level?: string | null
  language?: string | null
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function tokenizeExample(example: string): string[] {
  return example
    .replace(/[„“"«»]/g, '')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
}

function makeCloze(example: string, word: string): { prompt: string; solution: string } | null {
  const clean = example.replace(/[„“"«»]/g, '').trim()
  const tokens = tokenizeExample(clean)
  if (tokens.length < 3) return null

  const lowerWord = word.trim().toLowerCase()
  let blankIdx = tokens.findIndex((t) =>
    t.toLowerCase().replace(/[.,!?;:]/g, '') === lowerWord,
  )
  if (blankIdx < 0) {
    // blank a content word near the middle
    blankIdx = Math.min(tokens.length - 1, Math.max(1, Math.floor(tokens.length / 2)))
  }

  const solution = tokens[blankIdx].replace(/[.,!?;:]+$/g, '')
  const promptTokens = [...tokens]
  promptTokens[blankIdx] = '___'
  return {
    prompt: promptTokens.join(' '),
    solution,
  }
}

/**
 * Build draft quiz questions from topic vocabulary.
 * Mix: MC, typed_recall, cloze, sentence_builder, dictation.
 */
export function generateQuestionsFromVocab(
  words: VocabWordForQuiz[],
  opts?: {
    maxQuestions?: number
    level?: string | null
    /** Extra words used only for MC distractors / scramble fillers */
    distractorPool?: VocabWordForQuiz[]
  },
): QuizQuestionInput[] {
  const max = opts?.maxQuestions ?? 8
  const level = opts?.level || undefined
  const drafts: QuizQuestionInput[] = []

  const usable = words.filter((w) => w.word?.trim() && w.meaning?.trim())
  if (!usable.length) return []

  const meaningPool = [
    ...usable,
    ...(opts?.distractorPool || []),
  ]
    .map((w) => w.meaning.trim())
    .filter(Boolean)

  const uniqueMeanings = [...new Map(meaningPool.map((m) => [m.toLowerCase(), m])).values()]

  const wordPool = [
    ...usable,
    ...(opts?.distractorPool || []),
  ]
    .map((w) => w.word.trim())
    .filter(Boolean)

  const shuffled = shuffle(usable)

  // Multiple choice (~35%)
  const mcLimit = Math.min(usable.length, Math.max(2, Math.ceil(max * 0.35)))
  for (const w of shuffled.slice(0, mcLimit)) {
    if (drafts.length >= max) break

    const correct = w.meaning.trim()
    const distractors = shuffle(
      uniqueMeanings.filter((m) => m.toLowerCase() !== correct.toLowerCase()),
    ).slice(0, 3)

    if (distractors.length < 1) continue

    const choices = shuffle([
      { text: correct, isCorrect: true },
      ...distractors.map((text) => ({ text, isCorrect: false })),
    ])

    drafts.push({
      text: `«${w.word.trim()}» có nghĩa là gì?`,
      type: 'multiple_choice',
      level: w.level || level || null,
      choices,
    })
  }

  // Typed recall: meaning → type L2 word
  for (const w of shuffle(usable).slice(0, Math.ceil(max * 0.25))) {
    if (drafts.length >= max) break
    drafts.push({
      text: `Gõ từ/cụm tương ứng với nghĩa: «${w.meaning.trim()}»`,
      type: 'typed_recall',
      level: w.level || level || null,
      targetSentence: w.word.trim(),
      solution: w.word.trim(),
    })
  }

  const withExample = shuffle(usable.filter((w) => w.example?.trim()))

  // Cloze from examples
  for (const w of withExample) {
    if (drafts.length >= max) break
    const cloze = makeCloze(w.example!, w.word)
    if (!cloze) continue
    drafts.push({
      text: `Điền từ còn thiếu: ${cloze.prompt}`,
      type: 'cloze',
      level: w.level || level || null,
      targetSentence: cloze.prompt,
      solution: cloze.solution,
    })
  }

  const remaining = max - drafts.length
  if (remaining <= 0 || !withExample.length) return drafts.slice(0, max)

  const builderCount = Math.ceil(remaining / 2)
  const builderWords = withExample.slice(0, builderCount)
  const dictationWords = withExample.slice(builderCount)

  for (const w of builderWords) {
    if (drafts.length >= max) break
    const example = w.example!.trim()
    const tokens = tokenizeExample(example)
    if (tokens.length < 2) continue

    const distractors = shuffle(
      wordPool.filter((x) => x.toLowerCase() !== w.word.trim().toLowerCase()),
    ).slice(0, 2)

    drafts.push({
      text: 'Sắp xếp các từ thành câu hoàn chỉnh',
      type: 'sentence_builder',
      level: w.level || level || null,
      solution: example.replace(/[„“"«»]/g, '').trim(),
      scrambleWords: shuffle([...tokens, ...distractors]),
    })
  }

  for (const w of dictationWords) {
    if (drafts.length >= max) break
    const example = w.example!.trim()
    drafts.push({
      text: 'Nghe phát âm và gõ lại chính xác câu bạn nghe được',
      type: 'dictation',
      level: w.level || level || null,
      targetSentence: example,
      solution: example,
    })
  }

  return drafts.slice(0, max)
}
