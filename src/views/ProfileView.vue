<template>
  <div class="profile-view">
    <div class="profile-header">
      <button class="btn-icon" @click="$router.back()">
        <ChevronLeft :size="24" />
      </button>
      <h2>Профиль</h2>
      <button class="btn-icon" @click="toggleEdit">
        <Edit v-if="!isEditing" :size="20" />
        <Check v-else :size="20" />
      </button>
    </div>

    <div class="avatar-section" @click="showAvatarSelector = true">
      <div class="avatar">
        <img v-if="userStore.avatar && userStore.avatar !== 'default'" :src="userStore.avatar" alt="avatar" />
        <User v-else :size="60" />
      </div>
      <div v-if="isEditing" class="name-edit">
        <input
          v-model="editableName"
          type="text"
          class="name-input"
          @keyup.enter="toggleEdit"
          @click.stop
        />
      </div>
      <h3 v-else class="username" @click.stop>{{ userStore.name }}</h3>
    </div>

    <!-- Модалка выбора аватара -->
    <div v-if="showAvatarSelector" class="modal-overlay" @click.self="showAvatarSelector = false">
      <div class="modal avatar-modal">
        <div class="modal-header">
          <h3>Выберите аватар</h3>
          <button class="btn-icon" @click="showAvatarSelector = false">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <div class="avatar-options">
            <div
              v-for="opt in PRESET_AVATARS"
              :key="opt.value"
              class="avatar-option"
              :class="{ active: userStore.avatar === opt.value }"
              @click="selectAvatar(opt.value)"
            >
              <img v-if="opt.value !== 'default'" :src="opt.url" :alt="opt.label" />
              <User v-else :size="40" />
              <span>{{ opt.label }}</span>
            </div>
          </div>
          <div class="upload-section">
            <label for="avatar-upload" class="btn btn-outline">Загрузить своё фото</label>
            <input id="avatar-upload" type="file" accept="image/*" @change="handleAvatarUpload" style="display: none" />
          </div>
        </div>
      </div>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value">{{ userStore.progress.streak }}</div>
        <div class="stat-label">Дней подряд</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ userStore.progress.xp }}</div>
        <div class="stat-label">Опыт</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ userStore.progress.learnedWords.length }}</div>
        <div class="stat-label">Слов</div>
      </div>
    </div>

    <!-- Кнопка активности -->
    <button class="activity-btn" @click="showActivityModal = true">
      <Calendar :size="20" />
      <span>Активность</span>
      <span class="badge">{{ userStore.progress.activityLog?.length || 0 }} дней</span>
    </button>

    <!-- Блок целей с прогрессом -->
    <div class="goals-section" v-if="userStore.progress.goals.length">
      <h3>Мои цели</h3>
      <div class="goals-list">
        <div v-for="goal in userStore.progress.goals" :key="goal.id" class="goal-card">
          <div class="goal-icon">🎯</div>
          <div class="goal-info">
            <div class="goal-title">{{ goal.title }}</div>
            <div class="goal-description">{{ goal.description }}</div>
            <div v-if="goal.level" class="goal-progress">
              <span>Прогресс: {{ getLevelProgress(goal.level) }}%</span>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: getLevelProgress(goal.level) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button class="btn btn-outline edit-goals-btn" @click="openGoalModal">
        <Edit :size="16" /> Редактировать цели
      </button>
    </div>
    <div v-else class="goals-empty">
      <p>У вас пока нет целей.</p>
      <button class="btn btn-primary" @click="openGoalModal">Выбрать цели</button>
    </div>

    <!-- Круговая диаграмма статистики практики -->
    <div class="practice-stats" v-if="userStore.progress.practiceStats">
      <h3>Статистика практики</h3>
      <div class="circular-progress-container">
        <div class="circular-progress">
          <svg viewBox="0 0 100 100" width="120" height="120">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" stroke-width="8" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              :stroke="`var(--accent-color)`"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div class="progress-percent">{{ practicePercentage }}%</div>
        </div>
        <div class="stats-text">
          <p>Правильно: {{ userStore.progress.practiceStats.correct }}</p>
          <p>Всего: {{ userStore.progress.practiceStats.total }}</p>
        </div>
      </div>
    </div>

    <!-- Достижения -->
    <div class="achievements-section">
      <h3>Достижения</h3>
      <div v-if="achievements.length === 0" class="no-achievements">
        Пока нет достижений. Учите слова и занимайтесь регулярно!
      </div>
      <div v-else class="achievements-grid">
        <div v-for="ach in achievements" :key="ach.id" class="achievement-card" :class="{ locked: !ach.unlocked }">
          <div class="achievement-icon">{{ ach.icon }}</div>
          <div class="achievement-info">
            <div class="achievement-title">{{ ach.title }}</div>
            <div class="achievement-desc">{{ ach.description }}</div>
          </div>
          <div v-if="ach.unlocked" class="achievement-check">
            <CheckCircle :size="20" />
          </div>
        </div>
      </div>
    </div>

    <!-- Меню -->
    <div class="menu-list">
      <button class="menu-item" @click="openSettings">
        <Settings :size="20" />
        <span>Настройки</span>
        <ChevronRight :size="20" />
      </button>
      <button class="menu-item" @click="resetProgress">
        <RotateCcw :size="20" />
        <span>Сбросить прогресс</span>
        <ChevronRight :size="20" />
      </button>
      <button class="menu-item" @click="logout">
        <LogOut :size="20" />
        <span>Выйти</span>
        <ChevronRight :size="20" />
      </button>
    </div>

    <!-- Модалка целей -->
    <GoalModal v-if="showGoalModal" @close="showGoalModal = false" @save="userStore.setGoals" />

    <!-- Модалка активности -->
    <ActivityModal
      v-if="showActivityModal"
      :activityLog="userStore.progress.activityLog || []"
      :totalTime="currentTotalTime"
      @close="showActivityModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useVocabularyStore } from '@/stores/vocabularyStore'
