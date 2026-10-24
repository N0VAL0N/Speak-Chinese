<template>
  <div class="packs-view" :class="{ embedded }">
    <SectionHeader v-if="!embedded" title="Мои паки" @open-profile="$router.push('/profile')" />

    <!-- Поиск и кнопка фильтров -->
    <div v-if="!noSearch" class="search-section">
      <div class="search-wrapper">
        <Search :size="20" class="search-icon" />
        <input v-model="searchQuery" class="search-input" placeholder="Поиск паков..." />
      </div>
      <button class="filter-btn" @click="showFilters = true">
        <Filter :size="20" />
      </button>
    </div>

    <!-- Сетка паков -->
    <div v-if="packsStore.isLoading" class="loading">Загрузка...</div>
    <div v-else class="packs-grid">
      <div
        v-for="pack in filteredPacks"
        :key="pack.id"
        class="pack-card deck-style"
        @click="openPackMenu(pack)"
      >
        <div class="pack-cover" :style="{ backgroundColor: pack.coverImage ? 'transparent' : 'var(--accent-color)' }">
          <img v-if="pack.coverImage" :src="pack.coverImage" alt="cover" />
          <span v-else class="pack-initial">{{ pack.name.charAt(0).toUpperCase() }}</span>
        </div>
        <div class="pack-info">
          <h3>{{ pack.name }}</h3>
          <p>{{ pack.cardCount }} карточек</p>
          <p v-if="pack.level" class="pack-level">
            HSK {{ Array.isArray(pack.level) ? pack.level.join(', ') : pack.level }}
          </p>
        </div>
        <button class="pack-menu-btn" @click.stop="openPackMenu(pack)">
          <MoreVertical :size="20" />
        </button>
      </div>

      <!-- Карточка добавления нового пака -->
      <div
        class="pack-card add-pack-card"
        @click="$router.push('/pack/new')"
        @mousemove="updateRipplePosition"
        @mouseleave="rippleX = 50; rippleY = 50"
      >
        <div
          class="ripple-effect"
          :style="{ '--x': rippleX + '%', '--y': rippleY + '%' }"
        ></div>
        <div class="pack-cover add-pack-cover">
          <Plus :size="32" />
        </div>
        <div class="add-actions" @click.stop>
          <button class="add-action-btn create-btn" @click.stop="$router.push('/pack/new')">
            <Plus :size="16" /> Создать
          </button>
          <button class="add-action-btn import-btn" @click.stop="triggerFileImport">
            <Upload :size="16" /> Импортировать
          </button>
        </div>
      </div>
    </div>

    <!-- Скрытый инпут для импорта -->
    <input ref="fileInput" type="file" accept=".json,application/json" style="display: none" @change="importPacks" />

    <!-- Модалка действий над паком -->
    <div v-if="selectedPack" class="modal-overlay" @click.self="selectedPack = null">
      <div class="modal pack-actions-modal">
        <div class="modal-header">
          <h3>{{ selectedPack.name }}</h3>
          <button class="btn-icon" @click="selectedPack = null">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <button class="action-btn" @click="editPack(selectedPack.id)">
            <Edit :size="20" /> Редактировать
          </button>
          <button class="action-btn" @click="confirmDelete(selectedPack)">
            <Trash2 :size="20" /> Удалить
          </button>
          <button class="action-btn" @click="studyPack(selectedPack.id)">
            <BookOpen :size="20" /> Учить иероглифы
          </button>
          <button class="action-btn" @click="exportPack(selectedPack.id)">
            <Share2 :size="20" /> Поделиться
          </button>
        </div>
      </div>
    </div>

    <!-- Модалка подтверждения удаления -->
    <ConfirmModal
      v-if="showDeleteConfirm"
      title="Удалить пак?"
      :message="`Вы уверены, что хотите удалить пак «${packToDelete?.name}»? Все карточки будут потеряны.`"
      confirmText="Удалить"
      @confirm="deletePackConfirmed"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Модалка фильтров и сортировки -->
    <div v-if="showFilters" class="modal-overlay" @click.self="showFilters = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Фильтры и сортировка</h3>
          <button class="btn-icon" @click="showFilters = false">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <div class="filter-group">
            <label>Сортировать по</label>
            <div class="sort-buttons">
              <button
                :class="['sort-btn', { active: sortBy === 'name' }]"
                @click="sortBy = 'name'"
              >
                Названию
              </button>
              <button
                :class="['sort-btn', { active: sortBy === 'date' }]"
                @click="sortBy = 'date'"
              >
                Дате
              </button>
              <button
                :class="['sort-btn', { active: sortBy === 'level' }]"
                @click="sortBy = 'level'"
              >
                Уровню HSK
              </button>
            </div>
          </div>
          <div class="filter-group">
            <label>Порядок</label>
            <div class="sort-order-buttons">
              <button
                :class="['order-btn', { active: sortAsc }]"
                @click="sortAsc = true"
              >
                <ArrowUp :size="18" /> По возрастанию
              </button>
              <button
                :class="['order-btn', { active: !sortAsc }]"
                @click="sortAsc = false"
              >
                <ArrowDown :size="18" /> По убыванию
              </button>
            </div>
          </div>
          <div class="filter-group">
            <label>Уровни HSK</label>
            <div class="level-buttons">
              <button
                v-for="level in HSK_LEVELS"
                :key="level"
                :class="['level-btn', { active: filterLevels.includes(level) }]"
                @click="toggleLevel(level)"
              >
                HSK {{ level }}
              </button>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" @click="resetFilters">Сбросить</button>
            <button class="btn btn-primary" @click="applyFilters">Применить</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePacksStore } from '@/stores/packsStore';
