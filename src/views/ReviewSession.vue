<template>
  <div class="review-session" :style="{ backgroundColor: 'var(--bg-primary)' }">
    <div class="mobile-container">
      <!-- Шапка сессии -->
      <div class="session-header">
        <button class="back-btn" @click="exitSession">
          <ChevronLeft :size="24" />
        </button>
        <div class="progress-indicator">
          {{ currentIndex + 1 }} / {{ exercises.length }}
        </div>
        <button class="assistant-btn" @click="openAssistant" title="Спросить Сашу">
          <span class="assistant-char">萨</span>
        </button>
      </div>

      <!-- Прогресс-бар -->
      <div class="progress-bar-container">
        <div class="progress-bar-fill" :style="{ width: progress + '%' }"></div>
      </div>

      <!-- Карточка упражнения -->
      <div class="card-wrapper">
        <ExerciseCard
          v-if="exercises.length"
          :exercise="exercises[currentIndex]"
          :isActive="true"
          :reviewId="reviewIds[currentIndex]"
          @answered="handleAnswer"
          @next="nextCard"
          @mistake="handleMistake"
        />
      </div>

      <!-- Навигация -->
      <div class="session-footer">
        <button class="nav-btn prev" :disabled="currentIndex === 0" @click="prevCard">
          <ChevronLeft :size="20" />
          <span>Назад</span>
        </button>
        
        <button class="nav-btn next" :class="{ primary: isLastCard }" @click="nextCard" :disabled="!canGoNext">
          <span>{{ isLastCard ? 'Завершить' : 'Далее' }}</span>
          <ChevronRight :size="20" />
        </button>
      </div>
    </div>

    <!-- Модалка подтверждения выхода -->
    <div v-if="showExitConfirm" class="modal-overlay" @click.self="showExitConfirm = false">
      <div class="modal exit-modal">
        <h3>Завершить повторение?</h3>
        <p>Прогресс не сохранится</p>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showExitConfirm = false">Отмена</button>
          <button class="confirm-btn" @click="exitSession">Выйти</button>
        </div>
      </div>
    </div>

    <!-- Модалка результатов -->
    <div v-if="showResults" class="modal-overlay" @click.self="showResults = false">
      <div class="modal results-modal">
        <h2>Результаты</h2>
        <div class="stats">
          <p>Правильно: {{ resultStats.correct }} из {{ resultStats.total }}</p>
          <p>Процент: {{ percentage }}%</p>
          <p>Время: {{ formattedTime }}</p>
          <p>Ошибок: {{ resultStats.mistakes.length }}</p>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" @click="repeatMistakes" :disabled="resultStats.mistakes.length === 0">
            Повторить ошибки
          </button>
          <button class="btn btn-outline" @click="goToPractice">
            Выбрать режим
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import ExerciseCard from '@/components/review/ExerciseCard.vue'
import { useUserStore } from '@/stores/userStore'
import { useReviewStore } from '@/stores/reviewStore'
import type { Exercise } from '@/types'

interface SessionData {
  exercises: Exercise[]
  reviewIds: string[]
  settings: any
}

const router = useRouter()
const userStore = useUserStore()
const reviewStore = useReviewStore()

// Состояние сессии
const exercises = ref<Exercise[]>([])
const reviewIds = ref<string[]>([])
const settings = ref<any>(null)
const currentIndex = ref(0)
const startTime = ref(Date.now())
const endTime = ref(0)
const canGoNext = ref(true)
const resultStats = ref({ correct: 0, total: 0, mistakes: [] as Exercise[] })
const showExitConfirm = ref(false)
const showResults = ref(false)

// Таймер для авто-перехода
let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  // Получаем данные из sessionStorage
  const saved = sessionStorage.getItem('reviewSession')
  if (saved) {
    try {
      const data: SessionData = JSON.parse(saved)
      exercises.value = data.exercises
      reviewIds.value = data.reviewIds
      settings.value = data.settings
      startTime.value = Date.now()
      resultStats.value = { correct: 0, total: exercises.value.length, mistakes: [] }
    } catch (e) {
      console.error('Failed to load session data', e)
      router.push('/practice')
    }
  } else {
    router.push('/practice')
  }
})

onUnmounted(() => {
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
})

const progress = computed(() => ((currentIndex.value + 1) / exercises.value.length) * 100)
const isLastCard = computed(() => currentIndex.value === exercises.value.length - 1)
const percentage = computed(() => Math.round((resultStats.value.correct / resultStats.value.total) * 100))
const formattedTime = computed(() => {
  const diff = (endTime.value || Date.now()) - startTime.value
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

function handleAnswer(correct: boolean, quality?: number) {
  const reviewId = reviewIds.value[currentIndex.value]
  if (reviewId) {
    reviewStore.updateStats(reviewId, correct, quality)
  }
  if (correct) resultStats.value.correct++
  else {
    resultStats.value.mistakes.push(exercises.value[currentIndex.value])
  }
  userStore.addPracticeResult(correct)
}

function handleMistake() {}

function nextCard() {
  if (currentIndex.value < exercises.value.length - 1) {
    currentIndex.value++
    canGoNext.value = true
  } else {
    endTime.value = Date.now()
    showResults.value = true
  }
}

function prevCard() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    canGoNext.value = true
  }
}

function exitSession() {
  sessionStorage.removeItem('reviewSession')
  router.push('/practice')
}

function repeatMistakes() {
  exercises.value = shuffleArray(resultStats.value.mistakes)
  reviewIds.value = []
  currentIndex.value = 0
  startTime.value = Date.now()
  resultStats.value = { correct: 0, total: exercises.value.length, mistakes: [] }
  showResults.value = false
}

function goToPractice() {
  sessionStorage.removeItem('reviewSession')
  router.push('/practice')
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function openAssistant() {
  window.dispatchEvent(new CustomEvent('open-assistant'))
}
</script>

<style scoped>
.review-session {
  min-height: 100vh;
  padding: 1rem 0;
}

.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.back-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 12px;
  cursor: pointer;
  color: var(--accent-color);
  transition: background 0.2s;
}

.back-btn:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, transparent);
}

.progress-indicator {
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.assistant-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-color);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}

.assistant-btn:hover {
  transform: scale(1.1);
  background: color-mix(in srgb, var(--accent-color) 80%, black);
}

.assistant-char {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 1.2rem;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 2rem;
}
.dark .progress-bar-container {
  background: rgba(255,255,255,0.1);
}
.progress-bar-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s ease;
}

.card-wrapper {
  margin-bottom: 2rem;
  min-height: 300px;
}

.session-footer {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  align-items: center;
  position: sticky;
  bottom: 20px;
  background: var(--bg-primary);
  padding: 1rem;
  border-radius: 40px;
  box-shadow: var(--card-shadow);
  z-index: 10;
}

.nav-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--surface);
  color: var(--text-primary);
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  white-space: nowrap;
  flex: 2;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 5%, var(--surface));
  transform: scale(1.02);
}

.nav-btn.primary {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(5px);
}

.modal {
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: 24px;
  max-width: 300px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  border: 2px solid var(--accent-color);
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

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 30px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: var(--surface);
  color: var(--text-primary);
  border: 2px solid var(--border);
}

.cancel-btn:hover {
  background: color-mix(in srgb, var(--accent-color) 10%, var(--surface));
}

.confirm-btn {
  background: #f44336;
  color: white;
}

.confirm-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px #f44336;
}

.results-modal {
  max-width: 400px;
}

.stats {
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.result-actions .btn {
  width: 100%;
}
</style>