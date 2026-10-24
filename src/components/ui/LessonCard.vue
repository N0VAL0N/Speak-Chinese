<template>
  <button
    :class="['lesson-card', statusClass, { 'self-start': index % 2 === 0, 'self-end': index % 2 !== 0 }]"
    :disabled="lesson.locked"
    @click="!lesson.locked && emit('click')"
  >
    <div class="icon-background">
      <component :is="lessonIcon" class="bg-icon" />
    </div>

    <div class="content-overlay">
      <div class="status-indicator">
        <Lock v-if="lesson.locked" class="w-5 h-5 text-white/80" />
        <div
          v-else-if="lesson.completed"
          class="progress-circle completed"
        >
          <CheckCircle class="w-5 h-5 text-white" />
        </div>
        <div
          v-else-if="lesson.inProgress"
          class="progress-circle"
          :style="{ '--progress': lesson.progress }"
        >
          <svg viewBox="0 0 36 36" class="circle-svg">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              stroke-width="2"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
              transform="rotate(-90 18 18)"
            />
          </svg>
          <span class="progress-text">{{ lesson.progress }}%</span>
        </div>
        <div v-else class="progress-circle">
          <span class="progress-text">0%</span>
        </div>
      </div>

      <h3 class="lesson-title">{{ lesson.title }}</h3>

      <!-- Иероглиф для выделения -->
      <div v-if="lesson.hanzi" class="hanzi-wrapper" @click.stop="onHanziClick">
        <span class="hanzi">{{ lesson.hanzi }}</span>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Lock,
  CheckCircle,
  User,
  Users,
  Baby,
  Heart,
  Home,
  Utensils,
  Car,
  Shirt,
  Trophy,
  Music,
  Plane,
  Palette,
  TreePine,
  Cloud,
  Moon,
  Mountain,
  Briefcase,
  GraduationCap,
  Globe,
  Scale,
  Ruler,
  Brain,
  Book,
  MessageCircle,
  HelpCircle,
  Cpu,
  Church,
  ScrollText,
  Train,
  Bus,
  Leaf,
  Umbrella,
  Snowflake,
  Wind,
  Sun,
  Star,
  Smile,
  Coffee,
  Clock,
  Activity,
  Dog,
  Cat,
  Bird,
  Fish,
  Turtle,
  Rabbit,
  ShoppingBag,
  Compass,
  Sailboat,
} from 'lucide-vue-next'
import type { HSKLevel } from '@/types'

const props = defineProps<{
  lesson: {
    id: string
    title: string
    hskLevel: HSKLevel
    lessonNumber: number
    difficulty: 1 | 2 | 3
    locked?: boolean
    completed?: boolean
    inProgress?: boolean
    progress?: number
    topics?: string[]
    hanzi?: string
  }
  index: number
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'select-text', text: string): void
}>()

const statusClass = computed(() => {
  if (props.lesson.locked) return 'locked'
  if (props.lesson.completed) return 'completed'
  if (props.lesson.inProgress) return 'in-progress'
  return ''
})

const circumference = 2 * Math.PI * 16
const dashOffset = computed(() => {
  if (!props.lesson.inProgress || props.lesson.progress === undefined) return circumference
  return circumference - (props.lesson.progress / 100) * circumference
})

// Словарь иконок
const topicIconMap: Record<string, any> = {
  'person.': User,
  'person.family': Users,
  'person.age': Baby,
  'person.gender': User,
  'person.relationship': Heart,
  'person.emotion': Smile,
  'person.character': Star,
  'person.profession': Briefcase,
  'daily.': Home,
  'daily.food': Utensils,
  'daily.drink': Coffee,
  'daily.transport': Car,
  'daily.housing': Home,
  'daily.clothing': Shirt,
  'daily.shopping': ShoppingBag,
  'leisure.': Palette,
  'leisure.sport': Trophy,
  'leisure.art': Music,
  'leisure.travel': Plane,
  'leisure.hobby': Star,
  'nature.': TreePine,
  'nature.landscape': Mountain,
  'nature.weather': Cloud,
  'nature.astronomy': Moon,
  'nature.animals': Cat,
  'society.': Globe,
  'society.education': GraduationCap,
  'society.work': Briefcase,
  'society.geo': Compass,
  'society.politics': Scale,
  'society.economy': Scale,
  'society.communication': MessageCircle,
  'abstract.': Brain,
  'abstract.quality': Scale,
  'abstract.quantity': Ruler,
  'abstract.time': Clock,
  'abstract.space': Compass,
  'abstract.cognition': Brain,
  'grammar.': Book,
  'grammar.pronoun': User,
  'grammar.verb': Activity,
  'grammar.particle': Star,
  'grammar.question': HelpCircle,
  'health': Activity,
  'technology': Cpu,
  'culture': Church,
  'history': ScrollText,
  'transport.': Car,
  'transport.train': Train,
  'transport.air': Plane,
  'transport.water': Sailboat,
  'transport.bus': Bus,
  'spring': Leaf,
  'summer': Sun,
  'autumn': Leaf,
  'winter': Snowflake,
  'rain': Umbrella,
  'snow': Snowflake,
  'wind': Wind,
  'storm': Cloud,
  'animal.dog': Dog,
  'animal.cat': Cat,
  'animal.bird': Bird,
  'animal.fish': Fish,
  'animal.turtle': Turtle,
  'animal.rabbit': Rabbit,
}

