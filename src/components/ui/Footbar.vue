<template>
  <nav class="footbar">
    <button
      v-for="item in navItems"
      :key="item.path"
      @click="navigate(item)"
      :class="['nav-item', { active: $route.path === item.path }]"
    >
      <component :is="item.icon" :size="24" />
      <span class="label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Home, Book, Edit3, Settings, MessageCircle } from 'lucide-vue-next'
import { ROUTES } from '@/constants'
import { useAppStore } from '@/stores/appStore'

const router = useRouter()
const appStore = useAppStore()

const navItems = [
  { path: ROUTES.HOME, icon: Home, label: 'Учеба' },
  { path: ROUTES.PRACTICE, icon: Edit3, label: 'Практика' },
  { path: ROUTES.GLOSSARY, icon: Book, label: 'Глоссарий' },
  { path: ROUTES.ASSISTANT, icon: MessageCircle, label: 'Ассистент' },
  { path: '#', icon: Settings, label: 'Настройки' }
]

function navigate(item: typeof navItems[0]) {
  if (item.path === ROUTES.ASSISTANT) {
    router.push('/assistant')
    return
  }
  if (item.label === 'Настройки') {
    appStore.openSettings()
    return
  }
  router.push(item.path)
}
</script>

<style scoped>
.footbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  width: 90%;
  max-width: 600px;
  margin: 0 auto 0.5rem;
  padding: 0.25rem 1rem;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(200, 200, 200, 0.5);
  border-radius: 40px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-sizing: border-box;
  padding-bottom: env(safe-area-inset-bottom, 0.5rem);
  overflow: hidden;
}

.dark .footbar {
  background: rgba(30, 30, 30, 0.8);
  border-color: rgba(100, 100, 100, 0.5);
}

.nav-item {
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.4rem 0.6rem;
  border-radius: 30px;
  transition: all 0.2s;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.8rem;
  flex-shrink: 0;
}

.nav-item.active {
  background: var(--accent-color);
  color: white;
  transform: scale(1.05);
  box-shadow: 0 4px 8px var(--accent-color);
}

.nav-item:not(.active):hover {
  background: rgba(0,0,0,0.05);
}

.dark .nav-item:not(.active):hover {
  background: rgba(255,255,255,0.1);
}

.label {
  margin-top: 0.2rem;
  font-size: 0.7rem;
  font-weight: 500;
}

@media (max-width: 480px) {
  .nav-item { padding: 0.3rem 0.4rem; }
  .label { font-size: 0.6rem; }
}
@media (max-width: 400px) {
  .nav-item { padding: 0.2rem 0.3rem; }
  .footbar { padding: 0.25rem 0.5rem; }
}
</style>