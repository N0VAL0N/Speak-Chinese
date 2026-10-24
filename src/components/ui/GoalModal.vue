<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>Ваши цели</h3>
        <button class="btn-icon" @click="$emit('close')">
          <X :size="20" />
        </button>
      </div>
      <div class="modal-body">
        <p class="description">Выберите, что хотите изучать. Это поможет нам подбирать рекомендации.</p>
        
        <div class="goals-list">
          <label
            v-for="goal in PRESET_GOALS"
            :key="goal.id"
            class="goal-item"
            :class="{ selected: selectedIds.includes(goal.id) }"
          >
            <input
              type="checkbox"
              :value="goal.id"
              v-model="selectedIds"
              class="goal-checkbox"
            />
            <div class="goal-info">
              <span class="goal-title">{{ goal.title }}</span>
              <span class="goal-description">{{ goal.description }}</span>
            </div>
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">Позже</button>
        <button class="btn btn-primary" @click="saveGoals" :disabled="selectedIds.length === 0">
          Сохранить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { PRESET_GOALS } from '@/constants'

const emit = defineEmits<{ (e: 'close'): void; (e: 'save', goals: any[]): void }>()

const selectedIds = ref<string[]>([])

function saveGoals() {
  const selected = PRESET_GOALS.filter(g => selectedIds.value.includes(g.id))
  emit('save', selected)
  emit('close')
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
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
}
.modal {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--bg-primary);
  border-radius: 28px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: inherit;
  border-radius: 28px 28px 0 0;
  z-index: 1;
}
.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}
.modal-body {
  padding: 1.5rem;
}
.description {
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
}
.goals-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.goal-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.goal-item.selected {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 10%, var(--surface));
}
.goal-checkbox {
  width: 20px;
  height: 20px;
  accent-color: var(--accent-color);
}
.goal-info {
  display: flex;
  flex-direction: column;
}
.goal-title {
  font-weight: 600;
  color: var(--text-primary);
}
.goal-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border);
  position: sticky;
  bottom: 0;
  background: inherit;
  border-radius: 0 0 28px 28px;
}
.btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}
.btn-primary {
  background: var(--accent-color);
  color: white;
  border: none;
}
.btn-primary:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 4px 12px var(--accent-color);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-outline {
  background: transparent;
  border: 2px solid var(--accent-color);
  color: var(--accent-color);
}
.btn-outline:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent-color) 10%, transparent);
}
.btn-icon {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 12px;
  cursor: pointer;
  color: var(--accent-color);
  transition: background 0.2s;
}
.btn-icon:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, transparent);
}
</style>