<template>
  <div class="exams-view mobile-container">
    <SectionHeader v-if="!embedded" title="Экзамены" @open-profile="$router.push('/profile')" />

    <div class="tabs">
      <button :class="['tab', { active: activeTab === 'available' }]" @click="activeTab = 'available'">
        Доступные
      </button>
      <button :class="['tab', { active: activeTab === 'completed' }]" @click="activeTab = 'completed'">
        Завершённые
      </button>
    </div>

    <div v-if="activeTab === 'available'">
      <button class="new-exam-btn" @click="showLevelModal = true"> Новый экзамен</button>
      <div v-if="examStore.isLoading" class="loading">Загрузка...</div>
      <div v-else-if="filteredExams.length === 0" class="placeholder">
        Нет экзаменов для выбранных уровней.
      </div>
      <div v-else class="exam-list">
        <div v-for="exam in filteredExams" :key="exam.id" class="exam-card">
          <h3>{{ exam.title }}</h3>
          <p>Уровень HSK {{ exam.level }}</p>
          <button class="exam-btn" @click="startExam(exam)">Начать экзамен</button>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'completed'">
      <div v-if="examStore.completedExams.length === 0" class="placeholder">
        Вы ещё не завершили ни одного экзамена.
      </div>
      <div v-else class="exam-list">
        <div v-for="exam in examStore.completedExams" :key="exam.id" class="exam-card completed">
          <h3>{{ exam.title }}</h3>
          <p>Уровень HSK {{ exam.level }}</p>
          <p class="completed-date">{{ exam.completedAt ? new Date(exam.completedAt).toLocaleDateString() : '' }}</p>
          <div class="score-badge" :class="{ passed: exam.score?.passed }">
            {{ exam.score?.percentage }}% • {{ exam.score?.passed ? 'Сдан' : 'Не сдан' }}
          </div>
          <button class="exam-btn review-btn" @click="reviewExam(exam)">
            👁️ Посмотреть
          </button>
        </div>
      </div>
    </div>

    <!-- Модалка выбора уровня -->
    <div v-if="showLevelModal" class="modal-overlay" @click.self="showLevelModal = false">
      <div class="modal level-modal">
        <h3>Выберите уровень HSK</h3>
        <div class="level-buttons">
          <button
            v-for="level in HSK_LEVELS"
            :key="level"
            class="level-btn"
            :style="{ backgroundColor: HSK_LEVEL_COLORS[level], color: 'white' }"
            @click="createExam(level)"
          >
            HSK {{ level }}
          </button>
        </div>
        <button class="cancel-btn" @click="showLevelModal = false">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useExamStore } from '@/stores/examStore'
import { useRouter } from 'vue-router'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import type { Exam, HSKLevel } from '@/types'
import { HSK_LEVELS, HSK_LEVEL_COLORS } from '@/constants'

const props = defineProps<{
  embedded?: boolean   // если true – не показываем собственный заголовок
}>()

const examStore = useExamStore()
const router = useRouter()

const selectedLevels = ref<HSKLevel[]>(HSK_LEVELS)
const filteredExams = computed(() => {
  const exams = examStore.exams || []
  return exams.filter((e: Exam) => selectedLevels.value.includes(e.level))
})

const activeTab = ref<'available' | 'completed'>('available')
const showLevelModal = ref(false)

onMounted(() => {
  examStore.loadExams()
})

function createExam(level: HSKLevel) {
  showLevelModal.value = false
  examStore.generateNewExam(level)
  router.push(`/exam/${examStore.currentExam?.id}`)
}

function startExam(exam: Exam) {
  router.push(`/exam/${exam.id}`)
}

function reviewExam(exam: Exam) {
  examStore.reviewCompletedExam(exam)
  router.push(`/exam/${exam.id}`)
}
</script>

<style scoped>
/* все стили из исходного ExamsView.vue остаются без изменений */
.exams-view { padding: 1rem 0 80px; }
.tabs { display: flex; gap: 1rem; margin-bottom: 1rem; }
.tab { flex: 1; padding: 0.75rem; border: 2px solid var(--border); background: var(--surface); border-radius: 30px; font-weight: 600; cursor: pointer; color: var(--text-primary); transition: all 0.2s; }
.tab.active { background: var(--accent-color); color: white; border-color: var(--accent-color); }
.new-exam-btn {
  width: 100%;
  padding: 1rem;
  background: color-mix(in srgb, var(--accent-color) 20%, transparent);
  color: var(--accent-color);
  border: 2px solid var(--accent-color);
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: all 0.2s;
}
.new-exam-btn:hover {
  background: color-mix(in srgb, var(--accent-color) 40%, transparent);
  transform: scale(1.02);
}
.exam-list { display: grid; gap: 1rem; }
.exam-card { background: var(--card-bg); border-radius: 16px; padding: 1rem; box-shadow: var(--card-shadow); text-align: center; position: relative; }
.exam-card.completed { opacity: 0.9; }
.exam-card h3 { margin-bottom: 0.5rem; color: var(--text-primary); }
.exam-card p { color: var(--text-secondary); margin-bottom: 0.5rem; }
.completed-date { font-size: 0.8rem; color: var(--text-secondary); }
.score-badge { position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; background: var(--surface); border: 2px solid #f44336; }
.score-badge.passed { border-color: #4caf50; color: #4caf50; }
.exam-btn { padding: 0.6rem 1.5rem; background: var(--accent-color); color: white; border: none; border-radius: 30px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.exam-btn:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 4px 12px var(--accent-color); }
.review-btn { background: var(--surface); color: var(--accent-color); border: 2px solid var(--accent-color); }
.review-btn:hover { background: var(--accent-color); color: white; }
.modal-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); }
.modal { background: var(--bg-primary); border-radius: 28px; padding: 2rem; max-width: 400px; width: 90%; text-align: center; }
.level-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin: 1.5rem 0; }
.level-btn { padding: 0.75rem 1.5rem; border: none; border-radius: 30px; font-weight: 600; cursor: pointer; transition: all 0.2s; color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
.level-btn:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
.cancel-btn { padding: 0.75rem 1.5rem; background: transparent; border: 2px solid var(--accent-color); color: var(--accent-color); border-radius: 30px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.cancel-btn:hover { background: var(--accent-color); color: white; }
</style>