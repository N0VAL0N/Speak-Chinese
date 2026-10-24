<template>
  <div class="lesson-page">
    <!-- Титульная страница -->
    <div v-if="page.type === 'title'" class="title-page centered">
      <h2>{{ page.title }}</h2>
      <p>{{ page.description }}</p>
    </div>

    <!-- Страница с одним словом -->
    <div v-else-if="page.type === 'word'" class="word-page centered">
      <div class="word-card">
        <div class="hanzi">{{ page.word.simplified }}</div>
        <div class="pinyin">{{ page.word.pinyin }}</div>
        <div class="translation">{{ page.word.translations.ru }}</div>
        <button class="btn-icon audio-btn" @click="playAudio(page.word.simplified)" title="Прослушать">
          <Volume2 :size="24" />
        </button>
      </div>
    </div>

    <!-- Страница с одним грамматическим правилом -->
    <div v-else-if="page.type === 'grammar'" class="grammar-page centered">
      <div class="grammar-header">
        <h3>Грамматика</h3>
        <GrammarLegend v-if="grammarMeta" :meta="grammarMeta" />
      </div>
      <div class="grammar-item">
        <p class="pattern">{{ page.grammarPoint.pattern }}</p>
        <p class="explanation">{{ page.grammarPoint.explanation }}</p>
        <ul class="examples">
          <li v-for="(ex, idx) in page.grammarPoint.examples" :key="idx">
            <template v-if="typeof ex === 'string'">
              <span class="example-chinese">{{ ex }}</span>
              <button class="btn-icon audio-btn-small" @click="playAudio(ex)" title="Прослушать">
                <Volume2 :size="18" />
              </button>
            </template>
            <template v-else>
              <span class="example-chinese">{{ ex.chinese }}</span>
              <button class="btn-icon audio-btn-small" @click="playAudio(ex.chinese)" title="Прослушать">
                <Volume2 :size="18" />
              </button>
              <span class="example-pinyin" v-if="ex.pinyin"> ({{ ex.pinyin }})</span>
              <span class="example-translation" v-if="ex.translation"> – {{ ex.translation }}</span>
            </template>
          </li>
        </ul>
        <!-- Кнопка примечания — открывает модалку с сокращениями -->
        <button class="btn btn-outline note-btn" @click="showGrammarNote = true">
          Примечание
        </button>
        <!-- Модальное окно с сокращениями -->
        <div v-if="showGrammarNote" class="modal-overlay" @click.self="showGrammarNote = false">
          <div class="modal grammar-note-modal">
            <h4>Сокращения</h4>
            <p>S = Subject (подлежащее), N = Noun (существительное), V = Verb (глагол), Adj = Adjective (прилагательное), O = Object (дополнение), Prep = Preposition (предлог), Part = Particle (частица), M = Measure word (счётное слово), Num = Numeral (числительное), Pron = Pronoun (местоимение), Conj = Conjunction (союз), Adv = Adverb (наречие).</p>
            <button class="btn btn-primary" @click="showGrammarNote = false">Закрыть</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Страница с диалогом -->
    <div v-else-if="page.type === 'dialogue'" class="dialogue-page centered">
      <h3>Диалог</h3>
      <div v-for="(line, idx) in page.dialogue.lines" :key="idx" class="dialogue-line">
        <span class="speaker">{{ line.speaker }}:</span>
        <div class="chinese-block">
          <span class="chinese">{{ line.chinese }}</span>
          <button class="btn-icon audio-btn-small" @click="playAudio(line.chinese)" title="Прослушать">
            <Volume2 :size="18" />
          </button>
          <span class="pinyin">{{ line.pinyin }}</span>
        </div>
        <button v-if="!showTranslations[Number(idx)]" class="show-translation-btn" @click="toggleTranslation(Number(idx))">
          <Eye :size="28" />
        </button>
        <span v-else class="translation">{{ line.russian }}</span>
      </div>
    </div>

    <!-- Страница завершения -->
    <div v-else-if="page.type === 'completion'" class="completion-page centered">
      <div class="check-circle">
        <CheckCircle :size="96" />
      </div>
      <h2>Урок завершён!</h2>
      <p>Вы готовы к практике</p>
      <button class="btn btn-primary" @click="$emit('practice')">Практика</button>
    </div>

    <!-- Неизвестный тип -->
    <div v-else class="unknown-page">
      <p>Неизвестный тип страницы: {{ page.type }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { CheckCircle, Eye, Volume2 } from 'lucide-vue-next'
import GrammarLegend from '@/components/ui/GrammarLegend.vue'
import { speak } from '@/services/tts'
import { useAppStore } from '@/stores/appStore'

const props = defineProps<{ page: any; grammarMeta?: any }>()
const emit = defineEmits(['practice'])

const appStore = useAppStore()
const showGrammarNote = ref(false)
const showTranslations = ref<boolean[]>([])

watch(() => props.page, (newPage) => {
  if (newPage?.type === 'dialogue' && newPage.dialogue?.lines) {
    showTranslations.value = new Array(newPage.dialogue.lines.length).fill(false)
  }
}, { immediate: true })

function toggleTranslation(index: number) {
  showTranslations.value[index] = true
}

async function playAudio(text: string) {
  try {
    await speak(text, 'zh-CN')
  } catch (error) {
    appStore.showToast('Ошибка воспроизведения аудио', 'error')
  }
}
</script>

<style scoped>
.lesson-page {
  background: var(--bg-primary);
  border-radius: 24px;
  padding: 2rem 1rem;
  box-shadow: var(--card-shadow);
  min-height: 60vh;
  font-size: 1.2rem;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* Центрирование для всех страниц */
.centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  box-sizing: border-box;
  padding: 0 1rem;
}

.dark .lesson-page {
  background: #2a2a2a;
  color: #f5f5f5;
}

/* Карточка слова */
.word-card {
  text-align: center;
  padding: 2rem;
  background: var(--surface);
  border-radius: 24px;
  box-shadow: var(--card-shadow);
  max-width: 100%;
  width: 100%;
  position: relative;
  box-sizing: border-box;
}

.hanzi {
  font-size: 6rem;
  font-weight: bold;
  line-height: 1.2;
  margin-bottom: 1rem;
  color: var(--text-primary);
}
.pinyin {
  font-size: 2rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}
.translation {
  font-size: 1.8rem;
  color: var(--text-primary);
}

.audio-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background 0.2s;
}
.audio-btn:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, transparent);
}

