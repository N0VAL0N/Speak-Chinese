<template>
  <div class="pack-study mobile-container">
    <div class="session-header">
      <button class="back-btn" @click="goBack">
        <ChevronLeft :size="24" />
      </button>
      <div v-if="inSession" class="progress-indicator">
        {{ currentStep + 1 }} / {{ totalSteps }}
      </div>
      <div v-else class="title-placeholder" :style="{ color: 'var(--accent-color)' }">
        Изучение иероглифов
      </div>
      <button class="assistant-btn filled" @click="openAssistant" title="Спросить Сашу">
        <span class="assistant-char">萨</span>
        <span>Саша</span>
      </button>
    </div>

    <!-- Экран настроек -->
    <div v-if="!inSession" class="settings-panel">
      <div v-if="filteredCardsForSession.length === 0" class="empty-state">
        <p>Нет карточек для выбранного фильтра.</p>
      </div>
      <template v-else>
        <h3>Выберите режимы</h3>
        <div class="modes-group">
          <label class="custom-checkbox checked disabled">
            <input type="checkbox" checked disabled />
            <span>Карточка (обязательно)</span>
          </label>

          <label
            v-for="mode in optionalModes"
            :key="mode.value"
            class="custom-checkbox"
            :class="{ checked: selectedModes.includes(mode.value) }"
          >
            <input type="checkbox" :value="mode.value" v-model="selectedModes" />
            <span>{{ mode.label }}</span>
          </label>
        </div>

        <!-- Фильтр карточек -->
        <div class="filter-section">
          <h4>Показать</h4>
          <div class="filter-buttons">
            <button
              :class="['filter-btn', { active: cardFilter === 'all' }]"
              @click="cardFilter = 'all'"
            >
              Все карточки ({{ totalCardsCount }})
            </button>
            <button
              :class="['filter-btn', { active: cardFilter === 'unstudied' }]"
              @click="cardFilter = 'unstudied'"
            >
              Неизученные ({{ unstudiedCardsCount }})
            </button>
          </div>
        </div>

        <button
          class="btn btn-primary start-btn"
          @click="startSession"
          :disabled="selectedModes.length === 0"
        >
          Начать
        </button>
      </template>
    </div>

    <!-- Сессия изучения -->
    <div v-else class="session-area">
      <div class="progress-bar-container">
        <div class="progress-bar-fill" :style="{ width: sessionProgress + '%' }"></div>
      </div>

      <div class="mode-block">
        <!-- Интро-карточка -->
        <div v-if="currentMode === 'intro'" class="intro-mode">
          <div class="card-flip" @click="showTranslation = !showTranslation" :class="{ flipped: showTranslation }">
            <div class="card-front">
              <span class="hanzi">{{ currentCard.front }}</span>
              <span class="pinyin-below">{{ currentCard.pinyin || '' }}</span>
            </div>
            <div class="card-back">
              <span class="translation">{{ currentCard.back }}</span>
            </div>
          </div>
          <p class="flip-hint">👆 нажми на карточку, чтобы увидеть перевод</p>
          <div class="actions">
            <button class="btn btn-outline" @click="playAudio">
              <Volume2 :size="20" /> Аудио
            </button>
            <button v-if="isChinese(currentCard.front)" class="btn btn-outline stroke-btn" @click="openStrokeOrder">
              <PenTool :size="20" /> Порядок черт
            </button>
          </div>
        </div>

        <!-- Выбор перевода -->
        <div v-else-if="currentMode === 'choice-translate'" class="choice-mode">
          <div class="character-display">
            <span class="hanzi">{{ currentCard.front }}</span>
          </div>
          <div class="options-grid two-columns">
            <button
              v-for="(option, idx) in translateOptions"
              :key="idx"
              @click="handleChoiceAnswer(option, currentCard.back)"
              :class="['option-btn', { selected: selectedOption === option }]"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <!-- Выбор иероглифа -->
        <div v-else-if="currentMode === 'choice-chinese'" class="choice-mode">
          <div class="question-text">{{ currentCard.back }}</div>
          <div class="options-grid two-columns">
            <button
              v-for="(option, idx) in chineseOptions"
              :key="idx"
              @click="handleChoiceAnswer(option, currentCard.front)"
              :class="['option-btn', { selected: selectedOption === option }]"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <!-- Выбор пиньиня -->
        <div v-else-if="currentMode === 'choice-pinyin'" class="choice-mode">
          <div class="character-display">
            <span class="hanzi">{{ currentCard.front }}</span>
          </div>
          <div class="options-grid two-columns">
            <button
              v-for="(option, idx) in pinyinOptions"
              :key="idx"
              @click="handleChoiceAnswer(option, currentCard.pinyin || '')"
              :class="['option-btn', { selected: selectedOption === option }]"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <!-- Пропись -->
        <div v-else-if="currentMode === 'drawing'" class="drawing-mode">
          <CharacterDrawing
            :key="currentCard.id"
            :word="wordForDrawing"
            :size="280"
            @complete="handleDrawingComplete"
          />
        </div>

        <!-- Аудирование с выбором -->
        <div v-else-if="currentMode === 'listening'" class="listening-mode">
          <button class="btn btn-primary audio-btn" @click="playAudio">
            <Volume2 :size="24" /> Прослушать
          </button>
          <div class="options-grid two-columns" v-if="hasListeningOptions">
            <button
              v-for="(option, idx) in listeningOptions"
              :key="idx"
              @click="handleChoiceAnswer(option, currentCard.back)"
              :class="['option-btn', { selected: selectedOption === option }]"
            >
              {{ option }}
            </button>
          </div>
          <p class="hint">Прослушайте и выберите перевод</p>
        </div>
      </div>

      <!-- Навигация назад/вперёд -->
      <div class="session-navigation">
        <button class="nav-btn" @click="prevStep" :disabled="currentStep === 0">
          <ChevronLeft :size="32" />
          <span>Назад</span>
        </button>
        <button
          class="nav-btn"
          @click="nextStep"
          :disabled="currentStep === totalSteps - 1 || (currentMode === 'drawing' && !drawingCompleted)"
        >
          <span>Далее</span>
          <ChevronRight :size="32" />
        </button>
      </div>
    </div>

    <!-- Модалка порядка черт -->
    <div v-if="showStrokeModal" class="modal-overlay" @click.self="showStrokeModal = false">
      <div class="modal stroke-modal">
        <div class="modal-header">
          <h3>{{ currentCard?.front }}</h3>
          <button class="btn-icon" @click="showStrokeModal = false">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <StrokeOrder :character="currentCard.front" :size="200" />
        </div>
      </div>
    </div>

    <!-- Модалка результатов -->
    <div v-if="showResultModal" class="modal-overlay" @click.self="showResultModal = false">
      <div class="modal results-modal">
        <h2>Результаты</h2>
        <p>Ошибок: {{ mistakeCards.length }} из {{ sessionCards.length }}</p>
        <div class="result-actions">
          <button v-if="mistakeCards.length" class="btn btn-primary" @click="repeatMistakes">
            Повторить ошибки
          </button>
          <button class="btn btn-outline" @click="resetSession">Завершить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue' 
