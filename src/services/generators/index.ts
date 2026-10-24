// src/services/generators/index.ts
import { shuffleArray, shuffleArrayWithCorrect } from '@/constants/shuffle';
import { useVocabularyStore } from '@/stores/vocabularyStore';
import { useGrammarStore } from '@/stores/grammarStore';
import lessonTopics from '@/data/lessonTopics.json';
import type {
  HSKWord,
  GrammarPoint,
  Exercise,
  FillBlankExercise,
  MultipleChoiceExercise,
  ListeningExercise,
  TranslateExercise,
  MatchPinyinExercise,
  MatchTranslationExercise,
  SentenceOrderExercise,
  Lesson,
  HSKLevel,
} from '@/types';
import { ExerciseType } from '@/constants';

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function canGenerateType(
  type: ExerciseType,
  wordsCount: number,
  hasSentences: boolean
): boolean {
  switch (type) {
    case ExerciseType.MatchPinyin:
    case ExerciseType.MatchTranslation:
      if (wordsCount < 2) {
        console.warn(`[generator] ${type} requires at least 2 words, but only ${wordsCount} available`);
        return false;
      }
      return true;
    case ExerciseType.SentenceOrder:
      if (!hasSentences) {
        console.warn(`[generator] ${type} requires sentences, but none available`);
        return false;
      }
      return true;
    default:
      if (wordsCount === 0) {
        console.warn(`[generator] ${type} requires at least 1 word, but 0 available`);
        return false;
      }
      return true;
  }
}

function generateFillBlank(word: HSKWord, allWords: HSKWord[]): Omit<Exercise, 'id'> | null {
  const otherWords = allWords
    .filter(w => w.id !== word.id && w.level === word.level)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(w => w.simplified);

  const options = [word.simplified, ...otherWords];
  const { shuffled, correctIndex } = shuffleArrayWithCorrect(options, word.simplified);

  const exercise: FillBlankExercise = {
    id: '',
    type: ExerciseType.FillBlank,
    level: word.level,
    sentence: `___ — это ${word.translations.ru}?`,
    options: shuffled,
    correctAnswer: correctIndex,
  };
  console.log(`[generator] Created FillBlank for word "${word.simplified}"`);
  const { id, ...rest } = exercise;
  return rest as Omit<Exercise, 'id'>;
}

function generateMultipleChoice(word: HSKWord, allWords: HSKWord[]): Omit<Exercise, 'id'> | null {
  const otherWords = allWords
    .filter(w => w.id !== word.id && w.level === word.level)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(w => w.translations.ru);

  const options = [word.translations.ru, ...otherWords];
  const { shuffled, correctIndex } = shuffleArrayWithCorrect(options, word.translations.ru);

  const exercise: MultipleChoiceExercise = {
    id: '',
    type: ExerciseType.MultipleChoice,
    level: word.level,
    question: `Что означает «${word.simplified}»?`,
    options: shuffled,
    correctAnswer: correctIndex,
  };
  console.log(`[generator] Created MultipleChoice for word "${word.simplified}"`);
  const { id, ...rest } = exercise;
  return rest as Omit<Exercise, 'id'>;
}

function generateListening(word: HSKWord, allWords: HSKWord[]): Omit<Exercise, 'id'> | null {
  const otherOptions = allWords
    .filter(w => w.id !== word.id && w.level === word.level)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(w => w.translations.ru);

  const options = [word.translations.ru, ...otherOptions];
  const { shuffled } = shuffleArrayWithCorrect(options, word.translations.ru);

  const exercise: ListeningExercise = {
    id: '',
    type: ExerciseType.Listening,
    level: word.level,
    word: word,
    options: shuffled,
    correctAnswer: word.translations.ru,
  };
  console.log(`[generator] Created Listening for word "${word.simplified}"`);
  const { id, ...rest } = exercise;
  return rest as Omit<Exercise, 'id'>;
}

function generateTranslate(word: HSKWord): Omit<Exercise, 'id'> | null {
  const exercise: TranslateExercise = {
    id: '',
    type: ExerciseType.Translate,
    level: word.level,
    question: word.translations.ru,
    correctAnswer: word.simplified,
  };
  console.log(`[generator] Created Translate for word "${word.simplified}"`);
  const { id, ...rest } = exercise;
  return rest as Omit<Exercise, 'id'>;
}

