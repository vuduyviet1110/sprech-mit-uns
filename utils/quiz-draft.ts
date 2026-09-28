import type { QuizQuestion, QuizQuestionType } from '~/utils/types'

export interface DraftQuizQuestion {
  id?: string
  text: string
  type: QuizQuestionType | string
  level?: string | null
  targetSentence?: string | null
  solution?: string | null
  scrambleWordsText?: string
  choices?: { text: string; isCorrect: boolean }[]
}

export function emptyDraftQuestion(type: QuizQuestionType = 'multiple_choice'): DraftQuizQuestion {
  if (type === 'sentence_builder') {
    return {
      text: 'Sắp xếp các từ thành câu hoàn chỉnh',
      type,
      solution: '',
      scrambleWordsText: '',
    }
  }
  if (type === 'dictation') {
    return {
      text: 'Nghe phát âm và gõ lại chính xác câu bạn nghe được',
      type,
      targetSentence: '',
      solution: '',
    }
  }
  if (type === 'typed_recall') {
    return {
      text: 'Gõ từ/cụm tương ứng với nghĩa…',
      type,
      targetSentence: '',
      solution: '',
    }
  }
  if (type === 'cloze') {
    return {
      text: 'Điền từ còn thiếu trong câu (dùng ___ cho chỗ trống)',
      type,
      targetSentence: '',
      solution: '',
    }
  }
  return {
    text: '',
    type: 'multiple_choice',
    choices: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  }
}

export function draftFromApi(q: QuizQuestion): DraftQuizQuestion {
  return {
    id: q.id,
    text: q.text,
    type: q.type || 'multiple_choice',
    level: q.level,
    targetSentence: q.targetSentence,
    solution: q.solution,
    scrambleWordsText: (q.scrambleWords || []).join(' '),
    choices: q.choices?.length
      ? q.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect }))
      : undefined,
  }
}

export function draftToPayload(q: DraftQuizQuestion) {
  const type = q.type || 'multiple_choice'
  const payload: Record<string, any> = {
    text: q.text?.trim(),
    type,
    level: q.level || null,
  }
  if (q.id) payload.id = q.id

  if (type === 'multiple_choice') {
    payload.choices = (q.choices || []).map((c, i) => ({
      index: i,
      text: c.text.trim(),
      isCorrect: Boolean(c.isCorrect),
    }))
  } else if (type === 'sentence_builder') {
    payload.solution = q.solution?.trim()
    payload.scrambleWords = (q.scrambleWordsText || '')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter(Boolean)
  } else if (type === 'dictation' || type === 'typed_recall' || type === 'cloze') {
    const target = (q.targetSentence || q.solution || '').trim()
    payload.targetSentence = target
    payload.solution = (q.solution || target).trim()
  }
  return payload
}
