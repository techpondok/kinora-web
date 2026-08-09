<template>
  <div v-if="headings.length" class="article-toc">
    <!-- Desktop/Large Tablet: Sticky sidebar -->
    <nav class="hidden xl:block sticky top-20 w-56 flex-shrink-0 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-gray-100 bg-white p-4">
      <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h14"/>
        </svg>
        Daftar Isi
      </h4>
      <ul class="space-y-0.5">
        <li v-for="heading in headings" :key="heading.id">
          <a
            :href="`#${heading.id}`"
            @click.prevent="scrollTo(heading.id)"
            class="block text-[13px] leading-snug py-1 transition-colors duration-150 border-l-2"
            :class="[
              heading.level === 3 ? 'pl-5' : 'pl-3',
              activeId === heading.id
                ? 'border-amber-500 text-amber-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            ]"
          >{{ heading.text }}</a>
        </li>
      </ul>
    </nav>

    <!-- Mobile/Tablet: Collapsible card -->
    <div class="xl:hidden rounded-xl border border-gray-100 bg-white overflow-hidden">
      <button
        @click="mobileOpen = !mobileOpen"
        class="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        <span class="flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h14"/>
          </svg>
          <span>Daftar Isi</span>
          <span class="text-xs text-gray-400 font-normal">({{ headings.length }})</span>
        </span>
        <svg
          class="w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0"
          :class="{ 'rotate-180': mobileOpen }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      <div v-if="mobileOpen" class="px-4 pb-4 pt-1 border-t border-gray-50">
        <ul class="space-y-0.5">
          <li v-for="heading in headings" :key="heading.id">
            <a
              :href="`#${heading.id}`"
              @click.prevent="handleMobileClick(heading.id)"
              class="block text-sm py-2 transition-colors rounded-md px-2 -mx-2"
              :class="[
                heading.level === 3 ? 'pl-6' : 'pl-2',
                activeId === heading.id
                  ? 'text-amber-700 font-medium bg-amber-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              ]"
            >{{ heading.text }}</a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  headings: { type: Array, required: true },
  activeId: { type: String, default: '' },
})

const emit = defineEmits(['update:activeId'])
const mobileOpen = ref(false)

// Navbar height offset (sticky header ~64px + padding)
const SCROLL_OFFSET = 80

function scrollTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
  window.scrollTo({ top, behavior: 'smooth' })
  history.replaceState(null, '', `#${id}`)
}

function handleMobileClick(id) {
  scrollTo(id)
  // Collapse after navigation so reader can continue
  mobileOpen.value = false
}

// --- Intersection Observer for active section tracking ---
let observer = null

function setupObserver() {
  if (typeof IntersectionObserver === 'undefined') return
  if (!props.headings.length) return

  // Disconnect previous if any
  if (observer) observer.disconnect()

  observer = new IntersectionObserver(
    (entries) => {
      // Track which headings are currently intersecting
      const visible = entries.filter(e => e.isIntersecting)
      if (visible.length > 0) {
        // Pick the one closest to top
        const sorted = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        emit('update:activeId', sorted[0].target.id)
      }
    },
    {
      rootMargin: `-${SCROLL_OFFSET}px 0px -60% 0px`,
      threshold: 0,
    }
  )

  nextTick(() => {
    for (const heading of props.headings) {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    }
  })
}

// Re-setup observer when headings change
watch(() => props.headings, (newHeadings) => {
  if (newHeadings.length) setupObserver()
}, { immediate: false })

onMounted(() => {
  if (props.headings.length) setupObserver()

  // Handle initial hash in URL
  if (window.location.hash) {
    const id = window.location.hash.slice(1)
    if (props.headings.some(h => h.id === id)) {
      setTimeout(() => scrollTo(id), 400)
    }
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>
