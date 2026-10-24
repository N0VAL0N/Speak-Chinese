<template>
  <div class="exercise-card" :class="{ active: isActive, disabled: disabled }">
    <!-- Инструкция в зависимости от типа -->
    <p v-if="exercise.type === ExerciseType.MatchTranslation" class="instruction">Соедините иероглифы с переводом</p>
    <p v-else-if="exercise.type === ExerciseType.Listening" class="instruction">Прослушайте слово и выберите перевод</p>
    <p v-else-if="exercise.type === ExerciseType.FillBlank" class="instruction">Выберите правильный вариант</p>
    <p v-else-if="exercise.type === ExerciseType.MultipleChoice" class="instruction">Выберите правильный вариант</p>
    <p v-else-if="exercise.type === ExerciseType.MatchPinyin" class="instruction">Выберите пиньинь для каждого иероглифа</p>
    <p v-else-if="exercise.type === ExerciseType.Translate" class="instruction">Введите перевод</p>
    <p v-else-if="exercise.type === ExerciseType.SentenceOrder" class="instruction">Расположите слова в правильном порядке</p>

    <!-- fill-blank -->
    <div v-if="exercise.type === ExerciseType.FillBlank">
      <p class="sentence">{{ exercise.sentence }}</p>
      <p v-if="exercise.pinyin" class="sentence-pinyin">{{ exercise.pinyin }}</p>
      <div class="options">
        <button
          v-for="(opt, optIndex) in exercise.options"
          :key="optIndex"
          @click="selectOption(optIndex)"
          :disabled="disabled || (answered && isCorrect)"
          :class="[
            'option-btn',
            {
              correct: answered && isCorrect && optIndex === exercise.correctAnswer,
              wrong: !answered && selectedIdx === optIndex && optIndex !== exercise.correctAnswer,
              selected: !answered && selectedIdx === optIndex,
              'pulse-correct': showCorrectPulse && optIndex === exercise.correctAnswer
            }
          ]"
        >
          {{ opt || 'нет перевода' }}
        </button>
      </div>
    </div>

    <!-- multiple-choice -->
    <div v-else-if="exercise.type === ExerciseType.MultipleChoice">
      <p class="question">{{ exercise.question }}</p>
      <p v-if="exercise.pinyin" class="sentence-pinyin">{{ exercise.pinyin }}</p>
      <div class="options">
        <button
          v-for="(opt, optIndex) in exercise.options"
          :key="optIndex"
          @click="selectOption(optIndex)"
          :disabled="disabled || (answered && isCorrect)"
          :class="[
            'option-btn',
            {
              correct: answered && isCorrect && optIndex === exercise.correctAnswer,
              wrong: !answered && selectedIdx === optIndex && optIndex !== exercise.correctAnswer,
              selected: !answered && selectedIdx === optIndex,
              'pulse-correct': showCorrectPulse && optIndex === exercise.correctAnswer
            }
          ]"
        >
          {{ opt || 'нет перевода' }}
        </button>
      </div>
    </div>

    <!-- listening -->
    <div v-else-if="exercise.type === ExerciseType.Listening" class="listening-mode">
      <button class="btn btn-primary audio-btn" @click="playAudio(exercise.word.simplified)" :disabled="disabled">
        <Volume2 :size="20" /> Прослушать
      </button>
      <div class="options-grid two-columns" v-if="exercise.options?.length">
        <button
          v-for="(option, idx) in exercise.options"
          :key="idx"
          @click="selectOptionByValue(option, exercise.correctAnswer)"
          :disabled="disabled || (answered && isCorrect)"
          :class="[
            'option-btn',
            {
              selected: selectedOption === option,
              correct: answered && isCorrect && option === exercise.correctAnswer,
              wrong: !answered && selectedOption === option && option !== exercise.correctAnswer,
              'pulse-correct': showCorrectPulse && option === exercise.correctAnswer
            }
          ]"
        >
          {{ option || 'нет перевода' }}
        </button>
      </div>
    </div>

    <!-- match-pinyin -->
    <div v-else-if="exercise.type === ExerciseType.MatchPinyin" class="match-pinyin">
      <p class="instruction">Выберите пиньинь для каждого иероглифа:</p>
      <div v-for="(pair, pairIndex) in exercise.pairs" :key="pairIndex" class="match-row">
        <span class="chinese-char">{{ pair.chinese }}</span>
        <div class="pinyin-options">
          <button
            v-for="p in pinyinOptions"
            :key="p"
            @click="handlePinyinClick(pairIndex, p)"
            :disabled="disabled || rowStatus[pairIndex] === 'correct'"
            :class="[
              'pinyin-btn',
              { 
                active: userMatches[pairIndex] === p,
                correct: rowStatus[pairIndex] === 'correct' && p === pair.pinyin,
                wrong: !answered && userMatches[pairIndex] === p && p !== pair.pinyin
              }
            ]"
          >
            {{ p }}
          </button>
        </div>
      </div>
    </div>

    <!-- match-translation -->
    <div v-else-if="exercise.type === ExerciseType.MatchTranslation" class="match-translation">
      <p class="instruction">Соедините иероглифы с переводом:</p>
      <div class="match-grid">
        <div class="chinese-col">
          <div
            v-for="(pair, idx) in exercise.pairs"
            :key="idx"
            class="match-item chinese-item"
            :class="{ selected: selectedChineseIndex === idx, matched: matchedIndices.includes(idx) }"
            @click="!disabled && handleChineseClick(idx)"
          >
            {{ pair.chinese }}
          </div>
        </div>
        <div class="translation-col">
          <div
            v-for="(pair, idx) in exercise.pairs"
            :key="idx"
            class="match-item translation-item"
            :class="{ selected: selectedTranslationIndex === idx, matched: matchedIndices.includes(idx) }"
            @click="!disabled && handleTranslationClick(idx)"
          >
            {{ pair.translation || 'нет перевода' }}
          </div>
        </div>
      </div>
    </div>

    <!-- sentence-order с drag-and-drop -->
    <div v-else-if="exercise.type === ExerciseType.SentenceOrder">
      <div class="words-pool" 
           @dragover.prevent
           @drop="handleDropOnPool">
        <div
          v-for="(word, idx) in shuffledWords"
          :key="idx"
          class="word-btn"
          :draggable="!disabled && !(answered && isCorrect)"
          @dragstart="handleDragStart(idx, $event)"
          @dragend="handleDragEnd"
          @click="addWord(idx)"
        >
          {{ word }}
        </div>
      </div>

      <div class="sentence-builder"
           @dragover.prevent
           @drop="handleDropOnBuilder">
        <span 
          v-for="(idx, i) in userOrder" 
          :key="i" 
          class="selected-word"
          :draggable="!disabled && !(answered && isCorrect)"
          @dragstart="handleBuilderDragStart(i, $event)"
          @dragend="handleDragEnd"
          @dragover.prevent
          @drop="handleDropOnBuilderItem(i, $event)"
        >
          {{ shuffledWords[idx] }}
          <button v-if="!disabled && !(answered && isCorrect)" @click="removeWord(i)" class="remove-word">✖</button>
        </span>
      </div>

      <div class="order-actions">
        <button class="btn btn-outline" @click="resetOrder" :disabled="disabled || (answered && isCorrect)">Сбросить</button>
        <button class="btn btn-primary" @click="checkOrder" :disabled="disabled || (answered && isCorrect)">Проверить</button>
      </div>

      <div v-if="showOrderError" class="feedback wrong">
        <span>❌ Неправильно, попробуйте снова</span>
      </div>
    </div>

    <!-- translate -->
    <div v-else-if="exercise.type === ExerciseType.Translate">
      <p class="question">{{ exercise.question }}</p>
      <input v-model="userAnswer" class="input" placeholder="Введите перевод" :disabled="disabled || (answered && isCorrect)" />
      <button class="btn btn-primary" @click="checkTranslate" :disabled="disabled || (answered && isCorrect)">Проверить</button>
      <div v-if="showTranslateError" class="feedback wrong">
        <span>❌ Неправильно, попробуйте снова</span>
      </div>
    </div>

    <!-- Неизвестный тип -->
    <div v-else class="error-placeholder">
      <p>⚠️ Неизвестный тип упражнения: {{ (exercise as any).type }}</p>
    </div>

    <!-- Единый блок feedback для правильного ответа -->
    <div v-if="answered && isCorrect" class="feedback correct">
      <span>✅ Верно!</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Exercise } from '@/types'
