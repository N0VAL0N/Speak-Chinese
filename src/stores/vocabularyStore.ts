// stores/vocabularyStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { initDB } from '../db/db'
import type { HSKWord, HSKLevel } from '../types'
import hskAll from '@/data/hsk_all.json'

export const useVocabularyStore = defineStore('vocabulary', () => {
  const words = ref<HSKWord[]>([])
  const isLoading = ref(false)

  const wordsByLevel = computed(() => {
    const map = new Map<HSKLevel, HSKWord[]>()
    for (const w of words.value) {
      const level = w.level
      if (!map.has(level)) map.set(level, [])
      map.get(level)!.push(w)
    }
    return map
  })

  async function loadVocabulary(level?: HSKLevel) {
    isLoading.value = true
    const db = await initDB()
    let allWords = await db.getAll('vocabulary')

    if (allWords.length === 0) {
      await seedVocabularyFromJson()
      allWords = await db.getAll('vocabulary')
    }

    if (level) {
      words.value = allWords.filter(w => w.level === level)
    } else {
      words.value = allWords
    }
    isLoading.value = false
  }

  async function seedVocabularyFromJson() {
    const db = await initDB()
    const tx = db.transaction('vocabulary', 'readwrite')
    try {
      await tx.store.clear()
      for (const w of hskAll) {
        // Преобразуем level в строку (в JSON level числовой)
        await tx.store.put({ ...w, level: String(w.level) as HSKLevel })
      }
      await tx.done
    } catch (error) {
      console.error('Error seeding vocabulary:', error)
    }
  }

  function getWordsByTopics(level: HSKLevel, topics: string[]): HSKWord[] {
    return words.value.filter(w => {
      if (w.level !== level) return false
      if (!w.topics || w.topics.length === 0) return false
      return w.topics.some(t => topics.includes(t))
    })
  }

  async function search(term: string): Promise<HSKWord[]> {
    const db = await initDB()
    const all = await db.getAll('vocabulary')
    const lowerTerm = term.toLowerCase()
    return all.filter(w => {
      if (w.simplified.includes(term)) return true
      if (w.translations.ru.toLowerCase().includes(lowerTerm)) return true
      return false
    })
  }

  return {
    words,
    wordsByLevel,
    isLoading,
    loadVocabulary,
    seedVocabularyFromJson,
    getWordsByTopics,
    search,
  }
})