import { useAppStore } from '@/stores/appStore';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import ConfirmModal from '@/components/ui/ConfirmModal.vue';
import {
  Search, Filter, Plus, Edit, Trash2, X, Upload,
  MoreVertical, BookOpen, Share2, ArrowUp, ArrowDown
} from 'lucide-vue-next';
import { ROUTES, HSK_LEVELS } from '@/constants';
import type { Pack, HSKLevel } from '@/types';

const props = defineProps<{
  embedded?: boolean;
  noSearch?: boolean;
}>();

const router = useRouter();
const packsStore = usePacksStore();
const appStore = useAppStore();

// Поиск
const searchQuery = ref('');

// Сортировка
const sortBy = ref<'name' | 'date' | 'level'>('name');
const sortAsc = ref(true);

// Фильтры по уровням
const filterLevels = ref<HSKLevel[]>([]);

// Состояние модалки фильтров
const showFilters = ref(false);

// Модалка действий
const selectedPack = ref<Pack | null>(null);

// Модалка подтверждения удаления
const showDeleteConfirm = ref(false);
const packToDelete = ref<Pack | null>(null);

// Импорт
const fileInput = ref<HTMLInputElement | null>(null);

// Эффект волны для карточки добавления
const rippleX = ref(50);
const rippleY = ref(50);

// Вычисляемые паки с учётом поиска, сортировки и фильтров
const filteredPacks = computed(() => {
  let result = packsStore.packs;

  // Поиск
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(q));
  }

  // Фильтр по уровням
  if (filterLevels.value.length > 0) {
    result = result.filter(p => {
      if (!p.level) return false;
      const packLevels = Array.isArray(p.level) ? p.level : [p.level];
      return packLevels.some(l => filterLevels.value.includes(l as HSKLevel));
    });
  }

  // Сортировка
  result = [...result].sort((a, b) => {
    let valA: any, valB: any;

    if (sortBy.value === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortBy.value === 'date') {
      valA = a.createdAt;
      valB = b.createdAt;
    } else if (sortBy.value === 'level') {
      const getLevelNumber = (level: any): number => {
        if (!level) return 6;
        if (Array.isArray(level)) {
          return level.length ? Math.min(...level.map(l => Number(l))) : 6;
        }
        return Number(level);
      };
      valA = getLevelNumber(a.level);
      valB = getLevelNumber(b.level);
    }

    if (valA < valB) return sortAsc.value ? -1 : 1;
    if (valA > valB) return sortAsc.value ? 1 : -1;
    return 0;
  });

  return result;
});

function updateRipplePosition(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  rippleX.value = x;
  rippleY.value = y;
}

function openPackMenu(pack: Pack) {
  selectedPack.value = pack;
}

function editPack(packId: string) {
  selectedPack.value = null;
  router.push(`/pack/${packId}/edit`);
}

function confirmDelete(pack: Pack) {
  packToDelete.value = pack;
  showDeleteConfirm.value = true;
  selectedPack.value = null;
}

async function deletePackConfirmed() {
  if (!packToDelete.value) return;
  await packsStore.deletePack(packToDelete.value.id);
  showDeleteConfirm.value = false;
  packToDelete.value = null;
}