import { ExerciseType } from '@/constants'
import { useAppStore } from '@/stores/appStore'
import { useReviewStore } from '@/stores/reviewStore'
import { Volume2 } from 'lucide-vue-next'
import { speak } from '@/services/tts'
import { AUTO_ADVANCE_DELAY } from '@/constants'  // new

const props = defineProps<{
  exercise: Exercise
  isActive: boolean
  reviewId?: string
  initialState?: any
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'answered', isCorrect: boolean, quality?: number): void
  (e: 'next'): void
  (e: 'mistake'): void
  (e: 'update-state', state: any): void
}>()

console.log('[ExerciseCard] mounted with type:', props.exercise.type, 'initialState:', props.initialState)

const appStore = useAppStore()
const reviewStore = useReviewStore()

const answered = ref(props.initialState?.answered || false)
const isCorrect = ref(props.initialState?.isCorrect || false)
const selectedIdx = ref<number | null>(props.initialState?.selectedIdx || null)
const selectedOption = ref<string | null>(props.initialState?.selectedOption || null)
const userAnswer = ref(props.initialState?.userAnswer || '')
const userMatches = ref<string[]>(props.initialState?.userMatches || [])
const showOrderError = ref(false)
const showTranslateError = ref(false)

// Для анимации правильного ответа
const showCorrectPulse = ref(false)

