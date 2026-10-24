<template>
  <header class="hotbar">
    <button class="icon-btn" @click="$emit('open-menu')">
      <Menu :size="24" />
    </button>
    <div class="level-badge">
      HSK {{ appStore.currentHSKLevel }}
    </div>
    <button class="icon-btn" @click="$emit('open-profile')" :class="{ rotating: settingsOpen }">
      <User :size="24" />
    </button>
  </header>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/appStore'
import { Menu, User } from 'lucide-vue-next'

defineProps<{
  settingsOpen?: boolean  // передаётся из родителя, если нужно вращение
}>()

const appStore = useAppStore()
defineEmits(['open-menu', 'open-profile'])
</script>

<style scoped>
.hotbar {
  position: fixed; 
  top: 0;
  z-index: 20;
  width: 90%;
  max-width: 600px;
  margin: 0.5rem auto 0;
  padding: 0.5rem 1rem;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(200, 200, 200, 0.5);
  border-radius: 40px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.dark .hotbar {
  background: rgba(30, 30, 30, 0.7);
  border-color: rgba(100, 100, 100, 0.5);
}

.icon-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
}

.icon-btn:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, transparent);
}

.icon-btn:active {
  transform: scale(0.95);
}

/* Анимация вращения */
.rotating {
  animation: spin 0.5s ease;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(180deg); }
}

.level-badge {
  background: var(--accent-color);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 40px;
  font-weight: 600;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
</style>