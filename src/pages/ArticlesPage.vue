<template>
  <div class="min-h-screen bg-gray-50">
    <PublicHeader />

    <main class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ isNews ? 'Berita' : 'Artikel' }}</h1>
          <p class="text-sm text-gray-500 mt-1">Tips keluarga, parenting, keamanan digital, dan informasi Kinora.</p>
        </div>
        <div class="relative w-full sm:w-64">
          <input v-model="search" type="text" :placeholder="`Cari ${isNews ? 'berita' : 'artikel'}...`"
            class="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-300" />
          <svg class="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <!-- Category Filter -->
      <div class="flex flex-wrap gap-2 mb-8 overflow-x-auto">
        <button @click="activeCategory = ''" :class="['px-4 py-1.5 rounded-full text-sm font-medium transition', !activeCategory ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300']">Semua</button>
        <button v-for="cat in categories" :key="cat" @click="activeCategory = cat"
          :class="['px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap', activeCategory === cat ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300']">
          {{ cat }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="n in 6" :key="n" class="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
          <div class="h-40 bg-gray-200"></div>
          <div class="p-4 space-y-2"><div class="h-3 bg-gray-200 rounded w-1/4"></div><div class="h-4 bg-gray-200 rounded w-3/4"></div><div class="h-3 bg-gray-100 rounded w-full"></div></div>
        </div>
      </div>

      <template v-else>
      <!-- Featured Article -->
      <div v-if="featuredArticle && !search && !activeCategory" class="mb-10">
        <a :href="`/${isNews ? 'news' : 'articles'}/${featuredArticle.slug}`" class="block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition group">
          <div class="grid grid-cols-1 md:grid-cols-2">
            <div class="h-48 md:h-64 bg-gray-100">
              <img v-if="featuredArticle.cover_url" :src="featuredArticle.cover_url" :alt="featuredArticle.cover_alt || featuredArticle.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div class="p-6 flex flex-col justify-center">
              <span class="text-xs text-amber-600 font-semibold uppercase">{{ featuredArticle.category }} · Featured</span>
              <h2 class="mt-2 text-xl font-bold text-gray-900 group-hover:text-amber-700 transition line-clamp-2">{{ featuredArticle.title }}</h2>
              <p class="mt-2 text-sm text-gray-500 line-clamp-3">{{ featuredArticle.summary }}</p>
              <div class="mt-4 flex items-center gap-3 text-xs text-gray-400">
                <span>{{ featuredArticle.author_name || 'Kinora' }}</span>
                <span>·</span>
                <span>{{ formatDate(featuredArticle.published_at) }}</span>
                <span>·</span>
                <span>{{ readTime(featuredArticle.body) }} menit baca</span>
              </div>
            </div>
          </div>
        </a>
      </div>

      <!-- Empty -->
      <div v-if="filteredArticles.length === 0" class="text-center py-12 text-gray-500">
        <p>{{ search ? 'Tidak ditemukan artikel yang cocok.' : `Belum ada ${isNews ? 'berita' : 'artikel'}.` }}</p>
      </div>

      <!-- Article Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <template v-for="(a, idx) in filteredArticles" :key="a.id">
          <a :href="`/${isNews ? 'news' : 'articles'}/${a.slug}`" class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition group">
            <div class="h-40 bg-gray-100 overflow-hidden">
              <img v-if="a.cover_url" :src="a.cover_url" :alt="a.cover_alt || a.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
            </div>
            <div class="p-4">
              <p class="text-xs text-amber-600 font-medium mb-1">{{ a.category }}</p>
              <h2 class="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-amber-700 transition">{{ a.title }}</h2>
              <p class="text-xs text-gray-500 mt-2 line-clamp-2">{{ a.summary }}</p>
              <div class="flex items-center justify-between mt-3 text-xs text-gray-400">
                <span>{{ a.author_name || 'Kinora' }}</span>
                <span>{{ formatDate(a.published_at) }}</span>
              </div>
            </div>
          </a>
          <ArticleAdSlot v-if="idx === 2 && filteredArticles.length > 3" placement="article_list_after_3" :slot-id="getAdSlot('article_list_after_3')" :ads-free="isAdsFree" class="col-span-1 md:col-span-2 lg:col-span-3" />
          <ArticleAdSlot v-if="idx === 5 && filteredArticles.length > 6" placement="article_list_after_6" :slot-id="getAdSlot('article_list_after_6')" :ads-free="isAdsFree" class="col-span-1 md:col-span-2 lg:col-span-3" />
        </template>
      </div>
      </template>
    </main>

    <PublicFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useArticles } from '../composables/useArticles.js'
import { useGoogleServices } from '../composables/useGoogleServices.js'
import { supabase } from '../lib/supabase.js'
import PublicHeader from '../components/PublicHeader.vue'
import PublicFooter from '../components/PublicFooter.vue'
import ArticleAdSlot from '../components/ArticleAdSlot.vue'

const props = defineProps({ type: { type: String, default: 'article' } })
const isNews = computed(() => props.type === 'news')

const { articles, loading, fetchArticles } = useArticles()
const { googleConfig } = useGoogleServices()

const isAdsFree = ref(false)

// Check subscription ad-free entitlement from backend
async function checkAdsFree() {
  const { data } = await supabase.rpc('check_article_ads_allowed')
  if (data && data.ads_allowed === false) isAdsFree.value = true
}
checkAdsFree()

const search = ref('')
const activeCategory = ref('')

const categories = computed(() => {
  const cats = new Set(articles.value.map(a => a.category).filter(Boolean))
  return [...cats].sort()
})

const featuredArticle = computed(() => articles.value.find(a => a.is_featured))

const filteredArticles = computed(() => {
  let list = articles.value.filter(a => !a.is_featured || search.value || activeCategory.value)
  if (activeCategory.value) list = list.filter(a => a.category === activeCategory.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(a => a.title.toLowerCase().includes(q) || (a.summary || '').toLowerCase().includes(q) || (a.category || '').toLowerCase().includes(q))
  }
  return list
})

function getAdSlot(placement) {
  const placements = googleConfig.value?.adsense?.placements || {}
  return placements[placement]?.slot_id || ''
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function readTime(body) {
  if (!body) return 1
  return Math.max(1, Math.ceil(body.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))
}

onMounted(() => {
  fetchArticles({ pageSize: 50, contentType: isNews.value ? 'news' : '', status: 'published', sortBy: 'published_at', sortAsc: false })
})
</script>
