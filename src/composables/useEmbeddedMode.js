import { computed } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Centralized embedded/in-app mode detection.
 * Use this in any component that should conditionally hide Web-only chrome
 * when the page is rendered inside Kinora Mobile App WebView.
 *
 * Usage:
 *   const { isEmbedded } = useEmbeddedMode()
 *   v-if="!isEmbedded"
 */
export function useEmbeddedMode() {
  const route = useRoute()
  const isEmbedded = computed(() => route.query.in_app === '1')
  return { isEmbedded }
}