import { useAppStore } from '@/stores/appStore'
import {
  ChevronLeft, Edit, Check, User, Settings, ChevronRight,
  LogOut, CheckCircle, X, RotateCcw, Calendar
} from 'lucide-vue-next'
import GoalModal from '@/components/ui/GoalModal.vue'
import ActivityModal from '@/components/ui/ActivityModal.vue'
import type { HSKLevel } from '@/types'
import { PRESET_AVATARS } from '@/constants'

const router = useRouter()
const userStore = useUserStore()
const vocabStore = useVocabularyStore()
const appStore = useAppStore()

onMounted(() => {
  userStore.loadProgress()
  vocabStore.loadVocabulary()
  startTimer()
})

onBeforeUnmount(() => {
  stopTimer()
})

const isEditing = ref(false)
const editableName = ref(userStore.name)
const showAvatarSelector = ref(false)
const showGoalModal = ref(false)
const showActivityModal = ref(false)

let timerInterval: ReturnType<typeof setInterval> | null = null
const currentTotalTime = ref(userStore.totalTimeWithSession)

function startTimer() {
  timerInterval = setInterval(() => {
    currentTotalTime.value = userStore.totalTimeWithSession
  }, 60000)
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval)
}

function toggleEdit() {
  if (isEditing.value) {
    userStore.updateName(editableName.value)
  }
  isEditing.value = !isEditing.value
}

function selectAvatar(avatarValue: string) {
  userStore.setAvatar(avatarValue)
  showAvatarSelector.value = false
}

async function handleAvatarUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    userStore.setAvatar(dataUrl)
    showAvatarSelector.value = false
  }
  reader.readAsDataURL(file)
}

function openSettings() {
  appStore.openSettings()
}

async function resetProgress() {
  if (confirm('Сбросить весь прогресс (изученные слова, достижения, статистику)?')) {
    await userStore.resetProgress()
    appStore.showToast('Прогресс сброшен', 'success')
  }
}

function logout() {
  router.push('/')
}

function openGoalModal() {
  showGoalModal.value = true
}

function getLevelProgress(level: HSKLevel): number {
  const totalWords = vocabStore.wordsByLevel.get(level)?.length || 1
  const learnedInLevel = userStore.progress.learnedWords.filter(id => {
    const word = vocabStore.words.find(w => w.id === id)
    return word?.level === level
  }).length
  return Math.round((learnedInLevel / totalWords) * 100)
}

const achievements = computed(() => userStore.progress.achievements)

