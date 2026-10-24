<!-- views/GlossaryView.vue -->
<template>
  <div class="glossary-view mobile-container">
    <SectionHeader title="Глоссарий" @open-profile="$router.push('/profile')" />

    <!-- Вкладки: Библиотека / Мои паки -->
    <div class="tabs main-tabs">
      <button
        :class="['tab', { active: activeTab === 'library' }]"
        @click="activeTab = 'library'"
      >
        Библиотека
      </button>
      <button
        :class="['tab', { active: activeTab === 'packs' }]"
        @click="activeTab = 'packs'"
      >
        Мои паки
      </button>
    </div>

    <!-- Библиотека -->
    <div v-if="activeTab === 'library'" class="library-tab">
      <!-- Подвкладки: Слова / Ключи -->
      <div class="sub-tabs">
        <button
          :class="['sub-tab', { active: libraryMode === 'words' }]"
          @click="libraryMode = 'words'"
        >
          Слова
        </button>
        <button
          :class="['sub-tab', { active: libraryMode === 'radicals' }]"
          @click="libraryMode = 'radicals'"
        >
          Ключи (радикалы)
        </button>
      </div>

      <!-- Строка поиска и фильтры -->
      <div class="search-section">
        <div class="search-wrapper">
          <Search :size="20" class="search-icon" />
          <input
            v-model="librarySearch"
            class="search-input"
            :placeholder="libraryMode === 'words' ? 'Поиск иероглифов или значения...' : 'Поиск по ключу или значению...'"
          />
        </div>
        <button class="filter-btn" @click="openFiltersModal">
          <Filter :size="20" />
        </button>
      </div>

      <!-- Виртуальный список для слов -->
      <RecycleScroller
        v-if="libraryMode === 'words'"
        class="scroller"
        :items="filteredWords"
        :item-size="120"
        key-field="id"
        v-slot="{ item }"
      >
        <div class="word-card" @click="showWordDetails(item as HSKWord)">
          <div class="word-hanzi">{{ (item as HSKWord).simplified }}</div>
          <div class="word-pinyin">{{ (item as HSKWord).pinyin }}</div>
          <div class="word-translation">{{ (item as HSKWord).translations.ru }}</div>
          <div class="word-level">HSK {{ (item as HSKWord).level }}</div>
          <button 
            class="btn-icon stroke-order-btn" 
            @click.stop="showStrokeOrderForWord(item as HSKWord)"
            title="Порядок черт"
          >
            <PenTool :size="18" />
          </button>
        </div>
      </RecycleScroller>

      <!-- Виртуальный список для ключей -->
      <RecycleScroller
        v-else-if="libraryMode === 'radicals'"
        class="scroller"
        :items="filteredRadicals"
        :item-size="120"
        key-field="id"
        v-slot="{ item }"
      >
        <div class="radical-card" @click="showRadicalDetails(item as Radical)">
          <div class="radical-char">{{ (item as Radical).character }}</div>
          <div class="radical-meaning">{{ (item as Radical).meaning }}</div>
          <div class="radical-pinyin">{{ (item as Radical).pinyin }}</div>
          <div class="radical-strokes">{{ (item as Radical).strokes }} черт</div>
        </div>
      </RecycleScroller>
    </div>

    <!-- Мои паки -->
    <div v-else-if="activeTab === 'packs'" class="packs-tab">
      <PacksView :embedded="true" :no-search="false" />
    </div>

    <!-- Модалка фильтров для слов -->
    <div v-if="showWordFilters" class="modal-overlay" @click.self="showWordFilters = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Фильтры</h3>
          <button class="btn-icon" @click="showWordFilters = false">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <div class="filter-group">
            <label>Уровень HSK</label>
            <div class="filter-options">
              <label
                v-for="level in HSK_LEVELS"
                :key="level"
                class="checkbox-label"
                :class="{ checked: selectedLevels.includes(level) }"
              >
                <input type="checkbox" :value="level" v-model="selectedLevels" />
                <span>HSK {{ level }}</span>
              </label>
            </div>
          </div>
          <div class="filter-group">
            <label>Темы</label>
            <div class="filter-options">
              <label
                v-for="topic in availableTopics"
                :key="topic"
                class="checkbox-label"
                :class="{ checked: selectedTopics.includes(topic) }"
              >
                <input type="checkbox" :value="topic" v-model="selectedTopics" />
                <span>{{ topic }}</span>
              </label>
            </div>
          </div>
          <div class="filter-group">
            <label>Сортировка</label>
            <select v-model="wordSort" class="input">
              <option value="default">По умолчанию</option>
              <option value="level">По уровню HSK</option>
              <option value="alphabet">По алфавиту (пиньинь)</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" @click="resetWordFilters">Сбросить</button>
            <button class="btn btn-primary" @click="applyWordFilters">Применить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка фильтров для ключей -->
    <div v-if="showRadicalFilters" class="modal-overlay" @click.self="showRadicalFilters = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Фильтры</h3>
          <button class="btn-icon" @click="showRadicalFilters = false">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <div class="filter-group">
            <label>Количество черт</label>
            <div class="filter-options stroke-options">
              <button
                v-for="filter in STROKE_FILTERS"
                :key="filter.value"
                class="stroke-btn"
                :class="{ active: selectedStrokeFilter === filter.value }"
                @click="selectedStrokeFilter = filter.value"
              >
                {{ filter.label }}
              </button>
            </div>
          </div>
          <div class="filter-group">
            <label>Сортировка</label>
            <select v-model="radicalSort" class="input">
              <option value="default">По умолчанию</option>
              <option value="strokes">По количеству черт</option>
              <option value="alphabet">По алфавиту (пиньинь)</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" @click="resetRadicalFilters">Сбросить</button>
            <button class="btn btn-primary" @click="applyRadicalFilters">Применить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка деталей иероглифа -->
    <div v-if="selectedWord" class="modal-overlay" @click.self="selectedWord = null">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ selectedWord.simplified }}</h3>
          <button class="btn-icon" @click="selectedWord = null">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <p><strong>Пиньинь:</strong> {{ selectedWord.pinyin }}</p>
          <p><strong>Перевод:</strong> {{ selectedWord.translations.ru }}</p>
          <p><strong>HSK уровень:</strong> {{ selectedWord.level }}</p>
          <p><strong>Темы:</strong> {{ selectedWord.topics?.join(', ') || 'нет' }}</p>
        </div>
      </div>
    </div>

    <!-- Модалка деталей ключа -->
    <div v-if="selectedRadical" class="modal-overlay" @click.self="selectedRadical = null">
      <div class="modal radical-modal">
        <div class="modal-header">
          <h3>{{ selectedRadical.character }}</h3>
          <button class="btn-icon" @click="selectedRadical = null">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <p><strong>Пиньинь:</strong> {{ selectedRadical.pinyin }}</p>
          <p><strong>Значение:</strong> {{ selectedRadical.meaning }}</p>
          <p><strong>Количество черт:</strong> {{ selectedRadical.strokes }}</p>
          <p v-if="selectedRadical.variant"><strong>Вариант:</strong> {{ selectedRadical.variant }}</p>
          <div class="stroke-order-section">
            <h4>Порядок черт</h4>
            <StrokeOrder :character="selectedRadical.character" :size="200" />
          </div>
          <div v-if="selectedRadical.examples?.length" class="examples">
            <p><strong>Примеры:</strong></p>
            <div class="example-chars">
              <span
                v-for="ex in selectedRadical.examples"
                :key="ex"
                class="example-char"
                @click.stop="librarySearch = ex; selectedRadical = null"
              >
                {{ ex }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка порядка черт для слова -->
    <div v-if="showStrokeModalForWord" class="modal-overlay" @click.self="showStrokeModalForWord = false">
      <div class="modal stroke-modal">
        <div class="modal-header">
          <h3>{{ selectedWordForStroke?.simplified || 'Иероглиф' }}</h3>
          <button class="btn-icon" @click="showStrokeModalForWord = false">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <StrokeOrder :character="selectedWordForStroke?.simplified || ''" :size="200" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// @ts-ignore
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { useVocabularyStore } from '@/stores/vocabularyStore'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import StrokeOrder from '@/components/ui/StrokeOrder.vue'
import { Search, Filter, X, PenTool } from 'lucide-vue-next'
import PacksView from './PacksView.vue'
import radicalsData from '@/data/radicals.json'
import { HSK_LEVELS, STROKE_FILTERS } from '@/constants'
import type { HSKWord } from '@/types'

export interface Radical {
  id: number
  character: string
  pinyin: string
  meaning: string
  examples?: string[]
  strokes: number
  variant?: string
}

const vocabStore = useVocabularyStore()

// Основные вкладки
const activeTab = ref<'library' | 'packs'>('library')

// Подвкладки внутри библиотеки
const libraryMode = ref<'words' | 'radicals'>('words')

// Поиск
const librarySearch = ref('')

// Состояние модалок фильтров
const showWordFilters = ref(false)
const showRadicalFilters = ref(false)

// Фильтры для слов
const selectedLevels = ref<string[]>([])
const selectedTopics = ref<string[]>([])
const wordSort = ref('default')

// Фильтры для ключей
const selectedStrokeFilter = ref('all')
const radicalSort = ref('default')

// Для модалки порядка черт
const showStrokeModalForWord = ref(false)
const selectedWordForStroke = ref<HSKWord | null>(null)

// Вычисляемые данные для слов
const filteredWords = computed(() => {
  let result = vocabStore.words

  if (librarySearch.value) {
    const q = librarySearch.value.toLowerCase()
    result = result.filter(w =>
      w.simplified.includes(q) ||
      w.translations.ru.toLowerCase().includes(q)
    )
  }

  if (selectedLevels.value.length) {
    result = result.filter(w => selectedLevels.value.includes(w.level))
  }

  if (selectedTopics.value.length) {
    result = result.filter(w =>
      w.topics?.some(t => selectedTopics.value.includes(t))
    )
  }

  if (wordSort.value === 'level') {
    result = [...result].sort((a, b) => Number(a.level) - Number(b.level))
  } else if (wordSort.value === 'alphabet') {
    result = [...result].sort((a, b) => a.pinyin.localeCompare(b.pinyin))
  }

  return result
})

// Вычисляемые данные для ключей
const filteredRadicals = computed(() => {
  let result = radicalsData as Radical[]

  if (librarySearch.value) {
    const s = librarySearch.value.toLowerCase()
    result = result.filter(
      r => r.character.includes(s) || 
           r.meaning.toLowerCase().includes(s) || 
           r.pinyin.includes(s)
    )
  }

  if (selectedStrokeFilter.value !== 'all') {
    const [min, max] = selectedStrokeFilter.value.split('-').map(Number)
    if (max) {
      result = result.filter(r => r.strokes >= min && r.strokes <= max)
    } else {
      result = result.filter(r => r.strokes >= 10)
    }
  }

  if (radicalSort.value === 'strokes') {
    result = [...result].sort((a, b) => a.strokes - b.strokes)
  } else if (radicalSort.value === 'alphabet') {
    result = [...result].sort((a, b) => a.pinyin.localeCompare(b.pinyin))
  }

  return result
})

// Доступные темы для фильтра
const availableTopics = computed(() => {
  const topicsSet = new Set<string>()
  vocabStore.words.forEach(w => w.topics?.forEach(t => topicsSet.add(t)))
  return Array.from(topicsSet).sort()
})

// Выбранные элементы
const selectedWord = ref<HSKWord | null>(null)
const selectedRadical = ref<Radical | null>(null)

function showWordDetails(word: HSKWord) {
  selectedWord.value = word
}

function showRadicalDetails(radical: Radical) {
  selectedRadical.value = radical
}

function showStrokeOrderForWord(word: HSKWord) {
  selectedWordForStroke.value = word
  showStrokeModalForWord.value = true
}

function openFiltersModal() {
  if (libraryMode.value === 'words') {
    showWordFilters.value = true
  } else {
    showRadicalFilters.value = true
  }
}

function applyWordFilters() {
  showWordFilters.value = false
}

function resetWordFilters() {
  selectedLevels.value = []
  selectedTopics.value = []
  wordSort.value = 'default'
  showWordFilters.value = false
}

function applyRadicalFilters() {
  showRadicalFilters.value = false
}

function resetRadicalFilters() {
  selectedStrokeFilter.value = 'all'
  radicalSort.value = 'default'
  showRadicalFilters.value = false
}

onMounted(() => {
  vocabStore.loadVocabulary()
})
</script>

<style scoped>
.glossary-view {
  padding: 1rem 0 80px;
}

.main-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.2s;
}

