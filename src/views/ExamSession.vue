<template>
  <div class="exam-session" :style="{ backgroundColor: 'var(--level-bg)' }">
    <div class="mobile-container">
      <!-- Модалка старта экзамена -->
      <div v-if="showStartModal" class="modal-overlay" @click.self="showStartModal = false">
        <div class="modal start-modal">
          <h2>Начать экзамен?</h2>
          <p>Время: {{ exam?.totalTime || 60 }} минут</p>
          <p>Вопросов: {{ totalQuestions }}</p>
          <div class="modal-actions">
            <button class="btn btn-outline" @click="cancelStart">Отмена</button>
            <button class="btn btn-primary" @click="startExam">Начать</button>
          </div>
        </div>
      </div>

      <!-- Основной интерфейс -->
      <div v-if="!showStartModal">
        <div class="session-header">
          <button class="back-btn" @click="confirmExit">
            <ChevronLeft :size="24" />
          </button>
          <div 
            class="timer tabular-nums" 
            :class="{ warning: localSecondsLeft && localSecondsLeft < 60 }" 
            v-if="localSecondsLeft !== null && !isReviewMode"
            :key="localSecondsLeft"
          >
            {{ formatTime(localSecondsLeft) }}
          </div>
          <div v-else-if="isReviewMode" class="review-badge">
            👁️ Просмотр
          </div>
          <div class="progress-text">
            {{ answeredCount }}/{{ totalQuestions }} • Раздел {{ currentSectionIndex + 1 }}/{{ exam?.sections.length }}
          </div>
          <div class="placeholder"></div>
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar-fill" :style="{ width: totalProgress + '%' }"></div>
        </div>

        <div v-if="exam && currentSection" class="section-container">
          <h2 class="section-title">{{ currentSection.name }}</h2>
          <div class="questions">
            <div
              v-for="(q, qIdx) in currentSection.questions"
              :key="qIdx"
              class="question-card"
              v-show="currentQuestionIndex === qIdx"
            >
              <!-- Аудирование -->
              <div v-if="q.type === 'listening'" class="listening">
                <p class="question-text">{{ q.text }}</p>
                <button 
                  class="btn btn-primary audio-btn" 
                  @click="playAudio(q.word)" 
                  title="Прослушать" 
                  :disabled="isReviewMode ? true : false"
                >
                  <Volume2 :size="20" /> Прослушать
                </button>
                <div class="options">
                  <button
                    v-for="(opt, optIdx) in q.options"
                    :key="optIdx"
                    @click="answerListening(Number(qIdx), opt)"
                    :disabled="(isListeningAnswered(Number(qIdx)) || isReviewMode) ? true : false"
                    :class="[
                      'option-btn',
                      {
                        correct: (isReviewMode || isListeningAnswered(Number(qIdx))) && opt === q.correctAnswer,
                        wrong: isReviewMode && getAnswer(Number(qIdx)) === opt && opt !== q.correctAnswer,
                        selected: !isReviewMode && !isListeningAnswered(Number(qIdx)) && tempListeningAnswer === opt,
                      },
                    ]"
                  >
                    {{ opt }}
                  </button>
                </div>
              </div>

              <!-- Чтение -->
              <div v-else-if="q.type === 'reading'" class="reading">
                <div class="reading-text">
                  <p>{{ q.text }}</p>
                </div>
                <div
                  v-for="(item, itemIdx) in q.items"
                  :key="itemIdx"
                  class="reading-item"
                >
                  <p class="reading-question">{{ item.question }}</p>
                  <div class="options">
                    <button
                      v-for="(opt, optIdx) in item.options"
                      :key="optIdx"
                      @click="answerReadingItem(Number(qIdx), Number(itemIdx), Number(optIdx))"
                      :disabled="(examStore.isReadingItemAnswered(currentSectionIndex, Number(qIdx), Number(itemIdx)) || isReviewMode) ? true : false"
                      :class="[
                        'option-btn',
                        {
                          correct: (isReviewMode || examStore.isReadingItemAnswered(currentSectionIndex, Number(qIdx), Number(itemIdx))) &&
                            Number(optIdx) === item.answer,
                          wrong: isReviewMode &&
                            examStore.getAnswer(currentSectionIndex, Number(qIdx), Number(itemIdx)) === Number(optIdx) &&
                            Number(optIdx) !== item.answer,
                          selected: !isReviewMode &&
                            !examStore.isReadingItemAnswered(currentSectionIndex, Number(qIdx), Number(itemIdx)) &&
                            tempReadingAnswer[Number(itemIdx)] === Number(optIdx),
                        },
                      ]"
                    >
                      {{ opt }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Письмо (fill-blank) -->
              <div v-else-if="q.type === 'fill-blank'" class="fill-blank">
                <p class="sentence">{{ q.sentence }}</p>
                <div class="options">
                  <button
                    v-for="(opt, optIdx) in q.options"
                    :key="optIdx"
                    @click="answerFillBlank(Number(qIdx), Number(optIdx))"
                    :disabled="(isFillBlankAnswered(Number(qIdx)) || isReviewMode) ? true : false"
                    :class="[
                      'option-btn',
                      {
                        correct: (isReviewMode || isFillBlankAnswered(Number(qIdx))) && Number(optIdx) === q.correctAnswer,
                        wrong: isReviewMode &&
                          examStore.getAnswer(currentSectionIndex, Number(qIdx)) === Number(optIdx) &&
                          Number(optIdx) !== q.correctAnswer,
                        selected: !isReviewMode && !isFillBlankAnswered(Number(qIdx)) && tempFillBlank === Number(optIdx),
                      },
                    ]"
                  >
                    {{ opt }}
                  </button>
                </div>
              </div>

              <!-- Перевод -->
              <div v-else-if="q.type === 'translate'" class="translate">
                <p class="question-text">{{ q.question }}</p>
                <input
                  v-model="tempTranslate"
                  class="input"
                  placeholder="Ваш перевод"
                  :disabled="(isTranslateAnswered(qIdx) || isReviewMode) ? true : false"
                />
                <button
                  class="btn btn-primary submit-btn"
                  @click="submitTranslate(qIdx)"
                  :disabled="(isTranslateAnswered(qIdx) || !tempTranslate.trim() || isReviewMode) ? true : false"
                >
                  Ответить
                </button>
                <div v-if="isReviewMode && getAnswer(qIdx)" class="review-answer">
                  Ваш ответ: {{ getAnswer(qIdx) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="loading">Загрузка экзамена...</div>

        <div class="navigation">
          <button
            class="nav-btn prev"
            :disabled="(currentSectionIndex === 0 && currentQuestionIndex === 0) ? true : false"
            @click="prevQuestion"
          >
            Назад
          </button>
          <button
            class="nav-btn next"
            :class="{ primary: isLastQuestion && !isReviewMode }"
            @click="nextQuestion"
            :disabled="(!canGoNext && !isReviewMode) ? true : false"
          >
            {{ isLastQuestion ? (isReviewMode ? 'Закрыть' : 'Завершить') : 'Далее' }}
          </button>
        </div>

        <!-- Модалка подтверждения выхода -->
        <div v-if="showExitConfirm" class="modal-overlay" @click.self="showExitConfirm = false">
          <div class="modal">
            <h3>Завершить экзамен?</h3>
            <p>Прогресс не сохранится</p>
            <div class="modal-actions">
              <button class="cancel-btn" @click="showExitConfirm = false">Отмена</button>
              <button class="confirm-btn" @click="exitExam">Выйти</button>
            </div>
          </div>
        </div>

        <!-- Модалка результатов -->
        <div v-if="showResults" class="modal-overlay" @click.self="showResults = false">
          <div class="modal results-modal">
            <h2>Результаты экзамена</h2>
            <div class="score-circle">
              <svg viewBox="0 0 100 100" width="120" height="120">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" stroke-width="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  :stroke="scoreColor"
                  stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="dashOffset"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div class="score-percent">{{ scorePercentage }}%</div>
            </div>
            <div class="score-stats">
              <p>Правильно: {{ correctCount }} из {{ totalQuestions }}</p>
              <p class="score-result" :class="{ passed: scorePassed, failed: !scorePassed }">
                {{ scorePassed ? 'Экзамен сдан' : 'Экзамен не сдан' }}
              </p>
            </div>
            <button class="btn btn-primary" @click="finishExamAndExit">На главную</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ChevronLeft, Volume2 } from 'lucide-vue-next'
import { useExamStore } from '@/stores/examStore'
import { speak } from '@/services/tts'
import type { ExamSection } from '@/types'
import { AUTO_ADVANCE_DELAY } from '@/constants'

const router = useRouter()
const examStore = useExamStore()
const { timeLeft } = storeToRefs(examStore)

const exam = computed(() => examStore.currentExam)

const currentSectionIndex = ref(0)
const currentQuestionIndex = ref(0)

const tempListeningAnswer = ref<string | null>(null)
const tempFillBlank = ref<number | null>(null)
const tempTranslate = ref('')
const tempReadingAnswer = ref<Record<number, number>>({})

const showExitConfirm = ref(false)
const showResults = ref(false)
const showStartModal = ref(false)

const localSecondsLeft = ref<number | null>(null)
const timerActive = ref(false)

const isReviewMode = computed(() => !examStore.startTime && exam.value?.savedAnswers)

let timerInterval: ReturnType<typeof setInterval> | null = null
let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null

const answeredCount = computed(() => {
  let count = 0
  if (!exam.value) return 0
  for (let s = 0; s < exam.value.sections.length; s++) {
    const section = exam.value.sections[s]
    for (let q = 0; q < section.questions.length; q++) {
      const question = section.questions[q]
      if (question.type === 'reading') {
        const items = (question as any).items
        if (!items) continue
        let allAnswered = true
        for (let i = 0; i < items.length; i++) {
          if (!examStore.isReadingItemAnswered(s, q, i)) {
            allAnswered = false
            break
          }
        }
        if (allAnswered) count++
      } else {
        if (examStore.getAnswer(s, q) !== undefined) count++
      }
    }
  }
  return count
})

onMounted(() => {
  if (!exam.value) {
    router.push('/main/exams')
    return
  }
  
  if (isReviewMode.value) {
    showStartModal.value = false
    localSecondsLeft.value = null
  } else {
    showStartModal.value = true
  }
})

onUnmounted(() => {
  stopTimer()
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
})

function startExam() {
  showStartModal.value = false
  examStore.startTime = Date.now()
  localSecondsLeft.value = examStore.timeLimit ? examStore.timeLimit * 60 : 60
  timerActive.value = true
  startTimer()
}

function cancelStart() {
  examStore.clearExam()
  router.push('/main/exams')
}

function startTimer() {
  stopTimer()
  timerInterval = setInterval(() => {
    if (timerActive.value && localSecondsLeft.value !== null && localSecondsLeft.value > 0) {
      localSecondsLeft.value -= 1
      
      if (localSecondsLeft.value === 0) {
        finishExam()
      }
    }
  }, 1000)
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval)
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const currentSection = computed(() => exam.value?.sections[currentSectionIndex.value])

const isLastQuestion = computed(() => {
  if (!exam.value) return false
  return (
    currentSectionIndex.value === exam.value.sections.length - 1 &&
    currentQuestionIndex.value === (currentSection.value?.questions.length ?? 0) - 1
  )
})

const totalQuestions = computed(() => {
  if (!exam.value) return 0
  return exam.value.sections.reduce((acc: number, sec: ExamSection) => acc + sec.questions.length, 0)
})

const totalProgress = computed(() => {
  return (answeredCount.value / totalQuestions.value) * 100
})

const canGoNext = computed(() => {
  if (isReviewMode.value) return true
  
  const secIdx = currentSectionIndex.value
  const qIdx = currentQuestionIndex.value
  const question = currentSection.value?.questions[qIdx]
  if (!question) return false

  if (question.type === 'reading') {
    const items = (question as any).items
    if (!items) return false
    for (let i = 0; i < items.length; i++) {
      if (!examStore.isReadingItemAnswered(secIdx, qIdx, i)) return false
    }
    return true
  } else {
    return examStore.getAnswer(secIdx, qIdx) !== undefined
  }
})

const correctCount = computed(() => {
  let correct = 0
  if (!exam.value) return 0
  for (let s = 0; s < exam.value.sections.length; s++) {
    const section = exam.value.sections[s]
    for (let q = 0; q < section.questions.length; q++) {
      const question = section.questions[q]
      if (question.type === 'reading') {
        const items = (question as any).items
        if (!items) continue
        for (let i = 0; i < items.length; i++) {
          const userAnswer = examStore.getAnswer(s, q, i)
          if (userAnswer === items[i].answer) correct++
        }
      } else if (question.type === 'listening') {
        if (examStore.getAnswer(s, q) === (question as any).correctAnswer) correct++
      } else if (question.type === 'fill-blank') {
        if (examStore.getAnswer(s, q) === (question as any).correctAnswer) correct++
      } else if (question.type === 'translate') {
        if (examStore.getAnswer(s, q) !== undefined) correct++
      }
    }
  }
  return correct
})

const scorePercentage = computed(() => Math.round((correctCount.value / totalQuestions.value) * 100))
const scorePassed = computed(() => scorePercentage.value >= 60)
const circumference = 2 * Math.PI * 45
const dashOffset = computed(() => circumference - (scorePercentage.value / 100) * circumference)
const scoreColor = computed(() => {
  if (scorePercentage.value >= 80) return '#4caf50'
  if (scorePercentage.value >= 50) return '#ff9800'
  return '#f44336'
})

function getAnswer(qIdx: number, itemIndex?: number) {
  return examStore.getAnswer(currentSectionIndex.value, qIdx, itemIndex)
}

function isListeningAnswered(qIdx: number): boolean {
  return examStore.getAnswer(currentSectionIndex.value, qIdx) !== undefined
}

function isFillBlankAnswered(qIdx: number): boolean {
  return examStore.getAnswer(currentSectionIndex.value, qIdx) !== undefined
}

function isTranslateAnswered(qIdx: number): boolean {
  return examStore.getAnswer(currentSectionIndex.value, qIdx) !== undefined
}

function answerListening(qIdx: number, answer: string) {
  if (isListeningAnswered(qIdx) || isReviewMode.value) return
  tempListeningAnswer.value = answer
  examStore.saveAnswer(currentSectionIndex.value, qIdx, answer)
  const question = currentSection.value?.questions[qIdx]
  if (question && (question as any).correctAnswer === answer) {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = setTimeout(() => {
      nextQuestion()
      autoAdvanceTimer = null
    }, AUTO_ADVANCE_DELAY)
  }
}

function answerFillBlank(qIdx: number, optIdx: number) {
  if (isFillBlankAnswered(qIdx) || isReviewMode.value) return
  tempFillBlank.value = optIdx
  examStore.saveAnswer(currentSectionIndex.value, qIdx, optIdx)
  const question = currentSection.value?.questions[qIdx]
  if (question && (question as any).correctAnswer === optIdx) {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = setTimeout(() => {
      nextQuestion()
      autoAdvanceTimer = null
    }, AUTO_ADVANCE_DELAY)
  }
}

function answerReadingItem(qIdx: number, itemIdx: number, optIdx: number) {
  if (examStore.isReadingItemAnswered(currentSectionIndex.value, qIdx, itemIdx) || isReviewMode.value) return
  tempReadingAnswer.value[itemIdx] = optIdx
  examStore.saveAnswer(currentSectionIndex.value, qIdx, optIdx, itemIdx)
  const question = currentSection.value?.questions[qIdx] as any
  if (question && question.items && question.items[itemIdx].answer === optIdx) {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = setTimeout(() => {
      nextQuestion()
      autoAdvanceTimer = null
    }, AUTO_ADVANCE_DELAY)
  }
}

function submitTranslate(qIdx: number) {
  if (!tempTranslate.value.trim() || isReviewMode.value) return
  examStore.saveAnswer(currentSectionIndex.value, qIdx, tempTranslate.value)
  // Для перевода нет авто-перехода, так как ответ не сравнивается автоматически
}

function prevQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  } else if (currentSectionIndex.value > 0) {
    currentSectionIndex.value--
    currentQuestionIndex.value = exam.value!.sections[currentSectionIndex.value].questions.length - 1
  }
  resetTemp()
}