// Для drag-and-drop
const draggedItem = ref<{ type: 'pool' | 'builder'; index: number } | null>(null)

const shuffledWords = ref<string[]>(props.initialState?.shuffledWords || [])
const originalIndices = ref<number[]>(props.initialState?.originalIndices || [])
const userOrder = ref<number[]>(props.initialState?.userOrder || [])

// Для match-pinyin
const pinyinOptions = computed(() => {
  if (props.exercise.type !== ExerciseType.MatchPinyin) return []
  return props.exercise.pairs?.map(p => p.pinyin) || []
})
const rowStatus = ref<string[]>(props.initialState?.rowStatus || [])

// Для match-translation
const selectedChineseIndex = ref<number | null>(props.initialState?.selectedChineseIndex || null)
const selectedTranslationIndex = ref<number | null>(props.initialState?.selectedTranslationIndex || null)
const matchedIndices = ref<number[]>(props.initialState?.matchedIndices || [])
const allMatched = computed(() => matchedIndices.value.length === (props.exercise.type === ExerciseType.MatchTranslation ? props.exercise.pairs?.length || 0 : 0) * 2)

// new: таймер для авто-перехода
let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (!props.initialState) {
    resetForNewExercise()
  }
})

onUnmounted(() => {
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
})

watch(() => props.exercise, () => {
  console.log('[ExerciseCard] exercise changed, resetting')
  if (props.initialState) {
    answered.value = props.initialState.answered || false
    isCorrect.value = props.initialState.isCorrect || false
    selectedIdx.value = props.initialState.selectedIdx ?? null
    selectedOption.value = props.initialState.selectedOption || null
    userAnswer.value = props.initialState.userAnswer || ''
    userMatches.value = props.initialState.userMatches || []
    userOrder.value = props.initialState.userOrder || []
    shuffledWords.value = props.initialState.shuffledWords || []
    originalIndices.value = props.initialState.originalIndices || []
    rowStatus.value = props.initialState.rowStatus || []
    selectedChineseIndex.value = props.initialState.selectedChineseIndex ?? null
    selectedTranslationIndex.value = props.initialState.selectedTranslationIndex ?? null
    matchedIndices.value = props.initialState.matchedIndices || []
  } else {
    resetForNewExercise()
  }
})

