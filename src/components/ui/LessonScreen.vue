<template>
  <div class="lesson-screen" :style="{ backgroundColor: 'var(--bg-primary)' }">
    <div class="mobile-container">
      <!-- Шапка урока (видна всегда, кроме модалок) -->
      <div class="lesson-header" v-if="!showResults && !showDeathModal && !showResultsModal">
        <button class="back-btn" @click="goBack">
          <ChevronLeft :size="28" />
        </button>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="page-counter">{{ currentPage }} / {{ totalPages }}</div>
      </div>

      <!-- Индикатор жизней (только во время прохождения) -->
      <div class="lives-indicator" v-if="!isCompleted && totalPages > 0 && currentPageData?.type !== 'completion'">
        <span v-for="i in maxLives" :key="i" class="heart" :class="{ lost: i > lives }">❤️</span>
      </div>

      <!-- Контент урока -->
      <div class="lesson-content"
           @touchstart="handleTouchStart"
           @touchend="handleTouchEnd"
           v-if="lesson && currentPageData">

        <!-- Титульная страница -->
        <div v-if="currentPageData.type === 'title'" class="title-page centered">
          <h2>{{ currentPageData.title }}</h2>
          <p>{{ currentPageData.description }}</p>
          <!-- Кнопки для завершённого урока -->
          <div v-if="isCompleted" class="completed-actions">
            <button class="btn btn-primary" @click="restartLesson">Пройти заново</button>
            <button class="btn btn-outline" @click="showResultsModal = true">Результаты</button>
          </div>
        </div>

        <!-- Страница слова -->
        <div v-else-if="currentPageData.type === 'word'" class="word-page centered">
          <div class="card-flip" @click="flipCard" :class="{ flipped: isFlipped }">
            <div class="card-front">
              <span class="hanzi">{{ currentPageData.word.simplified }}</span>
              <span class="pinyin">{{ currentPageData.word.pinyin }}</span>
            </div>
            <div class="card-back">
              <span class="translation">{{ currentPageData.word.translations?.ru || 'нет перевода' }}</span>
            </div>
          </div>
          <p class="flip-hint">👆 нажми на карточку, чтобы увидеть перевод</p>
          <div class="word-actions">
            <button class="btn btn-primary audio-btn-large" @click="playAudio(currentPageData.word.simplified)">
              <Volume2 :size="32" /> Прослушать
            </button>
            <button class="btn btn-outline stroke-btn" @click="openStrokeOrder">
              <PenTool :size="20" /> Порядок черт
            </button>
            <button class="btn btn-outline skip-btn" @click="skipWord">
              <span>⏭️ Пропустить</span>
            </button>
          </div>
        </div>

        <!-- Страница грамматики -->
        <div v-else-if="currentPageData.type === 'grammar'" class="grammar-page centered">
          <div class="grammar-header">
            <h3>Грамматика</h3>
            <GrammarLegend v-if="grammarMeta" :meta="grammarMeta" />
          </div>
          <div class="grammar-item">
            <p class="pattern">{{ currentPageData.grammarPoint.pattern }}</p>
            <p class="explanation">{{ currentPageData.grammarPoint.explanation }}</p>
            <ul class="examples">
              <li v-for="(ex, idx) in currentPageData.grammarPoint.examples" :key="idx">
                <template v-if="typeof ex === 'string'">
                  <span class="example-chinese">{{ ex }}</span>
                  <button class="btn-icon audio-btn-small" @click="playAudio(ex)" title="Прослушать">
                    <Volume2 :size="18" />
                  </button>
                </template>
                <template v-else>
                  <span class="example-chinese">{{ ex.chinese }}</span>
                  <button class="btn-icon audio-btn-small" @click="playAudio(ex.chinese)" title="Прослушать">
                    <Volume2 :size="18" />
                  </button>
                  <span class="example-pinyin" v-if="ex.pinyin"> ({{ ex.pinyin }})</span>
                  <span class="example-translation" v-if="ex.translation"> – {{ ex.translation }}</span>
                </template>
              </li>
            </ul>
            <button class="btn btn-outline note-btn" @click="showGrammarNote = true">Примечание</button>
            <div v-if="showGrammarNote" class="modal-overlay" @click.self="showGrammarNote = false">
              <div class="modal grammar-note-modal">
                <h4>Сокращения</h4>
                <p>S = Subject, N = Noun, V = Verb, Adj = Adjective, O = Object, Prep = Preposition, Part = Particle, M = Measure word, Num = Numeral, Pron = Pronoun, Conj = Conjunction, Adv = Adverb.</p>
                <button class="btn btn-primary" @click="showGrammarNote = false">Закрыть</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Страница диалога -->
        <div v-else-if="currentPageData.type === 'dialogue'" class="dialogue-page centered">
        <h3>Диалог</h3>
        <div v-for="(line, idx) in currentPageData.dialogue.lines" :key="idx" class="dialogue-line">
          <div class="speaker">{{ line.speaker }}</div>
          <div class="dialogue-content">
            <div class="chinese-row">
              <span class="chinese">{{ line.chinese }}</span>
              <div class="dialogue-actions">
                <button class="btn-icon audio-btn-small" @click="playAudio(line.chinese)" title="Прослушать">
                  <Volume2 :size="20" />
                </button>
                <button class="btn-icon" @click="toggleTranslation(Number(idx))" title="Показать перевод">
                  <Eye :size="20" />
                </button>
              </div>
            </div>
            <div class="pinyin">{{ line.pinyin }}</div>
            <div v-if="showTranslations[Number(idx)]" class="translation">{{ line.russian }}</div>
          </div>
        </div>
      </div>

        <!-- Страница true/false -->
        <div v-else-if="currentPageData.type === 'dialogue-truefalse'" class="truefalse-page">
        <h3>Проверьте понимание диалога</h3>
        <p class="instruction">Выберите 对 (верно) или 错 (неверно) для каждого утверждения.</p>
        <div v-for="(statement, idx) in currentPageData.statements" :key="idx" class="statement-item">
          <p class="statement-text">{{ statement.text }}</p>
          <p class="statement-pinyin">{{ statement.pinyin }}</p>
          <div class="options">
            <button
              @click="answerTrueFalse(Number(idx), true)"
              :disabled="userAnswers[Number(idx)] === true || (userAnswers[Number(idx)] === false && allTrueFalseCorrect)"
              :class="[
                'option-btn',
                { 
                  correct: userAnswers[Number(idx)] === true && statement.correct === true,
                  wrong: userAnswers[Number(idx)] === true && statement.correct === false,
                  selected: userAnswers[Number(idx)] === true
                }
              ]"
            >
              对 (верно)
            </button>
            <button
              @click="answerTrueFalse(Number(idx), false)"
              :disabled="userAnswers[Number(idx)] === false || (userAnswers[Number(idx)] === true && allTrueFalseCorrect)"
              :class="[
                'option-btn',
                { 
                  correct: userAnswers[Number(idx)] === false && statement.correct === false,
                  wrong: userAnswers[Number(idx)] === false && statement.correct === true,
                  selected: userAnswers[Number(idx)] === false
                }
              ]"
            >
              错 (неверно)
            </button>
          </div>
        </div>
      </div>

        <!-- Страница с упражнением -->
        <div v-else-if="currentPageData.type === 'exercise'" class="exercise-page">
          <ExerciseCard
            :key="currentPageData.exercise.id"
            :exercise="currentPageData.exercise"
            :isActive="true"
            :reviewId="getReviewId(currentPageData.exercise)"
            :initialState="exerciseStates[currentPage-1]"
            :disabled="lives <= 0 || (exerciseStates[currentPage-1]?.answered && exerciseStates[currentPage-1]?.isCorrect)"
            @answered="(isCorrect) => handleExerciseAnswer(isCorrect)"
            @update-state="updateExerciseState(currentPage-1, $event)"
            @next="nextPage"
            @mistake="handleMistake"
          />
        </div>

        <!-- Неизвестный тип -->
        <div v-else class="unknown-page">
          <p>Неизвестный тип страницы: {{ currentPageData.type }}</p>
        </div>
      </div>
      <div v-else class="loading">Загрузка урока...</div>

      <!-- Нижняя навигация с кнопкой ассистента -->
      <div class="lesson-footer" 
          v-if="currentPageData && 
                  currentPageData.type !== 'completion' && 
                  !isCompleted">
        <button class="nav-btn prev" :disabled="currentPage === 1" @click="prevPage">
          <ChevronLeft :size="20" />
          <span>Назад</span>
        </button>
        
        <!-- Кнопка ассистента -->
        <button class="nav-btn assistant-btn" @click="openAssistant">
          <span class="assistant-char">萨</span>
          <span>Саша</span>
        </button>
        
        <button class="nav-btn next" :class="{ primary: currentPage === totalPages }" @click="nextPage" :disabled="!canGoNext">
          <span>Далее</span>
          <ChevronRight :size="20" />
        </button>
      </div>

      <!-- Модалка результатов (обычная) -->
      <div v-if="showResults" class="modal-overlay" @click.self="showResults = false">
        <div class="modal results-modal">
          <h2>Результаты урока</h2>
          <div class="score-circle">
            <svg viewBox="0 0 100 100" width="120" height="120">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" stroke-width="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                :stroke="scoreColor"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="dashOffset"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div class="score-percent">{{ successPercentage }}%</div>
          </div>
          <div class="stats">
            <p>Ошибок: {{ totalMistakes }} из {{ exercisesCount }}</p>
            <p>Осталось жизней: {{ lives }}</p>
            <p>Время: {{ formattedTime }}</p>
            <p class="grade">{{ grade }}</p>
          </div>
          <div class="result-actions">
            <button class="btn btn-primary" @click="finishLesson">На главную</button>
          </div>
        </div>
      </div>

      <!-- Модалка смерти -->
      <div v-if="showDeathModal" class="modal-overlay" @click.self="showDeathModal = false">
        <div class="modal death-modal">
          <h2>💔 Жизни кончились</h2>
          <p>Попробуйте начать урок заново.</p>
          <div class="modal-actions">
            <button class="btn btn-outline" @click="restartLesson">Начать заново</button>
            <button class="btn btn-primary" @click="finishLesson">На главную</button>
          </div>
        </div>
      </div>

      <!-- Модалка просмотра результатов (для завершённого урока) -->
      <div v-if="showResultsModal" class="modal-overlay" @click.self="showResultsModal = false">
        <div class="modal results-modal">
          <h2>Результаты урока</h2>
          <div v-if="lastResult">
            <div class="score-circle">
              <svg viewBox="0 0 100 100" width="120" height="120">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" stroke-width="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  :stroke="scoreColorForPercentage(lastResult.percentage)"
                  stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="dashOffsetForPercentage(lastResult.percentage)"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div class="score-percent">{{ lastResult.percentage }}%</div>
            </div>
            <div class="stats">
              <p>Правильно: {{ lastResult.correct }} из {{ lastResult.total }}</p>
              <p>Ошибок: {{ lastResult.mistakes }}</p>
              <p>Время: {{ formatTime(lastResult.time) }}</p>
              <p class="grade">{{ lastResult.grade }}</p>
            </div>
            <div v-if="bestResult && bestResult.date !== lastResult.date" class="comparison">
              <p>🏆 Лучший результат: {{ bestResult.percentage }}% ({{ bestResult.correct }}/{{ bestResult.total }})</p>
              <p v-if="lastResult.percentage > bestResult.percentage" class="new-record">🎉 Новый рекорд!</p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary" @click="restartLesson">Пройти заново</button>
            <button class="btn btn-outline" @click="showResultsModal = false">Закрыть</button>
          </div>
        </div>
      </div>

      <!-- Модалка порядка черт -->
      <div v-if="showStrokeModal" class="modal-overlay" @click.self="showStrokeModal = false">
        <div class="modal stroke-modal">
          <div class="modal-header">
            <h3>{{ currentPageData?.word?.simplified || 'Иероглиф' }}</h3>
            <button class="btn-icon" @click="showStrokeModal = false">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-body">
            <StrokeOrder :character="currentPageData?.word?.simplified || ''" :size="200" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronLeft, ChevronRight, Volume2, Eye, PenTool, X } from 'lucide-vue-next';
