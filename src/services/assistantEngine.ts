import Fuse from 'fuse.js';

interface KnowledgeItem {
  id: string;
  text: string;
  answer: string;
  type: 'word' | 'grammar' | 'dialogue' | 'radical';
  keywords: string[];
}

interface Intent {
  name: string;
  patterns: string[];
  responses?: string[];
  isFact?: boolean;
}

export class AssistantEngine {
  private intents: Intent[] = [];
  private knowledgeBase: KnowledgeItem[] = [];
  private fuse: Fuse<KnowledgeItem> | null = null;
  private cache = new Map<string, { answer: string; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private readonly MAX_QUESTION_LENGTH = 200;
  private initialized = false;

  async init() {
    if (this.initialized) return;
    
    try {
      console.log('🔄 Загрузка intents.json...');
      const intentsRes = await fetch('/intents.json');
      if (!intentsRes.ok) {
        throw new Error(`Failed to load intents: ${intentsRes.status}`);
      }
      this.intents = await intentsRes.json();
      console.log('✅ Intents загружены:', this.intents.length);
    } catch (e) {
      console.error('❌ intents.json не загружен:', e);
      this.intents = [];
    }

    try {
      console.log('🔄 Загрузка knowledge_base.json...');
      const kbRes = await fetch('/knowledge_base.json');
      if (!kbRes.ok) {
        throw new Error(`Failed to load knowledge base: ${kbRes.status}`);
      }
      this.knowledgeBase = await kbRes.json();
      console.log('✅ Knowledge base загружена:', this.knowledgeBase.length);

      if (this.knowledgeBase.length) {
        this.fuse = new Fuse(this.knowledgeBase, {
          keys: [
            { name: 'text', weight: 1 },
            { name: 'keywords', weight: 2 }
          ],
          includeScore: true,
          threshold: 0.3,
          ignoreLocation: true,
          minMatchCharLength: 2
        });
        console.log('✅ Fuse индекс построен');
      }
    } catch (e) {
      console.error('❌ knowledge_base.json не загружен:', e);
      this.knowledgeBase = [];
    }
    
    this.initialized = true;
  }

  async ask(question: string): Promise<string> {
    if (!this.initialized) {
      await this.init();
    }

    console.log('📝 Вопрос:', question);

    if (question.length > this.MAX_QUESTION_LENGTH) {
      return 'Слишком длинный вопрос. Пожалуйста, сократите.';
    }

    const cached = this.getCached(question);
    if (cached) {
      console.log('📦 Ответ из кэша');
      return cached;
    }

    const lowerQuestion = question.toLowerCase().trim();

    // Поиск по интентам
    const intent = this.classifyIntent(lowerQuestion);
    if (intent && !intent.isFact && intent.responses?.length) {
      const answer = intent.responses[Math.floor(Math.random() * intent.responses.length)];
      console.log('💬 Ответ из интента:', intent.name);
      this.setCache(question, answer);
      return answer;
    }

    // Поиск в базе знаний
    if (this.fuse) {
      const fact = this.lookupFact(lowerQuestion);
      if (fact) {
        console.log('📚 Найден факт из базы знаний');
        this.setCache(question, fact.answer);
        return fact.answer;
      }
    }

    // Fallback
    return this.fallback();
  }

  private classifyIntent(question: string): Intent | null {
    for (const intent of this.intents) {
      for (const pattern of intent.patterns) {
        if (question.includes(pattern.toLowerCase())) {
          return intent;
        }
      }
    }
    return null;
  }

  private lookupFact(question: string): KnowledgeItem | null {
    if (!this.fuse) return null;
    
    const results = this.fuse.search(question);
    if (results.length > 0 && results[0].score && results[0].score < 0.5) {
      return results[0].item;
    }
    
    return null;
  }

  private fallback(): string {
    const variants = [
      "Я не совсем поняла. Может, спросите что-то по китайскому языку?",
      "Хм, давайте вернёмся к учёбе. Что именно вас интересует?",
      "Я лучше отвечаю на вопросы про китайский. Попробуйте спросить о слове или грамматике.",
      "Не уверена, что правильно поняла. Можете перефразировать?"
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  private getCached(question: string): string | null {
    const cached = this.cache.get(question);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.answer;
    }
    return null;
  }

  private setCache(question: string, answer: string) {
    this.cache.set(question, { answer, timestamp: Date.now() });
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }
}

export const assistant = new AssistantEngine();