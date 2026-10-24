import { defineStore } from 'pinia'
import { ref } from 'vue'
import { generateLesson, getLessonMetaByLevel } from '@/services/generators'
import type { Lesson } from '@/types'
import { initDB } from '@/db/db'
import type { HSKLevel } from '@/constants'

export const useLessonsStore = defineStore('lessons', () => {
  const isLoading = ref(false)
  const lessonCache = ref<Record<string, Lesson>>({})

  async function saveLessonToDB(lesson: Lesson) {
    const db = await initDB()
    const safeLesson = JSON.parse(JSON.stringify(lesson))
    await db.put('lessons', safeLesson)
  }

  async function loadLessonFromDB(id: string): Promise<Lesson | null> {
    const db = await initDB()
    const lesson = await db.get('lessons', id)
    return lesson || null
  }

  async function getLessonById(id: string): Promise<Lesson | null> {
    if (lessonCache.value[id]) {
      return lessonCache.value[id]
    }
    const dbLesson = await loadLessonFromDB(id)
    if (dbLesson) {
      lessonCache.value[id] = dbLesson
      return dbLesson
    }
    isLoading.value = true
    const lesson = await generateLesson(id)
    if (lesson) {
      lessonCache.value[id] = lesson
      await saveLessonToDB(lesson)
    }
    isLoading.value = false
    return lesson
  }

  function getLessonsByLevel(level: HSKLevel) {
    return getLessonMetaByLevel(level)
  }

  async function clearAllLessons() {
    lessonCache.value = {}
    const db = await initDB()
    await db.clear('lessons')
  }

  async function seedLessons() {
    return Promise.resolve()
  }

  return {
    isLoading,
    getLessonById,
    getLessonsByLevel,
    seedLessons,
    clearAllLessons,
  }
})