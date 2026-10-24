<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal glass">
      <div class="modal-header">
        <h3>Выберите уровень HSK</h3>
        <button class="close-btn" @click="$emit('close')">
          <X :size="20" />
        </button>
      </div>
      <div class="levels">
        <button
          v-for="level in levels"
          :key="level"
          @click="selectLevel(level)"
          :class="['level-btn', { active: appStore.currentHSKLevel === level }]"
        >
          <span class="level-indicator" :style="{ backgroundColor: getLevelColor(level) }"></span>
          <span class="level-text">HSK {{ level }}</span>
          <span v-if="appStore.currentHSKLevel === level" class="check">
            <CheckCircle :size="20" />
          </span>
        </button>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="$emit('close')">Отмена</button>
        <button class="save-btn" @click="$emit('close')">Сохранить</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/appStore'
import type { HSKLevel } from '@/types'
import { X, CheckCircle } from 'lucide-vue-next'
import { HSK_LEVELS, HSK_LEVEL_COLORS } from '@/constants'

const appStore = useAppStore()
const emit = defineEmits<{ (e: 'close'): void }>()

const levels: HSKLevel[] = HSK_LEVELS

function getLevelColor(level: HSKLevel): string {
  return HSK_LEVEL_COLORS[level]
}

function selectLevel(level: HSKLevel) {
  appStore.setHSKLevel(level)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
}
.modal {
  width: 100%;
  max-width: 400px;
  background: var(--bg-primary);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px); /* стекло */
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-top: 4px solid var(--border);
  border-radius: 20px;
}
.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: background 0.2s;
}
.close-btn:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, var(--surface));
}
.levels {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.level-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: none;
  background: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}
.level-btn:hover {
  background: var(--surface);
}
.level-btn.active {
  background: var(--accent-color);
  transform: scale(1.02);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.level-btn.active .level-text,
.level-btn.active .check {
  color: white;
}
.level-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: transform 0.2s;
}
.level-btn.active .level-indicator {
  transform: scale(1.2);
}
.level-text {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-primary);
}
.check {
  color: var(--accent-color);
}
.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 4px solid var(--border);
  border-radius: 20px;
}
.cancel-btn, .save-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}
.cancel-btn {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text-primary);
}
.cancel-btn:hover {
  background: color-mix(in srgb, var(--accent-color) 10%, var(--surface));
}
.save-btn {
  background: var(--accent-color);
  color: white;
  box-shadow: 0 4px 12px var(--accent-color);
}
.save-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 16px var(--accent-color);
}
</style>