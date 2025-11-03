<script lang="ts" setup>
import type { QuizQuestion } from '~/utils/types'

definePageMeta({ layout: 'page' })
useHead({ title: 'Blank Page' })

const quiz: QuizQuestion = {
  question: 'Which planet is known as the Red Planet?',
  answers: ['Earth', 'Mars', 'Jupiter', 'Venus'],
  correctAnswerIndex: 1,
}

const handleAnswer = (payload: { correct: boolean; selectedIndex: number }) => {
  console.log('User answered:', payload)
}
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageHeader>
      <LayoutPageTitle text="Quizz Page" class="capitalize" />
    </LayoutPageHeader>
    <LayoutPageSectionQuizzItem
      :question="quiz.question"
      :answers="quiz.answers"
      :correct-answer-index="quiz.correctAnswerIndex"
      @answered="handleAnswer"
    />
  </LayoutPageWrapper>
</template>
