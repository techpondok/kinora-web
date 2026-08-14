<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Moderasi Komentar</h1>
        <p class="text-sm text-gray-500">Kelola komentar dan laporan pengguna.</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <span>Total: {{ totalCount }}</span>
          <span>·</span>
          <span class="text-yellow-600">Reported: {{ reportedCount }}</span>
        </div>
        <button @click="refresh" :disabled="loading" class="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
          ↻ Refresh
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex flex-wrap gap-2">
      <button v-for="tab in tabs" :key="tab.value" @click="setFilter(tab.value)"
        :class="filter === tab.value ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition">
        {{ tab.label }} <span v-if="tab.count !== undefined" class="ml-1 opacity-70">({{ tab.count }})</span>
      </button>
    </div>

    <!-- Search + Sort -->
    <div class="flex flex-col sm:flex-row gap-3">
      <input v-model="searchInput" @input="debouncedSearch" type="text" placeholder="Cari komentar, user..."
        class="flex-1 sm:max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200" />
      <select v-model="sortOrder" @change="refresh" class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
        <option value="newest">Terbaru</option>
        <option value="oldest">Terlama</option>
        <option value="most_reported">Paling Dilaporkan</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading && comments.length === 0" class="text-center py-8 text-gray-400 text-sm">Memuat...</div>

    <!-- Empty -->
    <div v-else-if="comments.length === 0" class="text-center py-12">
      <p class="text-gray-400 text-sm">Tidak ada komentar.</p>
      <p class="text-gray-300 text-xs mt-1">Komentar dari mobile app akan muncul di sini.</p>
    </div>

    <!-- List -->
    <div v-else class="space-y-3">
      <div v-for="c in comments" :key="c.id" class="bg-white rounded-xl border p-4">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img v-if="c.avatar_url" :src="c.avatar_url" class="w-full h-full object-cover" />
            <span v-else class="text-xs font-semibold text-purple-700">{{ (c.display_name || '?')[0].toUpperCase() }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium text-gray-900">{{ c.display_name || 'Unknown User' }}</span>
              <span :class="statusColor(c.display_status)" class="px-1.5 py-0.5 text-[10px] rounded font-medium capitalize">{{ c.display_status }}</span>
              <span v-if="c.report_count > 0" class="px-1.5 py-0.5 text-[10px] rounded bg-red-100 text-red-700">{{ c.report_count }} laporan</span>
              <span class="text-xs text-gray-400">{{ formatDate(c.created_at) }}</span>
            </div>
            <p class="mt-1 text-sm text-gray-700 break-words">{{ c.body || '(dihapus)' }}</p>
            <p v-if="c.article_title" class="text-xs text-gray-400 mt-1">
              Artikel: <a v-if="c.article_slug" :href="`/articles/${c.article_slug}`" target="_blank" class="text-purple-600 hover:underline">{{ c.article_title }}</a>
              <span v-else>{{ c.article_title }}</span>
            </p>
            <p v-else-if="c.content_id" class="text-xs text-gray-400 mt-1">{{ c.content_type || 'article' }}: {{ c.content_id.substring(0, 8) }}...</p>
          </div>
        </div>
        <!-- Actions -->
        <div class="flex flex-wrap gap-2 mt-3 pl-11">
          <button v-if="c.display_status !== 'published'" @click="updateStatus(c, 'published')" class="px-2.5 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition">Publish</button>
          <button v-if="c.display_status !== 'hidden'" @click="updateStatus(c, 'hidden')" class="px-2.5 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 transition">Sembunyikan</button>
          <button v-if="c.display_status !== 'rejected'" @click="updateStatus(c, 'rejected')" class="px-2.5 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition">Tolak</button>
          <button v-if="c.article_slug" @click="viewArticle(c)" class="px-2.5 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition">Lihat Artikel</button>
          <button @click="removeComment(c)" class="px-2.5 py-1 text-xs bg-gray-100 text-gray-500 rounded hover:bg-gray-200 transition">Delete</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalCount > PAGE_SIZE" class="flex items-center justify-between pt-4">
      <p class="text-xs text-gray-400">Halaman {{ page }} dari {{ totalPages }} ({{ totalCount }} komentar)</p>
      <div class="flex gap-2">
        <button @click="prevPage" :disabled="page <= 1" class="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-30 hover:bg-gray-50">← Prev</button>
        <button @click="nextPage" :disabled="page >= totalPages" class="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-30 hover:bg-gray-50">Next →</button>
      </div>
    </div>

    <!-- Dev log -->
    <div v-if="envLog" class="mt-4 p-3 bg-gray-50 rounded-lg text-[10px] text-gray-400 font-mono whitespace-pre-wrap">{{ envLog }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase, envInfo } from '../lib/supabase.js'

const PAGE_SIZE = 20

const comments = ref([])
const loading = ref(false)
const filter = ref('all')
const searchInput = ref('')
const search = ref('')
const sortOrder = ref('newest')
const page = ref(1)
const totalCount = ref(0)
const reportedCount = ref(0)
const envLog = ref('')

// Status normalization: treat legacy values as 'published'
const PUBLISHED_STATUSES = ['published', 'active', 'approved', 'visible']

function normalizeStatus(status) {
  if (!status || PUBLISHED_STATUSES.includes(status)) return 'published'
  return status
}

const tabs = computed(() => [
  { value: 'all', label: 'Semua', count: totalCount.value },
  { value: 'published', label: 'Published' },
  { value: 'reported', label: 'Reported', count: reportedCount.value },
  { value: 'hidden', label: 'Hidden' },
  { value: 'rejected', label: 'Rejected' },
])

const totalPages = computed(() => Math.ceil(totalCount.value / PAGE_SIZE))

function statusColor(status) {
  const map = {
    published: 'bg-green-100 text-green-700',
    hidden: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    pending: 'bg-blue-100 text-blue-700',
    deleted: 'bg-gray-100 text-gray-500',
  }
  return map[status] || 'bg-gray-100 text-gray-500'
}

function formatDate(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  if (diff < 60000) return 'Baru saja'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

let debounceTimer = null
function debouncedSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    search.value = searchInput.value
    page.value = 1
    loadComments()
  }, 400)
}