function generateMatchPinyin(words: HSKWord[]): Omit<Exercise, 'id'> | null {
  if (words.length < 2) return null;
  const selectedWords = words.slice(0, 4);
  const pairs = selectedWords.map(w => ({
    chinese: w.simplified,
    pinyin: w.pinyin,
  }));
  const shuffledPairs = shuffleArray(pairs);
  const exercise: MatchPinyinExercise = {
    id: '',
    type: ExerciseType.MatchPinyin,
    level: selectedWords[0].level,
    pairs: shuffledPairs,
    correctAnswer: 0,
  };
  console.log(`[generator] Created MatchPinyin with ${selectedWords.length} pairs`);
  const { id, ...rest } = exercise;
  return rest as Omit<Exercise, 'id'>;
}

function generateMatchTranslation(words: HSKWord[]): Omit<Exercise, 'id'> | null {
  if (words.length < 2) return null;
  const selectedWords = words.slice(0, 4);
  const chineseItems = selectedWords.map(w => w.simplified);
  const translationItems = selectedWords.map(w => w.translations.ru);
  const shuffledChinese = shuffleArray(chineseItems);
  const shuffledTranslations = shuffleArray(translationItems);
  const pairs = shuffledChinese.map((chinese, idx) => ({
    chinese,
    translation: shuffledTranslations[idx],
  }));
  const exercise: MatchTranslationExercise = {
    id: '',
    type: ExerciseType.MatchTranslation,
    level: selectedWords[0].level,
    pairs,
    correctAnswer: 0,
  };
  console.log(`[generator] Created MatchTranslation with ${selectedWords.length} pairs`);
  const { id, ...rest } = exercise;
  return rest as Omit<Exercise, 'id'>;
}

function generateSentenceOrderFromSentences(sentences: string[], level: HSKLevel): Omit<Exercise, 'id'> | null {
  if (!sentences || sentences.length === 0) return null;
  const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
  const words = randomSentence.split(' ');
  if (words.length < 2) return null;
  const correctOrder = words.map((_, i) => i);
  const shuffledIndices = shuffleArray([...correctOrder]);
  const shuffledWords = shuffledIndices.map(i => words[i]);
  const exercise: SentenceOrderExercise = {
    id: '',
    type: ExerciseType.SentenceOrder,
    level,
    words: shuffledWords,
    correctOrder,
    correctAnswer: 0,
  };
  console.log(`[generator] Created SentenceOrder from sentence: "${randomSentence}"`);
  const { id, ...rest } = exercise;
  return rest as Omit<Exercise, 'id'>;
}

// ==================== БАЗОВАЯ ФУНКЦИЯ ГЕНЕРАЦИИ ====================

export interface GenerateExercisesBaseOptions {
  words: HSKWord[];
  grammarPoints?: GrammarPoint[];
  count: number;
  includeTypes?: ExerciseType[];
  lessonLevel: HSKLevel;
  sentences?: string[];
  // Дополнительные параметры для повторения
  prioritizeMistakes?: boolean;   // если true – сначала берём слова с ошибками
  levels?: HSKLevel[];            // фильтр по уровням (если нужен)
}