import { useRouter } from 'vue-router'
import { usePacksStore } from '@/stores/packsStore'
import { useAppStore } from '@/stores/appStore'
import { ChevronLeft, ChevronRight, PenTool, X, Volume2 } from 'lucide-vue-next'
import StrokeOrder from '@/components/ui/StrokeOrder.vue'
import CharacterDrawing from '@/components/ui/CharacterDrawing.vue'
import { speak } from '@/services/tts'
import type { Card } from '@/types'
import type { HSKWord, HSKLevel } from '@/types'
import { AUTO_ADVANCE_DELAY } from '@/constants'

const props = defineProps<{ packId: string }>()
const router = useRouter()
const packsStore = usePacksStore()
const appStore = useAppStore()

const cards = ref<Card[]>([])
const loading = ref(true)

// Настройки сессии
const optionalModes = [
  { value: 'choice-translate', label: 'Выбор перевода' },
  { value: 'choice-chinese', label: 'Выбор иероглифа' },
  { value: 'choice-pinyin', label: 'Выбор пиньиня' },
  { value: 'drawing', label: 'Пропись' },
  { value: 'listening', label: 'Аудирование (выбор)' },
]
const selectedModes = ref<string[]>([])

// Фильтр карточек: 'all' или 'unstudied'
const cardFilter = ref<'all' | 'unstudied'>('all')

