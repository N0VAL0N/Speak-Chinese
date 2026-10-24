import type { HSKLevel } from '@/types';
import type { ExamBlueprint } from '@/types';
import { HSKLevel as LevelEnum } from '@/constants';

export const hskBlueprints: Record<HSKLevel, ExamBlueprint> = {
  [LevelEnum.Level1]: {
    level: LevelEnum.Level1,
    totalTime: 40,
    sections: [
      { name: 'Аудирование', type: 'listening', questionCount: 20, sources: ['vocabulary'] },
      { name: 'Чтение', type: 'reading', questionCount: 20, sources: ['reading'] },
    ],
  },
  [LevelEnum.Level2]: {
    level: LevelEnum.Level2,
    totalTime: 55,
    sections: [
      { name: 'Аудирование', type: 'listening', questionCount: 25, sources: ['vocabulary'] },
      { name: 'Чтение', type: 'reading', questionCount: 25, sources: ['reading'] },
    ],
  },
  [LevelEnum.Level3]: {
    level: LevelEnum.Level3,
    totalTime: 90,
    sections: [
      { name: 'Аудирование', type: 'listening', questionCount: 40, sources: ['vocabulary'] },
      { name: 'Чтение', type: 'reading', questionCount: 30, sources: ['reading'] },
      { name: 'Письмо', type: 'writing', questionCount: 10, sources: ['grammar'] },
    ],
  },
  [LevelEnum.Level4]: {
    level: LevelEnum.Level4,
    totalTime: 105,
    sections: [
      { name: 'Аудирование', type: 'listening', questionCount: 45, sources: ['vocabulary'] },
      { name: 'Чтение', type: 'reading', questionCount: 40, sources: ['reading'] },
      { name: 'Письмо', type: 'writing', questionCount: 15, sources: ['grammar'] },
    ],
  },
  [LevelEnum.Level5]: {
    level: LevelEnum.Level5,
    totalTime: 125,
    sections: [
      { name: 'Аудирование', type: 'listening', questionCount: 45, sources: ['vocabulary'] },
      { name: 'Чтение', type: 'reading', questionCount: 45, sources: ['reading'] },
      { name: 'Письмо', type: 'writing', questionCount: 10, sources: ['grammar'] },
    ],
  },
};