<template>
  <div class="practice-view mobile-container">
    <SectionHeader title="Практика" @open-profile="$router.push('/profile')" />

    <div class="sub-tabs">
      <button
        :class="['sub-tab', { active: activeTab === 'review' }]"
        @click="activeTab = 'review'"
      >
        Повторение
      </button>
      <button
        :class="['sub-tab', { active: activeTab === 'texts' }]"
        @click="activeTab = 'texts'"
      >
        Тексты
      </button>
      <button
        :class="['sub-tab', { active: activeTab === 'exams' }]"
        @click="activeTab = 'exams'"
      >
        Экзамены
      </button>
    </div>

    <div v-if="activeTab === 'review'">
      <ReviewView @start-session="startReviewSession" />
    </div>
    <div v-else-if="activeTab === 'texts'">
      <TextsView :embedded="true" />
    </div>
    <div v-else>
      <ExamsView :embedded="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import ReviewView from './ReviewView.vue'
import TextsView from './TextsView.vue'
import ExamsView from './ExamsView.vue'

const router = useRouter()
const activeTab = ref<'review' | 'texts' | 'exams'>('review')

function startReviewSession(sessionData: any) {
  // Сохраняем данные сессии и переходим на отдельную страницу
  sessionStorage.setItem('reviewSession', JSON.stringify(sessionData))
  router.push('/review-session')
}
</script>

<style scoped>
.practice-view {
  padding: 1rem 0 80px;
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
</style>