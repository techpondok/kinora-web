<template>
  <div class="min-h-screen bg-gray-50">
    <PublicHeader />

    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8" :class="{ 'xl:max-w-5xl': hasToc }">
      <div v-if="loading" class="text-center py-12 text-gray-500">Memuat artikel...</div>

      <div v-else-if="!article" class="text-center py-12">
        <h1 class="text-2xl font-bold text-gray-900">404</h1>
        <p class="text-gray-500 mt-2">Artikel tidak ditemukan.</p>
        <a href="/articles" class="text-blue-600 text-sm mt-4 inline-block">← Kembali ke daftar</a>
      </div>

      <div v-else class="xl:flex xl:gap-6">
        <!-- Main article content -->
        <article class="flex-1 min-w-0">
        <!-- Breadcrumb -->
        <nav class="text-xs text-gray-400 mb-4">
          <a href="/" class="hover:text-gray-600">Kinora</a> /
          <a :href="isNews ? '/news' : '/articles'" class="hover:text-gray-600">{{ isNews ? 'Berita' : 'Artikel' }}</a> /
          <span class="text-gray-600">{{ article.title }}</span>
        </nav>

        <!-- Header -->
        <h1 class="text-3xl font-bold text-gray-900 leading-tight">{{ article.title }}</h1>
        <div class="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 text-sm text-gray-500">
          <span>{{ article.author_name || 'Kinora' }}</span>
          <span>·</span>
          <span>{{ formatDate(article.published_at) }}</span>
          <span>·</span>
          <span>{{ readTime }} menit baca</span>
          <span class="hidden sm:inline">·</span>
          <ArticleShare :title="article.title" :url="currentUrl" />
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

        <!-- Mobile/Tablet TOC (collapsible card, hidden on xl) -->
        <div v-if="hasToc" class="xl:hidden mt-6">
          <ArticleToc
            :headings="tocHeadings"
            :active-id="activeHeadingId"
            @update:active-id="activeHeadingId = $event"
          />
        </div>

        <!-- Body -->
        <div class="mt-8 prose prose-gray max-w-none text-gray-700 leading-relaxed" v-html="processedBody"></div>

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

        <!-- Share (bottom of article) -->
        <div class="mt-8 border-t border-gray-100 pt-6 flex items-center gap-3">
          <span class="text-xs text-gray-500 font-medium">Bagikan artikel ini</span>
          <ArticleShare :title="article.title" :url="currentUrl" />
        </div>

        <!-- Comments -->
        <ArticleComments
          v-if="article"
          :content-id="article.id"
          :content-type="isNews ? 'news' : 'article'"
          :comments-enabled="article.allow_comments !== false"
        />

        <!-- Related Articles -->
        <div v-if="relatedArticles.length" class="mt-10 border-t border-gray-100 pt-8">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Artikel Terkait</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a v-for="r in relatedArticles" :key="r.id" :href="`/${isNews ? 'news' : 'articles'}/${r.slug}`" class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition group">
              <div class="h-32 bg-gray-100 overflow-hidden">
                <img v-if="r.cover_url" :src="r.cover_url" :alt="r.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
              </div>
              <div class="p-3">
                <p class="text-xs text-amber-600 font-medium mb-1">{{ r.category }}</p>
                <h4 class="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-amber-700 transition">{{ r.title }}</h4>
              </div>
            </a>
          </div>
        </div>
        </article>

        <!-- Desktop TOC Sidebar (xl only, handled internally by component) -->
        <div v-if="hasToc" class="hidden xl:block">
          <ArticleToc
            :headings="tocHeadings"
            :active-id="activeHeadingId"
            @update:active-id="activeHeadingId = $event"
          />
        </div>
      </div>
    </main>

    <!-- JSON-LD -->
    <component :is="'script'" v-if="article" type="application/ld+json" v-html="jsonLd"></component>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useArticles } from '../composables/useArticles.js'
import { useGoogleServices } from '../composables/useGoogleServices.js'
import { useArticleToc } from '../composables/useArticleToc.js'
import { setCanonical, SITE_URL } from '../composables/useCanonical.js'
import { supabase } from '../lib/supabase.js'

import ArticleAdSlot from '../components/ArticleAdSlot.vue'
import ArticleToc from '../components/ArticleToc.vue'
import ArticleComments from '../components/ArticleComments.vue'
import ArticleShare from '../components/ArticleShare.vue'

const route = useRoute()
const { article, loading, fetchBySlug, incrementReadCount } = useArticles()
const { googleConfig } = useGoogleServices()

const props = defineProps({ type: { type: String, default: 'article' } })
const isNews = computed(() => props.type === 'news')
const isAdsFree = ref(false)

// TOC
const { headings: tocHeadings, processedBody, activeId: activeHeadingId, hasToc, generate: generateToc } = useArticleToc()

// Check subscription ad-free entitlement from backend
async function checkAdsFree() {
  const { data } = await supabase.rpc('check_article_ads_allowed')
  if (data && data.ads_allowed === false) isAdsFree.value = true
}
checkAdsFree()

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
    publisher: { '@type': 'Organization', name: 'Kinora', url: 'https://kinorafamilies.com' },
  }
  return JSON.stringify(schema)
})

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function resolveOgImage(data) {
  // Priority: og_image → cover_url → first image in body → default
  if (data.og_image) return toAbsolute(data.og_image)
  if (data.cover_url) return toAbsolute(data.cover_url)
  // Extract first image from HTML body
  const match = (data.body || '').match(/<img[^>]+src="([^"]+)"/)
  if (match) return toAbsolute(match[1])
  return 'https://kinorafamilies.com/og-default.png'
}

function toAbsolute(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return 'https://kinorafamilies.com' + (url.startsWith('/') ? url : '/' + url)
}

function setMeta(name, content) {
  if (!content) return
  const isOg = name.startsWith('og:') || name.startsWith('twitter:')
  const attr = isOg ? 'property' : 'name'
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

const relatedArticles = ref([])
const currentUrl = computed(() => {
  if (!article.value) return ''
  const prefix = isNews.value ? 'news' : 'articles'
  return `${SITE_URL}/${prefix}/${route.params.slug}`
})

onMounted(async () => {
  const slug = route.params.slug
  const { data } = await fetchBySlug(slug)
  if (data) {
    article.value = data
    generateToc(data.body)
    incrementReadCount(data.id)
    document.title = data.seo_title || data.title

    // Set OG metadata dynamically
    const prefix = isNews.value ? 'news' : 'articles'
    const canonicalPath = `/${prefix}/${slug}`
    const canonicalUrl = SITE_URL + canonicalPath
    setCanonical(canonicalPath)

    setMeta('og:title', data.og_title || data.seo_title || data.title)
    setMeta('og:description', data.og_description || data.meta_description || data.summary || '')
    setMeta('og:image', resolveOgImage(data))
    setMeta('og:url', canonicalUrl)
    setMeta('og:type', 'article')
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', data.twitter_title || data.og_title || data.seo_title || data.title)
    setMeta('twitter:description', data.twitter_description || data.og_description || data.meta_description || data.summary || '')
    setMeta('twitter:image', data.twitter_image || resolveOgImage(data))
    if (data.meta_description) setMeta('description', data.meta_description)

    // Fetch related articles (same category, different slug)
    const { data: related } = await supabase
      .from('kinora_articles')
      .select('id, title, slug, cover_url, category, published_at')
      .eq('status', 'published')
      .eq('category', data.category)
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(3)
    relatedArticles.value = related || []
  }
})
</script>
