export type QuizQuestionType =
  | 'multiple_choice'
  | 'sentence_builder'
  | 'dictation'
  | 'typed_recall'
  | 'cloze'

export interface QuizChoiceInput {
  text: string
  isCorrect?: boolean
  index?: number
}

export interface QuizQuestionInput {
  id?: string
  text: string
  type: QuizQuestionType | string
  level?: string | null
  audioUrl?: string | null
  targetSentence?: string | null
  solution?: string | null
  scrambleWords?: string[]
  choices?: QuizChoiceInput[]
}

export function normalizeChoices(choices: QuizChoiceInput[] = []) {
  return choices.map((c, i) => ({
    index: typeof c.index === 'number' ? c.index : i,
    text: String(c.text || '').trim(),
    isCorrect: Boolean(c.isCorrect),
  })).filter((c) => c.text.length > 0)
}

export function validateQuestionInput(q: QuizQuestionInput): string | null {
  if (!q?.text?.trim()) return 'Question text is required'
  const type = q.type || 'multiple_choice'

  if (type === 'multiple_choice') {
    const choices = normalizeChoices(q.choices)
    if (choices.length < 2) return 'Multiple choice needs at least 2 choices'
    const correctCount = choices.filter((c) => c.isCorrect).length
    if (correctCount !== 1) return 'Multiple choice needs exactly 1 correct answer'
    return null
  }

  if (type === 'sentence_builder') {
    if (!q.solution?.trim()) return 'Sentence builder needs a solution'
    if (!Array.isArray(q.scrambleWords) || q.scrambleWords.filter(Boolean).length < 2) {
      return 'Sentence builder needs at least 2 scramble words'
    }
    return null
  }

  if (type === 'dictation' || type === 'typed_recall' || type === 'cloze') {
    const target = (q.targetSentence || q.solution || '').trim()
    if (!target) return `${type} needs targetSentence or solution`
    return null
  }

  return `Unsupported question type: ${type}`
}

export function toCreateData(topicId: string, q: QuizQuestionInput) {
  const type = (q.type || 'multiple_choice') as string
  const base = {
    topicId,
    text: q.text.trim(),
    type,
    level: q.level || null,
    audioUrl: q.audioUrl || null,
    targetSentence: q.targetSentence || null,
    solution: q.solution || null,
    scrambleWords: Array.isArray(q.scrambleWords) ? q.scrambleWords.filter(Boolean) : [],
  }

  if (type === 'multiple_choice') {
    return {
      ...base,
      choices: {
        create: normalizeChoices(q.choices),
      },
    }
  }

  if (type === 'dictation' || type === 'typed_recall' || type === 'cloze') {
    const solution = (q.solution || q.targetSentence || '').trim()
    return {
      ...base,
      targetSentence: (q.targetSentence || solution).trim(),
      solution,
    }
  }

  return base
}
