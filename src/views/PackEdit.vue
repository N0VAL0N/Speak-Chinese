<template>
  <div class="pack-edit mobile-container">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">
        <ChevronLeft :size="24" />
      </button>
      <h2>{{ isNew ? 'Создать пак' : 'Редактировать пак' }}</h2>
      <div class="placeholder"></div>
    </div>

    <form @submit.prevent="savePack">
      <!-- Название -->
      <div class="form-group">
        <label>Название</label>
        <input v-model="packForm.name" class="input" required />
      </div>

      <!-- Описание -->
      <div class="form-group">
        <label>Описание</label>
        <input v-model="packForm.description" class="input" />
      </div>

      <!-- Уровни HSK (автоматические) -->
      <div class="form-group">
        <label>Уровни HSK (определяются автоматически по словам)</label>
        <div class="level-buttons">
          <span
            v-for="level in selectedLevels"
            :key="level"
            class="level-badge"
            :style="{ backgroundColor: HSK_LEVEL_COLORS[level] }"
          >
            HSK {{ level }}
          </span>
        </div>
      </div>

      <!-- Обложка -->
      <div class="form-group">
        <label>Обложка</label>
        <div class="cover-upload">
          <div v-if="packForm.coverPreview" class="cover-preview" @click="openCoverModal">
            <img :src="packForm.coverPreview" alt="cover" />
          </div>
          <div v-else class="cover-placeholder"></div>
          <label class="file-upload-btn">
            Загрузить
            <input type="file" accept="image/*" @change="handleCoverUpload" />
          </label>
          <button v-if="packForm.coverPreview" type="button" class="btn-icon" @click="removeCover">
            <X :size="18" />
          </button>
        </div>
      </div>

      <h3>Карточки ({{ cards.length }})</h3>
      <div class="cards-grid">
        <div v-for="(card, index) in cards" :key="index" class="card-item">
          <div class="card-flip" @click="flipCard(index)" :class="{ flipped: flipped[index] }">
            <div class="card-front">
              <div v-if="card.imageUrl" class="card-image" @click.stop="openImageModal(card.imageUrl)">
                <img :src="card.imageUrl" alt="card" />
              </div>
              <div class="card-front-content">
                <span class="hanzi">{{ card.front }}</span>
                <span class="pinyin">{{ card.pinyin }}</span>
              </div>
            </div>
            <div class="card-back">
              <span class="translation">{{ card.back }}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-icon" @click.stop.prevent="playAudio(card.front)" title="Прослушать">
              <Volume2 :size="18" />
            </button>
            <button class="btn-icon" @click.stop.prevent="openStrokeOrder(card.front)" title="Порядок черт">
              <PenTool :size="18" />
            </button>
            <button class="btn-icon" @click.stop.prevent="uploadCardImage(index)" title="Загрузить изображение">
              <ImagePlus :size="18" />
            </button>
            <button class="btn-icon remove" @click.stop.prevent="removeCard(index)" title="Удалить">
              <Trash2 :size="18" />
            </button>
          </div>
        </div>
      </div>

      <div class="add-actions">
        <button type="button" class="btn btn-outline add-card-btn" @click="goToSelectWords">
          <Plus :size="16" /> Добавить из библиотеки
        </button>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-outline" @click="cancel">Отмена</button>
        <button type="submit" class="btn btn-primary" :disabled="!packForm.name.trim()">
          {{ isNew ? 'Создать' : 'Сохранить' }}
        </button>
      </div>
    </form>

    <!-- Скрытый input для загрузки изображения на карточку -->
    <input
      ref="cardImageInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleCardImageUpload"
    />

    <!-- Модалка для просмотра изображения -->
    <div v-if="showImageModal" class="modal-overlay" @click.self="closeImageModal">
      <div class="modal image-modal">
        <div class="modal-header">
          <h3>Просмотр</h3>
          <button class="btn-icon" @click="closeImageModal">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <img :src="modalImageSrc" class="modal-image" />
        </div>
      </div>
    </div>

    <!-- Модалка для порядка черт -->
    <div v-if="showStrokeModal" class="modal-overlay" @click.self="showStrokeModal = false">
      <div class="modal stroke-modal">
        <div class="modal-header">
          <h3>Порядок черт: {{ strokeCharacter }}</h3>
          <button class="btn-icon" @click="showStrokeModal = false">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <StrokeOrder :character="strokeCharacter" :size="200" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, Plus, Trash2, Volume2, PenTool, ImagePlus, X } from 'lucide-vue-next'