const practiceStats = computed(() => userStore.progress.practiceStats || { total: 0, correct: 0 })
const practicePercentage = computed(() => {
  if (practiceStats.value.total === 0) return 0
  return Math.round((practiceStats.value.correct / practiceStats.value.total) * 100)
})
const circumference = 2 * Math.PI * 45
const dashOffset = computed(() => circumference - (practicePercentage.value / 100) * circumference)
</script>

<style scoped>
.profile-view {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 0 1rem 80px; /* убрали верхний отступ */
}
.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}
.profile-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--accent-color);
}
.avatar-section {
  text-align: center;
  margin-bottom: 2rem;
  cursor: pointer;
}
.avatar {
  width: 100px;
  height: 100px;
  background: linear-gradient(145deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 70%, white));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto 1rem;
  overflow: hidden;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.username {
  font-size: 1.3rem;
  font-weight: 500;
  color: var(--text-primary);
}
.name-edit {
  margin-top: 0.5rem;
}
.name-input {
  font-size: 1.3rem;
  text-align: center;
  padding: 0.5rem;
  border: 2px solid var(--accent-color);
  border-radius: 30px;
  width: 80%;
  max-width: 300px;
  margin: 0 auto;
  background: var(--surface);
  color: var(--text-primary);
}
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}
.stat-card {
  background: var(--surface);
  padding: 1rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: var(--card-shadow);
}
.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--accent-color);
  line-height: 1.2;
}
.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Кнопка активности */
.activity-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem;
  background: var(--surface);
  border: none;
  border-radius: 16px;
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
  color: var(--text-primary);
}
.activity-btn:hover {
  background: var(--border);
}
.activity-btn .badge {
  margin-left: auto;
  background: var(--accent-color);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
}

/* Цели */
.goals-section {
  margin-bottom: 2rem;
  background: var(--surface);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: var(--card-shadow);
}
.goals-section h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: var(--text-primary);
}
.goals-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.goal-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--bg-primary);
  border-radius: 12px;
}
.goal-icon {
  font-size: 2rem;
}
.goal-info {
  flex: 1;
}
.goal-title {
  font-weight: 600;
  color: var(--text-primary);
}
.goal-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.goal-progress {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.progress-bar {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.25rem;
  width: 100%;
}
.progress-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s;
}
.edit-goals-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.goals-empty {
  text-align: center;
  padding: 2rem;
  background: var(--surface);
  border-radius: 16px;
  margin-bottom: 2rem;
}
.goals-empty p {
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

/* Статистика практики */
.practice-stats {
  margin-bottom: 2rem;
  background: var(--surface);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: var(--card-shadow);
}
.practice-stats h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: var(--text-primary);
}
.circular-progress-container {
  display: flex;
  align-items: center;
  gap: 2rem;
  justify-content: center;
}
.circular-progress {
  position: relative;
  width: 120px;
  height: 120px;
}
.progress-percent {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-primary);
}
.stats-text {
  font-size: 1rem;
  color: var(--text-secondary);
}
.stats-text p {
  margin: 0.2rem 0;
}

/* Достижения */
.achievements-section {
  margin-bottom: 2rem;
}
.achievements-section h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}
.no-achievements {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
  background: var(--surface);
  border-radius: 16px;
}
.achievements-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
.achievement-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  transition: all 0.2s;
}
.achievement-card.locked {
  opacity: 0.5;
  filter: grayscale(0.8);
}
.achievement-icon {
  font-size: 2rem;
  min-width: 48px;
  text-align: center;
}
.achievement-info {
  flex: 1;
}
.achievement-title {
  font-weight: 600;
  margin-bottom: 0.2rem;
  color: var(--text-primary);
}
.achievement-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.achievement-check {
  color: var(--accent-color);
}

/* Меню */
.menu-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1rem;
  background: var(--surface);
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: background 0.2s;
  color: var(--text-primary);
}
.menu-item:hover {
  background: var(--border);
}
.menu-item span {
  flex: 1;
  text-align: left;
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
  background: rgba(0, 0, 0, 0.5);
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
.modal-header h3 {
  margin: 0;
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent-color);
}
.avatar-modal .avatar-options {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin: 1.5rem 0;
}
.avatar-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.avatar-option.active {
  border-color: var(--accent-color);
  background: var(--surface);
}
.avatar-option img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}
.upload-section {
  margin: 1rem 0;
  text-align: center;
}
</style>