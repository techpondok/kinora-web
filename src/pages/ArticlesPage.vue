<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <PublicHeader />

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ isNews ? 'Berita' : 'Artikel' }}</h1>

      <div v-if="loading" class="text-center py-12 text-gray-500">Memuat...</div>

      <div v-else-if="articles.length === 0" class="text-center py-12 text-gray-500">
        Belum ada {{ isNews ? 'berita' : 'artikel' }}.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <template v-for="(a, idx) in articles" :key="a.id">
          <a :href="`/${isNews ? 'news' : 'articles'}/${a.slug}`" class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
            <div class="h-40 bg-gray-100">
              <img v-if="a.cover_url" :src="a.cover_url" :alt="a.cover_alt || a.title" class="w-full h-full object-cover" loading="lazy" />
            </div>
            <div class="p-4">
              <p class="text-xs text-blue-600 font-medium mb-1">{{ a.category }}</p>
              <h2 class="font-semibold text-gray-900 text-sm line-clamp-2">{{ a.title }}</h2>
              <p class="text-xs text-gray-500 mt-2 line-clamp-2">{{ a.summary }}</p>
              <div class="flex items-center justify-between mt-3 text-xs text-gray-400">
                <span>{{ a.author_name || 'Kinora' }}</span>
                <span>{{ formatDate(a.published_at) }}</span>
              </div>
            </div>
          </a>
          <!-- Ad after 3rd article -->
          <ArticleAdSlot
            v-if="idx === 2 && articles.length > 3"
            placement="article_list_after_3"
            :slot-id="getAdSlot('article_list_after_3')"
            :ads-free="isAdsFree"
            class="col-span-1 md:col-span-2 lg:col-span-3"
          />
          <!-- Ad after 6th article -->
          <ArticleAdSlot
            v-if="idx === 5 && articles.length > 6"
            placement="article_list_after_6"
            :slot-id="getAdSlot('article_list_after_6')"
            :ads-free="isAdsFree"
            class="col-span-1 md:col-span-2 lg:col-span-3"
          />
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useArticles } from '../composables/useArticles.js'
import { useGoogleServices } from '../composables/useGoogleServices.js'
import PublicHeader from '../components/PublicHeader.vue'
import ArticleAdSlot from '../components/ArticleAdSlot.vue'

const props = defineProps({ type: { type: String, default: 'article' } })
const isNews = computed(() => props.type === 'news')

const { articles, loading, fetchArticles } = useArticles()
const { googleConfig } = useGoogleServices()

const isAdsFree = ref(false) // TODO: check user subscription entitlement

function getAdSlot(placement) {
  // Return slot ID from config placements if available
  const placements = googleConfig.value?.adsense?.placements || {}
  return placements[placement]?.slot_id || ''
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => {
  fetchArticles({ pageSize: 50, contentType: isNews.value ? 'news' : '', status: 'published', sortBy: 'published_at', sortAsc: false })
})
</script>
