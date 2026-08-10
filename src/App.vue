<template>
  <PublicHeader v-if="showPublicLayout" />
  <router-view />
  <PublicFooter v-if="showPublicLayout" />
  <ReauthModal />
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGoogleServices } from './composables/useGoogleServices.js'
import { setCanonical, setNoIndex, clearNoIndex } from './composables/useCanonical.js'
import { useEmbeddedMode } from './composables/useEmbeddedMode.js'
import ReauthModal from './components/ReauthModal.vue'
import PublicHeader from './components/PublicHeader.vue'
import PublicFooter from './components/PublicFooter.vue'

const route = useRoute()
const { loadConfig, injectHeadTags } = useGoogleServices()
const { isEmbedded, detectEmbedded } = useEmbeddedMode()

// Routes that use their own layout (no shared header/footer)
const excludedPrefixes = ['/dashboard', '/consultant', '/login', '/register', '/forgot-password', '/open-app']

// Routes that should not be indexed
const noIndexPrefixes = ['/dashboard', '/consultant', '/portal', '/security', '/login', '/register', '/forgot-password', '/open-app', '/help/my-tickets']

const showPublicLayout = computed(() => {
  // Hide navbar/footer when inside Mobile App WebView
  if (isEmbedded.value) return false
  const path = route.path
  return !excludedPrefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'))
})

// Detect embedded mode and handle SEO/canonical on every route change
watch(() => route.fullPath, () => {
  // Check for embedded mode on every navigation (activates once, persists)
  detectEmbedded(route)

  const newPath = route.path
  const isNoIndex = noIndexPrefixes.some(prefix => newPath === prefix || newPath.startsWith(prefix + '/'))
  if (isNoIndex) {
    setNoIndex()
  } else {
    clearNoIndex()
    setCanonical(newPath)
  }
  injectHeadTags(newPath)
}, { immediate: true })

// Load config once
loadConfig().then(() => {
  injectHeadTags(route.path)
})
</script>
