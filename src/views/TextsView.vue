<template>
  <div class="texts-view mobile-container">
    <SectionHeader v-if="!embedded" title="Тексты для чтения" @open-profile="$router.push('/profile')" />

    <div v-if="readingStore.isLoading" class="loading">Загрузка текстов...</div>
    <div v-else>
      <div class="mode-switcher">
        <button
          :class="['mode-btn', { active: mode === 'all' }]"
          @click="mode = 'all'"
        >Все тексты</button>
        <button
          :class="['mode-btn', { active: mode === 'completed' }]"
          @click="mode = 'completed'"
        >Прочитанные</button>
      </div>

      <div v-if="mode === 'all'" class="levels-group">
        <label
          v-for="level in levelOptions"
          :key="level.value"
          class="custom-checkbox"
          :class="{ checked: selectedLevels.includes(level.value) }"
        >
          <input type="checkbox" :value="level.value" v-model="selectedLevels" />
          <span>HSK {{ level.label }}</span>
        </label>
      </div>

      <div v-if="filteredReadings.length === 0" class="placeholder">
        {{ mode === 'all' ? 'Нет текстов для выбранных уровней.' : 'Вы ещё не прочитали ни одного текста.' }}
      </div>
      <div v-else class="texts-grid">
        <div
          v-for="reading in filteredReadings"
          :key="reading.id"
          class="text-card"
          @click="openReading(reading, mode === 'completed')"
        >
          <h3>{{ displayTitle(reading) }}</h3>
          <p class="preview">{{ reading.content.substring(0, 80) }}...</p>
          <div class="meta">
            <span class="level-badge">HSK {{ reading.level }}</span>
            <span class="questions-count">{{ reading.questions?.length || 0 }} вопросов</span>
          </div>
          <div v-if="userStore.isReadingCompleted(reading.id)" class="completed-badge">
            ✅ Прочитано
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно чтения -->
    <div v-if="selectedReading" class="modal-overlay" @click.self="selectedReading = null">
      <div class="modal reading-modal">
        <div class="modal-header">
          <h3>{{ displayTitle(selectedReading) }}</h3>
          <button class="btn-icon" @click="selectedReading = null">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <div class="reading-content">
            <p>{{ selectedReading.content }}</p>
            <p v-if="selectedReading.pinyin" class="content-pinyin">{{ selectedReading.pinyin }}</p>
            <p v-if="selectedReading.translation" class="content-translation">{{ selectedReading.translation }}</p>
          </div>
          <div v-if="selectedReading.questions?.length" class="questions">
            <h4>Вопросы:</h4>
            <div v-for="(q, idx) in selectedReading.questions" :key="idx" class="question-item">
              <p>{{ getQuestionText(q) }}</p>
              <p v-if="showPinyin && q.question.pinyin" class="question-pinyin">{{ q.question.pinyin }}</p>
              <div class="options">
                <button
                  v-for="(opt, optIdx) in q.options"
                  :key="optIdx"
                  @click="!selectedReading.readonly && checkAnswer(selectedReading, idx, optIdx)"
                  :disabled="selectedReading.readonly || q.answered"
                  :class="[
                    'option-btn',
                    {
                      correct: (selectedReading.readonly && optIdx === q.answer) || (q.answered && optIdx === q.answer),
                      wrong: !selectedReading.readonly && q.answered && q.userAnswer === optIdx && optIdx !== q.answer
                    }
                  ]"
                >
                  {{ getOptionText(opt) }}
                </button>
              </div>
            </div>
          </div>
          <div v-else class="no-questions">
            <p>К этому тексту нет вопросов.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReadingStore } from '@/stores/readingStore'
import { useUserStore } from '@/stores/userStore'
import { useAppStore } from '@/stores/appStore'
import { X } from 'lucide-vue-next'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import type { Reading, ReadingQuestion } from '@/types'
import { HSKLevel, HSK_LEVELS } from '@/constants'

const props = defineProps<{
  embedded?: boolean   // если true – не показываем собственный заголовок
}>()

interface ReadingModal extends Reading {
  readonly?: boolean
  questions: (ReadingQuestion & { answered: boolean; userAnswer: number | null })[]
}

const readingStore = useReadingStore()
const userStore = useUserStore()
const appStore = useAppStore()

onMounted(() => {
  readingStore.loadReadings()
})

const mode = ref<'all' | 'completed'>('all')
const showPinyin = ref(true)

const levelOptions = HSK_LEVELS.map(level => ({
  value: level,
  label: level
}))
const selectedLevels = ref<HSKLevel[]>([HSKLevel.Level1])

