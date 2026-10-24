<template>
  <div class="select-words-view mobile-container">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">
        <ChevronLeft :size="24" />
      </button>
      <h2>Выберите слова</h2>
      <button class="btn-icon" @click="addSelected" :disabled="selectedIds.length === 0">
        <Check :size="24" />
      </button>
    </div>

    <div class="search-section">
      <div class="search-wrapper">
        <Search :size="20" class="search-icon" />
        <input v-model="search" class="search-input" placeholder="Поиск..." />
      </div>
      <button class="filter-btn" @click="showFilters = true">
        <Filter :size="20" />
      </button>
    </div>

    <div class="words-grid">
      <div
        v-for="word in filteredWords"
        :key="word.id"
        class="word-card"
        @click="toggleWord(word)"
      >
        <div class="word-checkbox">
          <div v-if="selectedIds.includes(word.id)" class="checked">✓</div>
        </div>
        <div class="word-hanzi">{{ word.simplified }}</div>
        <div class="word-pinyin">{{ word.pinyin }}</div>
        <div class="word-translation">{{ word.translations.ru }}</div>
        <div class="word-level">HSK {{ word.level }}</div>
      </div>
    </div>

    <!-- Модалка фильтров -->
    <div v-if="showFilters" class="modal-overlay" @click.self="showFilters = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Фильтры</h3>
          <button class="btn-icon" @click="showFilters = false">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <div class="filter-group">
            <label>Уровни HSK</label>
            <div class="filter-options">
              <label v-for="level in HSK_LEVELS" :key="level" class="checkbox-label">
                <input type="checkbox" :value="level" v-model="selectedLevels" />
                <span>HSK {{ level }}</span>
              </label>
            </div>
          </div>
          <div class="filter-group">
            <label>Темы</label>
            <div class="filter-options">
              <label v-for="topic in availableTopics" :key="topic" class="checkbox-label">
                <input type="checkbox" :value="topic" v-model="selectedTopics" />
                <span>{{ topic }}</span>
              </label>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" @click="resetFilters">Сбросить</button>
            <button class="btn btn-primary" @click="showFilters = false">Применить</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft, Search, Filter, X, Check } from 'lucide-vue-next'
import { useVocabularyStore } from '@/stores/vocabularyStore'
import { HSK_LEVELS } from '@/constants'
import type { HSKWord, HSKLevel } from '@/types'

const router = useRouter()
const route = useRoute()
const vocabStore = useVocabularyStore()

const search = ref('')
const selectedLevels = ref<HSKLevel[]>([])
const selectedTopics = ref<string[]>([])
const showFilters = ref(false)
const selectedIds = ref<number[]>([])

const availableTopics = computed(() => {
  const topics = new Set<string>()
  vocabStore.words.forEach(w => w.topics?.forEach(t => topics.add(t)))
  return Array.from(topics).sort()
})

const filteredWords = computed(() => {
  let result = vocabStore.words
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(w =>
      w.simplified.includes(q) || w.translations.ru.toLowerCase().includes(q)
    )
  }
  if (selectedLevels.value.length) {
    result = result.filter(w => selectedLevels.value.includes(w.level))
  }
  if (selectedTopics.value.length) {
    result = result.filter(w => w.topics?.some(t => selectedTopics.value.includes(t)))
  }
  return result
})

function toggleWord(word: HSKWord) {
  const idx = selectedIds.value.indexOf(word.id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(word.id)
}

function resetFilters() {
  selectedLevels.value = []
  selectedTopics.value = []
  showFilters.value = false
}

function addSelected() {
  const selectedWords = vocabStore.words.filter(w => selectedIds.value.includes(w.id))
  const returnTo = route.query.returnTo as string || '/pack/new'
  router.push({
    path: returnTo,
    state: { selectedWords: selectedWords.map(w => ({
      front: w.simplified,
      back: w.translations.ru,
      pinyin: w.pinyin,
      imageUrl: '',
      source: 'hsk',
      sourceId: w.id,
    })) }
  })
}

onMounted(() => {
  vocabStore.loadVocabulary()
})
</script>

<style scoped>
.select-words-view {
  padding: 1rem 0 80px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.search-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.search-wrapper {
  flex: 1;
  position: relative;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}
.search-input {
  width: 85%;
  padding: 0.8rem 1rem 0.8rem 2.5rem;
  border: 2px solid var(--border);
  border-radius: 30px;
  background: var(--surface);
  color: var(--text-primary);
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
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn:hover {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 5%, var(--surface));
}
.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 0.75rem;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 0.25rem;
}
.word-card {
  background: var(--surface);
  border-radius: 16px;
  padding: 0.75rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  position: relative;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}
.word-card:hover {
  border-color: var(--accent-color);
}
.word-checkbox {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.word-checkbox .checked {
  background: var(--accent-color);
  color: white;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.word-hanzi {
  font-size: 1.7rem;
  font-weight: bold;
  color: var(--text-primary);
  font-family: 'Noto Sans SC', sans-serif;
  text-align: center;
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
}
.word-level {
  font-size: 0.8rem;
  color: var(--accent-color);
  text-align: center;
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
  width: 90%;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.filter-group {
  margin-bottom: 1rem;
}
.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}
.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--surface);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  border: 1px solid var(--border);
  font-size: 0.9rem;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
</style>