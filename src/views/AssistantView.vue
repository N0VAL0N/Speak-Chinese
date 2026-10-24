<template>
  <div class="assistant-view">
    <div class="assistant-header">
      <button class="back-btn" @click="$router.back()">
        <ChevronLeft :size="24" />
      </button>
      <h2>Саша (萨莎)</h2>
      <div class="placeholder"></div>
    </div>

    <div class="messages" ref="messagesRef">
      <div v-if="messages.length === 0" class="welcome-message">
        Привет! Я Саша. Задай мне вопрос о китайском языке.
      </div>
      <div v-for="(msg) in messages" :key="msg.id" class="message" :class="msg.role">
        <div class="bubble">{{ msg.content }}</div>
        <button v-if="msg.showSaveButton" class="save-btn" @click="saveItem(msg)">
          <Bookmark :size="14" /> Сохранить
        </button>
      </div>
    </div>

    <div class="input-area">
      <input
        ref="inputRef"
        v-model="inputText"
        type="text"
        class="message-input"
        placeholder="Напишите сообщение..."
        @keyup.enter="handleSend"
        :disabled="isSending"
      />
      <button
        v-if="inputText.trim()"
        class="icon-btn send-btn"
        :disabled="isSending"
        @click="handleSend"
      >
        <Send :size="18" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ChevronLeft, Send, Bookmark } from 'lucide-vue-next'
import { assistant } from '@/services/assistantEngine'
import { useAppStore } from '@/stores/appStore'
import type { Message } from '@/types'

const appStore = useAppStore()
const messages = ref<Message[]>([])
const inputText = ref('')
const isSending = ref(false)
const messagesRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

const handleSend = async () => {
  const messageText = inputText.value.trim()
  if (!messageText || isSending.value) return

  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    content: messageText,
    timestamp: Date.now()
  })
  inputText.value = ''
  scrollToBottom()
  isSending.value = true

  messages.value.push({
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: 'Думаю...',
    timestamp: Date.now()
  })
  scrollToBottom()

  const answer = await assistant.ask(messageText)
  const lastIndex = messages.value.length - 1
  messages.value[lastIndex].content = answer
  scrollToBottom()
  isSending.value = false
  inputRef.value?.focus()
}

function saveItem(msg: Message) {
  console.log('Saving:', msg.content)
  appStore.showToast('Сохранено', 'success')
}

onMounted(() => {
  const initialText = appStore.getAndClearSelectedText()
  if (initialText) {
    inputText.value = initialText
  }
  inputRef.value?.focus()
})
</script>

<style scoped>
/* стили из предыдущего ответа */
</style>

<style scoped>
.assistant-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
}

.assistant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.assistant-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--accent-color);
  margin: 0;
}

.back-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 12px;
  cursor: pointer;
  color: var(--accent-color);
}

.placeholder {
  width: 40px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.welcome-message {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
  font-style: italic;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.bubble {
  padding: 0.75rem 1rem;
  border-radius: 18px;
  background: var(--surface);
  color: var(--text-primary);
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.4;
  border: 1px solid var(--border);
}

.message.user .bubble {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.save-btn {
  margin-top: 0.25rem;
  align-self: flex-end;
  background: var(--surface);
  border: 1px solid var(--accent-color);
  color: var(--accent-color);
  border-radius: 20px;
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover {
  background: var(--accent-color);
  color: white;
}

.input-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border);
  background: var(--surface);
}

.message-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border);
  border-radius: 30px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: var(--accent-color);
}

.icon-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--surface);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid var(--border);
}

.icon-btn:hover {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 10%, var(--surface));
}

.send-btn {
  background: var(--accent-color);
  color: white;
  border: none;
}

.send-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent-color) 80%, black);
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  background: var(--border);
}
</style>