import { useLessonsStore } from '@/stores/lessonsStore';
import { useVocabularyStore } from '@/stores/vocabularyStore';
import { useGrammarStore } from '@/stores/grammarStore';
import { useUserStore } from '@/stores/userStore';
import { useAppStore } from '@/stores/appStore';
import { useReviewStore } from '@/stores/reviewStore';
import GrammarLegend from '@/components/ui/GrammarLegend.vue';
import ExerciseCard from '@/components/review/ExerciseCard.vue';
import StrokeOrder from '@/components/ui/StrokeOrder.vue';
import { speak } from '@/services/tts';
import type { Lesson, Exercise, LessonResult } from '@/types';
import { DEFAULT_LIVES } from '@/constants';

const props = defineProps<{ id: string }>();
const router = useRouter();
const lessonsStore = useLessonsStore();
const vocabStore = useVocabularyStore();
const grammarStore = useGrammarStore();
const userStore = useUserStore();
const appStore = useAppStore();
const reviewStore = useReviewStore();

const lesson = ref<Lesson | null>(null);
const pages = ref<any[]>([]);
const currentPage = ref(1);
const showGrammarNote = ref(false);
const showTranslations = ref<boolean[]>([]);
const touchStartX = ref(0);
const touchEndX = ref(0);
const isFlipped = ref(false);

