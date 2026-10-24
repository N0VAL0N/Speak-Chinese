// src/directives/selectable.ts
import { DirectiveBinding } from 'vue'
import { useAppStore } from '@/stores/appStore'
import router from '@/router'

interface SelectableElement extends HTMLElement {
  _selectableHandler?: (e: MouseEvent | TouchEvent) => void
}

let floatingButtonContainer: HTMLDivElement | null = null

function getClientCoordinates(event: MouseEvent | TouchEvent): { x: number; y: number } {
  if ('touches' in event) {
    const touch = event.touches[0]
    return { x: touch.clientX, y: touch.clientY }
  } else {
    return { x: event.clientX, y: event.clientY }
  }
}

function showFloatingButton(event: MouseEvent | TouchEvent, text: string, callback: (text: string) => void) {
  if (floatingButtonContainer) {
    document.body.removeChild(floatingButtonContainer)
    floatingButtonContainer = null
  }

  const coords = getClientCoordinates(event)

  floatingButtonContainer = document.createElement('div')
  floatingButtonContainer.style.position = 'absolute'
  floatingButtonContainer.style.left = (coords.x - 60) + 'px'
  floatingButtonContainer.style.top = (coords.y - 40) + 'px'
  floatingButtonContainer.style.zIndex = '1000'
  floatingButtonContainer.style.backgroundColor = 'var(--accent-color)'
  floatingButtonContainer.style.color = 'white'
  floatingButtonContainer.style.borderRadius = '20px'
  floatingButtonContainer.style.padding = '6px 12px'
  floatingButtonContainer.style.fontSize = '14px'
  floatingButtonContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)'
  floatingButtonContainer.style.cursor = 'pointer'
  floatingButtonContainer.style.whiteSpace = 'nowrap'
  floatingButtonContainer.innerText = '💬 Спросить Сашу'

  floatingButtonContainer.addEventListener('click', () => {
    callback(text)
    if (floatingButtonContainer) {
      document.body.removeChild(floatingButtonContainer)
      floatingButtonContainer = null
    }
  })

  // Автоматически скрываем через 5 секунд
  setTimeout(() => {
    if (floatingButtonContainer) {
      document.body.removeChild(floatingButtonContainer)
      floatingButtonContainer = null
    }
  }, 5000)

  document.body.appendChild(floatingButtonContainer)
}

export default {
  mounted(el: SelectableElement, _binding: DirectiveBinding) {
    const handler = (e: MouseEvent | TouchEvent) => {
      setTimeout(() => {
        const selection = window.getSelection()
        const selectedText = selection?.toString().trim()
        if (selectedText && selectedText.length > 0 && selectedText.length < 50) {
          const range = selection?.getRangeAt(0)
          if (range && el.contains(range.commonAncestorContainer)) {
            showFloatingButton(e, selectedText, (savedText) => {
              const appStore = useAppStore()
              appStore.setSelectedTextForAssistant(savedText)
              router.push('/assistant')
            })
          }
        }
      }, 100)
    }
    el._selectableHandler = handler
    el.addEventListener('mouseup', handler)
    el.addEventListener('touchend', handler)
  },
  unmounted(el: SelectableElement) {
    if (el._selectableHandler) {
      el.removeEventListener('mouseup', el._selectableHandler)
      el.removeEventListener('touchend', el._selectableHandler)
    }
  }
}