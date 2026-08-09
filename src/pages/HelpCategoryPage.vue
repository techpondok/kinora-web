<template>
  <div class="min-h-screen bg-gray-50">

    <section class="py-12 px-4 sm:px-6">
      <div class="max-w-4xl mx-auto">
        <!-- Breadcrumb -->
        <nav class="mb-6 text-sm text-gray-500">
          <a href="/help" class="hover:text-amber-600 transition">Pusat Bantuan</a>
          <span class="mx-2">›</span>
          <span class="text-gray-900">{{ category?.name || 'Kategori' }}</span>
        </nav>

        <!-- Loading -->
        <div v-if="loading" class="space-y-4">
          <div class="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div class="h-4 bg-gray-100 rounded w-2/3 animate-pulse"></div>
          <div class="grid gap-3 mt-6">
            <div v-for="n in 4" :key="n" class="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-100 rounded w-full"></div>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p class="text-gray-900 font-semibold text-sm mb-1">Tidak dapat memuat kategori ini</p>
          <p class="text-gray-500 text-xs mb-4">Terjadi kendala. Silakan coba kembali.</p>
          <div class="flex justify-center gap-3">
            <button @click="fetchData" class="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition">Coba Lagi</button>
            <a href="/help" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Kembali</a>
          </div>
        </div>

        <!-- Content -->
        <template v-else>
          <div class="mb-8">
            <h1 class="text-2xl font-bold text-gray-900" style="font-family: 'Bricolage Grotesque', sans-serif">
              <span class="mr-2">{{ category?.icon || '📖' }}</span>{{ category?.name }}
            </h1>
            <p v-if="category?.description" class="mt-2 text-gray-600 text-sm">{{ category.description }}</p>
          </div>

          <!-- Articles -->
          <div v-if="articles.length > 0" class="space-y-3">
            <a
              v-for="article in articles"
              :key="article.slug"
              :href="`/help/${article.slug}`"
              class="block bg-white rounded-xl border border-gray-200 p-5 hover:border-amber-300 hover:shadow-sm transition"
            >
              <h3 class="font-semibold text-gray-900 text-sm mb-1">{{ article.title }}</h3>
              <p v-if="article.summary" class="text-xs text-gray-500 line-clamp-2">{{ article.summary }}</p>
            </a>
          </div>

          <!-- No articles -->
          <div v-else class="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p class="text-gray-900 font-semibold text-sm mb-1">Panduan segera tersedia</p>
            <p class="text-gray-500 text-xs mb-4">Artikel untuk kategori ini sedang disiapkan.</p>
            <a href="/help" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition inline-block">Kembali ke Pusat Bantuan</a>
          </div>
        </template>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase.js'


const route = useRoute()
const slug = route.params.slug

const category = ref(null)
const articles = ref([])
const loading = ref(true)
const error = ref(false)

async function fetchData() {
  loading.value = true
  error.value = false

  try {
    const { data: cat, error: catErr } = await supabase
      .from('kinora_help_categories')
      .select('name, slug, description, icon')
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('is_active', true)
      .maybeSingle()

    if (catErr) throw catErr
    category.value = cat

    const { data: arts, error: artErr } = await supabase
      .from('kinora_help_articles')
      .select('title, slug, summary, sort_order')
      .eq('category', slug)
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true })

    if (artErr) throw artErr
    articles.value = arts || []
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