// Количество карточек для отображения в фильтре
const totalCardsCount = computed(() => cards.value.length)
const unstudiedCardsCount = computed(() => cards.value.filter(c => c.totalReviews === 0).length)

// Отфильтрованные карточки для сессии (на основе выбранного фильтра)
const filteredCardsForSession = computed(() => {
  if (cardFilter.value === 'all') return cards.value
  return cards.value.filter(c => c.totalReviews === 0)
})

// Состояние сессии
const inSession = ref(false)
const sessionCards = ref<Card[]>([])
const steps = ref<{ mode: string; card: Card }[]>([])
const currentStep = ref(0)
const selectedOption = ref<string | null>(null)
const showTranslation = ref(false)
const mistakeCards = ref<Card[]>([])
const showResultModal = ref(false)
const showStrokeModal = ref(false)
const drawingCompleted = ref(false)

// Отслеживание использования подсказок для текущей карточки
const usedHintForCurrent = ref(false)

// Таймер для авто-перехода
let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null

// Загрузка карточек
onMounted(async () => {
  await packsStore.loadPack(props.packId)
  cards.value = await packsStore.getCardsByPackId(props.packId)
  loading.value = false
})

// Вычисляемые
const currentCard = computed(() => steps.value[currentStep.value]?.card)
const currentMode = computed(() => steps.value[currentStep.value]?.mode)
const totalSteps = computed(() => steps.value.length)
const sessionProgress = computed(() => {
  if (totalSteps.value === 0) return 0
  return ((currentStep.value + 1) / totalSteps.value) * 100
})

// Опции для выбора (генерируются из всех карточек пака)
const translateOptions = computed(() => {
  if (!currentCard.value) return []
  const correct = currentCard.value.back
  const otherCards = cards.value.filter(c => c.id !== currentCard.value.id)
  const shuffled = otherCards.sort(() => 0.5 - Math.random()).slice(0, 3).map(c => c.back)
  return [correct, ...shuffled].sort(() => 0.5 - Math.random())
})

const chineseOptions = computed(() => {
  if (!currentCard.value) return []
  const correct = currentCard.value.front
  const otherCards = cards.value.filter(c => c.id !== currentCard.value.id)
  const shuffled = otherCards.sort(() => 0.5 - Math.random()).slice(0, 3).map(c => c.front)
  return [correct, ...shuffled].sort(() => 0.5 - Math.random())
})

const pinyinOptions = computed(() => {
  if (!currentCard.value) return []
  const correct = currentCard.value.pinyin || ''
  const otherCards = cards.value.filter(c => c.id !== currentCard.value.id && c.pinyin)
  const shuffled = otherCards.sort(() => 0.5 - Math.random()).slice(0, 3).map(c => c.pinyin || '')
  return [correct, ...shuffled].filter(p => p).sort(() => 0.5 - Math.random())
})

const listeningOptions = computed(() => translateOptions.value)
const hasListeningOptions = computed(() => listeningOptions.value.length > 0)

const wordForDrawing = computed<HSKWord>(() => ({
  id: 0,
  simplified: currentCard.value?.front || '',
  pinyin: currentCard.value?.pinyin || '',
  translations: { ru: currentCard.value?.back || '' },
  pos: [],
  level: '1' as HSKLevel,
  topics: []
}))

function isChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text)
}

// Открытие ассистента
const openAssistant = () => {
  router.push('/assistant');
};

// Запуск сессии – используем все отфильтрованные карточки
function startSession() {
  if (selectedModes.value.length === 0) return

  const available = filteredCardsForSession.value
  if (available.length === 0) return

  const shuffled = [...available].sort(() => 0.5 - Math.random())
  sessionCards.value = shuffled

  const newSteps: { mode: string; card: Card }[] = []
  sessionCards.value.forEach(card => newSteps.push({ mode: 'intro', card }))
  selectedModes.value.forEach(mode => {
    sessionCards.value.forEach(card => newSteps.push({ mode, card }))
  })

  steps.value = newSteps
  currentStep.value = 0
  selectedOption.value = null
  showTranslation.value = false
  mistakeCards.value = []
  usedHintForCurrent.value = false
  inSession.value = true
  drawingCompleted.value = false
}

// Навигация
function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
    resetModeState()
    usedHintForCurrent.value = false
    drawingCompleted.value = false
  }
}

