import { onMounted, onUnmounted, nextTick, watch } from 'vue'

/**
 * Lightweight scroll-triggered animation using Intersection Observer.
 * Elements with `data-animate` will get class `is-visible` when in viewport.
 * Supports `data-delay="100"` for stagger.
 * Respects prefers-reduced-motion.
 */
export function useScrollAnimation(trigger) {
  let observer = null

  function observeAll() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      document.querySelectorAll('[data-animate]').forEach(el => el.classList.add('is-visible'))
      return
    }

    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const delay = parseInt(entry.target.dataset.delay || '0')
            setTimeout(() => entry.target.classList.add('is-visible'), delay)
            observer.unobserve(entry.target)
          }
        })
      }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' })
    }

    document.querySelectorAll('[data-animate]:not(.is-visible)').forEach(el => observer.observe(el))
  }

  onMounted(() => {
    nextTick(observeAll)
  })

  // Re-observe when trigger changes (e.g., data loaded)
  if (trigger) {
    watch(trigger, () => {
      nextTick(observeAll)
    })
  }

  // Also re-observe after a small delay for async data
  onMounted(() => {
    setTimeout(observeAll, 500)
    setTimeout(observeAll, 1500)
  })

  onUnmounted(() => {
    if (observer) observer.disconnect()
  })
}
