// src/db/db.ts
import { openDB } from 'idb'

const DB_NAME = 'HSK_Trainer'
const DB_VERSION = 12

export async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion, newVersion, transaction) {
      try {
        console.log(`Upgrading DB from v${oldVersion} to v${newVersion}`)

        // Создание всех хранилищ при первом запуске (v1)
        if (oldVersion < 1) {
          console.log('Creating stores for v1')

          // vocabulary
          const vocabularyStore = db.createObjectStore('vocabulary', { keyPath: 'id' })
          vocabularyStore.createIndex('by_level', 'level')

          // lessons
          const lessonsStore = db.createObjectStore('lessons', { keyPath: 'id' })
          lessonsStore.createIndex('by_hsk_level', 'hskLevel')

          // grammar
          const grammarStore = db.createObjectStore('grammar', { keyPath: 'id' })
          grammarStore.createIndex('by_level', 'level')

          // readings
          const readingsStore = db.createObjectStore('readings', { keyPath: 'id' })
          readingsStore.createIndex('by_level', 'level')

          // exams
          const examsStore = db.createObjectStore('exams', { keyPath: 'id' })
          examsStore.createIndex('by_level', 'level')

          // exercises
          const exercisesStore = db.createObjectStore('exercises', { keyPath: 'id' })
          exercisesStore.createIndex('by_level', 'level')
          exercisesStore.createIndex('by_type', 'type')

          // reviews
          const reviewsStore = db.createObjectStore('reviews', { keyPath: 'id' })
          reviewsStore.createIndex('by_nextReview', 'nextReview')
          reviewsStore.createIndex('by_level', 'level')
          reviewsStore.createIndex('by_mistakeCount', 'mistakeCount')
          reviewsStore.createIndex('by_mastered', 'mastered')

          // progress
          db.createObjectStore('progress', { keyPath: 'userId' })

          // reviewBank
          const reviewBankStore = db.createObjectStore('reviewBank', { keyPath: 'id', autoIncrement: true })
          reviewBankStore.createIndex('by_level', 'level')
          reviewBankStore.createIndex('by_type', 'type')

          // mistakes
          const mistakesStore = db.createObjectStore('mistakes', { keyPath: 'id' })
          mistakesStore.createIndex('by_level', 'level')
          mistakesStore.createIndex('by_type', 'type')
          mistakesStore.createIndex('by_nextReview', 'nextReview')

          // radicals
          const radicalsStore = db.createObjectStore('radicals', { keyPath: 'id' })
          radicalsStore.createIndex('by_level', 'level')
          radicalsStore.createIndex('by_strokes', 'strokes')

          // ai_cache
          const aiCacheStore = db.createObjectStore('ai_cache', { keyPath: 'input' })
          aiCacheStore.createIndex('by_timestamp', 'timestamp')

          // userWords
          const userWordsStore = db.createObjectStore('userWords', { keyPath: 'id' })
          userWordsStore.createIndex('by_date', 'dateAdded')

          // completedExams
          const completedExamsStore = db.createObjectStore('completedExams', { keyPath: 'id' })
          completedExamsStore.createIndex('by_completedAt', 'completedAt')
        }

        // Миграция для версии 11: добавляем поле permanentlyUnlockedLessons
        if (oldVersion < 11) {
          console.log('Migrating to v11: adding permanentlyUnlockedLessons')
          const progressStore = transaction.objectStore('progress')
          const allProgress = await progressStore.getAll()
          for (const item of allProgress) {
            if (!item.permanentlyUnlockedLessons) {
              item.permanentlyUnlockedLessons = item.unlockedLessons || []
              await progressStore.put(item)
            }
          }
        }

        // Добавляем хранилища для паков и карточек (v12)
        if (oldVersion < 12) {
          console.log('Creating stores for packs and cards (v12)')

          // packs
          const packsStore = db.createObjectStore('packs', { keyPath: 'id' })
          packsStore.createIndex('by_isSystem', 'isSystem')
          packsStore.createIndex('by_lessonId', 'lessonId')
          packsStore.createIndex('by_updatedAt', 'updatedAt')

          // cards
          const cardsStore = db.createObjectStore('cards', { keyPath: 'id' })
          cardsStore.createIndex('by_packId', 'packId')
          cardsStore.createIndex('by_dueDate', 'dueDate')
          cardsStore.createIndex('by_source', 'source')
        }
      } catch (error) {
        console.error('Migration failed:', error)
        throw error // или можно обработать иначе, но лучше пробросить, чтобы приложение знало о проблеме
      }
    },
  })
  return db
}