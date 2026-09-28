import { normalizeAnswerText } from '~/server/utils/demo'

export type GradeableQuestion = {
  type: string
  solution: string | null
  targetSentence: string | null
  choices: { index: number; isCorrect: boolean; text?: string }[]
}

/**
 * Server-side grade — never trust client isCorrect.
 */
export function gradeQuizAnswer(
  question: GradeableQuestion,
  selectedIndex: number,
  typedAnswer?: string,
): boolean {
  const type = question.type || 'multiple_choice'

  if (type === 'multiple_choice' || question.choices?.length) {
    const choice = question.choices.find((c) => c.index === selectedIndex)
    if (choice) return !!choice.isCorrect
  }

  const expected = normalizeAnswerText(
    question.solution || question.targetSentence || '',
  )
  if (!expected) return false

  if (typeof typedAnswer === 'string' && typedAnswer.trim()) {
    return normalizeAnswerText(typedAnswer) === expected
  }

  // sentence_builder etc. sometimes send selectedIndex as N/A (-1)
  return false
}
