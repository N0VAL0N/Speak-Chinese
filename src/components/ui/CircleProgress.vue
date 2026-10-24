<!-- components/ui/CircleProgress.vue -->
<template>
  <div class="circle-progress" :style="{ width: size + 'px', height: size + 'px' }">
    <svg viewBox="0 0 100 100">
      <!-- Фоновый круг -->
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        stroke-width="8"
      />
      <!-- Прогресс -->
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="white"
        stroke-width="8"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        transform="rotate(-90 50 50)"
      />
    </svg>
    <div class="icon" v-if="icon">
      <img :src="icon" alt="icon" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  progress: number  // от 0 до 100
  size?: number     // размер в пикселях
  icon?: string     // URL иконки
}>()

const circumference = 2 * Math.PI * 45 // 2 * π * r

const dashOffset = computed(() => {
  return circumference - (props.progress / 100) * circumference
})
</script>

<style scoped>
.circle-progress {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
svg {
  width: 100%;
  height: 100%;
  transform: rotate(0deg);
}
.icon {
  position: absolute;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.icon img {
  width: 60%;
  height: 60%;
  object-fit: contain;
}
</style>