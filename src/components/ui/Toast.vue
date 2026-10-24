<template>
  <transition :name="transitionName" @after-leave="$emit('closed')">
    <div v-if="visible" class="toast" :class="type">
      <span class="toast-icon">{{ icon }}</span>
      <span class="toast-message">{{ message }}</span>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const props = defineProps<{
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}>();

const emit = defineEmits(['closed']);

const visible = ref(true);
const transitionName = computed(() => {
  // Для мобильных можно использовать slide-up, но slide-in справа тоже ок
  return 'toast-slide';
});

const icon = computed(() => {
  switch (props.type) {
    case 'success': return '✓';
    case 'error': return '✗';
    case 'warning': return '⚠';
    default: return 'ℹ';
  }
});

onMounted(() => {
  setTimeout(() => {
    visible.value = false;
  }, props.duration || 3000);
});
</script>

<style scoped>
.toast {
  position: fixed;
  top: 80px;
  right: 16px;
  left: 16px;
  margin: 0 auto;
  max-width: 400px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 40px;
  background: var(--surface);
  color: var(--text-primary);
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
  border-left: 4px solid currentColor;
  z-index: 2100;
  backdrop-filter: blur(10px);
  font-size: 1rem;
  pointer-events: none;
}
.toast.success { border-left-color: #4caf50; }
.toast.error { border-left-color: #f44336; }
.toast.warning { border-left-color: #ff9800; }
.toast.info { border-left-color: var(--accent-color); }

.toast-icon {
  font-size: 1.4rem;
  line-height: 1;
}

/* Анимация slide-up (лучше для мобильных) */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease;
}
.toast-slide-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}
.toast-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>