import { usePacksStore } from '@/stores/packsStore'
import { useAppStore } from '@/stores/appStore'
import { useVocabularyStore } from '@/stores/vocabularyStore'
import { speak } from '@/services/tts'
import StrokeOrder from '@/components/ui/StrokeOrder.vue'
import { HSK_LEVEL_COLORS, ROUTES } from '@/constants'
import type { HSKLevel } from '@/types'

const props = defineProps<{ packId?: string }>()
const router = useRouter()
const packsStore = usePacksStore()
const appStore = useAppStore()
const vocabStore = useVocabularyStore()

const isNew = computed(() => !props.packId)

interface PackForm {
  name: string
  description: string
  coverImage?: string
  coverPreview?: string
}

const packForm = ref<PackForm>({
  name: '',
  description: '',
  coverImage: undefined,
  coverPreview: undefined,
})

const selectedLevels = ref<HSKLevel[]>([])

interface CardEdit {
  front: string
  back: string
  pinyin: string
  imageUrl?: string
  source?: 'hsk' | 'user' | 'camera'
  sourceId?: number
}
const cards = ref<CardEdit[]>([])
const flipped = ref<boolean[]>([])

const cardImageInput = ref<HTMLInputElement | null>(null)
const currentCardIndexForImage = ref<number | null>(null)

const showImageModal = ref(false)
const modalImageSrc = ref('')
const showStrokeModal = ref(false)
const strokeCharacter = ref('')

// Вспомогательная функция для нормализации sourceId
function normalizeSourceId(id: string | number | undefined): number | undefined {
  if (id === undefined) return undefined
  if (typeof id === 'number') return id
  const num = Number(id)
  return isNaN(num) ? undefined : num
}

// Автоматическое определение уровней
const autoLevels = computed(() => {
  if (!vocabStore.words.length) return []
  const levels = new Set<HSKLevel>()
  cards.value.forEach(card => {
    if (card.source === 'hsk' && card.sourceId) {
      const word = vocabStore.words.find(w => w.id === card.sourceId)
      if (word) levels.add(word.level)
    }
  })
  return Array.from(levels).sort()
})

watch(autoLevels, (newLevels) => {
  selectedLevels.value = newLevels
}, { immediate: true })

// Восстановление из sessionStorage
onMounted(() => {
  const savedForm = sessionStorage.getItem('packEditForm')
  if (savedForm) packForm.value = JSON.parse(savedForm)
  const savedLevels = sessionStorage.getItem('packEditLevels')
  if (savedLevels) selectedLevels.value = JSON.parse(savedLevels)
})

watch(packForm, () => {
  sessionStorage.setItem('packEditForm', JSON.stringify(packForm.value))
}, { deep: true })

watch(selectedLevels, () => {
  sessionStorage.setItem('packEditLevels', JSON.stringify(selectedLevels.value))
})

function openImageModal(src: string) {
  modalImageSrc.value = src
  showImageModal.value = true
}

function closeImageModal() {
  showImageModal.value = false
}

function openCoverModal() {
  if (packForm.value.coverPreview) {
    openImageModal(packForm.value.coverPreview)
  }
}

onMounted(async () => {
  // Убедимся, что словарь загружен
  if (vocabStore.words.length === 0) {
    await vocabStore.loadVocabulary()
  }

  if (!isNew.value && props.packId) {
    const pack = await packsStore.loadPack(props.packId)
    if (pack) {
      packForm.value = {
        name: pack.name,
        description: pack.description || '',
        coverImage: pack.coverImage,
        coverPreview: pack.coverImage,
      }
      if (pack.level) {
        if (Array.isArray(pack.level)) {
          selectedLevels.value = pack.level as HSKLevel[]
        } else {
          selectedLevels.value = [pack.level as HSKLevel]
        }
      }
      const loadedCards = await packsStore.getCardsByPackId(props.packId)
      cards.value = loadedCards.map(c => ({
        front: c.front,
        back: c.back,
        pinyin: c.pinyin || '',
        imageUrl: c.imageUrl,
        source: c.source,
        sourceId: normalizeSourceId(c.sourceId), // преобразуем
      }))
      flipped.value = new Array(cards.value.length).fill(false)
    }
  }

  if (history.state && (history.state as any).selectedWords) {
    const selected = (history.state as any).selectedWords as CardEdit[]
    cards.value.push(...selected.map(c => ({
      ...c,
      sourceId: normalizeSourceId(c.sourceId) // преобразуем
    })))
    flipped.value = new Array(cards.value.length).fill(false)
    history.replaceState({}, document.title)
  }
})

function handleCoverUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    packForm.value.coverPreview = ev.target?.result as string
    packForm.value.coverImage = ev.target?.result as string
  }
  reader.readAsDataURL(file)
}

function removeCover() {
  packForm.value.coverPreview = undefined
  packForm.value.coverImage = undefined
}

function flipCard(index: number) {
  flipped.value[index] = !flipped.value[index]
}

function removeCard(index: number) {
  cards.value.splice(index, 1)
  flipped.value.splice(index, 1)
}

function goToSelectWords() {
  router.push({
    path: '/pack/select-words',
    query: { returnTo: props.packId ? `/pack/${props.packId}/edit` : '/pack/new' }
  })
}

async function playAudio(text: string) {
  try {
    await speak(text, 'zh-CN')
  } catch (error) {
    appStore.showToast('Ошибка воспроизведения', 'error')
  }
}

function openStrokeOrder(character: string) {
  strokeCharacter.value = character
  showStrokeModal.value = true
}

function uploadCardImage(index: number) {
  currentCardIndexForImage.value = index
  if (cardImageInput.value) {
    cardImageInput.value.value = ''
  }
  cardImageInput.value?.click()
}

function handleCardImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || currentCardIndexForImage.value === null) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const url = ev.target?.result as string
    cards.value[currentCardIndexForImage.value!].imageUrl = url
    currentCardIndexForImage.value = null
  }
  reader.readAsDataURL(file)
}

async function savePack() {
  if (!packForm.value.name.trim()) return

  const packLevel = selectedLevels.value.length ? selectedLevels.value : undefined

  const packData: any = {
    name: packForm.value.name,
    description: packForm.value.description,
    coverImage: packForm.value.coverImage,
    level: packLevel,
    isSystem: false,
  }

  if (isNew.value) {
    const pack = await packsStore.createPack(packData)
    if (pack && cards.value.length) {
      await packsStore.addCards(pack.id, cards.value.map(c => ({
        ...c,
        source: c.source || 'user',
      })))
    }
  } else if (props.packId) {
    await packsStore.updatePack(props.packId, packData)
    const oldCards = await packsStore.getCardsByPackId(props.packId)
    for (const card of oldCards) {
      await packsStore.deleteCard(card.id)
    }
    if (cards.value.length) {
      await packsStore.addCards(props.packId, cards.value.map(c => ({
        ...c,
        source: c.source || 'user',
      })))
    }
  }

  sessionStorage.removeItem('packEditForm')
  sessionStorage.removeItem('packEditLevels')

  router.push(ROUTES.PACKS)
}

function cancel() {
  sessionStorage.removeItem('packEditForm')
  sessionStorage.removeItem('packEditLevels')
  router.back()
}
</script>

<style scoped>
.pack-edit {
  padding: 1rem 1rem 80px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.form-group {
  margin-bottom: 1.5rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 2px solid var(--border);
  border-radius: 30px;
  background: var(--surface);
  color: var(--text-primary);
  box-sizing: border-box;
}
.level-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.level-badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}
.cover-upload {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.cover-preview {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  border: 2px solid var(--accent-color);
  overflow: hidden;
  cursor: pointer;
}
.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-placeholder {
  width: 60px;
  height: 60px;
  background: transparent;
}
.file-upload-btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: var(--accent-color);
  color: white;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 500;
}
.file-upload-btn input {
  display: none;
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}
.card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.card-flip {
  width: 100%;
  aspect-ratio: 3 / 4;
  position: relative;
  cursor: pointer;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.card-flip.flipped {
  transform: rotateY(180deg);
}
.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--card-shadow);
  padding: 0.5rem;
  box-sizing: border-box;
  overflow: hidden;
}
.card-front {
  transform: rotateY(0deg);
}
.card-back {
  transform: rotateY(180deg);
}
.card-image {
  width: 100%;
  height: 50%;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
}
.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card-front-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.hanzi {
  font-size: 1.8rem;
  font-weight: bold;
  line-height: 1.2;
}
.pinyin {
  font-size: 1rem;
  color: var(--text-secondary);
}
.translation {
  font-size: 1.2rem;
  text-align: center;
  color: var(--accent-color);
}
.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: center;
}
.btn-icon {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}
.btn-icon:hover {
  color: var(--accent-color);
}
.btn-icon.remove:hover {
  color: #f44336;
}
.add-actions {
  margin: 1rem 0;
}
.add-card-btn {
  width: 100%;
}
.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}
.actions .btn {
  flex: 1;
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
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.modal-body {
  display: flex;
  justify-content: center;
}
.modal-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
}
.stroke-modal .modal-body {
  justify-content: center;
}
</style>