function studyPack(packId: string) {
  selectedPack.value = null;
  router.push(ROUTES.PACK_STUDY(packId));
}

async function exportPack(packId: string) {
  const pack = await packsStore.loadPack(packId);
  if (!pack) return;
  const cards = await packsStore.getCardsByPackId(packId);
  const exportData = [{
    name: pack.name,
    description: pack.description,
    coverImage: pack.coverImage,
    isSystem: pack.isSystem,
    tags: pack.tags,
    level: pack.level,
    cards: cards.map(c => ({
      front: c.front,
      back: c.back,
      pinyin: c.pinyin,
      example: c.example,
      imageUrl: c.imageUrl,
      audioUrl: c.audioUrl,
      tags: c.tags,
      source: c.source,
      sourceId: c.sourceId,
    })),
  }];
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const file = new File([blob], `${pack.name}.json`, { type: 'application/json' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: pack.name,
        text: pack.description || 'Мой пак из HSK Trainer',
        files: [file],
      });
      return;
    } catch (e) {
      console.warn('Share failed, falling back to download', e);
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pack.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function triggerFileImport() {
  fileInput.value?.click();
}

async function importPacks(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const importedPacks = JSON.parse(text);
    if (!Array.isArray(importedPacks)) throw new Error('Неверный формат файла');
    for (const packData of importedPacks) {
      const { cards: importedCards, ...packInfo } = packData;
      const pack = await packsStore.createPack(packInfo);
      if (pack && importedCards?.length) {
        await packsStore.addCards(pack.id, importedCards);
      }
    }
    await packsStore.loadPacks();
    if (fileInput.value) fileInput.value.value = '';
    appStore.showToast('Паки успешно импортированы', 'success');
  } catch (error) {
    console.error('Ошибка импорта:', error);
    appStore.showToast('Не удалось импортировать паки. Проверьте формат файла.', 'error');
  }
}

function toggleLevel(level: HSKLevel) {
  const idx = filterLevels.value.indexOf(level);
  if (idx >= 0) filterLevels.value.splice(idx, 1);
  else filterLevels.value.push(level);
}

function resetFilters() {
  filterLevels.value = [];
  sortBy.value = 'name';
  sortAsc.value = true;
  showFilters.value = false;
}

function applyFilters() {
  showFilters.value = false;
}

onMounted(() => {
  packsStore.loadPacks();
});
</script>

<style scoped>
.packs-view {
  padding: 0;
}
.packs-view.embedded {
  padding: 0;
}
.packs-view {
  padding: 1rem 0 80px;
}

/* Поиск */
.search-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.search-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-secondary);
}
.search-input {
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 2.5rem;
  border: 2px solid var(--border);
  border-radius: 30px;
  background: var(--surface);
  color: var(--text-primary);
  font-size: 1rem;
}
.filter-btn {
  width: 48px;
  height: 48px;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn:hover {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 5%, var(--surface));
}

/* Сетка - главное исправление */
.packs-grid {
  display: grid;
  grid-template-columns: 50% 50%;
  gap: 0.75rem; /* уменьшили gap */
  width: 100%;
  box-sizing: border-box;
}

/* Общие стили карточки пака */
.pack-card {
  position: relative;
  background: var(--surface);
  border-radius: 16px;
  padding: 0.5rem; 
  box-shadow: 0 4px 10px rgba(0,0,0,0.1), 2px 4px 8px rgba(0,0,0,0.05), -2px 4px 8px rgba(0,0,0,0.05);
  border: 1px solid rgba(128,128,128,0.2);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  z-index: 1;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
}

.deck-style::before,
.deck-style::after {
  content: '';
  position: absolute;
  top: -4px;
  left: 4px;
  right: 4px;
  height: 8px;
  background: color-mix(in srgb, var(--surface) 90%, black);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
  border: 1px solid rgba(128,128,128,0.2);
  border-bottom: none;
  z-index: -1;
}
.deck-style::after {
  top: -8px;
  left: 8px;
  right: 8px;
  height: 8px;
  background: color-mix(in srgb, var(--surface) 80%, black);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 6px rgba(0,0,0,0.1);
  border: 1px solid rgba(128,128,128,0.2);
  border-bottom: none;
}

.pack-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.15), 2px 4px 12px rgba(0,0,0,0.1), -2px 4px 12px rgba(0,0,0,0.1);
}

