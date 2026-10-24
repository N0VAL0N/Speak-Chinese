<!-- App.vue -->
<template>
  <div class="bg-elements">
    <div class="bg-circle circle-1"></div>
    <div class="bg-circle circle-2"></div>
    <div class="bg-circle circle-3"></div>
    <div class="bg-bubble bubble-1"></div>
    <div class="bg-bubble bubble-2"></div>
    <div class="bg-float-character char-1">语</div>
    <div class="bg-float-character char-2">学</div>
    <div class="bg-float-character char-3">中</div>
  </div>

  <div v-if="isAppLoading" class="app-loading">
    <div class="spinner"></div>
    <p>Загрузка данных...</p>
  </div>
  <div v-else>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <SettingsModal v-if="appStore.isSettingsOpen" @close="appStore.closeSettings" />
    <ToastContainer ref="toastContainer" />
    <GoalModal v-if="showGoalModal" @close="showGoalModal = false" @save="userStore.setGoals" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'
import { App } from '@capacitor/app'
import { initDB } from './db/db'
import { useAppStore } from './stores/appStore'
import { useUserStore } from './stores/userStore'
import { useVocabularyStore } from './stores/vocabularyStore'
import { useGrammarStore } from './stores/grammarStore'
import { useExamStore } from './stores/examStore'
import { useReadingStore } from './stores/readingStore'
import SettingsModal from '@/components/ui/SettingsModal.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import GoalModal from '@/components/ui/GoalModal.vue'
import { isChineseVoiceAvailable } from '@/services/tts'
import { assistant } from '@/services/assistantEngine'

const appStore = useAppStore()
const userStore = useUserStore()
const router = useRouter()
const isAppLoading = ref(true)
const toastContainer = ref<InstanceType<typeof ToastContainer>>()
const showGoalModal = ref(false)

// Сохранение текущего роута
function saveCurrentRoute() {
  const route = router.currentRoute.value
  if (route.name && route.name !== 'splash') {
    localStorage.setItem('savedRoute', JSON.stringify({
      name: route.name,
      params: route.params,
      query: route.query
    }))
  }
}

// Восстановление роута
function restoreCurrentRoute() {
  const saved = localStorage.getItem('savedRoute')
  if (saved) {
    try {
      const { name, params, query } = JSON.parse(saved)
      router.push({ name, params, query })
    } catch (e) {
      console.error('Failed to restore route', e)
    }
  }
}

async function checkTtsVoice() {
  const available = await isChineseVoiceAvailable()
  if (!available) {
    appStore.showToast('Китайский голос не найден. Установите его в настройках.', 'warning')
  }
}

onMounted(async () => {
  try {
    console.log('🚀 Инициализация приложения...')
    
    // Инициализируем базу данных
    await initDB()
    console.log('✅ База данных инициализирована')
    
    // Загружаем все данные параллельно
    await Promise.all([
      useVocabularyStore().loadVocabulary(),
      useGrammarStore().loadGrammar(),
      useExamStore().loadExams(),
      useReadingStore().loadReadings(),
      userStore.loadProgress()
    ])
    console.log('✅ Все данные загружены')

    // Инициализируем ассистента
    try {
      console.log('🔄 Инициализация ассистента...')
      await assistant.init()
      console.log('✅ Ассистент инициализирован')
    } catch (error) {
      console.error('❌ Ошибка инициализации ассистента:', error)
    }

    // Настраиваем toast
    appStore.toast = (message: string, type: any = 'info') => {
      toastContainer.value?.addToast({ message, type })
    }
    
    // Применяем тему
    appStore.applyTheme()

    // Настраиваем нативные платформы
    if (Capacitor.isNativePlatform()) {
      StatusBar.hide()
      
      App.addListener('pause', () => {
        saveCurrentRoute()
        userStore.endSession()
      })
      
      App.addListener('resume', () => {
        restoreCurrentRoute()
        userStore.startSession()
      })
    }

    // Проверяем TTS
    checkTtsVoice()

    // Начинаем сессию пользователя
    userStore.startSession()
    userStore.logActivity()

    // Показываем модалку целей при первом запуске
    if (userStore.progress.goals.length === 0) {
      showGoalModal.value = true
    }

    // Восстанавливаем последний урок или роут
    const lastLessonId = localStorage.getItem('lastLessonId')
    if (lastLessonId) {
      router.push(`/lesson/${lastLessonId}`)
      localStorage.removeItem('lastLessonId')
    } else {
      restoreCurrentRoute()
    }
    
  } catch (error) {
    console.error('❌ Ошибка загрузки данных:', error)
    appStore.showToast('Ошибка загрузки данных', 'error')
  } finally {
    isAppLoading.value = false
    console.log('✅ Приложение готово')
  }
})