// Жизни и ошибки
const maxLives = ref(DEFAULT_LIVES);
const lives = ref(DEFAULT_LIVES);
const totalMistakes = ref(0);
const showResults = ref(false);
const showDeathModal = ref(false);
const startTime = ref(Date.now());
const endTime = ref(0);

// Состояния упражнений
interface ExerciseState {
  answered: boolean;
  isCorrect: boolean;
  selectedIdx?: number | null;
  userAnswer?: string;
  userMatches?: string[];
  userOrder?: number[];
  [key: string]: any;
}
const exerciseStates = ref<Record<number, ExerciseState>>({});
const userAnswers = ref<boolean[]>([]);
const showStrokeModal = ref(false);

// Результаты
const isCompleted = computed(() => userStore.progress.lessonProgress[props.id] === 'completed');
const lastResult = ref<LessonResult | null>(null);
const bestResult = ref<LessonResult | null>(null);
const showResultsModal = ref(false);

const grammarMeta = computed(() => grammarStore.grammarMeta);

// Вычисляемые свойства
const totalPages = computed(() => pages.value.length);
const currentPageData = computed(() => pages.value[currentPage.value - 1]);
const progressPercent = computed(() => (currentPage.value / totalPages.value) * 100);

const exercisesCount = computed(() => pages.value.filter(p => p.type === 'exercise').length);

