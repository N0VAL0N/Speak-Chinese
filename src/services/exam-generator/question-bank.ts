import { useVocabularyStore } from '@/stores/vocabularyStore'
import { useGrammarStore } from '@/stores/grammarStore'
import { useReadingStore } from '@/stores/readingStore'
import type { HSKWord, GrammarPoint, Reading, HSKLevel } from '@/types'

export function getRandomWords(level: HSKLevel, count: number): HSKWord[] {
  const store = useVocabularyStore()
  const words = store.words.filter(w => w.level === level)
  return shuffle(words).slice(0, count)
}

export function getRandomGrammar(level: HSKLevel, count: number): GrammarPoint[] {
  const store = useGrammarStore()
  const grammar = store.grammarPoints.filter(g => g.level === level)
  return shuffle(grammar).slice(0, count)
}

export function getRandomReadings(level: HSKLevel, count: number): Reading[] {
  const store = useReadingStore()
  const readings = store.readings.filter(r => r.level === level)
  return shuffle(readings).slice(0, count)
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}