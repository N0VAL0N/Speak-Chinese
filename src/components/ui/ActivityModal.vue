<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal activity-modal">
      <div class="modal-header">
        <h3>Активность</h3>
        <button class="btn-icon" @click="$emit('close')">
          <X :size="20" />
        </button>
      </div>
      <div class="modal-body">
        <p class="total-time">Всего времени: {{ formatTime(currentTotalTime) }}</p>
        <div class="calendar-grid">
          <div
            v-for="day in days"
            :key="day.date"
            class="calendar-day"
            :class="{ active: day.active, hasData: day.hasData }"
            @click="showDayDetails(day)"
          >
            {{ day.dayOfMonth }}
          </div>
        </div>
        <p class="calendar-note">Последние 30 дней (нажмите на день для деталей)</p>

        <!-- Детали выбранного дня -->
        <div v-if="selectedDay" class="day-details">
          <h4>{{ formatDate(selectedDay.date) }}</h4>
          <p v-if="selectedDay.hasData">
            <span>Время: {{ formatTime(selectedDay.timeSpent || 0) }}</span><br>
            <span>XP: {{ selectedDay.xp || 0 }}</span><br>
            <span>Слов выучено: {{ selectedDay.wordsLearned || 0 }}</span>
          </p>
          <p v-else>Нет данных за этот день</p>
          <button class="btn btn-outline close-details" @click="selectedDay = null">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { X } from 'lucide-vue-next'
import { useUserStore } from '@/stores/userStore'

const props = defineProps<{
  activityLog: string[]
  totalTime: number // в минутах
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const userStore = useUserStore()
const selectedDay = ref<any>(null)

// Текущее общее время с учётом активной сессии
const currentTotalTime = computed(() => {
  if (userStore.sessionStart) {
    const sessionMinutes = Math.round((Date.now() - userStore.sessionStart) / 60000)
    return props.totalTime + sessionMinutes
  }
  return props.totalTime
})

const days = computed(() => {
  const result = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const active = props.activityLog.includes(dateStr)
    // Здесь можно получить более детальную статистику за день из userStore.progress (например, почасовую)
    // Пока используем заглушки
    result.push({
      date: dateStr,
      dayOfMonth: date.getDate(),
      active,
      hasData: active, // пока просто совпадает с active
      timeSpent: active ? 15 : 0, // заглушка, позже можно заменить на реальные данные
      xp: active ? 50 : 0,
      wordsLearned: active ? 3 : 0
    })
  }
  return result
})

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}ч ${mins}м`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function showDayDetails(day: any) {
  selectedDay.value = day
}
</script>

<style scoped>
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
  font-size: 1.2rem;
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent-color);
}
.total-time {
  text-align: center;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 0.5rem;
}
.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  background: var(--border);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.calendar-day.active {
  background: var(--accent-color);
  color: white;
}
.calendar-day.hasData {
  font-weight: bold;
  box-shadow: 0 0 0 2px var(--accent-color);
}
.calendar-day:hover {
  transform: scale(1.1);
  z-index: 1;
}
.calendar-note {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
}
.day-details {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: 16px;
  text-align: center;
}
.day-details h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--accent-color);
}
.day-details p {
  margin: 0.5rem 0;
  color: var(--text-primary);
}
.close-details {
  margin-top: 1rem;
  width: 100%;
}
</style>