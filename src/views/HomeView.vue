<template>
  <div class="home-view mobile-container">
    <div class="bg-elements">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
      <div class="bg-bubble bubble-1"></div>
      <div class="bg-bubble bubble-2"></div>
    </div>

    <!-- Скелетоны при загрузке -->
    <div v-if="lessonsStore.isLoading" class="lessons-container">
      <SkeletonCard v-for="n in 6" :key="n" />
    </div>

    <div v-else-if="lessonsForLevel.length === 0" class="placeholder">
      Нет уроков для HSK {{ appStore.currentHSKLevel }}
    </div>

    <TransitionGroup v-else name="fade-up" tag="div" class="lessons-container">
      <template v-for="(lesson, index) in enhancedLessons" :key="index">
        <!-- Разделитель (показываем, начиная со второго урока) -->
        <div v-if="index > 0" class="connector-dots">
          <div class="connector-dot" />
          <div class="connector-dot" />
          <div class="connector-dot" />
        </div>
        <!-- Карточка урока -->
        <LessonCard
          :lesson="lesson"
          :index="index"
          @click="goToLesson(lesson)"
          @select-text="handleSelectText"
        />
      </template>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/appStore'
import { useLessonsStore } from '@/stores/lessonsStore'
import { useUserStore } from '@/stores/userStore'
import { useVocabularyStore } from '@/stores/vocabularyStore'
import LessonCard from '@/components/ui/LessonCard.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import type { HSKLevel } from '@/types'

const router = useRouter()
const appStore = useAppStore()
const lessonsStore = useLessonsStore()
const userStore = useUserStore()
const vocabStore = useVocabularyStore()

onMounted(() => {
  lessonsStore.isLoading = false
})

const lessonsForLevel = computed(() => 
  lessonsStore.getLessonsByLevel(appStore.currentHSKLevel)
)

function isLevelCompleted(level: HSKLevel): boolean {
  const levelLessons = lessonsStore.getLessonsByLevel(level)
  return levelLessons.every(l => 
    userStore.progress.lessonProgress[l.id] === 'completed' || 
    userStore.isLessonPermanentlyUnlocked(l.id)
  )
}

const enhancedLessons = computed(() => {
  return lessonsForLevel.value.map(lesson => {
    const status = userStore.progress.lessonProgress[lesson.id] || 'not_started'
    const inProgress = status === 'in_progress'
    const completed = status === 'completed'
    const wasCompleted = userStore.isLessonPermanentlyUnlocked(lesson.id)

    const currentLevelNum = parseInt(lesson.level)
    let levelLocked = false
    if (currentLevelNum > 1) {
      const prevLevel = (currentLevelNum - 1).toString() as HSKLevel
      levelLocked = !isLevelCompleted(prevLevel)
    }

    let lessonLocked = false
    if (!levelLocked && lesson.number > 1) {
      const prevLessonId = `${lesson.level}-${lesson.number - 1}`
      const prevCompleted = userStore.progress.lessonProgress[prevLessonId] === 'completed' ||
                           userStore.isLessonPermanentlyUnlocked(prevLessonId)
      lessonLocked = !prevCompleted
    }

    const locked = !wasCompleted && (levelLocked || lessonLocked)

    let theoryProgress = 0
    if (!locked && !completed) {
      const savedPage = userStore.getLessonProgress(lesson.id) || 1
      const totalTheoryPages = 20
      theoryProgress = Math.min(Math.round((savedPage / totalTheoryPages) * 100), 100)
    }

    let practiceProgress = 0
    const practiceIndex = userStore.getPracticeIndex(lesson.id)
    if (practiceIndex !== undefined && practiceIndex < 10) {
      practiceProgress = Math.round((practiceIndex / 10) * 100)
    } else if (completed) {
      practiceProgress = 100
    }

    const totalProgress = Math.round(theoryProgress * 0.7 + practiceProgress * 0.3)
    const difficulty = 2 as 1 | 2 | 3

    // Находим первый иероглиф для отображения
    let hanzi = ''
    if (lesson.newWords && lesson.newWords.length > 0) {
      const firstWordId = lesson.newWords[0]
      const word = vocabStore.words.find(w => w.id === firstWordId)
      if (word) hanzi = word.simplified
    }

    return {
      id: lesson.id,
      title: lesson.title,
      hskLevel: lesson.level,
      lessonNumber: lesson.number,
      difficulty,
      locked,
      completed,
      inProgress: inProgress || (!locked && !completed && (theoryProgress > 0 || practiceProgress > 0)),
      progress: totalProgress,
      topics: lesson.topics,
      hanzi,
    }
  })
})

function goToLesson(lesson: any) {
  if (!lesson.locked) {
    router.push(`/lesson/${lesson.id}`)
  }
}

function handleSelectText(text: string) {
  sessionStorage.setItem('assistantSelectedText', text)
  router.push('/assistant')
}
</script>

<style scoped>
.home-view {
  padding: 1 0 5rem 0;
  position: relative;
  min-height: 100vh;
}
.lessons-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 25%;
}
.connector-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin: 4px 0;
}
.connector-dot {
  width: 6px;
  height: 6px;
  background-color: var(--accent-color);
  border-radius: 50%;
  opacity: 0.6;
  box-shadow: 0 0 6px var(--accent-color);
}
.connector-dot:nth-child(2) {
  width: 8px;
  height: 8px;
  opacity: 0.9;
}
.loading, .placeholder {
  text-align: center;
  color: var(--text-secondary);
  margin-top: 40px;
}

.fade-up-enter-active {
  transition: all 0.4s ease;
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
</style>