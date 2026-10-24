// stores/examStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { generateExam } from '@/services/exam-generator'
import type { Exam, HSKLevel } from '@/types'
import { initDB } from '@/db/db'

export const useExamStore = defineStore('exam', () => {
  const currentExam = ref<Exam | null>(null)
  const exams = ref<Exam[]>([])
  const completedExams = ref<Exam[]>([])
  const isLoading = ref(false)
  const startTime = ref<number | null>(null)
  const timeLimit = ref<number | null>(null)
  const answers = ref<Record<string, any>>({})

  async function loadExams() {
    isLoading.value = true
    try {
      const db = await initDB()
      const all = await db.getAll('exams')
      exams.value = all as Exam[]
      const completed = await db.getAll('completedExams')
      completedExams.value = completed as Exam[]
    } catch (error) {
      console.error('Error loading exams:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function generateNewExam(level: HSKLevel) {
    isLoading.value = true
    try {
      const exam = await generateExam(level)
      currentExam.value = exam
      timeLimit.value = exam.totalTime || 60

      const saved = localStorage.getItem(`exam-${exam.id}-answers`)
      if (saved) {
        try {
          answers.value = JSON.parse(saved)
        } catch (e) {
          console.error('Failed to restore exam answers', e)
        }
      } else {
        answers.value = {}
      }

      const savedStart = localStorage.getItem(`exam-${exam.id}-start`)
      if (savedStart) {
        startTime.value = parseInt(savedStart, 10)
      } else {
        startTime.value = null
      }
    } finally {
      isLoading.value = false
    }
  }

  watch(answers, () => {
    if (currentExam.value) {
      localStorage.setItem(`exam-${currentExam.value.id}-answers`, JSON.stringify(answers.value))
    }
  }, { deep: true })

  watch(startTime, () => {
    if (currentExam.value && startTime.value) {
      localStorage.setItem(`exam-${currentExam.value.id}-start`, startTime.value.toString())
    }
  })

  function saveAnswer(sectionIndex: number, questionIndex: number, answer: any, itemIndex?: number) {
    const key = itemIndex !== undefined
      ? `${sectionIndex}-${questionIndex}-item-${itemIndex}`
      : `${sectionIndex}-${questionIndex}`
    answers.value[key] = answer
  }

  function getAnswer(sectionIndex: number, questionIndex: number, itemIndex?: number) {
    const key = itemIndex !== undefined
      ? `${sectionIndex}-${questionIndex}-item-${itemIndex}`
      : `${sectionIndex}-${questionIndex}`
    return answers.value[key]
  }

  function isReadingItemAnswered(sectionIndex: number, questionIndex: number, itemIndex: number): boolean {
    const key = `${sectionIndex}-${questionIndex}-item-${itemIndex}`
    return answers.value[key] !== undefined
  }

  function clearExam() {
    if (currentExam.value) {
      localStorage.removeItem(`exam-${currentExam.value.id}-answers`)
      localStorage.removeItem(`exam-${currentExam.value.id}-start`)
    }
    currentExam.value = null
    startTime.value = null
    timeLimit.value = null
    answers.value = {}
  }

  const timeLeft = computed(() => {
    if (!startTime.value || !timeLimit.value) {
      return null
    }
    
    const now = Date.now()
    const elapsedMilliseconds = now - startTime.value
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000)
    const totalSeconds = timeLimit.value * 60
    const remainingSeconds = totalSeconds - elapsedSeconds
    
    if (remainingSeconds <= 0) return 0
    return remainingSeconds
  })

  async function addCompletedExam(exam: Exam, result: { correct: number; total: number }) {
    const percentage = Math.round((result.correct / result.total) * 100)
    const passed = percentage >= 60

    const completedExam: Exam = {
      ...exam,
      completedAt: Date.now(),
      score: {
        correct: result.correct,
        total: result.total,
        percentage,
        passed,
      },
      savedAnswers: { ...answers.value }
    }

    completedExams.value.push(completedExam)
    const db = await initDB()
    await db.put('completedExams', completedExam)
    
    clearExam()
  }

  function reviewCompletedExam(exam: Exam) {
    currentExam.value = { 
      ...exam,
      savedAnswers: exam.savedAnswers ? { ...exam.savedAnswers } : undefined
    }
    timeLimit.value = exam.totalTime || 60
    startTime.value = null
    answers.value = exam.savedAnswers ? { ...exam.savedAnswers } : {}
  }

  return {
    currentExam,
    exams,
    completedExams,
    isLoading,
    startTime,
    timeLimit,
    timeLeft,
    answers,
    loadExams,
    generateNewExam,
    saveAnswer,
    getAnswer,
    isReadingItemAnswered,
    clearExam,
    addCompletedExam,
    reviewCompletedExam,
  }
})