function setFilter(val) {
  filter.value = val
  page.value = 1
  loadComments()
}

function nextPage() {
  if (page.value < totalPages.value) { page.value++; loadComments() }
}

function prevPage() {
  if (page.value > 1) { page.value--; loadComments() }
}

function refresh() {
  page.value = 1
  loadComments()
  loadCounts()
}

function viewArticle(c) {
  if (c.article_slug) window.open(`/articles/${c.article_slug}`, '_blank')
}

async function loadComments() {
  loading.value = true

  try {
    // Build query — fetch from kinora_comments (same table as mobile)
    let query = supabase
      .from('kinora_comments')
      .select(`
        id, body, status, content_id, content_type, parent_id,
        user_id, user_name, likes_count, replies_count, report_count,
        is_edited, is_hidden, created_at, updated_at,
        article:kinora_articles!article_id(title, slug),
        profile:users(display_name, avatar_url)
      `, { count: 'exact' })

    // Exclude soft-deleted
    query = query.neq('status', 'deleted')

    // Status filter
    if (filter.value === 'published') {
      // Include legacy statuses
      query = query.in('status', PUBLISHED_STATUSES.concat([null]))
    } else if (filter.value === 'hidden') {
      query = query.eq('status', 'hidden')
    } else if (filter.value === 'rejected') {
      query = query.eq('status', 'rejected')
    } else if (filter.value === 'reported') {
      query = query.gt('report_count', 0)
    }
    // 'all' = no status filter (except deleted excluded above)

    // Search
    if (search.value) {
      query = query.or(`body.ilike.%${search.value}%,user_name.ilike.%${search.value}%`)
    }

    // Sort
    if (sortOrder.value === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else if (sortOrder.value === 'most_reported') {
      query = query.order('report_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const from = (page.value - 1) * PAGE_SIZE
    query = query.range(from, from + PAGE_SIZE - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[ADMIN_COMMENTS] Query error:', error.message)
      // Fallback: try simpler query without relationships
      await loadCommentsFallback()
      return
    }

    totalCount.value = count || 0
    comments.value = (data || []).map(c => ({
      ...c,
      display_name: c.profile?.display_name || c.user_name || 'Unknown',
      avatar_url: c.profile?.avatar_url || null,
      article_title: c.article?.title || null,
      article_slug: c.article?.slug || null,
      display_status: normalizeStatus(c.status),
      report_count: c.report_count || 0,
    }))

    // Log for dev debugging
    if (envInfo.isDevelopment) {
      envLog.value = `[ADMIN_COMMENTS][LOAD]
  environment: ${envInfo.env}
  source: kinora_comments
  project: ${envInfo.projectRef}
  statusFilter: ${filter.value}
  search: ${search.value || '(none)'}
  page: ${page.value}
  responseCount: ${data?.length || 0}
  totalCount: ${count || 0}`
    }
  } catch (e) {
    console.error('[ADMIN_COMMENTS] Error:', e.message)
    await loadCommentsFallback()
  } finally {
    loading.value = false
  }
}

// Fallback query if relationship joins fail
async function loadCommentsFallback() {
  let query = supabase
    .from('kinora_comments')
    .select('*', { count: 'exact' })
    .neq('status', 'deleted')

  if (filter.value === 'published') {
    query = query.in('status', PUBLISHED_STATUSES.concat([null]))
  } else if (filter.value === 'hidden') {
    query = query.eq('status', 'hidden')
  } else if (filter.value === 'rejected') {
    query = query.eq('status', 'rejected')
  } else if (filter.value === 'reported') {
    query = query.gt('report_count', 0)
  }

  if (search.value) {
    query = query.or(`body.ilike.%${search.value}%,user_name.ilike.%${search.value}%`)
  }

  query = query.order('created_at', { ascending: sortOrder.value === 'oldest' })

  const from = (page.value - 1) * PAGE_SIZE
  query = query.range(from, from + PAGE_SIZE - 1)

  const { data, count } = await query

  totalCount.value = count || 0
  comments.value = (data || []).map(c => ({
    ...c,
    display_name: c.user_name || 'Unknown',
    avatar_url: null,
    article_title: null,
    article_slug: null,
    display_status: normalizeStatus(c.status),
    report_count: c.report_count || 0,
  }))
}

async function loadCounts() {
  // Total (non-deleted)
  const { count: total } = await supabase
    .from('kinora_comments')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'deleted')

  totalCount.value = total || 0

  // Reported
  const { count: reported } = await supabase
    .from('kinora_comments')
    .select('id', { count: 'exact', head: true })
    .gt('report_count', 0)
    .neq('status', 'deleted')

  reportedCount.value = reported || 0
}

async function updateStatus(comment, newStatus) {
  const { data, error } = await supabase.rpc('moderate_kinora_comment', {
    p_comment_id: comment.id,
    p_status: newStatus,
    p_reason: null,
  })

  if (error) {
    alert('Gagal update status: ' + error.message)
    return
  }

  if (envInfo.isDevelopment) {
    console.log('[COMMENT_MODERATION]', {
      commentId: comment.id,
      oldStatus: comment.display_status,
      newStatus,
      rpc: 'moderate_kinora_comment',
      result: data,
    })
  }

  comment.status = newStatus
  comment.display_status = newStatus
  loadCounts()
}

async function removeComment(comment) {
  if (!confirm('Hapus komentar ini? (soft delete)')) return

  const { error } = await supabase.rpc('moderate_kinora_comment', {
    p_comment_id: comment.id,
    p_status: 'deleted',
    p_reason: null,
  })

  if (error) {
    alert('Gagal hapus: ' + error.message)
    return
  }

  comments.value = comments.value.filter(c => c.id !== comment.id)
  totalCount.value = Math.max(totalCount.value - 1, 0)
}

onMounted(() => {
  loadComments()
  loadCounts()
})
</script>