onUnmounted(() => {
  userStore.endSession()
})

// Сохраняем состояние при закрытии
window.addEventListener('beforeunload', () => {
  saveCurrentRoute()
  userStore.endSession()
  const currentRoute = router.currentRoute.value
  if (currentRoute.name === 'lesson') {
    localStorage.setItem('lastLessonId', currentRoute.params.id as string)
  }
})
</script>

<style>
/* стили остаются без изменений */
.scroll-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: rgba(0, 0, 0, 0);
  transition: background 0.3s;
  z-index: 1;
}
.dark .scroll-overlay.scrolled {
  background: rgba(0, 0, 0, 0.5);
}

.bg-elements {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-color), transparent);
  opacity: 0.1;
  pointer-events: none;
  transition: transform 0.1s linear;
}
.circle-1 { width: 300px; height: 300px; top: -100px; left: -100px; animation: float 25s infinite; }
.circle-2 { width: 400px; height: 400px; bottom: -150px; right: -150px; animation: float 30s reverse infinite; }
.circle-3 { width: 200px; height: 200px; top: 30%; left: 20%; animation: ripple 20s infinite; }

.bg-float-character {
  position: absolute;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 120px;
  font-weight: 300;
  color: var(--accent-color);
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
  animation: floatCharacter 30s infinite ease-in-out;
  user-select: none;
}
.char-1 { top: 5%; left: 2%; animation-delay: 0s; }
.char-2 { bottom: 10%; right: 5%; animation-delay: 5s; }
.char-3 { top: 40%; left: 80%; animation-delay: 10s; }

@keyframes floatCharacter {
  0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.03; }
  25% { transform: translate(30px, -20px) rotate(5deg); opacity: 0.05; }
  50% { transform: translate(-20px, 30px) rotate(-5deg); opacity: 0.02; }
  75% { transform: translate(10px, -10px) rotate(3deg); opacity: 0.04; }
}

.bg-bubble {
  position: absolute;
  width: 60px;
  height: 60px;
  background: rgba(255,255,255,0.05);
  border-radius: 50%;
  pointer-events: none;
  animation: bubble 15s infinite;
}
.bubble-1 { top: 10%; left: 5%; animation-delay: 0s; }
.bubble-2 { top: 50%; right: 10%; animation-delay: 2s; }

@keyframes float {
  0%,100% { transform: translate(0,0) scale(1); opacity: 0.1; }
  33% { transform: translate(50px, -50px) scale(1.05); opacity: 0.15; }
  66% { transform: translate(-30px, 30px) scale(0.95); opacity: 0.08; }
}
@keyframes ripple {
  0% { transform: scale(1); opacity: 0.05; }
  50% { transform: scale(1.3); opacity: 0.02; }
  100% { transform: scale(1); opacity: 0.05; }
}
@keyframes bubble {
  0%,100% { transform: translateY(0) scale(1); opacity: 0.1; }
  50% { transform: translateY(-120px) scale(1.3); opacity: 0.2; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.app-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--level-bg);
}
.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0,0,0,0.1);
  border-top-color: var(--level-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Стили для глобальных элементов */
:root {
  --level-bg: var(--bg-primary);
  --level-accent: var(--accent-color);
}
</style>