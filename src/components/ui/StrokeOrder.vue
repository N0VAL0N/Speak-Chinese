<template>
  <div class="stroke-order">
    <div v-if="characters.length > 0">
      <div class="characters-container" :style="{ gridTemplateColumns: `repeat(${characters.length}, 1fr)` }">
        <div
          v-for="(_, index) in characters"
          :key="index"
          :ref="(el) => setContainerRef(el, index)"
          class="stroke-canvas"
          :style="{ width: size + 'px', height: size + 'px' }"
          :class="{ 'active-char': currentIndex === index }"
        ></div>
      </div>

      <div class="stroke-controls">
        <button class="btn btn-outline" @click="playAll">Анимировать все</button>
      </div>

      <div class="progress-indicator" v-if="characters.length > 1">
        {{ currentIndex + 1 }} / {{ characters.length }}
      </div>
    </div>
    <div v-else class="hint-warning">
      Не удалось загрузить иероглифы
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import HanziWriter from 'hanzi-writer'

const props = defineProps<{
  character: string
  size?: number
}>()

const containerRefs = ref<(HTMLElement | null)[]>([])
const writers = ref<any[]>([])
const currentIndex = ref(0)

const characters = computed(() => props.character.split(''))

function setContainerRef(el: Element | ComponentPublicInstance | null, index: number) {
  if (el && el instanceof HTMLElement) {
    containerRefs.value[index] = el
  } else {
    containerRefs.value[index] = null
  }
}

function destroyAllWriters() {
  writers.value.forEach(writer => {
    if (writer && typeof writer.destroy === 'function') {
      writer.destroy()
    }
  })
  writers.value = []
}

async function initWriters() {
  destroyAllWriters()
  await nextTick()

  for (let i = 0; i < characters.value.length; i++) {
    const container = containerRefs.value[i]
    if (!container) continue

    try {
      container.innerHTML = ''
      
      // Создаем writer с правильной конфигурацией
      const writer = HanziWriter.create(container, characters.value[i], {
        width: props.size || 200,
        height: props.size || 200,
        padding: 5,
        strokeColor: '#333',
        showOutline: true,
        delayBetweenStrokes: 500,
        // Важно: используем charDataLoader для загрузки данных
        charDataLoader: (character: string, onComplete: (data: any) => void) => {
          // Пытаемся загрузить данные с CDN
          fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(character)}.json`)
            .then(response => {
              if (!response.ok) {
                throw new Error('Failed to load character data')
              }
              return response.json()
            })
            .then(data => {
              onComplete(data)
            })
            .catch(error => {
              console.warn(`Failed to load data for ${character}, using fallback`, error)
              // Создаем простые данные для иероглифа как fallback
              // Это минимальная структура, которую ожидает HanziWriter
              const fallbackData = {
                strokes: [],
                medians: []  // Добавляем обязательное поле medians
              }
              onComplete(fallbackData)
            })
        }
      })
      writers.value[i] = writer
    } catch (e) {
      console.error(`Failed to create writer for ${characters.value[i]}:`, e)
    }
  }
}

async function playAll() {
  for (let i = 0; i < writers.value.length; i++) {
    currentIndex.value = i
    const writer = writers.value[i]
    if (writer && typeof writer.animateCharacter === 'function') {
      try {
        await new Promise((resolve) => {
          writer.animateCharacter({ 
            onComplete: resolve,
            delayBetweenStrokes: 500 
          })
        })
      } catch (error) {
        console.error(`Failed to animate character ${characters.value[i]}:`, error)
      }
    }
  }
}

onMounted(async () => {
  await initWriters()
  setTimeout(() => playAll(), 100)
})

onUnmounted(() => {
  destroyAllWriters()
})

watch(() => props.character, async () => {
  await initWriters()
  currentIndex.value = 0
  setTimeout(() => playAll(), 100)
})
</script>

<style scoped>
.characters-container {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
}
.stroke-canvas {
  margin: 0 auto;
  opacity: 0.5;
  transition: opacity 0.3s;
}
.stroke-canvas.active-char {
  opacity: 1;
}
.stroke-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}
.progress-indicator {
  text-align: center;
  color: var(--text-secondary);
  font-size: 1rem;
}
.hint-warning {
  color: var(--text-secondary);
  font-size: 1.2rem;
  text-align: center;
  padding: 1rem;
}
</style>