const canGoNext = computed(() => {
  if (lives.value <= 0) return false;
  if (!currentPageData.value) return false;
  if (currentPageData.value.type === 'dialogue-truefalse') {
    return allTrueFalseAnswered.value;
  }
  if (currentPageData.value.type === 'exercise') {
    const state = exerciseStates.value[currentPage.value - 1];
    return state?.answered === true;
  }
  return currentPage.value < totalPages.value;
});

const allTrueFalseAnswered = computed(() => {
  if (!currentPageData.value || !currentPageData.value.statements) return false;
  return userAnswers.value.length === currentPageData.value.statements.length && 
         userAnswers.value.every(a => a !== null);
});

const allTrueFalseCorrect = computed(() => {
  if (!currentPageData.value || !currentPageData.value.statements) return false;
  const correct = currentPageData.value.statements.map((s: any) => s.correct);
  return userAnswers.value.every((ans, idx) => ans === correct[idx]);
});

// Функции для расчёта результатов
const successPercentage = computed(() => {
  if (exercisesCount.value === 0) return 0;
  return Math.round(((exercisesCount.value - totalMistakes.value) / exercisesCount.value) * 100);
});

const formattedTime = computed(() => {
  const diff = (endTime.value || Date.now()) - startTime.value;
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

const grade = computed(() => {
  if (totalMistakes.value === 0) return '🏆 Идеально!';
  if (totalMistakes.value <= 3) return '✨ Отлично';
  if (totalMistakes.value <= 5) return '👍 Хорошо';
  return '😊 Можно лучше';
});

const circumference = 2 * Math.PI * 45;
const dashOffset = computed(() => circumference - (successPercentage.value / 100) * circumference);
const scoreColor = computed(() => {
  if (successPercentage.value >= 90) return '#4caf50';
  if (successPercentage.value >= 70) return '#ff9800';
  return '#f44336';
});

function scoreColorForPercentage(perc: number): string {
  if (perc >= 90) return '#4caf50';
  if (perc >= 70) return '#ff9800';
  return '#f44336';
}

function dashOffsetForPercentage(perc: number): number {
  return circumference - (perc / 100) * circumference;
}

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Открытие ассистента
const openAssistant = () => {
  router.push('/assistant');
};

// Инициализация
onMounted(async () => {
  console.log('[LessonScreen] mounted with id:', props.id);
  await Promise.all([
    vocabStore.loadVocabulary(),
    grammarStore.loadGrammar(),
  ]);

  lesson.value = await lessonsStore.getLessonById(props.id);
  console.log('[LessonScreen] lesson loaded:', lesson.value);

  if (lesson.value) {
    pages.value = await buildPages(lesson.value);
    console.log('[LessonScreen] pages built:', pages.value.length);
    const status = userStore.progress.lessonProgress[props.id];
    console.log('[LessonScreen] lesson status:', status);

    // Всегда пробуем восстановить сохранённую страницу, если она есть
    const savedPage = userStore.getLessonProgress(props.id);
    if (status === 'completed') {
      // Завершённый урок: показываем титульную страницу
      currentPage.value = 1;
      lastResult.value = userStore.getLastLessonResult(props.id) ?? null;
      bestResult.value = userStore.getBestLessonResult(props.id) ?? null;
    } else {
      // Незавершённый урок (not_started или in_progress)
      if (savedPage && savedPage >= 1 && savedPage <= pages.value.length) {
        currentPage.value = savedPage;
        console.log(`[LessonScreen] restored page ${savedPage}`);
        // Если статус not_started, переводим в in_progress
        if (status === 'not_started') {
          await userStore.updateLessonProgress(props.id, 'in_progress');
        }
      } else {
        currentPage.value = 1;
      }

      // Восстанавливаем состояния упражнений (как было)
      const savedStates = localStorage.getItem(`lesson-${props.id}-exercise-states`);
      if (savedStates) {
        try {
          const parsed = JSON.parse(savedStates);
          const restored: Record<number, ExerciseState> = {};
          for (const [key, value] of Object.entries(parsed)) {
            const idx = Number(key);
            if (!isNaN(idx) && idx >= 0 && idx < pages.value.length) {
              const page = pages.value[idx];
              if (page.type === 'exercise' && page.exercise.id === (value as any).exerciseId) {
                restored[idx] = value as ExerciseState;
              }
            }
          }
          exerciseStates.value = restored;
        } catch (e) {
          console.error('Failed to parse exercise states', e);
        }
      }

      const savedTf = localStorage.getItem(`lesson-${props.id}-truefalse`);
      if (savedTf) {
        try {
          userAnswers.value = JSON.parse(savedTf);
        } catch (e) {
          console.error('Failed to parse true/false answers', e);
        }
      } else {
        userAnswers.value = [];
      }
    }
  }
  startTime.value = Date.now();
});

async function buildPages(lesson: Lesson) {
  const pages = [];
  pages.push({ type: 'title', title: lesson.title, description: `Урок ${lesson.lessonNumber}` });

  if (lesson.newWords && lesson.newWords.length > 0) {
    for (const wordId of lesson.newWords) {
      const word = vocabStore.words.find(w => w.id === wordId);
      if (word) pages.push({ type: 'word', word });
    }
  }

  if (lesson.grammarPoints && lesson.grammarPoints.length > 0) {
    for (const grammarId of lesson.grammarPoints as string[]) {
      const grammar = grammarStore.grammarPoints.find(g => g.id === grammarId);
      if (grammar) pages.push({ type: 'grammar', grammarPoint: grammar });
    }
  }

  if (lesson.dialogues?.length) {
    lesson.dialogues.forEach((dialogue, index) => {
      pages.push({ type: 'dialogue', dialogue, index });
      if (lesson.trueFalseStatements && lesson.trueFalseStatements.length > 0) {
        pages.push({ type: 'dialogue-truefalse', statements: lesson.trueFalseStatements });
      }
    });
  }

  if (lesson.exercises?.length) {
    for (const exercise of lesson.exercises) {
      pages.push({ type: 'exercise', exercise });
    }
  }

  return pages;
}

function handleExerciseAnswer(isCorrect: boolean) {  
  if (lesson.value) {
    userStore.updateLessonPracticeStats(lesson.value.id, isCorrect);
  }
}

function updateExerciseState(pageIndex: number, state: ExerciseState) {
  exerciseStates.value[pageIndex] = state;
}

function handleMistake() {
  if (lives.value <= 0) return;
  lives.value--;
  totalMistakes.value++;
  appStore.showToast(`Ошибка! Осталось жизней: ${lives.value}`, 'warning');

  if (lives.value <= 0) {
    showDeathModal.value = true;
  }
}

function restartLesson() {
  console.log('[LessonScreen] restartLesson');
  userStore.updateLessonProgress(props.id, 'in_progress');
  userStore.resetLessonProgress?.(props.id);
  localStorage.removeItem(`lesson-${props.id}-exercise-states`);
  localStorage.removeItem(`lesson-${props.id}-truefalse`);
  lives.value = maxLives.value;
  totalMistakes.value = 0;
  currentPage.value = 1;
  exerciseStates.value = {};
  userAnswers.value = [];
  startTime.value = Date.now();
  showDeathModal.value = false;
  showResults.value = false;
  showResultsModal.value = false;
}

function goBack() {
  userStore.saveLessonProgress(props.id, currentPage.value);
  router.push('/main');
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    userStore.saveLessonProgress(props.id, currentPage.value);
  }
}

function nextPage() {
  if (lives.value <= 0) {
    showDeathModal.value = true;
    return;
  }
  if (currentPage.value < totalPages.value && canGoNext.value) {
    currentPage.value++;
    userStore.saveLessonProgress(props.id, currentPage.value);
  } else if (currentPage.value === totalPages.value) {
    endTime.value = Date.now();
    showResults.value = true;
  }
}

function skipWord() {
  const targetIndex = pages.value.findIndex(p => p.type === 'dialogue' || p.type === 'exercise');
  if (targetIndex !== -1 && targetIndex + 1 > currentPage.value) {
    currentPage.value = targetIndex + 1;
    userStore.saveLessonProgress(props.id, currentPage.value);
  } else {
    currentPage.value = totalPages.value;
    userStore.saveLessonProgress(props.id, currentPage.value);
  }
}

function finishLesson() {
  endTime.value = Date.now()
  const result: LessonResult = {
    date: Date.now(),
    correct: exercisesCount.value - totalMistakes.value,
    total: exercisesCount.value,
    mistakes: totalMistakes.value,
    time: endTime.value - startTime.value,
    grade: grade.value,
    percentage: successPercentage.value,
  }
  userStore.addLessonResult(props.id, result)

  // Добавляем lessonTitle и topics
  userStore.updateLessonProgress(
    props.id,
    'completed',
    lesson.value?.newWords,
    lesson.value?.title,
    lesson.value?.topics
  )

  userStore.resetLessonProgress?.(props.id)
  localStorage.removeItem(`lesson-${props.id}-exercise-states`)
  localStorage.removeItem(`lesson-${props.id}-truefalse`)
  router.push('/main')
}

function handleTouchStart(e: TouchEvent) {
  touchStartX.value = e.changedTouches[0].screenX;
}

function handleTouchEnd(e: TouchEvent) {
  touchEndX.value = e.changedTouches[0].screenX;
  handleSwipe();
}

function handleSwipe() {
  const threshold = 100;
  if (touchEndX.value < touchStartX.value - threshold) {
    if (canGoNext.value) nextPage();
  }
  if (touchEndX.value > touchStartX.value + threshold) {
    if (currentPage.value > 1) prevPage();
  }
}

function answerTrueFalse(index: number, value: boolean) {
  if (userAnswers.value[index] != null) return;

  const statement = currentPageData.value.statements[index];
  const isCorrect = (value === statement.correct);

  if (isCorrect) {
    userAnswers.value[index] = value;
    reviewStore.updateStats(`lesson-${props.id}-tf-${index}`, true, 5);
    appStore.showToast('Верно!', 'success');
  } else {
    reviewStore.updateStats(`lesson-${props.id}-tf-${index}`, false, 0);
    appStore.showToast('Ошибка!', 'error');
    handleMistake();
  }

  if (allTrueFalseCorrect.value) {
    appStore.showToast('Все верно! Можете продолжить.', 'success');
  }

  // Логирование
  console.log(`[TrueFalse] Утверждение: "${statement.text}"`);
  console.log(`[TrueFalse] Выбран ответ: ${value ? '对 (верно)' : '错 (неверно)'}`);
  console.log(`[TrueFalse] Правильный ответ: ${statement.correct ? '对' : '错'}`);
  console.log(`[TrueFalse] Результат: ${isCorrect ? 'Верно' : 'Ошибка'}`);
}

function flipCard() {
  isFlipped.value = !isFlipped.value;
}

function getReviewId(ex: Exercise): string | undefined {
  return `exercise-${ex.id}`;
}

function openStrokeOrder() {
  showStrokeModal.value = true;
}

function toggleTranslation(index: number) {
  showTranslations.value[index] = true;
}

async function playAudio(text: string) {
  try {
    await speak(text, 'zh-CN');
  } catch (error) {
    appStore.showToast('Ошибка воспроизведения аудио', 'error');
  }
}

watch(currentPageData, (newPage) => {
  if (newPage?.type === 'dialogue' && newPage.dialogue?.lines) {
    showTranslations.value = new Array(newPage.dialogue.lines.length).fill(false);
  }
  if (newPage?.type === 'dialogue-truefalse' && newPage.statements) {
    if (userAnswers.value.length !== newPage.statements.length) {
      userAnswers.value = new Array(newPage.statements.length).fill(null);
    }
  }
  isFlipped.value = false;
});

watch(currentPage, () => {
  userStore.saveLessonProgress(props.id, currentPage.value);
});

watch(exerciseStates, () => {
  const toSave: Record<number, any> = {};
  for (const [idx, state] of Object.entries(exerciseStates.value)) {
    const page = pages.value[Number(idx)];
    if (page?.type === 'exercise') {
      toSave[Number(idx)] = {
        ...state,
        exerciseId: page.exercise.id
      };
    }
  }
  localStorage.setItem(`lesson-${props.id}-exercise-states`, JSON.stringify(toSave));
}, { deep: true });

watch(userAnswers, () => {
  localStorage.setItem(`lesson-${props.id}-truefalse`, JSON.stringify(userAnswers.value));
}, { deep: true });

onBeforeUnmount(() => {
  userStore.saveLessonProgress(props.id, currentPage.value);
  
  const toSave: Record<number, any> = {};
  for (const [idx, state] of Object.entries(exerciseStates.value)) {
    const page = pages.value[Number(idx)];
    if (page?.type === 'exercise') {
      toSave[Number(idx)] = {
        ...state,
        exerciseId: page.exercise.id
      };
    }
  }
  localStorage.setItem(`lesson-${props.id}-exercise-states`, JSON.stringify(toSave));
  localStorage.setItem(`lesson-${props.id}-truefalse`, JSON.stringify(userAnswers.value));
});
</script>

<style scoped>
/* добавим стиль для statement-pinyin */
.statement-pinyin {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  font-style: italic;
}

/* ========== Базовые стили урока ========== */
.lesson-screen {
  min-height: 100vh;
  transition: background-color 0.3s;
  padding: 1rem 0;
  position: relative;
}
.lesson-header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
}
.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  color: var(--text-primary);
  transition: background 0.2s;
}
.back-btn:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, transparent);
}
.progress-bar-container {
  flex: 1;
  height: 8px;
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
  overflow: hidden;
  margin: 0 1rem;
}
.dark .progress-bar-container {
  background: rgba(255,255,255,0.1);
}
.progress-bar-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s ease;
}
.page-counter {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 60px;
  text-align: center;
}