function resetForNewExercise() {
  answered.value = false
  isCorrect.value = false
  selectedIdx.value = null
  selectedOption.value = null
  userAnswer.value = ''
  userMatches.value = []
  userOrder.value = []
  showOrderError.value = false
  showTranslateError.value = false
  rowStatus.value = []
  selectedChineseIndex.value = null
  selectedTranslationIndex.value = null
  matchedIndices.value = []

  if (props.exercise.type === ExerciseType.SentenceOrder && (props.exercise as any).words) {
    const words = (props.exercise as any).words
    const indices = Array.from({ length: words.length }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    originalIndices.value = indices
    shuffledWords.value = indices.map(i => words[i])
  }
  if (props.exercise.type === ExerciseType.MatchPinyin && (props.exercise as any).pairs) {
    userMatches.value = new Array((props.exercise as any).pairs.length).fill('')
    rowStatus.value = new Array((props.exercise as any).pairs.length).fill('')
  }
  emitState()
}

function emitState() {
  const state: any = {
    answered: answered.value,
    isCorrect: isCorrect.value,
    selectedIdx: selectedIdx.value,
    selectedOption: selectedOption.value,
    userAnswer: userAnswer.value,
    userMatches: userMatches.value,
    userOrder: userOrder.value,
    shuffledWords: shuffledWords.value,
    originalIndices: originalIndices.value,
    rowStatus: rowStatus.value,
    selectedChineseIndex: selectedChineseIndex.value,
    selectedTranslationIndex: selectedTranslationIndex.value,
    matchedIndices: matchedIndices.value,
  }
  emit('update-state', state)
}

// ========== Type guards ==========
function isFillBlankOrMultipleChoice(ex: Exercise): ex is Extract<Exercise, { type: ExerciseType.FillBlank | ExerciseType.MultipleChoice }> {
  return ex.type === ExerciseType.FillBlank || ex.type === ExerciseType.MultipleChoice;
}

function isListening(ex: Exercise): ex is Extract<Exercise, { type: ExerciseType.Listening }> {
  return ex.type === ExerciseType.Listening;
}

function isMatchPinyin(ex: Exercise): ex is Extract<Exercise, { type: ExerciseType.MatchPinyin }> {
  return ex.type === ExerciseType.MatchPinyin;
}

function isMatchTranslation(ex: Exercise): ex is Extract<Exercise, { type: ExerciseType.MatchTranslation }> {
  return ex.type === ExerciseType.MatchTranslation;
}

function isSentenceOrder(ex: Exercise): ex is Extract<Exercise, { type: ExerciseType.SentenceOrder }> {
  return ex.type === ExerciseType.SentenceOrder;
}

function isTranslate(ex: Exercise): ex is Extract<Exercise, { type: ExerciseType.Translate }> {
  return ex.type === ExerciseType.Translate;
}

// ========== Обработчики ==========
function selectOption(optIndex: number): void {
  if (props.disabled || !isFillBlankOrMultipleChoice(props.exercise)) return;
  selectedIdx.value = optIndex;
  const correct = optIndex === props.exercise.correctAnswer;
  if (correct) {
    showCorrectPulse.value = true;
    setTimeout(() => {
      showCorrectPulse.value = false;
    }, 500);
    answered.value = true;
    isCorrect.value = true;
    emit('answered', true, 5);
    if (props.reviewId) {
      reviewStore.updateStats(props.reviewId, true, 5);
    }
    // new: авто-переход
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = setTimeout(() => {
      emit('next');
      autoAdvanceTimer = null;
    }, AUTO_ADVANCE_DELAY);
  } else {
    emit('mistake');
    emit('answered', false, 0);
    if (props.reviewId) {
      reviewStore.updateStats(props.reviewId, false, 0);
    }
    appStore.showToast('Неверно, попробуйте ещё раз', 'error');
    selectedIdx.value = null;
  }
  emitState();
}

function selectOptionByValue(answer: string, correct: string): void {
  if (props.disabled || !isListening(props.exercise)) return;
  selectedOption.value = answer;
  if (answer === correct) {
    showCorrectPulse.value = true;
    setTimeout(() => {
      showCorrectPulse.value = false;
    }, 500);
    answered.value = true;
    isCorrect.value = true;
    emit('answered', true, 5);
    if (props.reviewId) {
      reviewStore.updateStats(props.reviewId, true, 5);
    }
    // new: авто-переход
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = setTimeout(() => {
      emit('next');
      autoAdvanceTimer = null;
    }, AUTO_ADVANCE_DELAY);
  } else {
    emit('mistake');
    emit('answered', false, 0);
    if (props.reviewId) {
      reviewStore.updateStats(props.reviewId, false, 0);
    }
    appStore.showToast('Неверно, попробуйте ещё раз', 'error');
    selectedOption.value = null;
  }
  emitState();
}

// Drag-and-drop для sentence-order
function handleDragStart(index: number, event: DragEvent) {
  draggedItem.value = { type: 'pool', index };
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
  }
}

function handleBuilderDragStart(index: number, event: DragEvent) {
  draggedItem.value = { type: 'builder', index };
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
  }
}

function handleDragEnd() {
  draggedItem.value = null;
}

