<template>
  <div class="splash">
    <div class="bg-elements">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
      <div class="bg-bubble bubble-1"></div>
      <div class="bg-bubble bubble-2"></div>
    </div>

    <div class="content">
      <div class="logo-wrapper">
        <div class="logo shimmer">
          <span class="logo-text">言</span>
        </div>
      </div>
      <h1 class="title">Speak Chinese</h1>
      <p class="subtitle">HSK Trainer</p>
    </div>
    <div class="spinner"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { initDB } from '@/db/db'
import { useVocabularyStore } from '@/stores/vocabularyStore'
import { useGrammarStore } from '@/stores/grammarStore'
import { useExamStore } from '@/stores/examStore'
import { useReadingStore } from '@/stores/readingStore'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()

onMounted(async () => {
  await initDB()
  // Загружаем только те данные, которые реально нужны при старте
  await Promise.all([
    useVocabularyStore().loadVocabulary(),
    useGrammarStore().loadGrammar(),
    useExamStore().loadExams(),
    useReadingStore().loadReadings(),
    useUserStore().loadProgress()
  ])
  router.push('/main')
})
</script>

<style scoped>
.splash {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  color: white;
  padding: 2rem 1rem;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(145deg, #1e3c72, #2a5298);
}

.bg-elements {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  z-index: 1;
}

.logo-wrapper {
  margin-bottom: 2rem;
}

.logo {
  width: 120px;
  height: 120px;
  background: linear-gradient(145deg, #4caf50, #2196f3);
  border-radius: 24px;
  box-shadow: 0 20px 30px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 3s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 20px 30px rgba(0,0,0,0.3); }
  50% { transform: scale(1.05); box-shadow: 0 30px 40px rgba(0,0,0,0.4); }
}

.logo-text {
  font-size: 5rem;
  font-weight: bold;
  color: white;
  line-height: 1;
}

.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: -150%;
  width: 200%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(0); }
  50% { transform: translateX(50%); }
  100% { transform: translateX(100%); }
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-top: 0.5rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 2rem;
  z-index: 1;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>