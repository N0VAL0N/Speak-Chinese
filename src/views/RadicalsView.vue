<template>
  <div class="radicals-view mobile-container">
    <SectionHeader title="Ключи (радикалы)" @open-profile="$router.push('/profile')" />

    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else>
      <div class="filter-bar">
        <input
          v-model="search"
          class="search-input"
          placeholder="Поиск по ключу или значению"
        />
        <div class="stroke-filter">
          <button
            v-for="filter in STROKE_FILTERS"
            :key="filter.value"
            class="filter-btn"
            :class="{ active: selectedStrokeFilter === filter.value }"
            @click="selectedStrokeFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <div class="radicals-grid">
        <div
          v-for="radical in filteredRadicals"
          :key="radical.id"
          class="radical-card"
          @click="selectRadical(radical)"
        >
          <div class="radical-char">{{ radical.character }}</div>
          <div class="radical-meaning">{{ radical.meaning }}</div>
          <div class="radical-pinyin">{{ radical.pinyin }}</div>
          <div class="radical-strokes">{{ radical.strokes }} черт</div>
        </div>
      </div>
    </div>

    <!-- Модалка с подробностями -->
    <div v-if="selectedRadical" class="modal-overlay" @click.self="selectedRadical = null">
      <div class="modal radical-modal">
        <div class="modal-header">
          <h3>{{ selectedRadical.character }}</h3>
          <button class="btn-icon" @click="selectedRadical = null">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <div class="radical-detail">
            <p><strong>Пиньинь:</strong> {{ selectedRadical.pinyin }}</p>
            <p><strong>Значение:</strong> {{ selectedRadical.meaning }}</p>
            <p><strong>Количество черт:</strong> {{ selectedRadical.strokes }}</p>
            <p v-if="selectedRadical.variant"><strong>Вариант:</strong> {{ selectedRadical.variant }}</p>
          </div>
          <div class="stroke-order-section">
            <h4>Порядок черт</h4>
            <StrokeOrder :character="selectedRadical.character" :size="200" />
          </div>
          <div v-if="selectedRadical.examples?.length" class="examples">
            <p><strong>Примеры:</strong></p>
            <div class="example-chars">
              <span
                v-for="ex in selectedRadical.examples"
                :key="ex"
                class="example-char"
                @click.stop="search = ex; selectedRadical = null"
              >
                {{ ex }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import StrokeOrder from '@/components/ui/StrokeOrder.vue';
import { X } from 'lucide-vue-next';
import radicalsData from '@/data/radicals.json';
import { STROKE_FILTERS } from '@/constants';

const loading = ref(false);
const radicals = ref(radicalsData);
const search = ref('');
const selectedRadical = ref<any>(null);
const selectedStrokeFilter = ref('all');

const filteredRadicals = computed(() => {
  let result = radicals.value;
  if (search.value) {
    const s = search.value.toLowerCase();
    result = result.filter(
      r => r.character.includes(s) || 
           r.meaning.toLowerCase().includes(s) || 
           r.pinyin.includes(s)
    );
  }
  if (selectedStrokeFilter.value !== 'all') {
    const [min, max] = selectedStrokeFilter.value.split('-').map(Number);
    if (max) {
      result = result.filter(r => r.strokes >= min && r.strokes <= max);
    } else {
      result = result.filter(r => r.strokes >= 10);
    }
  }
  return result;
});

function selectRadical(radical: any) {
  selectedRadical.value = radical;
}
</script>

<style scoped>
.radicals-view {
  padding: 1rem 0 80px;
}
.filter-bar {
  margin-bottom: 1rem;
}
.search-input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 2px solid var(--border);
  border-radius: 30px;
  background: var(--surface);
  color: var(--text-primary);
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
.stroke-filter {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}
.filter-btn {
  padding: 0.5rem 1rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.radicals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.radical-card {
  background: var(--surface);
  border-radius: 16px;
  padding: 1rem;
  text-align: center;
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: all 0.2s;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.radical-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-hover-shadow);
}
.radical-char {
  font-size: 3rem;
  font-weight: bold;
  color: var(--accent-color);
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.radical-meaning {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-top: 0.25rem;
}
.radical-pinyin {
  font-size: 0.9rem;
  color: var(--text-secondary);
}
.radical-strokes {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}
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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.modal-header h3 {
  font-size: 2rem;
  margin: 0;
  color: var(--accent-color);
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent-color);
}
.modal-body p {
  margin: 0.5rem 0;
  color: var(--text-primary);
}
.stroke-order-section {
  margin: 1.5rem 0;
  text-align: center;
}
.stroke-order-section h4 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}
.examples {
  margin-top: 1rem;
}
.example-chars {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.example-char {
  font-size: 1.5rem;
  background: var(--surface);
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.example-char:hover {
  background: var(--accent-color);
  color: white;
}
.loading {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
}
</style>