function handleDropOnPool(event: DragEvent) {
  event.preventDefault();
  if (!draggedItem.value || draggedItem.value.type !== 'builder') return;
  const builderIndex = draggedItem.value.index;
  if (builderIndex >= 0 && builderIndex < userOrder.value.length) {
    userOrder.value.splice(builderIndex, 1);
  }
  draggedItem.value = null;
  emitState();
}

function handleDropOnBuilder(event: DragEvent) {
  event.preventDefault();
  if (!draggedItem.value) return;
  if (draggedItem.value.type === 'pool') {
    const wordIndex = draggedItem.value.index;
    if (!userOrder.value.includes(wordIndex)) {
      userOrder.value.push(wordIndex);
    }
  } else if (draggedItem.value.type === 'builder') {
    const fromIndex = draggedItem.value.index;
    if (fromIndex >= 0 && fromIndex < userOrder.value.length) {
      const [moved] = userOrder.value.splice(fromIndex, 1);
      userOrder.value.push(moved);
    }
  }
  draggedItem.value = null;
  emitState();
}

function handleDropOnBuilderItem(targetIndex: number, event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  if (!draggedItem.value) return;
  if (draggedItem.value.type === 'pool') {
    const wordIndex = draggedItem.value.index;
    if (!userOrder.value.includes(wordIndex)) {
      userOrder.value.splice(targetIndex, 0, wordIndex);
    }
  } else if (draggedItem.value.type === 'builder') {
    const fromIndex = draggedItem.value.index;
    if (fromIndex >= 0 && fromIndex < userOrder.value.length && fromIndex !== targetIndex) {
      const [moved] = userOrder.value.splice(fromIndex, 1);
      const adjustedTarget = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
      userOrder.value.splice(adjustedTarget, 0, moved);
    }
  }
  draggedItem.value = null;
  emitState();
}

function addWord(index: number) {
  if (props.disabled || (answered.value && isCorrect.value) || !isSentenceOrder(props.exercise)) return;
  if (userOrder.value.includes(index)) return;
  userOrder.value.push(index);
  emitState();
}

function removeWord(orderIndex: number) {
  if (props.disabled || (answered.value && isCorrect.value)) return;
  userOrder.value.splice(orderIndex, 1);
  emitState();
}

function resetOrder() {
  if (props.disabled || (answered.value && isCorrect.value)) return;
  userOrder.value = [];
  emitState();
}

function checkOrder() {
  if (props.disabled || (answered.value && isCorrect.value) || !isSentenceOrder(props.exercise)) return;
  const correct = props.exercise.correctOrder;
  const userOriginalOrder = userOrder.value.map(idx => originalIndices.value[idx]);
  const correctOrder = userOriginalOrder.length === correct.length && userOriginalOrder.every((val, idx) => val === correct[idx]);
  if (correctOrder) {
    answered.value = true;
    isCorrect.value = true;
    emit('answered', true, 5);
    if (props.reviewId) {
      reviewStore.updateStats(props.reviewId, true, 5);
    }
    showOrderError.value = false;
    // new: авто-переход
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = setTimeout(() => {
      emit('next');
      autoAdvanceTimer = null;
    }, AUTO_ADVANCE_DELAY);
  } else {
    emit('mistake');
    emit('answered', false, 0);
    if (props.reviewId) {
      reviewStore.updateStats(props.reviewId, false, 0);
    }
    appStore.showToast('Неверный порядок, попробуйте снова', 'error');
    userOrder.value = [];
    showOrderError.value = true;
    setTimeout(() => {
      showOrderError.value = false;
    }, 2000);
  }
  emitState();
}

// Нормализация для перевода
function normalizeTranslation(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .replace(/[。？！.]$/, '')
    .trim();
}

function checkTranslate() {
  if (props.disabled || (answered.value && isCorrect.value) || !isTranslate(props.exercise)) return;
  const user = normalizeTranslation(userAnswer.value);
  const correct = normalizeTranslation(props.exercise.correctAnswer);
  if (user === correct) {
    answered.value = true;
    isCorrect.value = true;
    emit('answered', true, 5);
    if (props.reviewId) {
      reviewStore.updateStats(props.reviewId, true, 5);
    }
    showTranslateError.value = false;
    // new: авто-переход
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = setTimeout(() => {
      emit('next');
      autoAdvanceTimer = null;
    }, AUTO_ADVANCE_DELAY);
  } else {
    emit('mistake');
    emit('answered', false, 0);
    if (props.reviewId) {
      reviewStore.updateStats(props.reviewId, false, 0);
    }
    appStore.showToast('Неверный перевод, попробуйте снова', 'error');
    showTranslateError.value = true;
    setTimeout(() => {
      showTranslateError.value = false;
    }, 2000);
  }
  emitState();
}

