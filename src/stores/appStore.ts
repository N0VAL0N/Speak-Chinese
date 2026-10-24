// stores/appStore.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { HSKLevel } from '@/constants'

export type ColorScheme = 'green' | 'teal' | 'purple' | 'pink' | 'orange'

export const useAppStore = defineStore('app', () => {
  const interfaceLanguage = ref<'ru' | 'en'>('ru')
  const targetLanguage = ref<'chinese' | 'english' | 'russian'>('chinese')
  const targetLanguages = ref<string[]>(['chinese'])
  const currentHSKLevel = ref<HSKLevel>(HSKLevel.Level1)
  const isMenuOpen = ref(false)

  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
  const theme = ref<'light' | 'dark' | 'system'>(savedTheme || 'system')

  const savedFontSize = localStorage.getItem('fontSize') as 'small' | 'medium' | 'large' | null
  const fontSize = ref<'small' | 'medium' | 'large'>(savedFontSize || 'medium')

  const savedColorScheme = localStorage.getItem('colorScheme') as ColorScheme | null
  const colorScheme = ref<ColorScheme>(savedColorScheme || 'green')

  const isSettingsOpen = ref(false)
  const toast = ref<((message: string, type?: 'success' | 'error' | 'info' | 'warning') => void) | undefined>()
  
  // Флаг активной сессии практики
  const isInSession = ref(false)
  
  // Текст для ассистента
  const selectedTextForAssistant = ref<string | null>(null)

  function applyTheme() {
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme.value === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      prefersDark
        ? document.documentElement.classList.add('dark')
        : document.documentElement.classList.remove('dark')
    }
  }

  function applyFontSize() {
    const scale = fontSize.value === 'small' ? 0.875 : fontSize.value === 'large' ? 1.3 : 1
    document.documentElement.style.setProperty('--font-scale', scale.toString())
  }

  function applyColorScheme(scheme: ColorScheme) {
    document.documentElement.classList.remove('accent-green', 'accent-teal', 'accent-purple', 'accent-pink', 'accent-orange')
    document.documentElement.classList.add(`accent-${scheme}`)
    colorScheme.value = scheme
    localStorage.setItem('colorScheme', scheme)
  }

  function setHSKLevel(level: HSKLevel) {
    currentHSKLevel.value = level
  }

  function openSettings() {
    isSettingsOpen.value = true
  }

  function closeSettings() {
    isSettingsOpen.value = false
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    if (toast.value) {
      toast.value(message, type)
    } else {
      console.warn('Toast not initialized')
    }
  }
  
  function setSelectedTextForAssistant(text: string) {
    selectedTextForAssistant.value = text
  }
  
  function getAndClearSelectedText(): string | null {
    const text = selectedTextForAssistant.value
    selectedTextForAssistant.value = null
    return text
  }

  watch(theme, (val) => {
    localStorage.setItem('theme', val)
    applyTheme()
  }, { immediate: true })

  watch(fontSize, (val) => {
    localStorage.setItem('fontSize', val)
    applyFontSize()
  }, { immediate: true })

  applyColorScheme(colorScheme.value)

  return {
    interfaceLanguage,
    targetLanguage,
    targetLanguages,
    currentHSKLevel,
    isMenuOpen,
    theme,
    fontSize,
    colorScheme,
    isSettingsOpen,
    toast,
    isInSession,
    selectedTextForAssistant,
    setHSKLevel,
    applyTheme,
    applyFontSize,
    applyColorScheme,
    openSettings,
    closeSettings,
    showToast,
    setSelectedTextForAssistant,
    getAndClearSelectedText,
  }
})