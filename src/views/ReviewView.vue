<template>
  <div class="review-view">
    <div class="review-controls">
      <!-- Уровни -->
      <div class="levels-group">
        <label
          v-for="level in levelOptions"
          :key="level.value"
          class="custom-checkbox"
          :class="{ checked: selectedLevels.includes(level.value) }"
        >
          <input type="checkbox" :value="level.value" v-model="selectedLevels" />
          <span>HSK {{ level.label }}</span>
        </label>
      </div>

      <!-- Типы упражнений -->
      <div class="types-group">
        <label
          v-for="type in REVIEW_EXERCISE_TYPES"
          :key="type.value"
          class="custom-checkbox"
          :class="{ checked: selectedTypes.includes(type.value) }"
        >
          <input type="checkbox" :value="type.value" v-model="selectedTypes" />
          <span>{{ type.label }}</span>
        </label>
      </div>

      <!-- Кнопка выбора тем -->
      <div class="topics-selector">
        <button class="btn btn-outline topics-toggle" @click="showTopics = !showTopics">
          {{ showTopics ? 'Скрыть темы' : 'Выбрать темы' }}
          <span v-if="selectedTopics.length" class="topics-badge">{{ selectedTopics.length }}</span>
        </button>
        <div v-if="showTopics" class="topics-panel">
          <div class="topics-search">
            <input v-model="topicSearch" class="input" placeholder="Поиск темы..." />
          </div>
          <div class="topics-list">
            <label
              v-for="topic in filteredTopics"
              :key="topic"
              class="custom-checkbox"
              :class="{ checked: selectedTopics.includes(topic) }"
            >
              <input type="checkbox" :value="topic" v-model="selectedTopics" />
              <span>{{ topic }}</span>
            </label>
            <div v-if="filteredTopics.length === 0" class="no-topics">
              Нет тем для выбранного уровня
            </div>
          </div>
        </div>
      </div>

      <!-- Количество слов -->
      <div class="count-selector">
        <span class="count-label">
          Количество (макс. {{ maxAvailableWords }}):
        </span>
        <div class="count-buttons">
          <button
            v-for="n in WORD_COUNT_OPTIONS"
            :key="n"
            @click="cardCount = n"
            :class="['count-btn', { active: cardCount === n }]"
          >
            {{ n }}
          </button>
        </div>
      </div>

      <!-- Режим (ошибки / по расписанию) -->
      <div class="mode-switcher">
        <button
          :class="['mode-btn', { active: mode === REVIEW_MODES.MISTAKES }]"
          @click="mode = REVIEW_MODES.MISTAKES"
          title="Повторять только те слова, в которых вы чаще всего ошибались"
        >
          Только ошибки
        </button>
        <button
          :class="['mode-btn', { active: mode === REVIEW_MODES.SRS }]"
          @click="mode = REVIEW_MODES.SRS"
          title="Повторять по расписанию SM-2 (слова, которые уже пора повторить)"
        >
          По расписанию
        </button>
      </div>

      <!-- Кнопка старта -->
      <button
        class="btn btn-primary start-btn"
        @click="startReview"
        :disabled="selectedTypes.length === 0 || selectedLevels.length === 0 || cardCount < 1"
      >
        Начать повторение
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useVocabularyStore } from '@/stores/vocabularyStore';
import { generateReviewExercises } from '@/services/generators'; 
import {
  HSKLevel,
  HSK_LEVELS,
  REVIEW_EXERCISE_TYPES,
  WORD_COUNT_OPTIONS,
  REVIEW_MODES,
  ExerciseType,
  type ReviewMode
} from '@/constants';

const emit = defineEmits<{
  (e: 'start-session', sessionData: { exercises: any[]; reviewIds: string[]; settings: any }): void
}>();

const userStore = useUserStore();
const vocabStore = useVocabularyStore();

onMounted(() => {
  vocabStore.loadVocabulary();
});

const levelOptions = HSK_LEVELS.map(level => ({
  value: level,
  label: level
}));
const selectedLevels = ref<HSKLevel[]>([]);

const selectedTypes = ref<string[]>([]);

const cardCount = ref(10);
const mode = ref<ReviewMode>(REVIEW_MODES.MISTAKES);

const showTopics = ref(false);
const topicSearch = ref('');
const selectedTopics = ref<string[]>([]);

const allTopics = computed(() => {
  const topicsSet = new Set<string>();
  if (selectedLevels.value.length === 0) return [];
  vocabStore.words
    .filter(w => selectedLevels.value.includes(w.level))
    .forEach(w => w.topics?.forEach(t => topicsSet.add(t)));
  return Array.from(topicsSet).sort();
});

const filteredTopics = computed(() => {
  if (!topicSearch.value) return allTopics.value;
  const s = topicSearch.value.toLowerCase();
  return allTopics.value.filter(t => t.toLowerCase().includes(s));
});

const maxAvailableWords = computed(() => {
  if (selectedLevels.value.length === 0) return 0;
  let words = vocabStore.words.filter(w => selectedLevels.value.includes(w.level));
  if (selectedTopics.value.length > 0) {
    words = words.filter(w => w.topics?.some(t => selectedTopics.value.includes(t)));
  }
  const learnedIds = userStore.progress.learnedWords;
  words = words.filter(w => learnedIds.includes(w.id));
  return words.length;
});

watch(selectedLevels, () => {
  selectedTopics.value = [];
  topicSearch.value = '';
});

async function startReview() {
  if (selectedLevels.value.length === 0 || selectedTypes.value.length === 0) return;

  const exercises = await generateReviewExercises({
    levels: selectedLevels.value,
    types: selectedTypes.value as ExerciseType[],
    count: cardCount.value,
    mode: mode.value,
    topics: selectedTopics.value.length ? selectedTopics.value : undefined
  });

  const withIds = exercises.map((ex: any, idx: number) => ({
    ...ex,
    id: `review-${Date.now()}-${idx}`
  }));

  const settings = {
    levels: selectedLevels.value,
    types: selectedTypes.value,
    topics: selectedTopics.value,
    count: cardCount.value,
    mode: mode.value
  };

  emit('start-session', {
    exercises: withIds,
    reviewIds: [], // reviewStore.addItems нужно будет вызвать позже
    settings
  });
}
</script>

<style scoped>
.review-controls {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin: 1rem 0;
}

.levels-group, .types-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.custom-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: var(--surface);
  border-radius: 30px;
  border: 2px solid var(--border);
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  color: var(--text-primary);
  user-select: none;
}

.custom-checkbox:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, var(--surface));
  border-color: var(--accent-color);
}

.custom-checkbox input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.custom-checkbox.checked {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.topics-selector {
  margin-bottom: 1rem;
}

.topics-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topics-badge {
  background: var(--accent-color);
  color: white;
  border-radius: 20px;
  padding: 0.2rem 0.6rem;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.topics-panel {
  margin-top: 0.5rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: 16px;
  border: 2px solid var(--border);
}

.topics-search {
  margin-bottom: 0.5rem;
}

.topics-search .input {
  width: 100%;
  padding: 0.5rem;
}

.topics-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.no-topics {
  text-align: center;
  color: var(--text-secondary);
  padding: 0.5rem;
}

.count-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.count-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.count-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.count-btn {
  padding: 0.6rem 1.2rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  min-width: 50px;
}

.count-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.mode-switcher {
  display: flex;
  gap: 1rem;
}

.mode-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.2s;
}

.mode-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.start-btn {
  width: 100%;
  margin-top: 1rem;
}
</style>