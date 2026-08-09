<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Hero -->
    <section class="bg-white border-b border-gray-100 py-12 px-4 sm:px-6">
      <div class="max-w-3xl mx-auto text-center">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900" style="font-family: 'Bricolage Grotesque', sans-serif">Ada yang bisa kami bantu?</h1>
        <p class="mt-2 text-gray-600 text-sm">Temukan panduan, laporkan masalah, atau sampaikan ide untuk pengembangan Kinora.</p>
        <div class="mt-6 max-w-md mx-auto">
          <input v-model="search" type="text" placeholder="Cari panduan, fitur, atau masalah..." class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400 shadow-sm" />
        </div>
        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <a href="/help/report-bug" class="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition">Laporkan Bug</a>
          <a href="/help/request-feature" class="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition">Usulkan Fitur</a>
          <a href="/help/account-access" class="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition">Masalah Login</a>
          <a href="/help/contact" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Hubungi Dukungan</a>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="py-12 px-4 sm:px-6">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-lg font-bold text-gray-900 mb-6">Kategori Bantuan</h2>

        <!-- Loading State -->
        <div v-if="catLoading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div v-for="n in 8" :key="n" class="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div class="w-8 h-8 bg-gray-200 rounded-lg mb-3"></div>
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-100 rounded w-full mb-1"></div>
            <div class="h-3 bg-gray-100 rounded w-2/3"></div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="catError" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p class="text-gray-900 font-semibold text-sm mb-1">Kategori bantuan tidak dapat dimuat</p>
          <p class="text-gray-500 text-xs mb-4">Terjadi kendala saat memuat panduan bantuan. Silakan coba kembali.</p>
          <div class="flex justify-center gap-3">
            <button @click="fetchCategories" class="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition">Coba Lagi</button>
            <a href="/help/contact" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Buka Pusat Bantuan</a>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="categories.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p class="text-gray-900 font-semibold text-sm mb-1">Kategori bantuan belum tersedia</p>
          <p class="text-gray-500 text-xs mb-4">Panduan bantuan sedang kami siapkan. Anda tetap dapat mencari informasi atau menghubungi tim Kinora.</p>
          <div class="flex justify-center gap-3">
            <button @click="$el.querySelector('input')?.focus()" class="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition">Cari Bantuan</button>
            <a href="/help/contact" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Hubungi Dukungan</a>
          </div>
        </div>

        <!-- Success State -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <a
            v-for="(cat, idx) in categories"
            :key="cat.slug"
            :href="`/help/category/${cat.slug}`"
            class="bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-300 hover:shadow-md transition-all duration-200 group card-fade-up"
            :style="{ animationDelay: `${idx * 50}ms` }"
          >
            <p class="text-xl mb-2 group-hover:scale-110 transition-transform duration-200">{{ cat.icon || '📖' }}</p>
            <h3 class="font-semibold text-gray-900 text-sm mb-1">{{ cat.name }}</h3>
            <p v-if="cat.description" class="text-xs text-gray-500 line-clamp-2 mb-2">{{ cat.description }}</p>
            <div class="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
              <span v-if="cat.article_count > 0" class="text-xs text-gray-400">{{ cat.article_count }} artikel</span>
              <span v-else class="text-xs text-amber-500 italic">Panduan segera tersedia</span>
              <span class="text-xs text-amber-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Lihat Panduan →</span>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-12 px-4 sm:px-6 bg-white">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-lg font-bold text-gray-900 mb-6">Pertanyaan Umum</h2>
        <div class="space-y-3">
          <div v-for="(faq, i) in faqs" :key="i" class="border border-gray-200 rounded-xl overflow-hidden">
            <button @click="openFaq = openFaq === i ? -1 : i" class="w-full px-5 py-4 text-left flex items-center justify-between">
              <span class="font-medium text-gray-900 text-sm">{{ faq.q }}</span>
              <span class="text-gray-400 transition-transform duration-300" :class="openFaq === i ? 'rotate-45' : ''">+</span>
            </button>
            <div class="faq-answer" :class="openFaq === i ? 'is-open px-5 pb-4' : 'px-5'">
              <p class="text-sm text-gray-600">{{ faq.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- My Tickets link -->
    <section class="py-8 px-4 sm:px-6 text-center">
      <a href="/help/my-tickets" class="text-amber-600 text-sm font-medium hover:underline">Lihat tiket saya →</a>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'


const search = ref('')
const openFaq = ref(-1)
const faqs = ref([])

const categories = ref([])
const catLoading = ref(true)
const catError = ref(false)

async function fetchCategories() {
  catLoading.value = true
  catError.value = false

  try {
    // Fetch published + active categories
    const { data, error } = await supabase
      .from('kinora_help_categories')
      .select('name, slug, description, icon, display_order')
      .eq('status', 'published')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error

    // Filter valid entries
    const validCategories = (data || []).filter(c => c.name && c.slug)

    // Count published articles per category
    const { data: articles, error: artErr } = await supabase
      .from('kinora_help_articles')
      .select('category')
      .eq('status', 'published')

    const articleCounts = {}
    if (!artErr && articles) {
      articles.forEach(a => {
        articleCounts[a.category] = (articleCounts[a.category] || 0) + 1
      })
    }

    categories.value = validCategories.map(c => ({
      ...c,
      article_count: articleCounts[c.slug] || 0
    }))
  } catch (e) {
    catError.value = true
    categories.value = []
  } finally {
    catLoading.value = false
  }
}

onMounted(async () => {
  fetchCategories()

  const { data } = await supabase.from('kinora_landing_config').select('value').eq('key', 'faq').eq('status', 'published').maybeSingle()
  if (data?.value?.items) faqs.value = data.value.items.filter(f => f.active)
})
</script>

<style scoped>
.card-fade-up {
  opacity: 0;
  transform: translateY(12px);
  animation: fadeUp 0.4s ease forwards;
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