.pack-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  background: var(--accent-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  margin-bottom: 0.25rem;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.3);
}
.pack-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pack-initial {
  font-size: 3rem;
  font-weight: bold;
  color: white;
  text-transform: uppercase;
}
.pack-info h3 {
  margin: 0 0 0.2rem 0;
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
}
.pack-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
}
.pack-level {
  font-size: 0.8rem;
  color: var(--accent-color);
  margin-top: 0.2rem;
}

.pack-menu-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255,255,255,0.8);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-color);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}
.dark .pack-menu-btn {
  background: rgba(0,0,0,0.6);
}
.pack-menu-btn:hover {
  background: var(--accent-color);
  color: white;
  transform: scale(1.1);
}

/* Карточка добавления */
.add-pack-card {
  position: relative;
  border: 2px dashed color-mix(in srgb, var(--accent-color) 30%, transparent);
  background: color-mix(in srgb, var(--accent-color) 8%, transparent);
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: default;
  overflow: hidden;
  transition: box-shadow 0.3s, border-color 0.3s;
}
.add-pack-card:hover {
  border-color: color-mix(in srgb, var(--accent-color) 60%, white);
  background: color-mix(in srgb, var(--accent-color) 12%, transparent);
}
.add-pack-card::before,
.add-pack-card::after {
  content: '';
  position: absolute;
  top: -4px;
  left: 4px;
  right: 4px;
  height: 8px;
  background: color-mix(in srgb, var(--accent-color) 12%, transparent);
  border-radius: 16px 16px 0 0;
  backdrop-filter: blur(4px);
  box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
  z-index: -1;
}
.add-pack-card::after {
  top: -8px;
  left: 8px;
  right: 8px;
  height: 8px;
  background: color-mix(in srgb, var(--accent-color) 10%, transparent);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 6px rgba(0,0,0,0.1);
}
.add-pack-card .ripple-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(255,255,255,0.3) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.2s;
}
.add-pack-card:hover .ripple-effect {
  opacity: 0.5;
}
.add-pack-cover {
  background: color-mix(in srgb, var(--accent-color) 20%, transparent);
  color: white;
  border: 2px dashed color-mix(in srgb, var(--accent-color) 50%, white);
  margin-bottom: 0.5rem;
  backdrop-filter: blur(5px);
  transition: all 0.3s;
}
.add-pack-card:hover .add-pack-cover {
  border-color: white;
  background: color-mix(in srgb, var(--accent-color) 30%, transparent);
}
.add-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  position: relative;
  z-index: 2;
}
.add-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  backdrop-filter: blur(5px);
  color: white;
}
.create-btn {
  background: color-mix(in srgb, var(--accent-color) 70%, white);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--accent-color) 30%, transparent);
}
.create-btn:hover {
  background: var(--accent-color);
  transform: scale(1.02);
  box-shadow: 0 4px 12px var(--accent-color);
}
.import-btn {
  background: color-mix(in srgb, var(--accent-color) 20%, transparent);
  border: 2px solid color-mix(in srgb, var(--accent-color) 50%, white);
}
.import-btn:hover {
  background: color-mix(in srgb, var(--accent-color) 40%, transparent);
  border-color: white;
}

/* Модальные окна */
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
  max-width: 400px;
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
  margin: 0;
  color: var(--text-primary);
  text-align: center;
  flex: 1;
}
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.filter-group {
  margin-bottom: 0.5rem;
}
.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
}
.sort-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.sort-btn {
  flex: 1;
  padding: 0.6rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  min-width: 80px;
}
.sort-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.sort-order-buttons {
  display: flex;
  gap: 0.5rem;
}
.order-btn {
  flex: 1;
  padding: 0.6rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}
.order-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.level-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.level-btn {
  padding: 0.6rem 1.2rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 40px;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  min-width: 70px;
  text-align: center;
}
.level-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
.btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  border: 2px solid transparent;
}
.btn-outline {
  background: transparent;
  border: 2px solid var(--accent-color);
  color: var(--accent-color);
}
.btn-outline:hover {
  background: color-mix(in srgb, var(--accent-color) 10%, transparent);
}
.btn-primary {
  background: var(--accent-color);
  color: white;
}
.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px var(--accent-color);
}
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  border: 2px solid transparent;
  border-radius: 30px;
  background: var(--surface);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
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
.loading {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
}
</style>