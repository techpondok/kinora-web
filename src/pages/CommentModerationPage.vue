<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Moderasi Komentar</h1>
        <p class="text-sm text-gray-500">Kelola komentar dan laporan pengguna.</p>
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <span>Total: {{ stats.total }}</span>
        <span>·</span>
        <span class="text-yellow-600">Reported: {{ stats.reported }}</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2">
      <button v-for="tab in tabs" :key="tab.value" @click="filter = tab.value"
        :class="filter === tab.value ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition">
        {{ tab.label }}
      </button>
    </div>

    <!-- Search -->
    <input v-model="search" type="text" placeholder="Cari komentar, user..." class="w-full sm:w-64 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200" />

    <!-- Loading -->
    <div v-if="loading" class="text-center py-8 text-gray-400 text-sm">Memuat...</div>

    <!-- Empty -->
    <div v-else-if="filteredComments.length === 0" class="text-center py-8 text-gray-400 text-sm">Tidak ada komentar.</div>

    <!-- List -->
    <div v-else class="space-y-3">
      <div v-for="c in filteredComments" :key="c.id" class="bg-white rounded-xl border p-4">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img v-if="c.users?.avatar_url" :src="c.users.avatar_url" class="w-full h-full object-cover" />
            <span v-else class="text-xs font-semibold text-purple-700">{{ (c.users?.display_name || '?')[0].toUpperCase() }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium text-gray-900">{{ c.users?.display_name || 'Unknown' }}</span>
              <span :class="statusColor(c.status)" class="px-1.5 py-0.5 text-[10px] rounded font-medium">{{ c.status }}</span>
              <span v-if="c.report_count" class="px-1.5 py-0.5 text-[10px] rounded bg-red-100 text-red-700">{{ c.report_count }} laporan</span>
              <span class="text-xs text-gray-400">{{ formatDate(c.created_at) }}</span>
            </div>
            <p class="mt-1 text-sm text-gray-700 break-words">{{ c.body || '(deleted)' }}</p>
            <p class="text-xs text-gray-400 mt-1">Artikel: {{ c.content_id?.substring(0, 8) }}... · {{ c.content_type }}</p>
          </div>
        </div>
        <!-- Actions -->
        <div class="flex gap-2 mt-3 pl-11">
          <button v-if="c.status !== 'published'" @click="updateStatus(c, 'published')" class="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100">Approve</button>
          <button v-if="c.status !== 'hidden'" @click="updateStatus(c, 'hidden')" class="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">Hide</button>
          <button v-if="c.status !== 'rejected'" @click="updateStatus(c, 'rejected')" class="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100">Reject</button>
          <button @click="removeComment(c)" class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const comments = ref([])
const loading = ref(true)
const filter = ref('all')
const search = ref('')

const tabs = [
  { value: 'all', label: 'Semua' },
  { value: 'published', label: 'Published' },
  { value: 'reported', label: 'Reported' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'rejected', label: 'Rejected' },
]

const stats = computed(() => ({
  total: comments.value.length,
  reported: comments.value.filter(c => c.report_count > 0).length,
}))

const filteredComments = computed(() => {
  let list = comments.value
  if (filter.value === 'reported') list = list.filter(c => c.report_count > 0)
  else if (filter.value !== 'all') list = list.filter(c => c.status === filter.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(c => (c.body || '').toLowerCase().includes(q) || (c.users?.display_name || '').toLowerCase().includes(q))
  }
  return list
})

function statusColor(status) {
  const map = { published: 'bg-green-100 text-green-700', hidden: 'bg-yellow-100 text-yellow-700', rejected: 'bg-red-100 text-red-700', pending: 'bg-blue-100 text-blue-700', deleted: 'bg-gray-100 text-gray-500' }
  return map[status] || 'bg-gray-100 text-gray-500'
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function loadComments() {
  loading.value = true
  const { data } = await supabase
    .from('kinora_comments')
    .select('*, users!inner(display_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(200)

  // Count reports per comment
  const { data: reports } = await supabase
    .from('kinora_comment_reports')
    .select('comment_id')

  const reportCounts = {}
  for (const r of (reports || [])) {
    reportCounts[r.comment_id] = (reportCounts[r.comment_id] || 0) + 1
  }

  comments.value = (data || []).map(c => ({ ...c, report_count: reportCounts[c.id] || 0 }))
  loading.value = false
}

async function updateStatus(comment, status) {
  await supabase.from('kinora_comments').update({ status }).eq('id', comment.id)
  comment.status = status
}

async function removeComment(comment) {
  if (!confirm('Hapus permanen komentar ini?')) return
  await supabase.from('kinora_comments').delete().eq('id', comment.id)
  comments.value = comments.value.filter(c => c.id !== comment.id)
}

onMounted(loadComments)
</script>
