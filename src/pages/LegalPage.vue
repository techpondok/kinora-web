<template>
  <div class="min-h-screen bg-white">
    <PublicHeader />

    <main class="max-w-3xl mx-auto px-5 py-10 pt-16">
      <div v-if="loading" class="text-center py-12 text-gray-400 text-sm">Memuat...</div>
      <div v-else-if="!pageData" class="text-center py-12 text-gray-400 text-sm">Halaman tidak ditemukan.</div>
      <template v-else>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900">{{ pageData.title }}</h1>
        <div class="mt-8 prose prose-sm max-w-none text-gray-700 leading-relaxed" v-html="renderedBody"></div>
      </template>
    </main>

    <PublicFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../lib/supabase.js'
import PublicHeader from '../components/PublicHeader.vue'
import PublicFooter from '../components/PublicFooter.vue'

const props = defineProps({ slug: { type: String, required: true } })

const loading = ref(true)
const pageData = ref(null)

// Map route slug to kinora_landing_config key
const slugToKey = {
  'privacy-policy': 'page_privacy',
  'terms-and-conditions': 'page_terms',
}

async function loadPage() {
  loading.value = true

  const configKey = slugToKey[props.slug]

  if (configKey) {
    // Read from kinora_landing_config (same source as admin)
    const { data } = await supabase.from('kinora_landing_config').select('value').eq('key', configKey).eq('status', 'published').maybeSingle()
    pageData.value = data?.value || null
  } else {
    // Fallback: read from kinora_pages
    const { data } = await supabase.from('kinora_pages').select('*').eq('slug', props.slug).eq('status', 'published').maybeSingle()
    pageData.value = data
  }

  loading.value = false
  if (pageData.value?.title) document.title = pageData.value.title + ' - Kinora'
}

const renderedBody = computed(() => {
  const text = pageData.value?.body || ''
  // If it looks like HTML, use as-is. Otherwise render markdown-style
  if (text.includes('<h') || text.includes('<p') || text.includes('<div')) return text
  return text
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold mt-6 mb-3 text-gray-900">$1</h2>')
    .replace(/^- ❌ (.*$)/gm, '<p class="ml-4 text-red-700">❌ $1</p>')
    .replace(/^- \*\*(.*?)\*\* — (.*$)/gm, '<p class="ml-4"><strong>$1</strong> — $2</p>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4">$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
})

watch(() => props.slug, loadPage)
onMounted(loadPage)
</script>