/* Индикатор жизней */
.lives-indicator {
  position: absolute;
  top: 6%;
  right: 5%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 10;
}
.heart {
  font-size: 1.5rem;
  transition: opacity 0.3s;
}
.heart.lost {
  opacity: 0.3;
}

.lesson-content {
  margin-top: 25%;
  margin-bottom: 2rem;
  min-height: 70vh;
}

.lesson-footer {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  align-items: center;
}
.nav-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--surface);
  color: var(--text-primary);
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  white-space: nowrap;
}
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.nav-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 5%, var(--surface));
  transform: scale(1.02);
}
.nav-btn.prev, .nav-btn.next {
  flex: 2;
}
.nav-btn.assistant-btn {
  flex: 1;
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.nav-btn.assistant-btn:hover {
  background: color-mix(in srgb, var(--accent-color) 80%, black);
  border-color: var(--accent-color);
}
.assistant-char {
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.2rem;
}
.loading {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
}

/* ========== Флип-карточка ========== */
.card-flip {
  position: relative;
  width: 100%;
  min-height: 300px;
  cursor: pointer;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  margin: 0 auto;
  box-sizing: border-box;
}
.card-flip.flipped {
  transform: rotateY(180deg);
}
.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border-radius: 24px;
  box-shadow: var(--card-shadow);
  padding: 1rem;
  box-sizing: border-box;
  text-align: center;
  overflow-y: auto;
}