function nextQuestion() {
  if (isReviewMode.value) {
    if (currentQuestionIndex.value < (currentSection.value?.questions.length ?? 0) - 1) {
      currentQuestionIndex.value++
    } else if (currentSectionIndex.value < (exam.value?.sections.length ?? 0) - 1) {
      currentSectionIndex.value++
      currentQuestionIndex.value = 0
    } else {
      router.push('/main/exams')
    }
    return
  }

  if (!canGoNext.value) return

  if (currentQuestionIndex.value < (currentSection.value?.questions.length ?? 0) - 1) {
    currentQuestionIndex.value++
  } else if (currentSectionIndex.value < (exam.value?.sections.length ?? 0) - 1) {
    currentSectionIndex.value++
    currentQuestionIndex.value = 0
  } else {
    finishExam()
    return
  }
  resetTemp()
}

function resetTemp() {
  tempListeningAnswer.value = null
  tempFillBlank.value = null
  tempTranslate.value = ''
  tempReadingAnswer.value = {}
}

function confirmExit() {
  if (isReviewMode.value) {
    exitExam()
    return
  }
  showExitConfirm.value = true
}

function exitExam() {
  examStore.clearExam()
  router.push('/main/exams')
}

function finishExam() {
  stopTimer()
  timerActive.value = false
  const result = {
    correct: correctCount.value,
    total: totalQuestions.value,
  }
  if (exam.value) {
    examStore.addCompletedExam(exam.value, result)
  }
  showResults.value = true
}

