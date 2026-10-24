// stores/userStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { initDB } from '@/db/db'
import { usePacksStore } from './packsStore'
import { useVocabularyStore } from './vocabularyStore'
import { useLessonsStore } from './lessonsStore'
import type { UserProgress, Goal, LessonResult } from '@/types'
import { HSKLevel } from '@/constants'

export { type Goal }

export const useUserStore = defineStore('user', () => {
  const name = ref(localStorage.getItem('userName') || 'Пользователь')
  const avatar = ref(localStorage.getItem('userAvatar') || 'default')

  const sessionStart = ref<number | null>(null)

  const progress = ref<UserProgress>({
    userId: 'default',
    learnedWords: [],
    lessonProgress: {},
    lessonProgressPage: {},
    lessonPageCount: {},
    lessonPracticeIndex: {},
    streak: 0,
    xp: 0,
    achievements: [],
    lastVisitDate: new Date().toDateString(),
    unlockedLessons: ['1-1'],
    permanentlyUnlockedLessons: [],
    practiceStats: { total: 0, correct: 0 },
    completedReadings: [],
    lessonPracticeStats: {},
    goals: [],
    notificationEnabled: false,
    notificationTime: '20:00',
    notificationDays: [1,2,3,4,5,6,0],
    activityLog: [],
    totalTimeSpent: 0,
    lessonResults: {},
    bestLessonResult: {}
  })

  const totalTimeWithSession = computed(() => {
    if (sessionStart.value) {
      const elapsed = Math.round((Date.now() - sessionStart.value) / 60000)
      return progress.value.totalTimeSpent + elapsed
    }
    return progress.value.totalTimeSpent
  })

  function updateName(newName: string) {
    name.value = newName
    localStorage.setItem('userName', newName)
  }

  function setAvatar(avatarValue: string) {
    avatar.value = avatarValue
    localStorage.setItem('userAvatar', avatarValue)
  }

  async function loadProgress() {
    const db = await initDB()
    const saved = await db.get('progress', 'default')
    if (saved) {
      progress.value = {
        ...saved,
        achievements: saved.achievements || [],
        unlockedLessons: saved.unlockedLessons || ['1-1'],
        permanentlyUnlockedLessons: saved.permanentlyUnlockedLessons || [],
        practiceStats: saved.practiceStats || { total: 0, correct: 0 },
        completedReadings: saved.completedReadings || [],
        lessonProgressPage: saved.lessonProgressPage || {},
        lessonPageCount: saved.lessonPageCount || {},
        lessonPracticeIndex: saved.lessonPracticeIndex || {},
        lessonPracticeStats: saved.lessonPracticeStats || {},
        goals: saved.goals || [],
        notificationEnabled: saved.notificationEnabled ?? false,
        notificationTime: saved.notificationTime || '20:00',
        notificationDays: saved.notificationDays || [1,2,3,4,5,6,0],
        activityLog: saved.activityLog || [],
        totalTimeSpent: saved.totalTimeSpent || 0,
        lessonResults: saved.lessonResults || {},
        bestLessonResult: saved.bestLessonResult || {}
      }
      updateStreak()
    } else {
      const copy = JSON.parse(JSON.stringify(progress.value))
      await db.put('progress', copy)
    }
  }

  async function saveProgress() {
    const db = await initDB()
    const copy = JSON.parse(JSON.stringify(progress.value))
    await db.put('progress', copy)
  }

  function updateStreak() {
    const today = new Date().toDateString()
    const last = progress.value.lastVisitDate
    if (!last) {
      progress.value.streak = 1
    } else {
      const lastDate = new Date(last)
      const todayDate = new Date(today)
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        progress.value.streak += 1
      } else if (diffDays > 1) {
        progress.value.streak = 1
      }
    }
    progress.value.lastVisitDate = today
    saveProgress()
  }

  function logActivity() {
    const today = new Date().toISOString().split('T')[0]
    if (!progress.value.activityLog.includes(today)) {
      progress.value.activityLog.push(today)
      saveProgress()
    }
  }

  function startSession() {
    sessionStart.value = Date.now()
  }

  function endSession() {
    if (sessionStart.value) {
      const duration = Math.round((Date.now() - sessionStart.value) / 1000 / 60)
      progress.value.totalTimeSpent += duration
      sessionStart.value = null
      saveProgress()
    }
  }

  function isLessonPermanentlyUnlocked(lessonId: string): boolean {
    return progress.value.permanentlyUnlockedLessons.includes(lessonId)
  }

  async function addLearnedWord(wordId: number) {
    if (!progress.value.learnedWords.includes(wordId)) {
      progress.value.learnedWords.push(wordId)
      progress.value.xp += 10
      await checkAchievements()
      await saveProgress()
      
      // При выучивании нового слова, удаляем его из пака ошибок, если он там есть
      await removeFromMistakePack(wordId)
    }
  }

  async function createLessonPack(
    lessonId: string,
    lessonTitle?: string,
    topics?: string[],
    wordIds?: number[]
  ) {
    const packsStore = usePacksStore()
    const vocabStore = useVocabularyStore()

    await packsStore.loadPacks()

    const existing = packsStore.packs.find(p => p.lessonId === lessonId)
    if (existing) return

    const packName = lessonTitle || `Урок ${lessonId}`
    const description = topics?.length ? `Темы: ${topics.join(', ')}` : ''

    const pack = await packsStore.createPack({
      name: packName,
      description,
      isSystem: true,
      lessonId,
    })

    if (pack && wordIds?.length) {
      const words = vocabStore.words.filter(w => wordIds.includes(w.id))
      const cards = words.map(w => ({
        front: w.simplified,
        back: w.translations.ru,
        pinyin: w.pinyin,
        source: 'hsk' as const,
        sourceId: w.id,
      }))
      await packsStore.addCards(pack.id, cards)
    }
  }

  async function createMistakePack() {
    const packsStore = usePacksStore();
    const vocabStore = useVocabularyStore();
    await packsStore.loadPacks();

    // Проверяем, не создан ли уже пак с ошибками
    const existing = packsStore.packs.find(p => p.name === 'Мои ошибки' && p.isSystem);
    let pack = existing;

    if (!pack) {
      const createdPack = await packsStore.createPack({
        name: 'Мои ошибки',
        description: 'Слова, в которых вы ошибались',
        isSystem: true,
      });
      if (!createdPack) return; // выходим, если не удалось создать
      pack = createdPack;
    }


    const mistakeWords = new Set<number>();

    // Собираем ошибки из lessonPracticeStats
    for (const [lessonId, stats] of Object.entries(progress.value.lessonPracticeStats)) {
      if (stats.total > 0 && stats.correct < stats.total) {
        // Находим урок
        const lesson = await useLessonsStore().getLessonById(lessonId);
        if (lesson && lesson.newWords) {
          lesson.newWords.forEach(wordId => {
            mistakeWords.add(wordId);
          });
        }
      }
    }

    // Удаляем слова, которые уже выучены (находятся в learnedWords)
    const wordsToAdd = Array.from(mistakeWords).filter(id => 
      !progress.value.learnedWords.includes(id)
    );

    if (wordsToAdd.length === 0) return;

    // Получаем текущие карточки в паке
    const existingCards = await packsStore.getCardsByPackId(pack.id);
    const existingSourceIds = new Set(
      existingCards
        .filter(c => c.source === 'hsk' && c.sourceId)
        .map(c => Number(c.sourceId))
    );

    // Добавляем только те слова, которых ещё нет в паке
    const newWords = wordsToAdd.filter(id => !existingSourceIds.has(id));
    
    if (newWords.length === 0) return;

    const words = vocabStore.words.filter(w => newWords.includes(w.id));
    const cards = words.map(w => ({
      front: w.simplified,
      back: w.translations.ru,
      pinyin: w.pinyin,
      source: 'hsk' as const,
      sourceId: w.id,
    }));

    await packsStore.addCards(pack.id, cards);
  }

  async function removeFromMistakePack(wordId: number) {
    const packsStore = usePacksStore();
    await packsStore.loadPacks();

    const mistakePack = packsStore.packs.find(p => p.name === 'Мои ошибки' && p.isSystem);
    if (!mistakePack) return;

    const cards = await packsStore.getCardsByPackId(mistakePack.id);
    const cardToRemove = cards.find(c => c.source === 'hsk' && Number(c.sourceId) === wordId);
    
    if (cardToRemove) {
      await packsStore.deleteCard(cardToRemove.id);
    }
  }

  async function updateLessonProgress(
    lessonId: string,
    status: 'not_started' | 'in_progress' | 'completed',
    newWords?: number[],
    lessonTitle?: string,
    topics?: string[]
  ) {
    progress.value.lessonProgress[lessonId] = status
    
    if (status === 'completed') {
      if (!progress.value.permanentlyUnlockedLessons.includes(lessonId)) {
        progress.value.permanentlyUnlockedLessons.push(lessonId)
      }
      
      progress.value.xp += 50
      unlockNextLesson(lessonId)
      if (newWords) {
        for (const wordId of newWords) {
          if (!progress.value.learnedWords.includes(wordId)) {
            progress.value.learnedWords.push(wordId)
          }
        }
      }
      delete progress.value.lessonPracticeIndex[lessonId]
      delete progress.value.lessonProgressPage[lessonId]

      await createLessonPack(lessonId, lessonTitle, topics, newWords)
      await checkAchievements()
      await createMistakePack() // обновляем пак ошибок после завершения урока
    }
    await saveProgress()
  }

  function unlockNextLesson(completedLessonId: string) {
    const parts = completedLessonId.split('-')
    if (parts.length === 2) {
      const level = parts[0]
      const num = parseInt(parts[1])
      const nextId = `${level}-${num + 1}`
      if (!progress.value.unlockedLessons.includes(nextId)) {
        progress.value.unlockedLessons.push(nextId)
      }
    }
  }

  async function saveLessonProgress(lessonId: string, page?: number, totalPages?: number) {
    if (page !== undefined) {
      progress.value.lessonProgressPage[lessonId] = page
    }
    if (totalPages !== undefined) {
      progress.value.lessonPageCount[lessonId] = totalPages
    }
    await saveProgress()
  }

  function getLessonProgress(lessonId: string): number | undefined {
    return progress.value.lessonProgressPage?.[lessonId]
  }

  function getLessonPageCount(lessonId: string): number | undefined {
    return progress.value.lessonPageCount?.[lessonId]
  }

  async function savePracticeIndex(lessonId: string, index: number) {
    progress.value.lessonPracticeIndex[lessonId] = index
    await saveProgress()
  }

  function getPracticeIndex(lessonId: string): number | undefined {
    return progress.value.lessonPracticeIndex?.[lessonId]
  }

  async function clearPracticeIndex(lessonId: string) {
    delete progress.value.lessonPracticeIndex[lessonId]
    await saveProgress()
  }

  function getLessonPracticeStats(lessonId: string): { total: number; correct: number } {
    return progress.value.lessonPracticeStats[lessonId] || { total: 0, correct: 0 }
  }

  async function updateLessonPracticeStats(lessonId: string, correct: boolean) {
    if (!progress.value.lessonPracticeStats[lessonId]) {
      progress.value.lessonPracticeStats[lessonId] = { total: 0, correct: 0 }
    }
    progress.value.lessonPracticeStats[lessonId].total++
    if (correct) {
      progress.value.lessonPracticeStats[lessonId].correct++
    }
    await saveProgress()
  }

  async function resetLessonPracticeStats(lessonId: string) {
    delete progress.value.lessonPracticeStats[lessonId]
    await saveProgress()
  }

  async function checkAchievements() {
    const achievements = progress.value.achievements
    if (!achievements.find(a => a.id === 'first10')) {
      if (progress.value.learnedWords.length >= 10) {
        achievements.push({
          id: 'first10',
          icon: '🎓',
          title: 'Первый шаг',
          description: 'Выучить 10 слов',
          unlocked: true,
          unlockedAt: Date.now(),
        })
      }
    }
    if (!achievements.find(a => a.id === 'streak3')) {
      if (progress.value.streak >= 3) {
        achievements.push({
          id: 'streak3',
          icon: '🔥',
          title: 'Огонёк',
          description: 'Заниматься 3 дня подряд',
          unlocked: true,
          unlockedAt: Date.now(),
        })
      }
    }
    if (!achievements.find(a => a.id === 'words50')) {
      if (progress.value.learnedWords.length >= 50) {
        achievements.push({
          id: 'words50',
          icon: '🏆',
          title: 'Лингвист',
          description: 'Выучить 50 слов',
          unlocked: true,
          unlockedAt: Date.now(),
        })
      }
    }
  }

  async function addPracticeResult(correct: boolean) {
    if (!progress.value.practiceStats) {
      progress.value.practiceStats = { total: 0, correct: 0 }
    }
    progress.value.practiceStats.total++
    if (correct) {
      progress.value.practiceStats.correct++
      progress.value.xp += 5
    }
    await saveProgress()
  }

  async function addCompletedReading(readingId: string) {
    if (!progress.value.completedReadings.includes(readingId)) {
      progress.value.completedReadings.push(readingId)
      await saveProgress()
    }
  }

  function isReadingCompleted(readingId: string): boolean {
    return progress.value.completedReadings.includes(readingId)
  }

  async function resetProgress() {
    progress.value = {
      userId: 'default',
      learnedWords: [],
      lessonProgress: {},
      lessonProgressPage: {},
      lessonPageCount: {},
      lessonPracticeIndex: {},
      streak: 0,
      xp: 0,
      achievements: [],
      lastVisitDate: new Date().toDateString(),
      unlockedLessons: ['1-1'],
      permanentlyUnlockedLessons: [],
      practiceStats: { total: 0, correct: 0 },
      completedReadings: [],
      lessonPracticeStats: {},
      goals: [],
      notificationEnabled: false,
      notificationTime: '20:00',
      notificationDays: [1,2,3,4,5,6,0],
      activityLog: [],
      totalTimeSpent: 0,
      lessonResults: {},
      bestLessonResult: {}
    }
    await saveProgress()
  }

  function setGoals(goals: Goal[]) {
    progress.value.goals = goals
    saveProgress()
  }

  async function resetLessonProgress(lessonId: string) {
    delete progress.value.lessonProgressPage[lessonId]
    delete progress.value.lessonPageCount[lessonId]
    delete progress.value.lessonPracticeIndex[lessonId]
    await saveProgress()
  }

  function toggleNotifications(enabled: boolean) {
    progress.value.notificationEnabled = enabled
    saveProgress()
  }

  function setNotificationTime(time: string) {
    progress.value.notificationTime = time
    saveProgress()
  }

  function getLevelProgress(_level: HSKLevel): number {
    return 0
  }

  async function addLessonResult(lessonId: string, result: LessonResult) {
    if (!progress.value.lessonResults) progress.value.lessonResults = {}
    if (!progress.value.lessonResults[lessonId]) progress.value.lessonResults[lessonId] = []
    progress.value.lessonResults[lessonId].push(result)
    
    const best = progress.value.lessonResults[lessonId].reduce((best, curr) => 
      curr.correct > best.correct ? curr : best
    )
    if (!progress.value.bestLessonResult) progress.value.bestLessonResult = {}
    progress.value.bestLessonResult[lessonId] = best
    
    await saveProgress()
  }

  function getLastLessonResult(lessonId: string): LessonResult | undefined {
    return progress.value.lessonResults?.[lessonId]?.slice(-1)[0]
  }

  function getBestLessonResult(lessonId: string): LessonResult | undefined {
    return progress.value.bestLessonResult?.[lessonId]
  }

  return {
    name,
    avatar,
    progress,
    sessionStart,
    totalTimeWithSession,
    updateName,
    setAvatar,
    loadProgress,
    startSession,
    endSession,
    logActivity,
    addLearnedWord,
    updateLessonProgress,
    addPracticeResult,
    addCompletedReading,
    isReadingCompleted,
    resetProgress,
    saveLessonProgress,
    getLessonProgress,
    getLessonPageCount,
    savePracticeIndex,
    getPracticeIndex,
    clearPracticeIndex,
    getLessonPracticeStats,
    updateLessonPracticeStats,
    resetLessonPracticeStats,
    setGoals,
    toggleNotifications,
    setNotificationTime,
    isLessonPermanentlyUnlocked,
    resetLessonProgress,
    getLevelProgress,
    addLessonResult,
    getLastLessonResult,
    getBestLessonResult,
    createLessonPack,
    createMistakePack,
  }
})