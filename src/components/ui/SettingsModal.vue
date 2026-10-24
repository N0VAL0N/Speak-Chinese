<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>Настройки</h3>
        <button class="btn-icon" @click="$emit('close')">
          <X :size="24" />
        </button>
      </div>

      <div class="modal-body">
        <!-- Тема -->
        <div class="setting-section">
          <label class="setting-label">Тема</label>
          <div class="theme-buttons">
            <button
              v-for="t in THEMES"
              :key="t.value"
              @click="setTheme(t.value)"
              :class="['btn', { active: currentTheme === t.value }]"
            >
              <component :is="t.icon" :size="18" />
              {{ t.label }}
            </button>
          </div>
        </div>

        <!-- Размер шрифта -->
        <div class="setting-section">
          <label class="setting-label">Размер шрифта</label>
          <div class="font-size-buttons">
            <button
              v-for="s in FONT_SIZES"
              :key="s.value"
              @click="setFontSize(s.value)"
              :class="['btn', { active: currentFontSize === s.value }]"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <!-- Цветовая схема -->
        <div class="setting-section">
          <label class="setting-label">Цветовая схема</label>
          <div class="color-buttons">
            <button
              v-for="scheme in COLOR_SCHEMES"
              :key="scheme.value"
              @click="selectColorScheme(scheme.value)"
              :class="['color-btn', { active: currentColorScheme === scheme.value }]"
              :style="{ backgroundColor: scheme.color }"
              :title="scheme.label"
            ></button>
          </div>
        </div>

        <!-- Уведомления -->
        <div class="setting-section">
          <label class="setting-label">Уведомления</label>
          <div class="notification-controls">
            <label class="switch">
              <input type="checkbox" v-model="notificationEnabled" @change="toggleNotifications" />
              <span class="slider"></span>
            </label>
            <span>Включить ежедневные напоминания</span>
          </div>
          <div v-if="notificationEnabled" class="time-selector">
            <label>Время напоминания:</label>
            <input type="time" v-model="notificationTime" @change="updateNotificationTime" class="time-input" />
          </div>
          <div v-if="notificationEnabled" class="days-selector">
            <label class="setting-label">Дни напоминаний</label>
            <div class="weekdays">
              <label
                v-for="day in WEEK_DAYS"
                :key="day.value"
                class="day-checkbox"
                :class="{ checked: selectedDays.includes(day.value) }"
              >
                <input type="checkbox" :value="day.value" v-model="selectedDays" />
                <span>{{ day.label }}</span>
              </label>
            </div>
          </div>
          <button class="btn btn-outline test-btn" @click="testNotification" :disabled="!notificationEnabled">
            Протестировать
          </button>
        </div>

        <!-- Обслуживание -->
        <div class="setting-section">
          <label class="setting-label">Обслуживание</label>
          <button class="btn btn-outline reset-btn" @click="confirmReset">
            <RotateCcw :size="18" />
            Сбросить базу данных
          </button>
          <p class="reset-note">Очистит все данные и перезагрузит учебные материалы.</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">Отмена</button>
        <button class="btn btn-primary" @click="saveSettings">Сохранить</button>
      </div>
    </div>

    <!-- Модалка подтверждения сброса -->
    <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
      <div class="modal confirm-modal">
        <h3>Сбросить базу данных?</h3>
        <p>Все прогресс и настройки будут удалены, и данные будут загружены заново.</p>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="showResetConfirm = false">Отмена</button>
          <button class="btn btn-danger" @click="resetDatabase">Сбросить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore, type ColorScheme } from '@/stores/appStore'
import { useUserStore } from '@/stores/userStore'
import { useVocabularyStore } from '@/stores/vocabularyStore'
import { useLessonsStore } from '@/stores/lessonsStore'
import { useGrammarStore } from '@/stores/grammarStore'
import { useReadingStore } from '@/stores/readingStore'
import { initDB } from '@/db/db'
import { X, RotateCcw,  } from 'lucide-vue-next'  
import { LocalNotifications } from '@capacitor/local-notifications'
import {
  THEMES,
  FONT_SIZES,
  COLOR_SCHEMES,
  WEEK_DAYS
} from '@/constants'

const appStore = useAppStore()
const userStore = useUserStore()
const emit = defineEmits<{ (e: 'close'): void }>()

const currentTheme = ref<typeof THEMES[number]['value']>(appStore.theme)
const currentFontSize = ref<typeof FONT_SIZES[number]['value']>(appStore.fontSize)
const currentColorScheme = ref<ColorScheme>(appStore.colorScheme)
const notificationEnabled = ref(userStore.progress.notificationEnabled)
const notificationTime = ref(userStore.progress.notificationTime)
const selectedDays = ref<number[]>(userStore.progress.notificationDays || [])
const showResetConfirm = ref(false)

function setTheme(theme: typeof currentTheme.value) {
  currentTheme.value = theme
}

function setFontSize(size: typeof currentFontSize.value) {
  currentFontSize.value = size
}

