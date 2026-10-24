<template>
  <div class="grammar-legend" v-if="meta">
    <span class="legend-icon" @click="show = !show" title="Что означают сокращения?">ⓘ</span>
    <div v-if="show" class="legend-popup" @click.self="show = false">
      <div class="legend-content">
        <h4>Сокращения в грамматике</h4>
        <p v-for="line in lines" :key="line">{{ line }}</p>
        <button class="close-btn" @click="show = false">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  meta: any
}>()

const show = ref(false)

const lines = computed(() => {
  if (!props.meta || !props.meta.description) return []
  // Разбиваем описание по запятым или точкам для читаемости
  return props.meta.description.split(/[,.]/).filter((s: string) => s.trim())
})
</script>

<style scoped>
.grammar-legend {
  display: inline-block;
  margin-left: 0.5rem;
  position: relative;
}
.legend-icon {
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--level-accent);
  transition: opacity 0.2s;
}
.legend-icon:hover {
  opacity: 0.8;
}
.legend-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.legend-content {
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: 24px;
  max-width: 400px;
  width: 90%;
  color: var(--text-primary);
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
.legend-content h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--level-accent);
}
.legend-content p {
  margin: 0.5rem 0;
  line-height: 1.4;
}
.close-btn {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--level-accent);
  color: white;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}
</style>