function handlePinyinClick(pairIndex: number, pinyin: string | undefined) {
  if (props.disabled || !isMatchPinyin(props.exercise) || rowStatus.value[pairIndex] === 'correct') return;
  const correct = props.exercise.pairs?.[pairIndex].pinyin;
  if (pinyin && pinyin === correct) {
    userMatches.value[pairIndex] = pinyin;
    rowStatus.value[pairIndex] = 'correct';
    if (rowStatus.value.every(status => status === 'correct')) {
      answered.value = true;
      isCorrect.value = true;
      emit('answered', true, 5);
      if (props.reviewId) {
        reviewStore.updateStats(props.reviewId, true, 5);
      }
      emitState();
      // new: авто-переход
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = setTimeout(() => {
        emit('next');
        autoAdvanceTimer = null;
      }, AUTO_ADVANCE_DELAY);
    }
  } else {
    userMatches.value[pairIndex] = pinyin || '';
    emit('mistake');
    emit('answered', false, 0);
    if (props.reviewId) {
      reviewStore.updateStats(props.reviewId, false, 0);
    }
    appStore.showToast(`Неверно, правильный: ${correct}`, 'error');
  }
  emitState();
}

async function playAudio(text: string) {
  try {
    await speak(text, 'zh-CN');
  } catch (error) {
    appStore.showToast('Ошибка воспроизведения аудио', 'error');
    console.error('[ExerciseCard] audio error:', error);
  }
}

function handleChineseClick(index: number) {
  if (props.disabled || !isMatchTranslation(props.exercise) || matchedIndices.value.includes(index)) return;
  selectedChineseIndex.value = index;
  if (selectedTranslationIndex.value !== null) {
    checkMatch(index, selectedTranslationIndex.value);
  }
  emitState();
}

function handleTranslationClick(index: number) {
  if (props.disabled || !isMatchTranslation(props.exercise) || matchedIndices.value.includes(index)) return;
  selectedTranslationIndex.value = index;
  if (selectedChineseIndex.value !== null) {
    checkMatch(selectedChineseIndex.value, index);
  }
  emitState();
}

function checkMatch(chineseIdx: number, translationIdx: number) {
  if (props.disabled || !isMatchTranslation(props.exercise)) return;
  const pair = props.exercise.pairs[chineseIdx];
  const translationPair = props.exercise.pairs[translationIdx];
  if (pair.translation && pair.translation === translationPair.translation) {
    matchedIndices.value.push(chineseIdx, translationIdx);
    if (allMatched.value) {
      answered.value = true;
      isCorrect.value = true;
      emit('answered', true, 5);
      if (props.reviewId) {
        reviewStore.updateStats(props.reviewId, true, 5);
      }
      emitState();
      // new: авто-переход
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = setTimeout(() => {
        emit('next');
        autoAdvanceTimer = null;
      }, AUTO_ADVANCE_DELAY);
    }
  } else {
    emit('mistake');
    emit('answered', false, 0);
    if (props.reviewId) {
      reviewStore.updateStats(props.reviewId, false, 0);
    }
    appStore.showToast('Неверно, попробуйте снова', 'error');
  }
  selectedChineseIndex.value = null;
  selectedTranslationIndex.value = null;
  emitState();
}
</script>

<style scoped>
.exercise-card.disabled {
  opacity: 0.7;
  pointer-events: none;
}

.sentence-pinyin {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  text-align: center;
}
.error-placeholder {
  text-align: center;
  padding: 2rem;
  color: red;
}

.exercise-card {
  background: var(--bg-primary);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: var(--card-shadow);
  max-width: 500px;
  margin: 0 auto;
  opacity: 0.5;
  transform: scale(0.95);
  transition: all 0.3s;
  font-size: 1.2rem;
}
.exercise-card.active {
  opacity: 1;
  transform: scale(1);
}
.sentence,
.question,
.instruction {
  font-size: 1.6rem;
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-primary);
  line-height: 1.4;
}
.options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.option-btn {
  padding: 1.2rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  font-size: 1.2rem;
  width: 100%;              
  white-space: normal;       
  word-break: break-word;   
}
.option-btn.selected {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 10%, var(--surface));
}
.option-btn.correct {
  border-color: #4caf50;
  background: #e8f5e9;
  color: #2e7d32;
}
.option-btn.wrong {
  border-color: #f44336;
  background: #ffebee;
  color: #c62828;
}
.option-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