.statement-pinyin {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  font-style: italic;
}

.card-front {
  transform: rotateY(0deg);
}
.card-back {
  transform: rotateY(180deg);
}
.hanzi {
  font-size: clamp(2rem, 15vw, 6rem);
  font-weight: bold;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 1rem;
  word-break: break-word;
}
.pinyin {
  font-size: clamp(1rem, 5vw, 2rem);
  color: var(--text-secondary);
}
.translation {
  font-size: clamp(1.5rem, 8vw, 2.5rem);
  font-weight: bold;
  color: var(--accent-color) !important;
  text-align: center;
  width: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
  word-break: break-word;
}
.flip-hint {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

@media (max-width: 480px) {
  .hanzi {
    font-size: clamp(2rem, 12vw, 4rem);
  }
  .translation {
    font-size: clamp(1.2rem, 6vw, 2rem);
  }
}

/* ========== Кнопки действий ========== */
.word-actions {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
.audio-btn-large, .stroke-btn, .skip-btn {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: transform 0.2s;
}
.audio-btn-large {
  background: var(--accent-color);
  color: white;
  border: none;
}
.stroke-btn, .skip-btn {
  background: transparent;
  border: 2px solid var(--accent-color);
  color: var(--accent-color);
}
.audio-btn-large:hover, .stroke-btn:hover, .skip-btn:hover {
  transform: scale(1.05);
}

/* ========== Грамматика ========== */
.grammar-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}
.grammar-item {
  max-width: 700px;
  width: 100%;
  padding: 2rem;
  background: var(--surface);
  border-radius: 20px;
  text-align: left;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  box-sizing: border-box;
}
.pattern {
  font-weight: bold;
  color: var(--accent-color);
  margin-bottom: 1rem;
  font-size: 1.8rem;
}
.explanation {
  font-size: 1.6rem;
  margin-bottom: 1rem;
}
.examples {
  margin-top: 1rem;
  padding-left: 2rem;
  color: var(--text-secondary);
  font-size: 1.5rem;
}
.examples li {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.example-chinese {
  font-weight: 500;
}
.example-pinyin {
  color: var(--text-secondary);
  font-style: italic;
  margin-left: 0.5rem;
}
.example-translation {
  color: var(--text-secondary);
  margin-left: 0.5rem;
}
.audio-btn-small {
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.audio-btn-small:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, transparent);
}
.note-btn {
  margin-top: 1.5rem;
  width: 100%;
}

/* ========== Диалог (обновлён) ========== */
.dialogue-line {
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
}
.speaker {
  font-weight: bold;
  color: var(--accent-color);
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}
.dialogue-content {
  display: flex;
  flex-direction: column;
}
.chinese-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.chinese {
  font-size: 2rem;
  color: var(--text-primary);
  line-height: 1.2;
  word-break: break-word;
}
.dialogue-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
.pinyin {
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: 0.5rem;
}
.translation {
  color: var(--text-primary);
  border-left: 3px solid var(--accent-color);
  padding-left: 0.75rem;
  margin-top: 0.5rem;
}

/* ========== True/False страница ========== */
.truefalse-page {
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 24px;
  margin-bottom: 2rem;
}
.statement-item {
  background: var(--surface);
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1rem;
}
.statement-text {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}
.options {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
.option-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid var(--border);
  border-radius: 30px;
  background: var(--surface);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.option-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 10%, var(--surface));
}
.option-btn.selected {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.option-btn.correct {
  background: #4caf50 !important;
  color: white !important;
  border-color: #4caf50 !important;
}
.option-btn.wrong {
  background: #f44336 !important;
  color: white !important;
  border-color: #f44336 !important;
}
.option-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ========== Модальные окна ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(5px);
}
.modal {
  background: var(--bg-primary);
  border-radius: 28px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
}
.results-modal {
  max-width: 400px;
}
.results-modal h2 {
  margin-bottom: 1rem;
  color: var(--accent-color);
}
.stats {
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}
.stats p {
  margin: 0.5rem 0;
}
.result-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
.result-actions .btn {
  width: 100%;
}
.death-modal h2 {
  margin-bottom: 1rem;
  color: var(--accent-color);
}
.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}
.btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}
.btn-outline {
  background: transparent;
  border: 2px solid var(--accent-color);
  color: var(--accent-color);
}
.btn-outline:hover {
  background: color-mix(in srgb, var(--accent-color) 10%, transparent);
}
.btn-primary {
  background: var(--accent-color);
  color: white;
}
.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px var(--accent-color);
}
.stroke-modal .modal-body {
  display: flex;
  justify-content: center;
  padding: 1rem;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.modal-header h3 {
  margin: 0;
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent-color);
}

/* ========== Результаты ========== */
.score-circle {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 1rem;
}
.score-percent {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--text-primary);
}
.grade {
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: 0.5rem;
}

/* ========== Центрирование контента ========== */
.centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.completed-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;
}
.comparison {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: 12px;
}
.new-record {
  color: #ffd700;
  font-weight: bold;
}

.statement-pinyin {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  font-style: italic;
}
</style>