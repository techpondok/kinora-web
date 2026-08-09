<template>
  <div class="min-h-screen bg-white flex flex-col">

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center py-16"><div class="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div><p class="mt-3 text-sm text-gray-400">Memuat...</p></div>
    </div>

    <!-- Error -->
    <div v-else-if="!pageData" class="flex-1 flex items-center justify-center px-4">
      <div class="text-center py-16 max-w-sm">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><span class="text-2xl text-gray-300">📄</span></div>
        <h1 class="text-xl font-bold text-gray-900">Halaman tidak ditemukan</h1>
        <p class="text-gray-500 text-sm mt-2">Dokumen yang Anda cari belum tersedia atau sedang diperbarui.</p>
        <div class="mt-6 flex justify-center gap-3">
          <button @click="loadPage" class="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600">Coba Lagi</button>
          <a href="/help" class="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Pusat Bantuan</a>
        </div>
      </div>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Hero -->
      <section class="bg-gradient-to-b from-amber-50/50 to-white border-b border-gray-100 py-10 sm:py-14 px-4 sm:px-6" data-animate>
        <div class="max-w-4xl mx-auto">
          <nav class="text-xs text-gray-400 mb-4">
            <a href="/" class="hover:text-amber-600 transition">Beranda</a>
            <span class="mx-1.5">/</span>
            <span class="text-gray-700">{{ pageData.title }}</span>
          </nav>
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-medium">Dokumen Legal</span>
            <span class="text-xs text-gray-400">Terakhir diperbarui: 1 Agustus 2026</span>
          </div>
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900" style="font-family: 'Bricolage Grotesque', sans-serif">{{ pageData.title }}</h1>
          <p class="mt-3 text-gray-600 text-sm sm:text-base max-w-2xl">{{ pageDescription }}</p>
        </div>
      </section>

      <!-- Main: TOC + Content -->
      <section class="flex-1 py-10 px-4 sm:px-6">
        <div class="max-w-5xl mx-auto flex gap-10">
          <!-- Sticky TOC (desktop) -->
          <aside class="hidden lg:block w-56 flex-shrink-0">
            <div class="sticky top-20">
              <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Daftar Isi</h4>
              <nav class="space-y-1.5 border-l-2 border-gray-100 pl-3">
                <a v-for="(heading, i) in tocItems" :key="i" :href="`#section-${i}`"
                  :class="activeSection === i ? 'text-amber-700 font-medium border-l-2 border-amber-500 -ml-[calc(0.75rem+2px)] pl-3' : 'text-gray-500 hover:text-gray-900'"
                  class="block text-sm transition leading-snug py-0.5">
                  {{ heading }}
                </a>
              </nav>
            </div>
          </aside>

          <!-- Mobile TOC -->
          <div class="lg:hidden mb-6 w-full">
            <details class="bg-gray-50 rounded-xl border border-gray-200">
              <summary class="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer">Daftar Isi</summary>
              <nav class="px-4 pb-3 space-y-1.5">
                <a v-for="(heading, i) in tocItems" :key="i" :href="`#section-${i}`" class="block text-sm text-gray-600 hover:text-amber-700 py-0.5">{{ heading }}</a>
              </nav>
            </details>
          </div>

          <!-- Content -->
          <article class="flex-1 min-w-0 prose max-w-none" ref="contentRef" v-html="processedBody"></article>
        </div>
      </section>

      <!-- CTA -->
      <section class="py-10 px-4 sm:px-6 bg-gray-50 border-t border-gray-100">
        <div class="max-w-2xl mx-auto text-center">
          <p class="text-sm text-gray-600">Ada pertanyaan tentang dokumen ini?</p>
          <div class="mt-4 flex justify-center gap-3">
            <a href="/help" class="px-5 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition btn-press">Pusat Bantuan</a>
            <a href="/help/contact" class="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Hubungi Kami</a>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase.js'


const route = useRoute()
const loading = ref(true)
const pageData = ref(null)
const contentRef = ref(null)
const activeSection = ref(0)
let scrollObserver = null

const pageDescription = computed(() => {
  const slug = route.path.replace('/', '')
  if (slug === 'terms') return 'Ketentuan yang mengatur penggunaan layanan, fitur, dan akun Kinora.'
  if (slug === 'privacy') return 'Penjelasan mengenai cara Kinora mengumpulkan, menggunakan, melindungi, dan mengelola data pengguna.'
  return ''
})

// Extract TOC from body HTML headings
const tocItems = computed(() => {
  if (!pageData.value?.body) return []
  const matches = pageData.value.body.match(/<h2[^>]*>(.*?)<\/h2>/gi) || []
  return matches.map(m => m.replace(/<[^>]+>/g, ''))
})

// Add IDs to h2 elements for scroll linking
const processedBody = computed(() => {
  if (!pageData.value?.body) return ''
  let idx = 0
  return pageData.value.body.replace(/<h2/gi, () => `<h2 id="section-${idx++}"`)
})

async function loadPage() {
  loading.value = true
  const slug = route.path.replace('/', '')
  const configKey = `page_${slug}`
  const { data } = await supabase
    .from('kinora_landing_config')
    .select('value')
    .eq('key', configKey)
    .eq('status', 'published')
    .maybeSingle()
  if (data) pageData.value = data.value
  loading.value = false

  if (pageData.value?.title) document.title = pageData.value.title + ' - Kinora'

  // Setup scroll observer for TOC
  await nextTick()
  setupScrollObserver()
}

function setupScrollObserver() {
  if (scrollObserver) scrollObserver.disconnect()
  const headings = document.querySelectorAll('[id^="section-"]')
  if (!headings.length) return

  scrollObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = parseInt(entry.target.id.replace('section-', ''))
        activeSection.value = id
      }
    }
  }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 })

  headings.forEach(h => scrollObserver.observe(h))
}

onMounted(loadPage)
onUnmounted(() => { if (scrollObserver) scrollObserver.disconnect() })
</script>
