<template>
  <div class="main-layout">
    <div class="app-container">
      <Hotbar
        v-if="$route.meta?.showHotbar"
        @open-menu="appStore.isMenuOpen = true"
        @open-profile="$router.push('/profile')"
      />
      <router-view />
      <Footbar v-if="!hideFootbar" @open-settings="appStore.openSettings" />
    </div>
    <BurgerMenu v-if="appStore.isMenuOpen" @close="appStore.isMenuOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/appStore'
import Hotbar from '@/components/ui/Hotbar.vue'
import Footbar from '@/components/ui/Footbar.vue'
import BurgerMenu from '@/components/ui/BurgerMenu.vue'

const appStore = useAppStore()

const hideFootbar = computed(() => {
  // Скрываем футбар, если активна сессия практики
  return appStore.isInSession
})
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-primary);
}
.app-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem 80px;
  display: flex;
  flex-direction: column;
  flex: 1;
  box-sizing: border-box;
}
</style>