<template>
  <div
    v-if="shouldRender"
    ref="containerRef"
    class="ad-slot-container my-6"
    role="complementary"
    aria-label="Iklan"
  >
    <p class="text-[10px] text-gray-400 uppercase tracking-wider mb-1 text-center select-none">Iklan</p>
    <div
      class="ad-slot-inner bg-gray-50/50 border border-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
      :style="{ minHeight: minHeight + 'px' }"
    >
      <!-- Ad unit injected here -->
      <ins
        v-if="isVisible && adReady"
        class="adsbygoogle"
        :style="adStyle"
        :data-ad-client="publisherId"
        :data-ad-slot="slotId"
        :data-ad-format="responsive ? 'auto' : 'rectangle'"
        :data-full-width-responsive="responsive ? 'true' : 'false'"
      ></ins>
      <!-- Placeholder while loading -->
      <div v-else-if="!adFailed" class="w-full h-full flex items-center justify-center">
        <span class="text-xs text-gray-300">—</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useGoogleServices } from '../composables/useGoogleServices.js'

const props = defineProps({
  placement: { type: String, required: true },
  slotId: { type: String, default: '' },
  responsive: { type: Boolean, default: true },
  minHeight: { type: Number, default: 100 },
  lazy: { type: Boolean, default: true },
  adsFree: { type: Boolean, default: false },
  sensitive: { type: Boolean, default: false },
})

const { googleConfig, loaded } = useGoogleServices()

const containerRef = ref(null)
const isVisible = ref(!props.lazy)
const adReady = ref(false)
const adFailed = ref(false)
let observer = null

const publisherId = computed(() => googleConfig.value?.adsense?.publisher_id || '')

const shouldRender = computed(() => {
  // Don't render if ads-free user
  if (props.adsFree) return false
  // Don't render on sensitive content
  if (props.sensitive) return false
  // Don't render if AdSense disabled
  if (!googleConfig.value?.adsense?.enabled) return false
  // Don't render if no publisher ID
  if (!publisherId.value) return false
  // Don't render if no slot ID provided and not using auto ads
  if (!props.slotId && !googleConfig.value?.adsense?.auto_ads) return false
  return true
})

const adStyle = computed(() => ({
  display: 'block',
  width: '100%',
  minHeight: props.minHeight + 'px',
}))

function pushAd() {
  try {
    if (window.adsbygoogle) {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      adReady.value = true
    } else {
      // Script not loaded yet, wait
      const checkInterval = setInterval(() => {
        if (window.adsbygoogle) {
          clearInterval(checkInterval)
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
          adReady.value = true
        }
      }, 500)
      // Timeout after 5s
      setTimeout(() => {
        clearInterval(checkInterval)
        if (!adReady.value) adFailed.value = true
      }, 5000)
    }
  } catch (e) {
    adFailed.value = true
  }
}

onMounted(() => {
  if (!props.lazy) {
    nextTick(pushAd)
    return
  }

  // Intersection Observer for lazy loading
  if ('IntersectionObserver' in window && containerRef.value) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          isVisible.value = true
          nextTick(pushAd)
          observer?.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(containerRef.value)
  } else {
    isVisible.value = true
    nextTick(pushAd)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.ad-slot-container {
  max-width: 100%;
  overflow: hidden;
}
</style>