function finishExamAndExit() {
  showResults.value = false
  router.push('/main/exams')
}

async function playAudio(text: string) {
  try {
    await speak(text, 'zh-CN')
  } catch (error) {
    console.error('Ошибка воспроизведения аудио', error)
  }
}

watch(currentSection, () => {
  resetTemp()
})

watch(timeLeft, (newVal) => {
  if (!isReviewMode.value && newVal !== null) {
    localSecondsLeft.value = newVal
  }
})
</script>

<style scoped>
.audio-btn {
  margin-bottom: 1rem;
}

.exam-session {
  min-height: 100vh;
  padding: 1rem 0;
}

.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.back-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 12px;
  cursor: pointer;
  color: var(--level-accent);
}

.timer {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--accent-color);
  background: var(--surface);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  border: 2px solid var(--accent-color);
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}

.timer.warning {
  color: #f44336;
  border-color: #f44336;
}

.review-badge {
  font-size: 1.2rem;
  font-weight: bold;
  color: #4caf50;
  background: var(--surface);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  border: 2px solid #4caf50;
}

.progress-text {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.placeholder {
  width: 40px;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 2rem;
}
.dark .progress-bar-container {
  background: rgba(255, 255, 255, 0.1);
}
.progress-bar-fill {
  height: 100%;
  background: var(--level-accent);
  transition: width 0.3s ease;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.question-card {
  background: var(--bg-primary);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: var(--card-shadow);
  margin-bottom: 2rem;
}

.question-text,
.sentence {
  font-size: 1.3rem;
  margin-bottom: 2rem;
  color: var(--text-primary);
}

.options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.option-btn {
  padding: 1rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 16px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  white-space: normal;
  word-break: break-word;
  height: auto;
  min-height: 3rem;
}
.option-btn:hover:not(:disabled) {
  border-color: var(--level-accent);
  background: color-mix(in srgb, var(--level-accent) 5%, var(--surface));
}
.option-btn.selected {
  border-color: var(--level-accent);
  background: color-mix(in srgb, var(--level-accent) 10%, var(--surface));
}
.option-btn.correct {
  border-color: #4caf50;
  background: #e8f5e9;
  color: #2e7d32;
}
.option-btn.wrong {
  border-color: #f44336;
  background: #ffebee;
  color: #c62828;
}
.option-btn:disabled {
  opacity: 0.7;
  cursor: default;
}

.input {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--border);
  border-radius: 30px;
  background: var(--surface);
  color: var(--text-primary);
  font-size: 1.1rem;
  margin-bottom: 1rem;
}
.submit-btn {
  width: 100%;
}

.reading-text {
  background: var(--surface);
  padding: 1.5rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  white-space: pre-wrap;
  line-height: 1.6;
}
.reading-item {
  margin-bottom: 2rem;
}
.reading-question {
  font-weight: 500;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.navigation {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}
.nav-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--surface);
  color: var(--text-primary);
  border: 2px solid var(--border);
}
.nav-btn:hover:not(:disabled) {
  border-color: var(--level-accent);
  background: color-mix(in srgb, var(--level-accent) 5%, var(--surface));
  transform: scale(1.02);
}
.nav-btn.primary {
  background: var(--level-accent);
  color: white;
  border-color: var(--level-accent);
}
.nav-btn.primary:hover:not(:disabled) {
  background: var(--level-accent);
  transform: scale(1.02);
  box-shadow: 0 4px 12px var(--level-accent);
}
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: 24px;
  max-width: 300px;
  width: 90%;
  text-align: center;
}
.start-modal {
  max-width: 350px;
}
.start-modal h2 {
  margin-bottom: 1rem;
  color: var(--accent-color);
}
.start-modal p {
  margin: 0.5rem 0;
  color: var(--text-primary);
}
.start-modal .modal-actions {
  margin-top: 2rem;
}
.results-modal {
  max-width: 400px;
}
.modal h3 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}
.modal p {
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
}
.modal-actions {
  display: flex;
  gap: 1rem;
}
.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 30px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}
.cancel-btn {
  background: var(--surface);
  color: var(--text-primary);
  border: 2px solid var(--border);
}
.confirm-btn {
  background: #f44336;
  color: white;
}
.score-circle {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 1rem;
}
.score-percent {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--text-primary);
}
.score-stats {
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
}
.score-result {
  font-weight: bold;
  margin-top: 0.5rem;
}
.score-result.passed {
  color: #4caf50;
}
.score-result.failed {
  color: #f44336;
}
.review-answer {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: 8px;
  color: var(--text-primary);
  border-left: 4px solid var(--accent-color);
}
</style>