/* Анимация правильного ответа */
.pulse-correct {
  animation: correctPulse 0.5s ease;
}
@keyframes correctPulse {
  0% { transform: scale(1); background-color: transparent; }
  50% { transform: scale(1.05); background-color: color-mix(in srgb, #4caf50 30%, transparent); }
  100% { transform: scale(1); background-color: transparent; }
}

/* Стили для sentence-order с drag-and-drop */
.words-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  justify-content: center;
  margin-bottom: 2rem;
  min-height: 60px;
  background: var(--surface);
  border: 2px dashed var(--border);
  border-radius: 40px;
  padding: 1rem;
}
.word-btn {
  padding: 0.8rem 1.5rem;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  font-size: 1.2rem;
}
.word-btn[draggable="true"] {
  cursor: grab;
}
.word-btn[draggable="true"]:active {
  cursor: grabbing;
  opacity: 0.7;
}
.word-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 5%, var(--surface));
}
.word-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.sentence-builder {
  min-height: 80px;
  background: var(--surface);
  border: 2px dashed var(--border);
  border-radius: 40px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
  transition: background-color 0.2s;
}
.sentence-builder.drag-over {
  background-color: color-mix(in srgb, var(--accent-color) 10%, var(--surface));
  border-color: var(--accent-color);
}
.selected-word {
  background: var(--accent-color);
  color: white;
  padding: 0.5rem 1.2rem;
  border-radius: 40px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
}
.selected-word[draggable="true"] {
  cursor: grab;
}
.selected-word[draggable="true"]:active {
  cursor: grabbing;
  opacity: 0.7;
}
.remove-word {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0 0.3rem;
}
.order-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
}
.match-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.chinese-char {
  font-size: 2rem;
  min-width: 80px;
  color: var(--text-primary);
}
.pinyin-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  width: 100%;
}
.pinyin-btn {
  width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0.5rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  font-size: 1.2rem;
}
.pinyin-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.pinyin-btn.correct {
  background: #e8f5e9;
  border-color: #4caf50;
  color: #2e7d32;
}
.pinyin-btn.wrong {
  background: #ffebee;
  border-color: #f44336;
  color: #c62828;
}
.pinyin-btn.disabled {
  opacity: 0.5;
  cursor: default;
}
.match-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin: 2rem 0;
}
.match-item {
  padding: 1rem;
  margin: 0.5rem 0;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  word-wrap: break-word;
}
.match-item.selected {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 10%, var(--surface));
  transform: scale(1.02);
}
.match-item.matched {
  opacity: 0.5;
  background: #4caf50;
  color: white;
  border-color: #4caf50;
  cursor: default;
}
.options-grid {
  display: grid;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
}
.two-columns {
  grid-template-columns: 1fr 1fr;
}
.input {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 1rem 1.5rem;
  border: 2px solid var(--border);
  border-radius: 40px;
  margin-bottom: 1.5rem;
  background: var(--surface);
  color: var(--text-primary);
  font-size: 1.2rem;
}
.feedback {
  margin-top: 2.5rem;
  text-align: center;
  color: var(--text-primary);
  font-size: 1.4rem;
}
.feedback.correct {
  color: #4caf50;
}
.feedback.wrong {
  color: #f44336;
}
.next-btn {
  margin-top: 1.5rem;
}
.btn-primary {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px var(--accent-color);
  font-size: 1.2rem;
}
.btn-primary:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 6px 16px var(--accent-color);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-outline {
  background: transparent;
  border: 2px solid var(--accent-color);
  color: var(--accent-color);
  padding: 1rem 2rem;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.2rem;
}
.btn-outline:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent-color) 10%, transparent);
}
.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.listening-mode .audio-btn {
  margin-bottom: 1.2rem;
}
.listening-mode .options-grid.two-columns {
  gap: 0.5rem;
}
.listening-mode .option-btn {
  padding: 0.8rem;
  font-size: 1rem;
  white-space: normal;
  word-break: break-word;
}
</style>