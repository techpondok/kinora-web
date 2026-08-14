<template>
  <div class="min-h-screen bg-gray-50">
    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <!-- Breadcrumb -->
      <nav class="text-xs text-gray-400 mb-6">
        <a href="/" class="hover:text-gray-600">Kinora</a> /
        <span class="text-gray-600">Penulis</span>
      </nav>

      <div v-if="loading" class="text-center py-12 text-gray-500">Memuat...</div>

      <div v-else-if="!author" class="text-center py-12">
        <h1 class="text-2xl font-bold text-gray-900">Penulis tidak ditemukan</h1>
        <a href="/articles" class="text-blue-600 text-sm mt-4 inline-block">← Kembali ke artikel</a>
      </div>

      <div v-else>
        <!-- Author Profile -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 rounded-full bg-amber-100 flex-shrink-0 overflow-hidden">
              <img v-if="author.avatar_url" :src="author.avatar_url" :alt="author.name" class="w-full h-full object-cover" />
              <span v-else class="w-full h-full flex items-center justify-center text-xl font-bold text-amber-700">{{ author.name[0] }}</span>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900">{{ author.name }}</h1>
              <p v-if="author.expertise" class="text-sm text-amber-700 font-medium mt-0.5">{{ author.expertise }}</p>
              <p v-if="author.bio" class="text-sm text-gray-600 mt-2 leading-relaxed">{{ author.bio }}</p>
              <div v-if="author.social_links" class="flex gap-3 mt-3">
                <a v-if="author.social_links.linkedin" :href="author.social_links.linkedin" target="_blank" rel="noopener" class="text-xs text-blue-600 hover:underline">LinkedIn</a>
                <a v-if="author.social_links.twitter" :href="author.social_links.twitter" target="_blank" rel="noopener" class="text-xs text-blue-600 hover:underline">Twitter</a>
                <a v-if="author.social_links.website" :href="author.social_links.website" target="_blank" rel="noopener" class="text-xs text-blue-600 hover:underline">Website</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Articles by this author -->
        <h2 class="text-lg font-bold text-gray-900 mb-4">Artikel oleh {{ author.name }}</h2>
        <div v-if="articles.length === 0" class="text-sm text-gray-400">Belum ada artikel.</div>
        <div v-else class="space-y-4">
          <a v-for="a in articles" :key="a.id" :href="`/articles/${a.slug}`" class="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition">
            <div class="flex gap-4">
              <div v-if="a.cover_url" class="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <img :src="a.cover_url" :alt="a.title" class="w-full h-full object-cover" loading="lazy" />
              </div>
              <div class="min-w-0">
                <p class="text-xs text-amber-600 font-medium">{{ a.category }}</p>
                <h3 class="font-semibold text-gray-900 text-sm line-clamp-2">{{ a.title }}</h3>
                <p class="text-xs text-gray-400 mt-1">{{ formatDate(a.published_at) }}</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </main>

    <!-- JSON-LD Person -->
    <component :is="'script'" v-if="author" type="application/ld+json" v-html="jsonLd"></component>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase.js'
import { setCanonical } from '../composables/useCanonical.js'

const route = useRoute()
const props = defineProps({ slug: String })

const author = ref(null)
const articles = ref([])
const loading = ref(true)

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const jsonLd = computed(() => {
  if (!author.value) return ''
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.value.name,
    description: author.value.bio || '',
    image: author.value.avatar_url || undefined,
    jobTitle: author.value.expertise || undefined,
    url: `https://kinorafamilies.com/author/${author.value.slug}`,
  })
})

onMounted(async () => {
  const slug = props.slug || route.params.slug
  setCanonical(`/author/${slug}`)

  const { data } = await supabase
    .from('kinora_authors')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  author.value = data

  if (data) {
    const { data: arts } = await supabase
      .from('kinora_articles')
      .select('id, title, slug, category, cover_url, published_at')
      .eq('author_id', data.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20)

    articles.value = arts || []
  }

  loading.value = false
})
</script>
