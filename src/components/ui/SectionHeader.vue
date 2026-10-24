<template>
  <header class="section-header">
    <button class="btn-icon" @click="$router.back()">
      <ChevronLeft :size="24" />
    </button>
    <h1>{{ title }}</h1>
    <button class="btn-icon" @click="$emit('open-profile')">
      <User :size="24" />
    </button>
  </header>
</template>

<script setup lang="ts">
import { ChevronLeft, User } from 'lucide-vue-next'

defineProps<{
  title: string
}>()

defineEmits(['open-profile'])
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
}
.section-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--accent-color); /* вместо фиксированного зелёного */
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