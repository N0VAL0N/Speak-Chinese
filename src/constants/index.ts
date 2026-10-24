import { Sun, Moon, Monitor } from 'lucide-vue-next';

export enum HSKLevel {
  Level1 = '1',
  Level2 = '2',
  Level3 = '3',
  Level4 = '4',
  Level5 = '5'
}

export const HSK_LEVELS: HSKLevel[] = [
  HSKLevel.Level1,
  HSKLevel.Level2,
  HSKLevel.Level3,
  HSKLevel.Level4,
  HSKLevel.Level5
];

export const HSK_LEVEL_COLORS: Record<HSKLevel, string> = {
  [HSKLevel.Level1]: '#4caf50',
  [HSKLevel.Level2]: '#319795',
  [HSKLevel.Level3]: '#7e57c2',
  [HSKLevel.Level4]: '#d46b7a',
  [HSKLevel.Level5]: '#ff9800'
};

export enum ExerciseType {
  FillBlank = 'fill-blank',
  MultipleChoice = 'multiple-choice',
  Listening = 'listening',
  Translate = 'translate',
  MatchPinyin = 'match-pinyin',
  MatchTranslation = 'match-translation',
  SentenceOrder = 'sentence-order',
  DialogueTrueFalse = 'dialogue-truefalse'
}

export const REVIEW_EXERCISE_TYPES: Array<{ value: ExerciseType; label: string }> = [
  { value: ExerciseType.FillBlank, label: 'Вставка слова' },
  { value: ExerciseType.Translate, label: 'Перевод' },
  { value: ExerciseType.MatchPinyin, label: 'Соотнеси с пиньинем' },
  { value: ExerciseType.Listening, label: 'Аудирование' },
  { value: ExerciseType.MatchTranslation, label: 'Соотнеси с переводом' }
];

export enum WordStatus {
  New = 'new',
  Learning = 'learning',
  Review = 'review',
  Mastered = 'mastered'
}

export const REVIEW_MODES = {
  MISTAKES: 'mistakes',
  SRS: 'srs'
} as const;

export type ReviewMode = typeof REVIEW_MODES[keyof typeof REVIEW_MODES];

export const WORD_COUNT_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50];

export const STROKE_FILTERS: Array<{ label: string; value: string }> = [
  { label: 'Все', value: 'all' },
  { label: '1–3', value: '1-3' },
  { label: '4–6', value: '4-6' },
  { label: '7–9', value: '7-9' },
  { label: '10+', value: '10+' }
];

export const LESSON_PAGE_TYPES = {
  TITLE: 'title',
  WORD: 'word',
  GRAMMAR: 'grammar',
  DIALOGUE: 'dialogue',
  DIALOGUE_TRUEFALSE: 'dialogue-truefalse',
  EXERCISE: 'exercise',
  COMPLETION: 'completion'
} as const;

export const ROUTES = {
  HOME: '/main',
  REVIEW: '/main/review',
  TEXTS: '/main/texts',
  EXAMS: '/main/exams',
  RADICALS: '/radicals',
  PROFILE: '/profile',
  LESSON: (id: string) => `/lesson/${id}`,
  EXAM: (id: string) => `/exam/${id}`,
  // CHARACTER_REVIEW удалён
  SETTINGS: '/settings',
  SPLASH: '/',
  PACKS: '/main/packs',
  PACK: (id: string) => `/pack/${id}`,
  GLOSSARY: '/glossary', 
  PRACTICE: '/practice',
  ASSISTANT: '/assistant', // пока заглушка
  PACK_STUDY: (id: string) => `/pack/${id}/study`,  // новый маршрут
} as const;

export const PRESET_AVATARS = [
  { value: 'default', label: 'По умолчанию', url: '' },
  { value: 'cat', label: 'Кот', url: '/avatars/cat.svg' },
  { value: 'dog', label: 'Собака', url: '/avatars/dog.svg' },
  { value: 'panda', label: 'Панда', url: '/avatars/panda.svg' }
] as const;

export const PRESET_GOALS = [
  {
    id: 'travel',
    title: 'Поездка и путешествия',
    description: 'Базовый уровень для общения в поездках (HSK 3)',
    level: HSKLevel.Level3
  },
  {
    id: 'university',
    title: 'Учеба в университете',
    description: 'Подготовка к академической среде (HSK 5)',
    level: HSKLevel.Level5
  },
  {
    id: 'entertainment',
    title: 'Смотреть дорамы и мультики',
    description: 'Понимание разговорной речи в медиа (HSK 5)',
    level: HSKLevel.Level5
  }
] as const;

export const WEEK_DAYS = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 0, label: 'Вс' }
] as const;

export const COLOR_SCHEMES = [
  { value: 'green', label: 'Зелёный', color: '#4caf50' },
  { value: 'teal', label: 'Бирюзовый', color: '#319795' },
  { value: 'purple', label: 'Фиолетовый', color: '#7e57c2' },
  { value: 'pink', label: 'Розовый', color: '#d46b7a' },
  { value: 'orange', label: 'Оранжевый', color: '#ff9800' }
] as const;

export const THEMES = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Системная', icon: Monitor }
] as const;

export const FONT_SIZES = [
  { value: 'small', label: 'Мелкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'large', label: 'Крупный' }
] as const;

export const DEFAULT_LIVES = 5;

export const MAX_WORD_COUNT = 100;
export const MIN_WORD_COUNT = 5;
export const AUTO_ADVANCE_DELAY = 800; // мс

export const EXAM_QUESTION_COUNTS = {
  listening: 20,
  reading: 20,
  grammar: 10,
  writing: 10
} as const;