const getIconForTopic = (topics: string[] | undefined) => {
  if (!topics || topics.length === 0) return Star
  for (const topic of topics) {
    for (const [key, icon] of Object.entries(topicIconMap)) {
      if (topic.startsWith(key)) return icon
    }
  }
  return Star
}

const lessonIcon = computed(() => getIconForTopic(props.lesson.topics))

function onHanziClick(event: MouseEvent) {
  event.stopPropagation()
  if (!props.lesson.hanzi) return
  
  const selection = window.getSelection()
  const range = document.createRange()
  const target = event.currentTarget as HTMLElement
  range.selectNodeContents(target)
  selection?.removeAllRanges()
  selection?.addRange(range)
  
  // Искусственно вызываем событие выделения
  setTimeout(() => {
    emit('select-text', props.lesson.hanzi!)
  }, 100)
}
</script>

<style scoped>
.lesson-card {
  position: relative;
  width: calc(45% - 0.75rem);
  aspect-ratio: 1 / 1;
  border-radius: 28px;
  padding: 1.25rem;
  box-shadow: var(--card-shadow);
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  word-break: break-word;
  overflow: hidden;
  border: 1px solid rgba(128,128,128,0.2);
  background: var(--surface);
}

.dark .lesson-card {
  background: linear-gradient(145deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 70%, black));
  border-color: rgba(255,255,255,0.1);
}

:root:not(.dark) .lesson-card {
  background: var(--surface);
  border: 2px solid var(--border);
}

.lesson-card:hover:not(:disabled) {
  transform: translateY(-6px);
  box-shadow: var(--card-hover-shadow);
}

.lesson-card:disabled {
  cursor: not-allowed;
}

.lesson-card.completed {
  border: 2px solid var(--accent-color);
}
.lesson-card.in-progress {
  border: 2px solid var(--accent-color);
}
.lesson-card.locked {
  opacity: 0.6;
  filter: grayscale(0.8);
}

.icon-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
}

.bg-icon {
  width: 80%;
  height: 80%;
  color: var(--accent-color);
  opacity: 0.15;
  transition: opacity 0.2s;
}

.dark .bg-icon {
  opacity: 0.25;
  color: white;
}

.lesson-card:hover .bg-icon {
  opacity: 0.3;
}

.dark .lesson-card:hover .bg-icon {
  opacity: 0.4;
}

.lesson-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.5));
  pointer-events: none;
  z-index: 1;
  border-radius: 28px;
}

.content-overlay {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.status-indicator {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
}

.lesson-title {
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  margin: 0;
  line-height: 1.3;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  color: white;
  background: rgba(0,0,0,0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  backdrop-filter: blur(4px);
  align-self: flex-start;
  max-width: 90%;
  margin: 0 auto;
  z-index: 3;
}

.hanzi-wrapper {
  margin-top: 0.5rem;
  text-align: center;
  cursor: text;
  user-select: text;
}

.hanzi {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  background: rgba(0,0,0,0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  backdrop-filter: blur(4px);
  display: inline-block;
}

.self-start { align-self: flex-start; }
.self-end { align-self: flex-end; }

.w-5 { width: 1.25rem; }
.h-5 { height: 1.25rem; }
.text-white\/80 { color: rgba(255,255,255,0.8); }

.progress-circle {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-svg {
  width: 100%;
  height: 100%;
}

.progress-text {
  position: absolute;
  font-size: 0.75rem;
  font-weight: bold;
  color: white;
}

@media (max-width: 480px) {
  .progress-circle {
    width: 32px;
    height: 32px;
  }
  .progress-text {
    font-size: 0.65rem;
  }
}

@media (max-width: 360px) {
  .progress-circle {
    width: 28px;
    height: 28px;
  }
  .progress-text {
    font-size: 0.6rem;
  }
}

.progress-circle.completed {
  background: transparent;
}
</style>