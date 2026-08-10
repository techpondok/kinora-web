/**
 * Global Embedded Mode detection for Kinora Mobile App WebView.
 *
 * Once activated (via ?in_app=1 or sessionStorage), persists for the
 * entire browsing session. Normal external browser visits are never
 * accidentally treated as embedded.
 *
 * Usage:
 *   const { isEmbedded } = useEmbeddedMode()
 *   // isEmbedded.value === true when inside Mobile App
 */
import { ref } from 'vue'

const STORAGE_KEY = 'kinora_embedded'
const isEmbedded = ref(false)

// Initialize once from sessionStorage (survives SPA navigation + page refresh within same tab)
if (typeof window !== 'undefined') {
  if (sessionStorage.getItem(STORAGE_KEY) === '1') {
    isEmbedded.value = true
  }
}

/**
 * Call this on app init / route change to detect embedded mode.
 * Once activated, stays active for the entire session.
 */
function detectEmbedded(route) {
  if (isEmbedded.value) return // Already embedded, no need to re-check

  // Check query param: ?in_app=1
  if (route?.query?.in_app === '1') {
    activate()
    return
  }

  // Check User-Agent for Kinora Mobile App identifier (optional future use)
  if (typeof navigator !== 'undefined' && /KinoraApp/i.test(navigator.userAgent)) {
    activate()
  }
}

function activate() {
  isEmbedded.value = true
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, '1')
  }
}

export function useEmbeddedMode() {
  return {
    isEmbedded,
    detectEmbedded,
  }
}
