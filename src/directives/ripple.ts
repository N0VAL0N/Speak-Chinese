// src/directives/ripple.ts
import { DirectiveBinding } from 'vue'

interface RippleElement extends HTMLElement {
  _rippleHandler?: (e: PointerEvent) => void
}

const createRipple = (el: RippleElement, e: PointerEvent) => {
  const rect = el.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2

  const ripple = document.createElement('span')
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    width: ${size}px;
    height: ${size}px;
    top: ${y}px;
    left: ${x}px;
    pointer-events: none;
    z-index: 10;
  `
  el.appendChild(ripple)

  const cleanup = () => {
    if (ripple.parentNode) ripple.remove()
    el.removeEventListener('pointerup', cleanup)
    el.removeEventListener('pointercancel', cleanup)
  }

  el.addEventListener('pointerup', cleanup, { once: true })
  el.addEventListener('pointercancel', cleanup, { once: true })
  setTimeout(cleanup, 600)
}

export default {
  mounted(el: RippleElement, _binding: DirectiveBinding) {  // изменено: _binding
    el.style.position = 'relative'
    el.style.overflow = 'hidden'

    const handler = (e: PointerEvent) => {
      if (e.button !== 0) return
      createRipple(el, e)
    }

    el._rippleHandler = handler
    el.addEventListener('pointerdown', handler)
  },
  unmounted(el: RippleElement) {
    if (el._rippleHandler) {
      el.removeEventListener('pointerdown', el._rippleHandler)
      delete el._rippleHandler
    }
  }
}