export function generateExercisesBase(options: GenerateExercisesBaseOptions): Omit<Exercise, 'id'>[] {
  const { words, count, includeTypes, lessonLevel, sentences } = options;
  const exercises: Omit<Exercise, 'id'>[] = [];

  if (words.length === 0) {
    console.warn('[generator] No words available, cannot generate exercises');
    return exercises;
  }

  const desiredTypes = includeTypes || [
    ExerciseType.FillBlank,
    ExerciseType.MultipleChoice,
    ExerciseType.Listening,
    ExerciseType.Translate,
    ExerciseType.SentenceOrder,
  ];

  const availableTypes = desiredTypes.filter(type =>
    canGenerateType(type, words.length, !!sentences?.length)
  );

  if (availableTypes.length === 0) {
    console.warn('[generator] No exercise types available after filtering');
    return exercises;
  }

  // Создаём циклический итератор по словам
  let wordIndex = 0;
  const getNextWord = (): HSKWord => {
    const word = words[wordIndex % words.length];
    wordIndex++;
    return word;
  };

  // Сброс индекса для каждого прохода (чтобы не зацикливаться на одном типе)
  const resetWordIndex = () => { wordIndex = 0; };

  // Функция для добавления упражнения без дублирования подряд одного слова
  const tryAddExercise = (ex: Omit<Exercise, 'id'> | null) => {
    if (ex) {
      exercises.push(ex);
      return true;
    }
    return false;
  };

  // 1. Сложные типы (MatchPinyin, MatchTranslation) – они используют несколько слов сразу,
  //    поэтому для них не применяем циклический выбор.
  if (availableTypes.includes(ExerciseType.MatchPinyin) && words.length >= 2) {
    const target = Math.min(2, Math.floor(count / availableTypes.length));
    for (let i = 0; i < target; i++) {
      if (exercises.length >= count) break;
      tryAddExercise(generateMatchPinyin(words));
    }
  }

  if (availableTypes.includes(ExerciseType.MatchTranslation) && words.length >= 2) {
    const target = Math.min(2, Math.floor(count / availableTypes.length));
    for (let i = 0; i < target; i++) {
      if (exercises.length >= count) break;
      tryAddExercise(generateMatchTranslation(words));
    }
  }

  // 2. SentenceOrder
  if (availableTypes.includes(ExerciseType.SentenceOrder) && sentences?.length) {
    const target = Math.min(2, Math.floor(count / availableTypes.length));
    for (let i = 0; i < target; i++) {
      if (exercises.length >= count) break;
      tryAddExercise(generateSentenceOrderFromSentences(sentences, lessonLevel));
    }
  }

  // 3. Базовые генераторы – используем циклический выбор слов
  const basicGenerators = [
    { type: ExerciseType.FillBlank, gen: generateFillBlank },
    { type: ExerciseType.MultipleChoice, gen: generateMultipleChoice },
    { type: ExerciseType.Listening, gen: generateListening },
    { type: ExerciseType.Translate, gen: generateTranslate },
  ].filter(g => availableTypes.includes(g.type));

  // Сначала равномерно распределяем по типам
  const targetPerType = Math.floor(count / basicGenerators.length);
  for (const generator of basicGenerators) {
    resetWordIndex();
    for (let i = 0; i < targetPerType; i++) {
      if (exercises.length >= count) break;
      const word = getNextWord();
      tryAddExercise(generator.gen(word, words));
    }
  }

  // 4. Если остались незаполненные упражнения, добираем случайными типами,
  //    но продолжаем циклический выбор слов
  if (exercises.length < count) {
    const remaining = count - exercises.length;
    const allGenerators = [
      ...basicGenerators,
      ...(availableTypes.includes(ExerciseType.MatchPinyin) ? [{ type: ExerciseType.MatchPinyin }] : []),
      ...(availableTypes.includes(ExerciseType.MatchTranslation) ? [{ type: ExerciseType.MatchTranslation }] : []),
      ...(availableTypes.includes(ExerciseType.SentenceOrder) && sentences?.length ? [{ type: ExerciseType.SentenceOrder }] : []),
    ];

    // Продолжаем циклический счётчик слов с того места, где остановились
    for (let i = 0; i < remaining; i++) {
      if (allGenerators.length === 0) break;
      const randomType = allGenerators[Math.floor(Math.random() * allGenerators.length)].type;
      let ex = null;

      if (randomType === ExerciseType.MatchPinyin) {
        ex = generateMatchPinyin(words);
      } else if (randomType === ExerciseType.MatchTranslation) {
        ex = generateMatchTranslation(words);
      } else if (randomType === ExerciseType.SentenceOrder) {
        ex = generateSentenceOrderFromSentences(sentences as string[], lessonLevel);
      } else {
        const generator = basicGenerators.find(g => g.type === randomType);
        if (generator) {
          const word = getNextWord();
          ex = generator.gen(word, words);
        }
      }

      if (!tryAddExercise(ex)) {
        // Если не удалось создать упражнение, удаляем этот тип из доступных
        const idx = allGenerators.findIndex(g => g.type === randomType);
        if (idx !== -1) allGenerators.splice(idx, 1);
      }
    }
  }

  console.log(`[generator] Generated ${exercises.length} exercises (requested ${count})`);
  return exercises.slice(0, count);
}

// ==================== СТАРЫЕ ФУНКЦИИ (ОБЁРТКИ) ====================

export interface GenerateExercisesOptions {
  words: HSKWord[];
  grammarPoints?: GrammarPoint[];
  count: number;
  includeTypes?: ExerciseType[];
  lessonLevel: HSKLevel;
  sentences?: string[];
}

