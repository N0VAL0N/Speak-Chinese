import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initDB } from '@/db/db'
import type { ReviewItem, HSKLevel } from '@/types'

export const useReviewStore = defineStore('review', () => {
  const dueItems = ref<ReviewItem[]>([])
  const isLoading = ref(false)

  async function addItem(item: Omit<ReviewItem, 'id' | 'easiness' | 'interval' | 'repetitions' | 'nextReview' | 'lastReview' | 'mistakeCount' | 'totalAttempts' | 'lastMistake' | 'mastered'>) {
    const id = `${item.itemType}_${item.itemId}`
    const db = await initDB()
    const existing = await db.get('reviews', id)
    if (existing) return
    const newItem: ReviewItem = {
      id,
      ...item,
      easiness: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: Date.now(),
      lastReview: 0,
      mistakeCount: 0,
      totalAttempts: 0,
      lastMistake: 0,
      mastered: false,
    }
    await db.put('reviews', newItem)
  }

  async function updateStats(itemId: string, correct: boolean, quality?: number) {
    const db = await initDB()
    const item = await db.get('reviews', itemId)
    if (!item) return

    item.totalAttempts++
    if (!correct) {
      item.mistakeCount++
      item.lastMistake = Date.now()
    }

    if (quality !== undefined) {
      if (quality >= 3) {
        if (item.repetitions === 0) item.interval = 1
        else if (item.repetitions === 1) item.interval = 6
        else item.interval = Math.round(item.interval * item.easiness)
        item.repetitions++
      } else {
        item.repetitions = 0
        item.interval = 1
      }
      item.easiness = Math.max(1.3, item.easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      item.lastReview = Date.now()
      item.nextReview = item.lastReview + item.interval * 24 * 60 * 60 * 1000
    }

    await db.put('reviews', item)
  }

  async function getItemsForSession(
    levels: HSKLevel[],
    types: string[],
    count: number,
    prioritizeMistakes = true
  ): Promise<ReviewItem[]> {
    const db = await initDB()
    const all = await db.getAll('reviews')
    const filtered = all.filter(item =>
      levels.includes(item.level as HSKLevel) &&
      types.includes(item.itemType) &&
      !item.mastered
    )

    if (prioritizeMistakes) {
      const mistakes = filtered.filter(item => item.mistakeCount > 0)
      mistakes.sort((a, b) => {
        if (a.mistakeCount !== b.mistakeCount) return b.mistakeCount - a.mistakeCount
        return a.lastMistake - b.lastMistake
      })
      const others = filtered.filter(item => item.mistakeCount === 0)
      const combined = [...mistakes, ...others].slice(0, count)
      for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
      }
      return combined
    } else {
      const now = Date.now()
      const due = filtered.filter(item => item.nextReview <= now)
      due.sort((a, b) => a.nextReview - b.nextReview)
      return due.slice(0, count)
    }
  }

  async function markAsMastered(itemIds: string[]) {
    const db = await initDB()
    const tx = db.transaction('reviews', 'readwrite')
    for (const id of itemIds) {
      const item = await tx.store.get(id)
      if (item) {
        item.mastered = true
        await tx.store.put(item)
      }
    }
    await tx.done
  }

  async function loadDueItems() {
    isLoading.value = true
    const db = await initDB()
    const now = Date.now()
    const all = await db.getAll('reviews')
    dueItems.value = all.filter(item => item.nextReview <= now && !item.mastered)
    isLoading.value = false
  }

  return {
    dueItems,
    isLoading,
    addItem,
    updateStats,
    getItemsForSession,
    markAsMastered,
    loadDueItems,
  }
})