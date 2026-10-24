<template>
  <div class="character-drawing">
    <div class="drawing-header" v-if="word">
      <div class="target-char">{{ word.simplified }}</div>
      <div class="target-pinyin">{{ word.pinyin }}</div>
      <div class="target-translation">{{ word.translations.ru }}</div>
    </div>
    <div class="drawing-container">
      <div class="canvases-column">
        <div
          v-for="(_, index) in characters"
          :key="index"
          :ref="(el) => setCanvasRef(el as HTMLElement | null, index)"
          class="drawing-canvas"
          :class="{ active: activeIndex === index, inactive: activeIndex !== index }"
          :style="{ width: size + 'px', height: size + 'px' }"
        ></div>
      </div>
      <div v-if="result" class="feedback" :class="{ correct: result.passed }">
        {{ result.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import HanziWriter from 'hanzi-writer'
import type { HSKWord } from '@/types'

const props = defineProps<{
  word: HSKWord
  size?: number
  usedHint?: boolean // использовал ли пользователь подсказку (показ порядка черт)
}>()
const emit = defineEmits<{
  (e: 'complete', result: { passed: boolean; mistakes: number; quality: number }): void
}>()

const size = props.size || 280
const characters = props.word.simplified.split('').filter(c => c.trim())
const totalChars = characters.length

const canvasRefs = ref<(HTMLElement | null)[]>([])
const writers = ref<any[]>([])
const activeIndex = ref(0)
let totalMistakes = 0
let usedHint = props.usedHint || false
const result = ref<{ passed: boolean; message: string } | null>(null)

function setCanvasRef(el: HTMLElement | null, index: number) {
  if (el) canvasRefs.value[index] = el
  else canvasRefs.value[index] = null
}

async function initWriters() {
  destroyAllWriters()
  writers.value = []

  for (let i = 0; i < characters.length; i++) {
    const container = canvasRefs.value[i]
    if (!container) continue
    try {
      container.innerHTML = ''
      const writer = HanziWriter.create(container, characters[i], {
        width: size,
        height: size,
        padding: 5,
        strokeColor: '#333',
        showOutline: true,
        delayBetweenStrokes: 500,
      })
      writers.value[i] = writer
    } catch (e) {
      console.error(`Ошибка создания writer для "${characters[i]}":`, e)
    }
  }
}

function startCurrent() {
  if (activeIndex.value >= totalChars) {
    // Вычисляем качество
    let quality = 5
    if (totalMistakes === 0 && !usedHint) quality = 5
    else if (totalMistakes === 1) quality = 4
    else if (totalMistakes <= 3) quality = 3
    else if (totalMistakes <= 5) quality = 2
    else quality = 1

    const passed = quality >= 3
    result.value = {
      passed,
      message: passed ? '✅ Правильно!' : `❌ Ошибок: ${totalMistakes}`,
    }
    emit('complete', { passed, mistakes: totalMistakes, quality })
    return
  }

  const writer = writers.value[activeIndex.value]
  if (!writer) {
    activeIndex.value++
    startCurrent()
    return
  }

  writer.quiz({
    onMistake: () => totalMistakes++,
    onComplete: () => {
      activeIndex.value++
      setTimeout(() => startCurrent(), 300)
    },
  })
}

function destroyAllWriters() {
  writers.value.forEach(w => w?.destroy?.())
  writers.value = []
}

function reset() {
  destroyAllWriters()
  activeIndex.value = 0
  totalMistakes = 0
  usedHint = props.usedHint || false
  result.value = null
  nextTick(() => {
    initWriters().then(startCurrent)
  })
}

onMounted(reset)
onUnmounted(destroyAllWriters)
watch(() => props.word, reset)
watch(() => props.usedHint, (val) => { usedHint = val || false })
</script>

<style scoped>
.character-drawing {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.drawing-header {
  text-align: center;
  margin-bottom: 1.5rem;
}
.target-char {
  font-size: 4rem;
  font-weight: bold;
  color: var(--text-primary);
  line-height: 1.2;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.target-pinyin {
  font-size: 1.5rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}
.target-translation {
  font-size: 1.5rem;
  color: var(--accent-color);
  margin-top: 0.5rem;
}
.drawing-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.canvases-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
  width: 100%;
}
.drawing-canvas {
  background: #f5f5f5;
  border-radius: 16px;
  transition: opacity 0.3s;
  flex-shrink: 0;
}
.drawing-canvas.active {
  opacity: 1;
  pointer-events: auto;
}
.drawing-canvas.inactive {
  opacity: 0.5;
  pointer-events: none;
}
.feedback {
  font-size: 1.2rem;
  margin-top: 1rem;
}
.feedback.correct {
  color: #4caf50;
}
</style>