const filteredReadings = computed(() => {
  const readings = readingStore.readings || []
  if (!Array.isArray(readings)) return []

  if (mode.value === 'all') {
    return readings.filter((r: Reading) => selectedLevels.value.includes(r.level))
  } else {
    return readings.filter((r: Reading) => userStore.progress.completedReadings.includes(r.id))
  }
})

const selectedReading = ref<ReadingModal | null>(null)

function displayTitle(reading: Reading): string {
  if (appStore.interfaceLanguage === 'ru' && reading.title_ru) {
    return reading.title_ru
  }
  return reading.title
}

function getQuestionText(q: ReadingQuestion): string {
  if (appStore.interfaceLanguage === 'ru') {
    return q.question.ru
  }
  return q.question.chinese
}

function getOptionText(opt: ReadingQuestion['options'][0]): string {
  if (appStore.interfaceLanguage === 'ru') {
    return opt.ru
  }
  return opt.chinese
}

function openReading(reading: Reading, readonly = false) {
  selectedReading.value = {
    ...reading,
    readonly,
    questions: reading.questions
      ? reading.questions.map(q => ({ ...q, answered: false, userAnswer: null }))
      : []
  }
}

function checkAnswer(reading: ReadingModal, qIdx: number, optIndex: number) {
  if (reading.readonly) return
  const question = reading.questions[qIdx]
  if (question.answered) return
  question.answered = true
  question.userAnswer = optIndex

  const allCorrect = reading.questions.every((q, i) => {
    return reading.questions[i].userAnswer === q.answer
  })
  if (allCorrect) {
    userStore.addCompletedReading(reading.id)
  }
}
</script>

<style scoped>
/* все стили из исходного TextsView.vue остаются без изменений */
.texts-view {padding: 1rem 0 80px; }
.mode-switcher {display: flex; gap: 1rem; margin-bottom: 1rem; }
.mode-btn {flex: 1; padding: 0.75rem; border: 2px solid var(--border); background: var(--surface); border-radius: 30px; font-weight: 600; cursor: pointer; color: var(--text-primary); transition: all 0.2s; }
.mode-btn.active { background: var(--accent-color); color: white; border-color: var(--accent-color); }
.levels-group { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem; }
.texts-grid { display: grid; gap: 1rem; }
.text-card { background: var(--card-bg); border-radius: 16px; padding: 1rem; box-shadow: var(--card-shadow); cursor: pointer; transition: all 0.2s; position: relative; }
.text-card:hover { transform: translateY(-2px); box-shadow: var(--card-hover-shadow); }
.text-card h3 { margin: 0 0 0.5rem 0; font-size: 1.2rem; color: var(--text-primary); }
.preview { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem; }
.meta { display: flex; justify-content: space-between; align-items: center; }
.level-badge { background: var(--accent-color); color: white; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.8rem; }
.questions-count { color: var(--text-secondary); font-size: 0.8rem; }
.completed-badge { position: absolute; top: 0.5rem; right: 0.5rem; font-size: 0.8rem; color: #4caf50; background: rgba(255,255,255,0.9); padding: 0.2rem 0.5rem; border-radius: 20px; border: 1px solid #4caf50; }
.reading-modal { max-width: 600px; }
.reading-content { background: var(--surface); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; white-space: pre-wrap; line-height: 1.6; }
.content-pinyin { color: var(--text-secondary); font-style: italic; margin-top: 0.5rem; }
.content-translation { color: var(--text-secondary); margin-top: 0.5rem; border-left: 3px solid var(--accent-color); padding-left: 0.75rem; }
.questions h4 { margin-bottom: 1rem; color: var(--text-primary); }
.question-item { margin-bottom: 1.5rem; }
.question-item p { font-weight: 500; margin-bottom: 0.5rem; color: var(--text-primary); }
.question-pinyin { font-size: 0.9rem; color: var(--text-secondary); font-style: italic; margin-bottom: 0.5rem; }
.options { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.option-btn { padding: 0.5rem 1rem; border: 2px solid var(--border); background: var(--surface); border-radius: 20px; cursor: pointer; transition: all 0.2s; color: var(--text-primary); }
.option-btn.correct { border-color: #4caf50; background: #e8f5e9; color: #2e7d32; }
.option-btn.wrong { border-color: #f44336; background: #ffebee; color: #c62828; }
.option-btn:disabled { opacity: 0.7; cursor: default; }
.btn-icon { background: none; border: none; padding: 0.5rem; border-radius: 12px; cursor: pointer; color: var(--accent-color); transition: background 0.2s; }
.btn-icon:hover { background: rgba(0,0,0,0.05); }
.dark .btn-icon:hover { background: rgba(255,255,255,0.1); }
.loading, .placeholder { text-align: center; color: var(--text-secondary); margin-top: 2rem; }
.no-questions { text-align: center; color: var(--text-secondary); padding: 2rem; }
</style>