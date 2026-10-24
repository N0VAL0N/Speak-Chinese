// stores/grammarStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initDB } from '@/db/db'
import type { GrammarPoint, HSKLevel } from '@/types'
import allGrammar from '@/data/grammar_all.json'

export const useGrammarStore = defineStore('grammar', () => {
  const grammarPoints = ref<GrammarPoint[]>([])
  const grammarMeta = ref<any>(null)
  const isLoading = ref(false)

  async function loadGrammar(level?: HSKLevel) {
    isLoading.value = true
    const db = await initDB()
    let all = await db.getAll('grammar')

    if (all.length === 0) {
      await seedGrammar()
      all = await db.getAll('grammar')
    }

    grammarMeta.value = all.find(item => item.id === 'meta') || null
    const filtered = all.filter(item => item.id !== 'meta')

    if (level) {
      grammarPoints.value = filtered.filter(g => g.level === level)
    } else {
      grammarPoints.value = filtered
    }
    isLoading.value = false
  }

  async function seedGrammar() {
    const db = await initDB()
    const tx = db.transaction('grammar', 'readwrite')
    try {
      await tx.store.clear()
      for (const item of allGrammar) {
        await tx.store.put(item)
      }
      await tx.done
      console.log('Grammar seeded from allGrammar')
    } catch (error) {
      console.error('Error seeding grammar:', error)
    }
  }

  function getGrammarByTopics(level: HSKLevel, topics: string[]): GrammarPoint[] {
    return grammarPoints.value.filter((g: GrammarPoint) => {
      if (g.level !== level) return false
      if (!g.topics || g.topics.length === 0) return false
      return g.topics.some((t: string) => topics.includes(t))
    })
  }

  async function findByPattern(term: string): Promise<GrammarPoint | undefined> {
    const db = await initDB()
    const all = await db.getAll('grammar')
    const lowerTerm = term.toLowerCase()
    return all.find(g => 
      g.pattern.toLowerCase().includes(lowerTerm) || 
      g.pattern === term
    )
  }

  return {
    grammarPoints,
    grammarMeta,
    isLoading,
    loadGrammar,
    seedGrammar,
    getGrammarByTopics,
    findByPattern,
  }
})