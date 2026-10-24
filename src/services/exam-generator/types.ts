export interface Exam {
  id: string;
  title: string;
  level: string;
  sections: ExamSection[];
  totalTime?: number; // опционально
}

export interface ExamSection {
  name: string;
  questions: ExamQuestion[];
}

export type ExamQuestion = 
  | ListeningQuestion
  | ReadingQuestion
  | GrammarQuestion
  | WritingQuestion;

export interface ListeningQuestion {
  type: 'listening';
  text: string;        // что показывать на экране (инструкция)
  word: string;         // слово для озвучки (simplified)
  options: string[];    // варианты перевода
  correctAnswer: string;
}

export interface ReadingQuestion {
  type: 'reading';
  text: string;         // сам текст
  items: {
    question: string;
    options: string[];
    answer: number;
  }[];
}

export interface GrammarQuestion {
  type: 'fill-blank';
  sentence: string;
  options: string[];
  correctAnswer: number;
}

export interface WritingQuestion {
  type: 'translate';
  question: string;     // русская фраза
  correctAnswer: string; // китайский перевод
}