export function generateExercises(options: GenerateExercisesOptions): Omit<Exercise, 'id'>[] {
  return generateExercisesBase({ ...options });
}

export interface ReviewOptions {
  levels: HSKLevel[];
  types: ExerciseType[];
  count: number;
  mode: 'mistakes' | 'srs';
  topics?: string[];
}

export async function generateReviewExercises(options: ReviewOptions): Promise<Omit<Exercise, 'id'>[]> {
  const vocabStore = useVocabularyStore();
  if (!vocabStore.words.length) await vocabStore.loadVocabulary();

  let allWords: HSKWord[] = [];
  for (const level of options.levels) {
    let words = vocabStore.words.filter(w => w.level === level);
    if (options.topics && options.topics.length > 0) {
      words = words.filter(w => w.topics?.some(t => options.topics!.includes(t)));
    }
    allWords = [...allWords, ...words];
  }

  function getSentencesByLevel(level: HSKLevel): string[] {
    const sentences: string[] = [];
    const entries = Object.entries(lessonTopics);
    for (const [_, meta] of entries) {
      const m = meta as any;
      if (m.level === level && m.dialogues) {
        for (const dialogue of m.dialogues) {
          for (const line of dialogue.lines) {
            sentences.push(line.chinese);
          }
        }
      }
    }
    return sentences;
  }

  let allSentences: string[] = [];
  for (const level of options.levels) {
    allSentences = allSentences.concat(getSentencesByLevel(level));
  }

  // Фильтруем доступные типы
  const availableTypes = options.types.filter(type =>
    canGenerateType(type, allWords.length, allSentences.length > 0)
  );

  if (availableTypes.length === 0) {
    console.warn('[review] No exercise types available after filtering');
    return [];
  }

  // Используем базовую функцию, передавая все слова и предложения
  // Для режима ошибок можно позже добавить фильтрацию слов с ошибками
  return generateExercisesBase({
    words: allWords,
    count: options.count,
    includeTypes: availableTypes,
    lessonLevel: options.levels[0],
    sentences: allSentences,
  });
}

// ==================== ГЕНЕРАЦИЯ УРОКА ====================

export async function generateLesson(id: string): Promise<Lesson | null> {
  console.log('[generateLesson] generating lesson', id);
  const meta = (lessonTopics as any)[id];
  if (!meta) {
    console.warn('[generateLesson] no meta for', id);
    return null;
  }

  const vocabStore = useVocabularyStore();
  const grammarStore = useGrammarStore();

  if (vocabStore.words.length === 0) await vocabStore.loadVocabulary();
  if (grammarStore.grammarPoints.length === 0) await grammarStore.loadGrammar();

  const level = meta.level as HSKLevel;
  const words: HSKWord[] = vocabStore.getWordsByTopics(level, meta.topics);

  const grammarPoints: GrammarPoint[] = meta.grammarTopics
    ? meta.grammarTopics
        .map((gid: string) => grammarStore.grammarPoints.find(g => g.id === gid))
        .filter(Boolean) as GrammarPoint[]
    : grammarStore.getGrammarByTopics(level, meta.topics);

  const sentences: string[] = [];
  if (meta.dialogues) {
    for (const dialogue of meta.dialogues) {
      for (const line of dialogue.lines) {
        sentences.push(line.chinese);
      }
    }
  }

  const exerciseOptions: GenerateExercisesBaseOptions = {
    words,
    grammarPoints,
    count: 10,
    lessonLevel: level,
    sentences,
  };
  const generated = generateExercisesBase(exerciseOptions);

  const exercises: Exercise[] = generated.map((ex, index) => ({
    ...ex,
    id: `${id}-ex-${index}`,
  })) as Exercise[];

  const lesson: Lesson = {
    id,
    hskLevel: level,
    lessonNumber: meta.number,
    title: meta.title,
    topics: meta.topics,
    grammarPoints: grammarPoints.map(g => g.id),
    dialogues: meta.dialogues,
    newWords: words.map(w => w.id),
    exercises,
    trueFalseStatements: meta.trueFalseStatements,
  };

  return lesson;
}

export function getLessonMetaByLevel(level: HSKLevel) {
  const entries = Object.entries(lessonTopics);
  return entries
    .filter(([_, meta]) => (meta as any).level === level)
    .map(([id, meta]) => ({ id, ...(meta as any) }))
    .sort((a, b) => a.number - b.number);
}