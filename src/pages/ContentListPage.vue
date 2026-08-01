<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h1 class="text-xl font-bold text-gray-900">Konten & Artikel</h1>
      <button @click="$emit('navigate', 'content-editor')" class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
        + Tambah Konten
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <input v-model="search" type="text" placeholder="Cari judul, slug, penulis..." class="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64 outline-none focus:ring-2 focus:ring-blue-500" @input="debounceFetch" />
      <select v-model="filterType" @change="doFetch" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
        <option value="">Semua Tipe</option>
        <option v-for="t in contentTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
      <select v-model="filterStatus" @change="doFetch" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
        <option value="">Semua Status</option>
        <option value="draft">Draft</option>
        <option value="scheduled">Scheduled</option>
        <option value="published">Published</option>
        <option value="unpublished">Unpublished</option>
        <option value="archived">Archived</option>
      </select>
      <select v-model="filterFeatured" @change="doFetch" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
        <option value="">Featured?</option>
        <option value="true">Featured</option>
        <option value="false">Biasa</option>
      </select>
      <select v-model="sortBy" @change="doFetch" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
        <option value="created_at">Terbaru</option>
        <option value="created_at_asc">Terlama</option>
        <option value="read_count">Paling Dibaca</option>
        <option value="seo_score">SEO Score</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-gray-500">Memuat artikel...</div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{{ error }}</div>

    <!-- Empty -->
    <div v-else-if="articles.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div class="text-4xl mb-3">📝</div>
      <p class="text-gray-500">Belum ada konten. Buat artikel pertama!</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Artikel</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipe</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Publikasi</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Views</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SEO</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="a in articles" :key="a.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <img v-if="a.cover_url" :src="a.cover_url" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">📄</div>
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ a.title }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ a.author_name || '-' }}</p>
                </div>
                <span v-if="a.is_featured" class="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">⭐</span>
              </div>
            </td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ typeLabel(a.content_type) }}</td>
            <td class="px-4 py-3">
              <span :class="statusColor(a.status)" class="px-2 py-0.5 text-xs rounded-full">{{ a.status }}</span>
            </td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ formatDate(a.published_at) }}</td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ a.read_count }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-1">
                <div class="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div :class="a.seo_score >= 70 ? 'bg-green-500' : a.seo_score >= 40 ? 'bg-yellow-500' : 'bg-red-400'" class="h-full rounded-full" :style="{width: a.seo_score + '%'}"></div>
                </div>
                <span class="text-xs text-gray-500">{{ a.seo_score }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button @click="$emit('navigate', 'content-editor', a.id)" class="text-xs text-blue-600 hover:underline">Edit</button>
                <button v-if="a.status === 'draft' || a.status === 'unpublished'" @click="publish(a)" class="text-xs text-green-600 hover:underline">Publish</button>
                <button v-if="a.status === 'published'" @click="unpublish(a)" class="text-xs text-orange-600 hover:underline">Unpublish</button>
                <button @click="archive(a)" class="text-xs text-gray-500 hover:underline">Arsip</button>
                <button @click="confirmDelete(a)" class="text-xs text-red-600 hover:underline">Hapus</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalCount > pageSize" class="flex items-center justify-between">
      <p class="text-xs text-gray-500">{{ totalCount }} konten</p>
      <div class="flex gap-2">
        <button @click="page--; doFetch()" :disabled="page <= 1" class="px-3 py-1 text-sm border rounded disabled:opacity-30">←</button>
        <span class="px-3 py-1 text-sm text-gray-600">{{ page }} / {{ totalPages }}</span>
        <button @click="page++; doFetch()" :disabled="page >= totalPages" class="px-3 py-1 text-sm border rounded disabled:opacity-30">→</button>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="deletingArticle" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h3 class="font-semibold text-gray-900">Hapus Artikel</h3>
        <p class="text-sm text-gray-600 mt-2">Yakin hapus "<strong>{{ deletingArticle.title }}</strong>"?</p>
        <div class="flex justify-end gap-3 mt-5">
          <button @click="deletingArticle = null" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
          <button @click="doDelete" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Hapus</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useArticles } from '../composables/useArticles.js'

const emit = defineEmits(['navigate'])
const { articles, loading, error, totalCount, fetchArticles, updateStatus, deleteArticle } = useArticles()

const search = ref('')
const filterType = ref('')
const filterStatus = ref('')
const filterFeatured = ref('')
const sortBy = ref('created_at')
const page = ref(1)
const pageSize = 10
const deletingArticle = ref(null)

const contentTypes = [
  { value: 'article', label: 'Artikel' },
  { value: 'news', label: 'Berita' },
  { value: 'tips_keluarga', label: 'Tips Keluarga' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'keuangan_keluarga', label: 'Keuangan Keluarga' },
  { value: 'kesehatan_keluarga', label: 'Kesehatan Keluarga' },
  { value: 'keamanan_digital', label: 'Keamanan Digital' },
  { value: 'teknologi_keluarga', label: 'Teknologi Keluarga' },
  { value: 'update_produk', label: 'Update Produk' },
  { value: 'pengumuman', label: 'Pengumuman' },
  { value: 'press_release', label: 'Press Release' },
]

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

let debounceTimer = null
function debounceFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; doFetch() }, 300)
}

function doFetch() {
  const ascending = sortBy.value === 'created_at_asc'
  const col = sortBy.value === 'created_at_asc' ? 'created_at' : sortBy.value
  fetchArticles({ page: page.value, pageSize, search: search.value, contentType: filterType.value, status: filterStatus.value, featured: filterFeatured.value, sortBy: col, sortAsc: ascending })
}

function typeLabel(t) {
  return contentTypes.find(c => c.value === t)?.label || t
}

function statusColor(s) {
  const map = { draft: 'bg-gray-100 text-gray-600', scheduled: 'bg-blue-100 text-blue-700', published: 'bg-green-100 text-green-700', unpublished: 'bg-orange-100 text-orange-700', archived: 'bg-gray-100 text-gray-500' }
  return map[s] || 'bg-gray-100 text-gray-600'
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function publish(a) { await updateStatus(a.id, 'published'); doFetch() }
async function unpublish(a) { await updateStatus(a.id, 'unpublished'); doFetch() }
async function archive(a) { await updateStatus(a.id, 'archived'); doFetch() }

function confirmDelete(a) { deletingArticle.value = a }
async function doDelete() {
  await deleteArticle(deletingArticle.value.id)
  deletingArticle.value = null
  doFetch()
}

onMounted(doFetch)
</script>