function nextStep() {
  if (currentMode.value === 'drawing' && !drawingCompleted.value) {
    appStore.showToast('Сначала завершите пропись!', 'warning')
    return
  }

  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++
    resetModeState()
    usedHintForCurrent.value = false
    drawingCompleted.value = false
  } else {
    inSession.value = false
    showResultModal.value = true
  }
}

function resetModeState() {
  selectedOption.value = null
  showTranslation.value = false
}

// Определение качества ответа на основе использования подсказок и правильности
function determineQuality(isCorrect: boolean): number {
  if (!isCorrect) return 1

  if (usedHintForCurrent.value) {
    return 3
  }

  return 5
}

function handleChoiceAnswer(answer: string, correct: string) {
  if (selectedOption.value !== null) return
  selectedOption.value = answer
  const isCorrect = answer === correct
  const quality = determineQuality(isCorrect)

  if (isCorrect) {
    appStore.showToast('Верно!', 'success')
    // авто-переход
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = setTimeout(() => {
      nextStep()
      autoAdvanceTimer = null
    }, AUTO_ADVANCE_DELAY)
  } else {
    appStore.showToast('Ошибка!', 'error')
    handleMistake()
  }

  if (currentCard.value) {
    packsStore.answerCard(currentCard.value.id, quality)
  }
}

function handleMistake() {
  if (!mistakeCards.value.find(c => c.id === currentCard.value?.id)) {
    mistakeCards.value.push(currentCard.value!)
  }
}

function handleDrawingComplete(result: { passed: boolean; mistakes: number; quality: number }) {
  drawingCompleted.value = true
  if (currentCard.value) {
    if (result.mistakes > 0) {
      if (!mistakeCards.value.find(c => c.id === currentCard.value!.id)) {
        mistakeCards.value.push(currentCard.value!)
      }
    }
    packsStore.answerCard(currentCard.value.id, result.quality)
    // если успешно, авто-переход
    if (result.passed) {
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = setTimeout(() => {
        nextStep()
        autoAdvanceTimer = null
      }, AUTO_ADVANCE_DELAY)
    }
  }
}

async function playAudio() {
  if (currentCard.value) {
    try {
      await speak(currentCard.value.front, 'zh-CN')
      usedHintForCurrent.value = true // использование аудио считается подсказкой
    } catch (error) {
      appStore.showToast('Ошибка воспроизведения аудио', 'error')
    }
  }
}

function openStrokeOrder() {
  showStrokeModal.value = true
  usedHintForCurrent.value = true // просмотр порядка черт – подсказка
}

function repeatMistakes() {
  sessionCards.value = [...mistakeCards.value]
  mistakeCards.value = []

  const newSteps: { mode: string; card: Card }[] = []
  sessionCards.value.forEach(card => newSteps.push({ mode: 'intro', card }))
  selectedModes.value.forEach(mode => {
    sessionCards.value.forEach(card => newSteps.push({ mode, card }))
  })

  steps.value = newSteps
  currentStep.value = 0
  usedHintForCurrent.value = false
  inSession.value = true
  showResultModal.value = false
  drawingCompleted.value = false
}

function resetSession() {
  showResultModal.value = false
}

function goBack() {
  router.push('/main/packs') // вместо router.back()
}

watch(currentMode, () => {
  if (currentMode.value !== 'drawing') {
    drawingCompleted.value = false
  }
})

// Сброс флага подсказки при смене карточки
watch(currentCard, () => {
  usedHintForCurrent.value = false
})

onUnmounted(() => {
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
})
</script>

<style scoped>
/* Основные стили */
.pack-study {
  padding: 1rem 1rem 80px;
  min-height: 100vh;
  box-sizing: border-box;
}

