// stores/packsStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { initDB } from '@/db/db';
import type { Pack, Card } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const usePacksStore = defineStore('packs', () => {
  const packs = ref<Pack[]>([]);
  const currentPack = ref<Pack | null>(null);
  const cards = ref<Card[]>([]);
  const isLoading = ref(false);

  async function loadPacks() {
    isLoading.value = true;
    try {
      const db = await initDB();
      const allPacks = await db.getAll('packs');
      packs.value = allPacks.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Error loading packs:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadPack(packId: string) {
    isLoading.value = true;
    try {
      const db = await initDB();
      const pack = await db.get('packs', packId);
      if (!pack) return null;
      currentPack.value = pack;

      const allCards = await db.getAll('cards');
      cards.value = allCards.filter(c => c.packId === packId);
      return pack;
    } catch (error) {
      console.error('Error loading pack:', error);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function createPack(packData: Omit<Pack, 'id' | 'createdAt' | 'updatedAt' | 'cardCount'>) {
    const now = Date.now();

    // Обработка level: приводим к массиву строк или undefined
    let level = packData.level;
    if (level !== undefined) {
      if (!Array.isArray(level)) {
        level = [level];
      }
      // Убираем null/undefined (пустых строк быть не может, т.к. HSKLevel только '1'..'5')
      level = level.filter(l => l != null);
      if (level.length === 0) {
        level = undefined;
      }
    }

    const pack: Pack = {
      id: uuidv4(),
      ...packData,
      level,
      createdAt: now,
      updatedAt: now,
      cardCount: 0,
    };

    try {
      const db = await initDB();
      // Глубокое клонирование для избежания DataCloneError
      const packToSave = JSON.parse(JSON.stringify(pack));
      await db.put('packs', packToSave);
      packs.value.push(pack);
      return pack;
    } catch (error) {
      console.error('Error creating pack:', error);
      return null;
    }
  }

  async function updatePack(packId: string, updates: Partial<Pack>) {
    try {
      const db = await initDB();
      const pack = await db.get('packs', packId);
      if (!pack) return false;

      // Обработка level, если он есть в updates
      let level = updates.level;
      if (level !== undefined) {
        if (!Array.isArray(level)) {
          level = [level];
        }
        level = level.filter(l => l != null);
        if (level.length === 0) {
          level = undefined;
        }
        updates.level = level;
      }

      const updated = { ...pack, ...updates, updatedAt: Date.now() };
      const updatedToSave = JSON.parse(JSON.stringify(updated));
      await db.put('packs', updatedToSave);
      const index = packs.value.findIndex(p => p.id === packId);
      if (index !== -1) packs.value[index] = updated;
      if (currentPack.value?.id === packId) currentPack.value = updated;
      return true;
    } catch (error) {
      console.error('Error updating pack:', error);
      return false;
    }
  }

  async function deletePack(packId: string) {
    try {
      const db = await initDB();
      const tx = db.transaction(['packs', 'cards'], 'readwrite');
      await tx.objectStore('packs').delete(packId);

      const allCards = await tx.objectStore('cards').getAll();
      const toDelete = allCards.filter(c => c.packId === packId);
      for (const card of toDelete) {
        await tx.objectStore('cards').delete(card.id);
      }
      await tx.done;

      packs.value = packs.value.filter(p => p.id !== packId);
      if (currentPack.value?.id === packId) currentPack.value = null;
      return true;
    } catch (error) {
      console.error('Error deleting pack:', error);
      return false;
    }
  }

  // ========== Работа с карточками ==========

  async function addCard(packId: string, cardData: Omit<Card, 'id' | 'packId' | 'dueDate' | 'lastReview' | 'totalReviews' | 'correctCount' | 'streak' | 'easiness' | 'interval' | 'repetitions'>) {
    const now = Date.now();
    const card: Card = {
      id: uuidv4(),
      packId,
      ...cardData,
      easiness: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: now,
      lastReview: 0,
      totalReviews: 0,
      correctCount: 0,
      streak: 0,
    };
    try {
      const db = await initDB();
      await db.put('cards', card);
      if (currentPack.value?.id === packId) {
        cards.value.push(card);
      }
      await updatePack(packId, { cardCount: (await getCardCount(packId)) });
      return card;
    } catch (error) {
      console.error('Error adding card:', error);
      return null;
    }
  }

  async function addCards(packId: string, cardDataArray: Omit<Card, 'id' | 'packId' | 'dueDate' | 'lastReview' | 'totalReviews' | 'correctCount' | 'streak' | 'easiness' | 'interval' | 'repetitions'>[]) {
    try {
      const db = await initDB();
      const tx = db.transaction(['cards', 'packs'], 'readwrite');
      const now = Date.now();
      for (const data of cardDataArray) {
        const card: Card = {
          id: uuidv4(),
          packId,
          ...data,
          easiness: 2.5,
          interval: 0,
          repetitions: 0,
          dueDate: now,
          lastReview: 0,
          totalReviews: 0,
          correctCount: 0,
          streak: 0,
        };
        await tx.objectStore('cards').put(card);
      }
      const allCards = await tx.objectStore('cards').getAll();
      const cardCount = allCards.filter(c => c.packId === packId).length;
      const pack = await tx.objectStore('packs').get(packId);
      if (pack) {
        pack.cardCount = cardCount;
        pack.updatedAt = now;
        await tx.objectStore('packs').put(pack);
      }
      await tx.done;

      if (currentPack.value?.id === packId) {
        await loadPack(packId);
      } else {
        const index = packs.value.findIndex(p => p.id === packId);
        if (index !== -1) {
          packs.value[index].cardCount = cardCount;
          packs.value[index].updatedAt = now;
        }
      }
    } catch (error) {
      console.error('Error adding cards:', error);
    }
  }

  async function getCardCount(packId: string): Promise<number> {
    const db = await initDB();
    const allCards = await db.getAll('cards');
    return allCards.filter(c => c.packId === packId).length;
  }

  async function updateCard(cardId: string, updates: Partial<Card>) {
    try {
      const db = await initDB();
      const card = await db.get('cards', cardId);
      if (!card) return false;
      const updated = { ...card, ...updates };
      await db.put('cards', updated);
      if (currentPack.value?.id === card.packId) {
        const index = cards.value.findIndex(c => c.id === cardId);
        if (index !== -1) cards.value[index] = updated;
      }
      return true;
    } catch (error) {
      console.error('Error updating card:', error);
      return false;
    }
  }

  async function deleteCard(cardId: string) {
    try {
      const db = await initDB();
      const card = await db.get('cards', cardId);
      if (!card) return false;
      await db.delete('cards', cardId);
      if (currentPack.value?.id === card.packId) {
        cards.value = cards.value.filter(c => c.id !== cardId);
      }
      await updatePack(card.packId, { cardCount: (await getCardCount(card.packId)) });
      return true;
    } catch (error) {
      console.error('Error deleting card:', error);
      return false;
    }
  }

  async function getDueCards(packId: string, limit: number = 20): Promise<Card[]> {
    const db = await initDB();
    const allCards = await db.getAll('cards');
    const now = Date.now();
    return allCards
      .filter(c => c.packId === packId && c.dueDate <= now)
      .sort((a, b) => a.dueDate - b.dueDate)
      .slice(0, limit);
  }

  function applySM2(card: Card, quality: number): Card {
    if (quality < 3) {
      card.repetitions = 0;
      card.interval = 1;
    } else {
      if (card.repetitions === 0) {
        card.interval = 1;
      } else if (card.repetitions === 1) {
        card.interval = 6;
      } else {
        card.interval = Math.round(card.interval * card.easiness);
      }
      card.repetitions++;
    }

    card.easiness = Math.max(1.3, card.easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    const now = Date.now();
    card.lastReview = now;
    card.dueDate = now + card.interval * 24 * 60 * 60 * 1000;

    card.totalReviews++;
    if (quality >= 3) {
      card.correctCount++;
      card.streak++;
    } else {
      card.streak = 0;
    }

    return card;
  }

  async function answerCard(cardId: string, quality: number) {
    console.log(`Answering card ${cardId} with quality ${quality}`);
    const db = await initDB();
    const card = await db.get('cards', cardId);
    if (!card) return false;
    const updated = applySM2(card, quality);
    await db.put('cards', updated);
    if (currentPack.value?.id === card.packId) {
      const index = cards.value.findIndex(c => c.id === cardId);
      if (index !== -1) cards.value[index] = updated;
    }
    return true;
  }

  async function getCardsByPackId(packId: string): Promise<Card[]> {
    const db = await initDB();
    const allCards = await db.getAll('cards');
    return allCards.filter(c => c.packId === packId);
  }

  return {
    packs,
    currentPack,
    cards,
    isLoading,
    loadPacks,
    loadPack,
    createPack,
    updatePack,
    deletePack,
    addCard,
    addCards,
    updateCard,
    deleteCard,
    getDueCards,
    answerCard,
    getCardsByPackId,
  };
});