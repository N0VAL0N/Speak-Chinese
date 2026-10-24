<template>
  <div class="toast-container">
    <Toast
      v-for="(toast, index) in toasts"
      :key="index"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
      @closed="removeToast(index)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Toast from './Toast.vue';

export interface ToastItem {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

const toasts = ref<ToastItem[]>([]);

function addToast(toast: ToastItem) {
  toasts.value.push(toast);
}

function removeToast(index: number) {
  toasts.value.splice(index, 1);
}

defineExpose({ addToast });
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2000;
}
</style>