import { describe, expect, it } from 'vitest'
import { gradeQuizAnswer } from '~/server/utils/quiz-grade'
import { DEMO_EMAIL, isDemoAllowed } from '~/server/utils/demo'

describe('gradeQuizAnswer', () => {
  it('grades multiple choice from choice.isCorrect', () => {
    const q = {
      type: 'multiple_choice',
      solution: null,
      targetSentence: null,
      choices: [
        { index: 0, isCorrect: false },
        { index: 1, isCorrect: true },
        { index: 2, isCorrect: false },
      ],
    }
    expect(gradeQuizAnswer(q, 1)).toBe(true)
    expect(gradeQuizAnswer(q, 0)).toBe(false)
  })

  it('grades typed answers against solution', () => {
    const q = {
      type: 'dictation',
      solution: 'Guten Tag!',
      targetSentence: null,
      choices: [],
    }
    expect(gradeQuizAnswer(q, -1, 'guten tag')).toBe(true)
    expect(gradeQuizAnswer(q, -1, 'wrong')).toBe(false)
  })

  it('ignores client-claimed correctness (no typed, wrong index)', () => {
    const q = {
      type: 'multiple_choice',
      solution: null,
      targetSentence: null,
      choices: [{ index: 0, isCorrect: true }],
    }
    expect(gradeQuizAnswer(q, 99)).toBe(false)
  })
})

describe('isDemoAllowed', () => {
  it('blocks demo login in production unless SMU_ALLOW_DEMO', () => {
    const prevEnv = process.env.NODE_ENV
    const prevAllow = process.env.SMU_ALLOW_DEMO
    process.env.NODE_ENV = 'production'
    delete process.env.SMU_ALLOW_DEMO
    expect(isDemoAllowed('login')).toBe(false)
    process.env.SMU_ALLOW_DEMO = '1'
    expect(isDemoAllowed('login')).toBe(true)
    process.env.NODE_ENV = prevEnv
    if (prevAllow === undefined) delete process.env.SMU_ALLOW_DEMO
    else process.env.SMU_ALLOW_DEMO = prevAllow
  })

  it('exports demo email constant', () => {
    expect(DEMO_EMAIL).toBe('demo@sprech.local')
  })
})
