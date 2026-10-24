<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal confirm-modal">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="btn-icon" @click="handleClose">
          <X :size="20" />
        </button>
      </div>
      <div class="modal-body">
        <p>{{ message }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" @click="handleCancel">Отмена</button>
        <button class="btn btn-danger" @click="handleConfirm">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';

const props = defineProps<{
  title?: string;
  message: string;
  confirmText?: string;
}>();

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

function handleClose() {
  emit('cancel');
}

function handleCancel() {
  emit('cancel');
}

function handleConfirm() {
  emit('confirm');
}
</script>

<style scoped>
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
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}
.btn-icon {
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 50%;
  transition: background 0.2s;
}
.btn-icon:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, transparent);
}
.modal-body p {
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}
.modal-footer {
  display: flex;
  gap: 1rem;
}
.btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}
.btn-outline {
  background: transparent;
  border: 2px solid var(--accent-color);
  color: var(--accent-color);
}
.btn-outline:hover {
  background: color-mix(in srgb, var(--accent-color) 10%, transparent);
}
.btn-danger {
  background: #f44336;
  color: white;
  border: none;
}
.btn-danger:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px #f44336;
}
</style>