function selectColorScheme(scheme: ColorScheme) {
  currentColorScheme.value = scheme
}

function saveSettings() {
  appStore.theme = currentTheme.value
  appStore.fontSize = currentFontSize.value
  appStore.applyColorScheme(currentColorScheme.value)
  appStore.applyTheme()
  appStore.applyFontSize()
  emit('close')
}

async function toggleNotifications() {
  userStore.toggleNotifications(notificationEnabled.value)
  if (notificationEnabled.value) {
    const perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') {
      notificationEnabled.value = false
      userStore.toggleNotifications(false)
      return
    }
    await scheduleNotification()
  } else {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] })
  }
}

async function updateNotificationTime() {
  userStore.setNotificationTime(notificationTime.value)
  if (notificationEnabled.value) {
    await scheduleNotification()
  }
}

async function scheduleNotification() {
  if (!notificationEnabled.value || selectedDays.value.length === 0) return
  const [hours, minutes] = notificationTime.value.split(':').map(Number)
  await LocalNotifications.cancel({ notifications: [{ id: 1 }] })

  for (const day of selectedDays.value) {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Speak Chinese',
          body: 'Пора заниматься! Уделите 10 минут китайскому.',
          id: 1,
          schedule: {
            on: {
              hour: hours,
              minute: minutes,
              weekday: day === 0 ? 7 : day,
            },
          },
        },
      ],
    })
  }
}

async function testNotification() {
  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'Тестовое уведомление',
        body: 'Если вы это видите, всё работает!',
        id: 999,
        schedule: { at: new Date(Date.now() + 3000) }
      }
    ]
  })
}

function confirmReset() {
  showResetConfirm.value = true
}

async function resetDatabase() {
  showResetConfirm.value = false
  emit('close')

  const db = await initDB()
  const stores = ['vocabulary', 'lessons', 'grammar', 'readings', 'exams', 'progress', 'reviews', 'reviewBank', 'completedExams']
  const tx = db.transaction(stores, 'readwrite')
  for (const store of stores) {
    await tx.objectStore(store).clear()
  }
  await tx.done

  localStorage.clear()
  await useLessonsStore().clearAllLessons()
  await useVocabularyStore().seedVocabularyFromJson()
  await useGrammarStore().seedGrammar()
  await useReadingStore().seedReadings()
  await useUserStore().resetProgress()
  window.location.reload()
}
</script>

<style scoped>
.days-selector {
  margin-top: 1rem;
}
.weekdays {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.day-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.4rem 0.8rem;
  background: var(--surface);
  border-radius: 30px;
  border: 2px solid var(--border);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  color: var(--text-primary);
  user-select: none;
}
.day-checkbox:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, var(--surface));
  border-color: var(--accent-color);
}
.day-checkbox input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.day-checkbox.checked {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
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
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--bg-primary);
  border-radius: 28px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: inherit;
  border-radius: 28px 28px 0 0;
  z-index: 1;
}
.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}
.btn-icon {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 12px;
  cursor: pointer;
  color: var(--accent-color);
  transition: background 0.2s;
}
.btn-icon:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, transparent);
}
.modal-body {
  padding: 1.5rem;
}
.setting-section {
  margin-bottom: 1.5rem;
}
.setting-label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: var(--text-primary);
}
.theme-buttons,
.font-size-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.color-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
.color-btn {
  width: 100px;
  height: 60px;
  border-radius: 32px;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.color-btn.active {
  border-color: var(--text-secondary);
  transform: scale(1.1);
}
.color-btn:hover {
  transform: scale(1.05);
}
.btn {
  flex: 1;
  min-width: 80px;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}
.btn.active {
  border-color: var(--accent-color);
  background: var(--accent-color);
  color: white;
}
.btn-outline {
  background: transparent;
  border: 2px solid var(--accent-color);
  color: var(--accent-color);
}
.btn-outline:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent-color) 10%, transparent);
}
.btn-primary {
  background: var(--accent-color);
  color: white;
}
.btn-primary:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 4px 12px var(--accent-color);
}
.btn-danger {
  background: #f44336;
  color: white;
  border: none;
}
.btn-danger:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px #f44336;
}
.reset-btn {
  width: 100%;
  margin-bottom: 0.5rem;
}
.reset-note {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
}
.switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 26px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  border-radius: 34px;
  transition: 0.4s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.4s;
}
input:checked + .slider {
  background-color: var(--accent-color);
}
input:checked + .slider:before {
  transform: translateX(26px);
}
.notification-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.time-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.time-input {
  padding: 0.5rem;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-primary);
}
.test-btn {
  width: 100%;
}
.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border);
  position: sticky;
  bottom: 0;
  background: inherit;
  border-radius: 0 0 28px 28px;
}
.confirm-modal {
  max-width: 400px;
  padding: 2rem;
  text-align: center;
}
.confirm-modal h3 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}
.confirm-modal p {
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
}
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
</style>