.tab.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.sub-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0 0.25rem;
}

.sub-tab {
  flex: 1;
  padding: 0.5rem;
  border: none;
  background: transparent;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.sub-tab.active {
  color: var(--accent-color);
  border-bottom-color: var(--accent-color);
}

.search-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-secondary);
}

.search-input {
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 2.5rem;
  border: 2px solid var(--border);
  border-radius: 30px;
  background: var(--surface);
  color: var(--text-primary);
  font-size: 1rem;
}

.filter-btn {
  width: 48px;
  height: 48px;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 5%, var(--surface));
}

.scroller {
  height: 70vh;
  width: 100%;
}

.word-card {
  position: relative;
  background: var(--surface);
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  margin-bottom: 0.75rem;
}

.word-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-hover-shadow);
}

.stroke-order-btn {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  background: color-mix(in srgb, var(--accent-color) 10%, var(--surface));
  border: 1px solid var(--accent-color);
  color: var(--accent-color);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.stroke-order-btn:hover {
  background: var(--accent-color);
  color: white;
  transform: scale(1.1);
}

.word-hanzi {
  font-size: 1.7rem;
  font-weight: bold;
  color: var(--text-primary);
  font-family: 'Noto Sans SC', sans-serif;
  text-align: center;
  margin-bottom: 0.25rem;
}

.word-pinyin {
  font-size: 1rem;
  color: var(--text-secondary);
  text-align: center;
}

.word-translation {
  font-size: 0.9rem;
  color: var(--text-primary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.25rem;
}

.word-level {
  font-size: 0.8rem;
  color: var(--accent-color);
  text-align: center;
  margin-top: 0.25rem;
}

.radical-card {
  background: var(--surface);
  border-radius: 16px;
  padding: 1rem;
  text-align: center;
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: all 0.2s;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.radical-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-hover-shadow);
}

.radical-char {
  font-size: 3rem;
  font-weight: bold;
  color: var(--accent-color);
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.radical-meaning {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-top: 0.25rem;
}

.radical-pinyin {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.radical-strokes {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

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
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent-color);
  padding: 0.3rem;
  border-radius: 50%;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, transparent);
}

.modal-body p {
  margin: 0.5rem 0;
  color: var(--text-primary);
}

.filter-group {
  margin-bottom: 1.5rem;
}

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  user-select: none;
}

.checkbox-label input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-label.checked {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.stroke-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.stroke-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 20px;
  font-size: 0.9rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.stroke-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.input {
  width: 100%;
  padding: 0.6rem 1rem;
  border: 2px solid var(--border);
  border-radius: 30px;
  background: var(--surface);
  color: var(--text-primary);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  flex: 1;
  padding: 0.6rem;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  text-align: center;
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--accent-color);
  color: var(--accent-color);
}

.btn-outline:hover {
  background: color-mix(in srgb, var(--accent-color) 10%, transparent);
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px var(--accent-color);
}

.stroke-order-section {
  margin: 1.5rem 0;
  text-align: center;
}

.stroke-order-section h4 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.examples {
  margin-top: 1rem;
}

.example-chars {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.example-char {
  font-size: 1.2rem;
  background: var(--surface);
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  font-family: 'Noto Sans SC', sans-serif;
  border: 1px solid var(--border);
}

.example-char:hover {
  background: var(--accent-color);
  color: white;
}

.stroke-modal .modal-body {
  display: flex;
  justify-content: center;
  padding: 1rem;
}
</style>