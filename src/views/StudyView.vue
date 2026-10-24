<template>
  <div class="study-view">
    <h1>📘 Учеба (HSK {{ appStore.currentHSKLevel }})</h1>
    <div v-if="vocabStore.isLoading" class="loading">Загрузка слов...</div>
    <div v-else-if="wordsForLevel.length === 0" class="placeholder">
      Нет слов для этого уровня.
    </div>
    <div v-else class="word-grid">
      <div v-for="word in wordsForLevel" :key="word.id" class="word-card">
        <div class="chinese">{{ word.simplified }}</div>
        <div class="pinyin">{{ word.pinyin }}</div>
        <div class="translation">{{ word.translations.ru }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/appStore'
import { useVocabularyStore } from '@/stores/vocabularyStore'

const appStore = useAppStore()
const vocabStore = useVocabularyStore()

const loadData = () => {
  vocabStore.loadVocabulary(appStore.currentHSKLevel)
}

onMounted(loadData)
watch(() => appStore.currentHSKLevel, loadData)

const wordsForLevel = computed(() => vocabStore.words)
</script>

<style scoped>
.study-view {
  padding: 16px;
}
.word-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 20px;
}
.word-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}
.chinese {
  font-size: 1.5rem;
  font-weight: bold;
}
.pinyin {
  color: #666;
  margin: 4px 0;
}
.translation {
  color: #2a5298;
  font-size: 0.9rem;
}
.loading, .placeholder {
  text-align: center;
  color: #999;
  margin-top: 40px;
}
</style>