/* Стили для грамматической страницы */
.grammar-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

/* Грамматика */
.grammar-item {
  max-width: 100%;
  width: 100%;
  padding: 2rem;
  background: var(--surface);
  border-radius: 20px;
  text-align: left;
  margin: 0 auto;
  box-sizing: border-box;
}

.pattern {
  font-weight: bold;
  color: var(--accent-color);
  margin-bottom: 1rem;
  font-size: 1.8rem;
}
.explanation {
  font-size: 1.6rem;
  margin-bottom: 1rem;
}
.examples {
  margin-top: 1rem;
  padding-left: 2rem;
  color: var(--text-secondary);
  font-size: 1.5rem;
}
.examples li {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.example-chinese {
  font-weight: 500;
}
.example-pinyin {
  color: var(--text-secondary);
  font-style: italic;
  margin-left: 0.5rem;
}
.example-translation {
  color: var(--text-secondary);
  margin-left: 0.5rem;
}
.audio-btn-small {
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.audio-btn-small:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, transparent);
}
.note-btn {
  margin-top: 1.5rem;
  width: 100%;
}

/* Модальное окно для примечания */
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
  background: var(--bg-primary);
  border-radius: 28px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
}
.grammar-note-modal h4 {
  margin-bottom: 1rem;
  color: var(--accent-color);
}
.grammar-note-modal p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

/* Стили для диалогов */
/* Диалог */
.dialogue-line {
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: 16px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
.speaker {
  font-weight: bold;
  color: var(--accent-color);
  min-width: 100px;
  font-size: 1.6rem;
}
.chinese-block {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  flex: 1;
}
.chinese {
  font-size: 2.2rem;
  color: var(--text-primary);
  line-height: 1.2;
}
.show-translation-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent-color);
  margin-left: auto;
  display: flex;
  align-items: center;
  padding: 0.5rem;
}
.translation {
  color: var(--text-primary);
  margin-left: auto;
  font-style: italic;
  max-width: 300px;
  font-size: 1.6rem;
}

/* Стили для завершения */
.completion-page .check-circle {
  color: #58cc02;
  margin-bottom: 2rem;
}

/* Неизвестный тип */
.unknown-page {
  padding: 3rem;
  text-align: center;
  color: red;
}

/* Адаптация для мобильных */
@media (max-width: 480px) {
  .hanzi { font-size: 4rem; }
  .pinyin { font-size: 1.5rem; }
  .translation { font-size: 1.4rem; }
  .pattern { font-size: 1.5rem; }
  .explanation { font-size: 1.3rem; }
  .examples { font-size: 1.2rem; }
  .speaker { font-size: 1.3rem; min-width: 70px; }
  .chinese { font-size: 1.8rem; }
}

/* True/False страница */
.truefalse-page {
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 24px;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
</style>