<template>
  <div class="min-h-screen bg-gray-50">
    <PublicHeader />

    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div v-if="loading" class="text-center py-12 text-gray-500">Memuat artikel...</div>

      <div v-else-if="!article" class="text-center py-12">
        <h1 class="text-2xl font-bold text-gray-900">404</h1>
        <p class="text-gray-500 mt-2">Artikel tidak ditemukan.</p>
        <a href="/articles" class="text-blue-600 text-sm mt-4 inline-block">← Kembali ke daftar</a>
      </div>

      <article v-else>
        <!-- Breadcrumb -->
        <nav class="text-xs text-gray-400 mb-4">
          <a href="/" class="hover:text-gray-600">Kinora</a> /
          <a :href="isNews ? '/news' : '/articles'" class="hover:text-gray-600">{{ isNews ? 'Berita' : 'Artikel' }}</a> /
          <span class="text-gray-600">{{ article.title }}</span>
        </nav>

        <!-- Header -->
        <h1 class="text-3xl font-bold text-gray-900 leading-tight">{{ article.title }}</h1>
        <div class="flex items-center gap-3 mt-3 text-sm text-gray-500">
          <span>{{ article.author_name || 'Kinora' }}</span>
          <span>·</span>
          <span>{{ formatDate(article.published_at) }}</span>
          <span>·</span>
          <span>{{ readTime }} menit baca</span>
        </div>

        <!-- Cover -->
        <div v-if="article.cover_url" class="mt-6 rounded-xl overflow-hidden">
          <img :src="article.cover_url" :alt="article.cover_alt || article.title" class="w-full h-auto" loading="lazy" />
        </div>

        <!-- Ad after intro for long articles -->
        <ArticleAdSlot
          v-if="wordCount > 700 && !article.sensitive"
          placement="article_detail_after_intro"
          :slot-id="getAdSlot('article_detail_after_intro')"
          :ads-free="isAdsFree"
          :min-height="100"
        />

        <!-- Body -->
        <div class="mt-8 prose prose-gray max-w-none text-gray-700 leading-relaxed" v-html="article.body"></div>

        <!-- Ad after article body -->
        <ArticleAdSlot
          v-if="!article.sensitive"
          placement="article_detail_before_related"
          :slot-id="getAdSlot('article_detail_before_related')"
          :ads-free="isAdsFree"
          :min-height="120"
        />

        <!-- Source disclaimer -->
        <div v-if="article.source_name" class="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
          Sumber: <a :href="article.source_url" target="_blank" rel="noopener" class="text-blue-600 hover:underline">{{ article.source_name }}</a>
        </div>

        <!-- Tags -->
        <div v-if="article.tags?.length" class="mt-6 flex flex-wrap gap-2">
          <a v-for="tag in article.tags" :key="tag" :href="`/tag/${tag}`" class="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200">
            #{{ tag }}
          </a>
        </div>

        <!-- Share -->
        <div class="mt-8 flex gap-3">
          <button @click="share" class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Bagikan</button>
        </div>
      </article>
    </main>

    <!-- JSON-LD -->
    <component :is="'script'" v-if="article" type="application/ld+json" v-html="jsonLd"></component>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useArticles } from '../composables/useArticles.js'
import { useGoogleServices } from '../composables/useGoogleServices.js'
import PublicHeader from '../components/PublicHeader.vue'
import ArticleAdSlot from '../components/ArticleAdSlot.vue'

const route = useRoute()
const { article, loading, fetchBySlug, incrementReadCount } = useArticles()
const { googleConfig } = useGoogleServices()

const props = defineProps({ type: { type: String, default: 'article' } })
const isNews = computed(() => props.type === 'news')
const isAdsFree = ref(false) // TODO: check user subscription entitlement

const wordCount = computed(() => {
  if (!article.value?.body) return 0
  return article.value.body.replace(/<[^>]*>/g, '').split(/\s+/).length
})

const readTime = computed(() => {
  if (!article.value?.body) return 1
  return Math.max(1, Math.ceil(article.value.body.split(/\s+/).length / 200))
})

function getAdSlot(placement) {
  const placements = googleConfig.value?.adsense?.placements || {}
  return placements[placement]?.slot_id || ''
}

const jsonLd = computed(() => {
  if (!article.value) return ''
  const schema = {
    '@context': 'https://schema.org',
    '@type': isNews.value ? 'NewsArticle' : 'Article',
    headline: article.value.seo_title || article.value.title,
    description: article.value.meta_description || article.value.summary,
    image: article.value.og_image || article.value.cover_url,
    author: { '@type': 'Person', name: article.value.author_name || 'Kinora' },
    datePublished: article.value.published_at,
    dateModified: article.value.updated_at,
    publisher: { '@type': 'Organization', name: 'Kinora', url: 'https://kinora.app' },
  }
  return JSON.stringify(schema)
})

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function share() {
  if (navigator.share) {
    navigator.share({ title: article.value.title, url: window.location.href })
  } else {
    navigator.clipboard.writeText(window.location.href)
  }
}

onMounted(async () => {
  const slug = route.params.slug
  const { data } = await fetchBySlug(slug)
  if (data) {
    article.value = data
    incrementReadCount(data.id)
    document.title = data.seo_title || data.title
  }
})
</script>
