// src/types/index.ts
import { HSKLevel, ExerciseType } from '@/constants'

export type { HSKLevel }

// ========== Слова ==========
export interface HSKWord {
  id: number
  simplified: string
  pinyin: string
  translations: {
    ru: string
  }
  pos: string[]
  level: HSKLevel
  audioUrl?: string
  topics: string[]
}

// ========== Грамматика ==========
export interface GrammarPoint {
  id: string
  pattern: string
  explanation: string
  examples: Array<{ chinese: string; pinyin: string; translation: string } | string>
  level: HSKLevel
  topics?: string[]
}

// ========== Диалоги ==========
export interface Dialogue {
  id: string
  lines: {
    speaker: string
    chinese: string
    pinyin?: string
    russian?: string
  }[]
}

// ========== Упражнения ==========
export interface FillBlankExercise {
  id: string
  type: ExerciseType.FillBlank
  level: HSKLevel
  sentence: string
  options: string[]
  correctAnswer: number
  pinyin?: string
}

export interface MultipleChoiceExercise {
  id: string
  type: ExerciseType.MultipleChoice
  level: HSKLevel
  question: string
  options: string[]
  correctAnswer: number
  pinyin?: string
}

export interface ListeningExercise {
  id: string
  type: ExerciseType.Listening
  level: HSKLevel
  word: HSKWord
  options: string[]
  correctAnswer: string
}

export interface TranslateExercise {
  id: string
  type: ExerciseType.Translate
  level: HSKLevel
  question: string
  correctAnswer: string
}

export interface MatchPinyinExercise {
  id: string
  type: ExerciseType.MatchPinyin
  level: HSKLevel
  pairs: { chinese: string; pinyin: string }[]
  correctAnswer: number
}

export interface MatchTranslationExercise {
  id: string
  type: ExerciseType.MatchTranslation
  level: HSKLevel
  pairs: { chinese: string; translation: string }[]
  correctAnswer: number
}

export interface SentenceOrderExercise {
  id: string
  type: ExerciseType.SentenceOrder
  level: HSKLevel
  words: string[]
  correctOrder: number[]
  correctAnswer: number
}

export interface DialogueTrueFalseExercise {
  id: string
  type: ExerciseType.DialogueTrueFalse
  level: HSKLevel
  statements: Array<{ text: string; correct: boolean }>
  correctAnswer: boolean[]
  dialogueId?: string
}

export type Exercise = 
  | FillBlankExercise
  | MultipleChoiceExercise
  | ListeningExercise
  | TranslateExercise
  | MatchPinyinExercise
  | MatchTranslationExercise
  | SentenceOrderExercise
  | DialogueTrueFalseExercise

export type GeneratedExercise = Omit<Exercise, 'id'>

// ========== Уроки ==========
export interface Lesson {
  id: string
  hskLevel: HSKLevel
  lessonNumber: number
  title: string
  topics: string[]
  grammarPoints: string[] | GrammarPoint[]
  dialogues?: Dialogue[]
  newWords?: number[]
  exercises?: Exercise[]
  trueFalseStatements?: Array<{ text: string; correct: boolean }>
}

// ========== Достижения ==========
export interface Achievement {
  id: string
  icon: string
  title: string
  description: string
  unlocked: boolean
  unlockedAt?: number
}

// ========== Чтение ==========
export interface ReadingQuestion {
  question: {
    chinese: string
    pinyin: string
    ru: string
  }
  options: Array<{
    chinese: string
    pinyin: string
    ru: string
  }>
  answer: number
}

export interface Reading {
  id: string
  level: HSKLevel
  title: string
  title_pinyin?: string
  title_ru?: string
  content: string
  pinyin?: string
  translation?: string
  questions: ReadingQuestion[]
  topics: string[]
}

// ========== Цели ==========
export interface Goal {
  id: string
  title: string
  description?: string
  level?: HSKLevel
  topics?: string[]
  targetDate?: string
  progress?: number
}

// ========== Результаты уроков ==========
export interface LessonResult {
  date: number
  correct: number
  total: number
  mistakes: number
  time: number
  grade: string
  percentage: number
}

