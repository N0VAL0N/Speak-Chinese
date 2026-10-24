import json
import os
from pathlib import Path

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_knowledge_base():
    # Пути к исходным файлам
    data_dir = Path('src/data')
    hsk_all = load_json(data_dir / 'hsk_all.json')
    grammar_all = load_json(data_dir / 'grammar_all.json')
    lesson_topics = load_json(data_dir / 'lessonTopics.json')
    radicals = load_json(data_dir / 'radicals.json')

    knowledge_base = []

    # 1. Слова
    for word in hsk_all:
        text = f"{word['simplified']} ({word['pinyin']}) – {word['translations']['ru']}"
        answer = f"{word['simplified']} ({word['pinyin']}) – {word['translations']['ru']}. Уровень HSK {word['level']}."
        knowledge_base.append({
            'id': f"word_{word['id']}",
            'text': text,
            'answer': answer,
            'type': 'word',
            'keywords': [word['simplified'], word['translations']['ru']]
        })

    # 2. Грамматика
    for grammar in grammar_all:
        text = f"{grammar['pattern']} – {grammar['explanation']}"
        examples = '; '.join([ex.get('chinese', '') + ' – ' + ex.get('translation', '') for ex in grammar['examples'][:3]])
        answer = f"{grammar['pattern']} – {grammar['explanation']}\nПримеры: {examples}"
        knowledge_base.append({
            'id': f"grammar_{grammar['id']}",
            'text': text,
            'answer': answer,
            'type': 'grammar',
            'keywords': [grammar['pattern']] + grammar.get('topics', [])
        })

    # 3. Диалоги из уроков
    for lesson_id, lesson in lesson_topics.items():
        if 'dialogues' in lesson:
            for dialogue in lesson['dialogues']:
                lines_text = '\n'.join([f"{line['speaker']}: {line['chinese']} – {line['russian']}" for line in dialogue['lines']])
                text = f"Диалог: {lesson['title']}"
                answer = f"{lesson['title']}\n{lines_text}"
                knowledge_base.append({
                    'id': f"dialogue_{lesson_id}_{dialogue['id']}",
                    'text': text,
                    'answer': answer,
                    'type': 'dialogue',
                    'keywords': [lesson['title']] + lesson.get('topics', [])
                })

    # 4. Радикалы
    for radical in radicals:
        text = f"{radical['character']} ({radical['pinyin']}) – {radical['meaning']}"
        answer = f"{radical['character']} – {radical['meaning']}. Черты: {radical['strokes']}. Примеры: {', '.join(radical.get('examples', []))}"
        knowledge_base.append({
            'id': f"radical_{radical['id']}",
            'text': text,
            'answer': answer,
            'type': 'radical',
            'keywords': [radical['character'], radical['meaning']]
        })

    # Сохраняем в public/data
    output_dir = Path('public/data')
    output_dir.mkdir(parents=True, exist_ok=True)
    with open(output_dir / 'knowledge_base.json', 'w', encoding='utf-8') as f:
        json.dump(knowledge_base, f, ensure_ascii=False, indent=2)

    print(f"Knowledge base saved with {len(knowledge_base)} entries.")

if __name__ == '__main__':
    generate_knowledge_base()