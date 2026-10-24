import { hskBlueprints } from './blueprints';
import { 
  generateListeningQuestions,
  generateReadingQuestions,
  generateGrammarQuestions,
  generateWritingQuestions 
} from './generators';
import type { Exam, HSKLevel } from '@/types';
import type { ExamQuestion } from '@/types';
import { shuffleArray } from '@/constants/shuffle';

export async function generateExam(level: HSKLevel, customTitle?: string): Promise<Exam> {
  console.log(`[exam-generator] generating exam for level ${level}`);

  const blueprint = hskBlueprints[level];
  if (!blueprint) throw new Error(`Уровень ${level} не поддерживается`);

  const sections = [];

  for (const section of blueprint.sections) {
    let questions: ExamQuestion[] = [];

    switch (section.type) {
      case 'listening':
        questions = generateListeningQuestions(level, section.questionCount) as unknown as ExamQuestion[];
        break;
      case 'reading':
        questions = generateReadingQuestions(level, section.questionCount) as unknown as ExamQuestion[];
        break;
      case 'grammar':
        questions = generateGrammarQuestions(level, section.questionCount) as unknown as ExamQuestion[];
        break;
      case 'writing':
        questions = generateWritingQuestions(level, section.questionCount) as unknown as ExamQuestion[];
        break;
    }

    questions = shuffleArray(questions);

    if (section.type === 'reading') {
      questions = questions.map(q => {
        if ((q as any).type === 'reading') {
          const readingQ = q as any;
          return {
            ...readingQ,
            items: readingQ.items.map((item: { question: string; options: string[]; answer: number }) => ({
              ...item,
              options: shuffleArray(item.options)
            }))
          } as ExamQuestion;
        }
        return q;
      });
    }

    sections.push({
      name: section.name,
      questions,
    });

    console.log(`[exam-generator] section ${section.name}: generated ${questions.length} questions`);
  }

  const exam: Exam = {
    id: `exam-${level}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: customTitle || `HSK ${level} Пробный экзамен`,
    level,
    sections: sections,
    totalTime: blueprint.totalTime || 60,
  };

  console.log('[exam-generator] exam generated:', exam.id);
  return exam;
}