// ========== Прогресс пользователя ==========
export interface UserProgress {
  userId: string
  learnedWords: number[]
  lessonProgress: Record<string, 'not_started' | 'in_progress' | 'completed'>
  lessonProgressPage: Record<string, number>
  lessonPageCount: Record<string, number>
  lessonPracticeIndex: Record<string, number>
  streak: number
  xp: number
  achievements: Achievement[]
  lastVisitDate?: string
  unlockedLessons: string[]
  permanentlyUnlockedLessons: string[]
  practiceStats?: { total: number; correct: number }
  completedReadings: string[]
  lessonPracticeStats: Record<string, { total: number; correct: number }>
  goals: Goal[]
  notificationEnabled: boolean
  notificationTime: string
  notificationDays: number[]
  activityLog: string[]
  totalTimeSpent: number
  lessonResults?: Record<string, LessonResult[]>
  bestLessonResult?: Record<string, LessonResult>
}

// ========== Экзамены ==========
export interface Exam {
  id: string
  title: string
  level: HSKLevel
  sections: {
    name: string
    questions: any[]
  }[]
  totalTime?: number
  completedAt?: number
  score?: {
    correct: number
    total: number
    percentage: number
    passed: boolean
  }
  savedAnswers?: Record<string, any>
}

export interface ExamListeningQuestion {
  type: 'listening'
  text: string
  word: string
  options: string[]
  correctAnswer: string
}

export interface ExamReadingQuestion {
  type: 'reading'
  text: string
  items: {
    question: string
    options: string[]
    answer: number
  }[]
}

export interface ExamGrammarQuestion {
  type: 'fill-blank'
  sentence: string
  options: string[]
  correctAnswer: number
}

export interface ExamWritingQuestion {
  type: 'translate'
  question: string
  correctAnswer: string
}

export type ExamQuestion = 
  | ExamListeningQuestion
  | ExamReadingQuestion
  | ExamGrammarQuestion
  | ExamWritingQuestion

export interface ExamBlueprint {
  level: HSKLevel
  sections: ExamSectionBlueprint[]
  totalTime?: number
}

export interface ExamSectionBlueprint {
  name: string
  type: 'listening' | 'reading' | 'grammar' | 'writing'
  questionCount: number
  sources: string[]
}

export interface ExamSection {
  name: string
  questions: ExamQuestion[]
}

// ========== Повторение (SRS) ==========
export interface ReviewItem {
  id: string
  itemType: 'word' | 'grammar' | 'exercise'
  itemId: string | number
  level: HSKLevel
  easiness: number
  interval: number
  repetitions: number
  nextReview: number
  lastReview: number
  mistakeCount: number
  totalAttempts: number
  lastMistake: number
  mastered: boolean
}

// ========== Радикалы ==========
export interface Radical {
  id: number
  character: string
  pinyin: string
  meaning: string
  examples?: string[]
  level?: HSKLevel
  strokes: number
  variant?: string
}

// ========== ПАКИ (КАРТОЧКИ) ==========
export interface Card {
  id: string
  packId: string
  front: string
  back: string
  pinyin?: string
  example?: string
  imageUrl?: string
  audioUrl?: string
  tags?: string[]
  source?: 'hsk' | 'user' | 'camera'
  sourceId?: string | number
  easiness: number
  interval: number
  repetitions: number
  dueDate: number
  lastReview: number
  totalReviews: number
  correctCount: number
  streak: number
}

export interface Pack {
  id: string
  name: string
  description?: string
  coverImage?: string
  createdAt: number
  updatedAt: number
  cardCount: number
  isSystem: boolean
  lessonId?: string
  tags?: string[]
  newCardsPerDay?: number
  reviewsPerDay?: number
  level?: HSKLevel | HSKLevel[]
}

// ========== Чат с ассистентом ==========
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  showSaveButton?: boolean
  saveType?: string
  word?: string
  image?: string
}

export interface AssistantContext {
  lessonId?: string | number
  currentWord?: string
  selectedText?: string
}