/* Шапка */
.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 0.5rem;
}
.back-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 12px;
  cursor: pointer;
  color: var(--accent-color);
}
.progress-indicator {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
}
.title-placeholder {
  font-size: 1rem;
  font-weight: 500;
  flex: 1;
  text-align: center;
  color: var(--accent-color);
}
.assistant-btn {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 30px;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  cursor: pointer;
  color: var(--accent-color);
  transition: all 0.2s;
  font-size: 1.1rem;
  font-weight: 500;
  white-space: nowrap;
}
.assistant-btn:hover {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 10%, var(--surface));
}
.assistant-char {
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* Прогресс-бар */
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

/* Блок с карточкой */
.mode-block {
  background: var(--bg-primary);
  border-radius: 32px;
  padding: 2rem;
  box-shadow: var(--card-shadow);
  margin-bottom: 2rem;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Карточка-флип */
.card-flip {
  position: relative;
  width: 100%;
  min-height: 200px;
  cursor: pointer;
  transition: transform 0.3s;
  transform-style: preserve-3d;
}
.card-flip.flipped {
  transform: rotateY(180deg);
}
.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: var(--surface);
  box-shadow: var(--card-shadow);
}
.card-front {
  transform: rotateY(0deg);
}
.card-back {
  transform: rotateY(180deg);
}
.hanzi {
  font-size: 3rem;
  font-weight: bold;
  color: var(--text-primary);
}
.card-back .translation {
  font-size: 2rem;
  font-weight: bold;
  color: var(--accent-color);
  text-align: center;
  width: 100%;
  padding: 0 1rem;
  box-sizing: border-box;
}
.pinyin {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

/* Кнопки действий */
.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}
.btn-outline {
  background: transparent;
  border: 2px solid var(--accent-color);
  color: var(--accent-color);
  padding: 0.6rem 1.2rem;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}
.btn-outline:hover {
  background: color-mix(in srgb, var(--accent-color) 10%, transparent);
}

/* Навигация */
.session-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
}
.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 40px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  min-width: 110px;
  justify-content: center;
}
.nav-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 5%, var(--surface));
}
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Панель настроек */
.settings-panel {
  margin-top: 1rem;
}
.modes-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.custom-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.5rem 1rem;
  background: var(--surface);
  border-radius: 30px;
  border: 2px solid var(--border);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  color: var(--text-primary);
  user-select: none;
}
.custom-checkbox:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, var(--surface));
  border-color: var(--accent-color);
}
.custom-checkbox input {
  position: absolute;
  opacity: 0;
}
.custom-checkbox.checked {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.custom-checkbox.disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.filter-section {
  margin-bottom: 1rem;
}
.filter-buttons {
  display: flex;
  gap: 0.5rem;
}
.filter-btn {
  flex: 1;
  padding: 0.5rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  font-size: 0.9rem;
}
.filter-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.start-btn {
  width: 100%;
  padding: 0.75rem;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
}
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

/* Опции для выбора */
.options-grid {
  display: grid;
  gap: 0.75rem;
  width: 100%;
  max-width: 400px;
}
.two-columns {
  grid-template-columns: 1fr 1fr;
}
.option-btn {
  padding: 0.8rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 30px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  white-space: normal;
  word-break: break-word;
}
.option-btn.selected {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.option-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 10%, var(--surface));
}
.option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Аудирование */
.audio-btn {
  margin-bottom: 1rem;
}
.hint {
  margin-top: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Модальные окна */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(5px);
}
.modal {
  background: var(--bg-primary);
  border-radius: 28px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent-color);
}
.results-modal h2 {
  margin-bottom: 1rem;
  color: var(--accent-color);
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
.btn-primary {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
}

/* Карточка с пиньинем под иероглифом */
.card-front {
  transform: rotateY(0deg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.hanzi {
  font-size: 3rem;
  font-weight: bold;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 0.5rem;
}
.pinyin-below {
  font-size: 1.2rem;
  color: var(--text-secondary);
}
.card-back .translation {
  font-size: 2rem;
  font-weight: bold;
  color: var(--accent-color);
  text-align: center;
  width: 100%;
  padding: 0 1rem;
  box-sizing: border-box;
}
.flip-hint {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
}

/* Кнопка ассистента залитая */
.assistant-btn.filled {
  background: var(--accent-color);
  color: white;
  border: 2px solid var(--accent-color);
  padding: 0.5rem 1rem;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  font-weight: 500;
  white-space: nowrap;
}
.assistant-btn.filled:hover {
  background: color-mix(in srgb, var(--accent-color) 80%, black);
  border-color: color-mix(in srgb, var(--accent-color) 80%, black);
}
.assistant-char {
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.2rem;
}

/* Навигация */
.session-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
}
.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 40px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  min-width: 110px;
  justify-content: center;
}
.nav-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 5%, var(--surface));
}
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>