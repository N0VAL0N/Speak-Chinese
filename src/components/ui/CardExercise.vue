<template>
  <div class="card-exercise">
    <div class="question-area">
      <div class="chinese">{{ exercise.question }}</div>
      <div v-if="showPinyin" class="pinyin">{{ exercise.pinyin }}</div>
    </div>

    <div class="options-grid" :class="{ 'two-columns': exercise.options.length === 4 }">
      <button
        v-for="(option, idx) in exercise.options"
        :key="idx"
        @click="selectOption(idx)"
        :disabled="isAnswered"
        :class="[
          'option-btn',
          { 
            correct: isAnswered && idx === exercise.correctIndex,
            wrong: isAnswered && selectedIndex === idx && idx !== exercise.correctIndex,
            selected: selectedIndex === idx
          }
        ]"
      >
        {{ option }}
      </button>
    </div>

    <transition name="fade">
      <div v-if="isAnswered" class="feedback" :class="{ correct: isCorrect, wrong: !isCorrect }">
        <div class="feedback-icon">
          <CheckCircle v-if="isCorrect" :size="24" />
          <XCircle v-else :size="24" />
        </div>
        <div class="feedback-message">
          <span v-if="isCorrect">Верно!</span>
          <span v-else>Правильный ответ: {{ exercise.options[exercise.correctIndex] }}</span>
        </div>
        <button v-if="!isCorrect && !showExplanation" class="explain-btn" @click="showExplanation = true">
          Почему?
        </button>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showExplanation" class="explanation">
        <p>{{ exercise.explanation }}</p>
        <button class="continue-btn" @click="$emit('next')">Продолжить</button>
      </div>
    </transition>

    <button v-if="isAnswered && !showExplanation" class="next-btn" @click="$emit('next')">
      Далее
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CheckCircle, XCircle } from 'lucide-vue-next'

const props = defineProps<{
  exercise: {
    question: string
    pinyin?: string
    options: string[]
    correctIndex: number
    explanation?: string
  }
  showPinyin?: boolean
}>()

const emit = defineEmits(['next'])

const selectedIndex = ref<number | null>(null)
const isAnswered = ref(false)
const showExplanation = ref(false)

const isCorrect = computed(() => selectedIndex.value === props.exercise.correctIndex)

function selectOption(idx: number) {
  if (isAnswered.value) return
  selectedIndex.value = idx
  isAnswered.value = true
}
</script>

<style scoped>
/* стили без изменений */
</style>


<style scoped>
.card-exercise {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.dark .card-exercise {
  background: #1e1e1e;
  color: #f5f5f5;
}

.question-area {
  text-align: center;
  margin-bottom: 2rem;
}

.chinese {
  font-size: 4rem;
  font-weight: bold;
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.pinyin {
  font-size: 1.2rem;
  color: #666;
}

.dark .pinyin {
  color: #aaa;
}

.options-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

.two-columns {
  grid-template-columns: 1fr 1fr;
}

.option-btn {
  padding: 1rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 16px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}

.dark .option-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #ccc;
}

.option-btn:hover:not(:disabled) {
  border-color: var(--level-accent);
  background: color-mix(in srgb, var(--level-accent) 5%, white);
}

.option-btn.selected {
  border-color: var(--level-accent);
  background: color-mix(in srgb, var(--level-accent) 10%, white);
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
  opacity: 0.8;
  cursor: default;
}

.feedback {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 16px;
  margin-bottom: 1rem;
}

.feedback.correct {
  background: #e8f5e9;
  border: 2px solid #4caf50;
}

.feedback.wrong {
  background: #ffebee;
  border: 2px solid #f44336;
}

.feedback-icon {
  flex-shrink: 0;
}

.feedback-message {
  flex: 1;
  font-weight: 500;
}

.explain-btn {
  background: none;
  border: none;
  color: var(--level-accent);
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
}

.explanation {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 16px;
  margin-bottom: 1rem;
}

.dark .explanation {
  background: #2a2a2a;
}

.next-btn, .continue-btn {
  width: 100%;
  padding: 1rem;
  background: var(--level-accent);
  color: white;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.next-btn:hover, .continue-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px var(--level-accent);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>