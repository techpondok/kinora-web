<template>
  <router-view />
  <ReauthModal />
</template>

<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGoogleServices } from './composables/useGoogleServices.js'
import ReauthModal from './components/ReauthModal.vue'

const route = useRoute()
const { loadConfig, injectHeadTags } = useGoogleServices()

// Load config once, then inject on each route change
loadConfig().then(() => {
  injectHeadTags(route.path)
})

watch(() => route.path, (newPath) => {
  injectHeadTags(newPath)
})
</script>
