// stores/readingStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initDB } from '@/db/db'
import type { Reading, HSKLevel } from '@/types'
import readings from '@/data/hsk-reading.json'

export const useReadingStore = defineStore('reading', () => {
  const readingsData = ref<Reading[]>([])
  const isLoading = ref(false)

  async function loadReadings(level?: HSKLevel) {
    isLoading.value = true
    const db = await initDB()
    let all = await db.getAll('readings')
    if (all.length === 0) {
      await seedReadings()
      all = await db.getAll('readings')
    }
    if (level) {
      readingsData.value = all.filter(r => r.level === level)
    } else {
      readingsData.value = all
    }
    isLoading.value = false
  }

  async function seedReadings() {
    const db = await initDB()
    const tx = db.transaction('readings', 'readwrite')
    try {
      for (const item of readings) {
        await tx.store.put(item)
      }
      await tx.done
    } catch (error) {
      console.error('Error seeding readings:', error)
    }
  }

  async function findExamplesByWord(word: string): Promise<Array<{ text: string; translation: string }>> {
    const db = await initDB()
    const all = await db.getAll('readings')
    const results: Array<{ text: string; translation: string }> = []
    for (const reading of all) {
      if (reading.content.includes(word)) {
        results.push({
          text: reading.content,
          translation: reading.translation || ''
        })
      }
    }
    return results
  }

  return {
    readings: readingsData,
    isLoading,
    loadReadings,
    seedReadings,
    findExamplesByWord,
  }
})