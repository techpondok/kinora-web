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
import ReauthModal from './components/ReauthModal.vue'
import PublicHeader from './components/PublicHeader.vue'
import PublicFooter from './components/PublicFooter.vue'

const route = useRoute()
const { loadConfig, injectHeadTags } = useGoogleServices()

// Routes that use their own layout (no shared header/footer)
const excludedPrefixes = ['/dashboard', '/consultant', '/login', '/register', '/forgot-password', '/open-app']

// Routes that should not be indexed
const noIndexPrefixes = ['/dashboard', '/consultant', '/portal', '/security', '/login', '/register', '/forgot-password', '/open-app', '/help/my-tickets']

const showPublicLayout = computed(() => {
  const path = route.path
  return !excludedPrefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'))
})

// Set canonical and indexing on every route change
watch(() => route.path, (newPath) => {
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
