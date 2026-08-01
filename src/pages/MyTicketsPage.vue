<template>
  <div class="min-h-screen bg-gray-50">
    <PublicHeader />
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 class="text-xl font-bold text-gray-900 mb-6">Tiket Saya</h1>

      <div v-if="!user" class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <p class="text-sm text-gray-700 mb-3">Login untuk melihat tiket Anda.</p>
        <a href="/login?redirect=/help/my-tickets" class="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium">Login</a>
      </div>

      <template v-else>
        <div class="flex gap-2 mb-4 overflow-x-auto">
          <button v-for="f in filters" :key="f.value" @click="activeFilter = f.value" :class="activeFilter === f.value ? 'bg-amber-100 text-amber-800' : 'bg-white text-gray-600'" class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 whitespace-nowrap font-medium">{{ f.label }}</button>
        </div>

        <div v-if="loading" class="text-center py-8 text-gray-500">Memuat...</div>
        <div v-else-if="filteredTickets.length === 0" class="bg-white rounded-xl border p-8 text-center text-gray-400">Belum ada tiket.</div>
        <div v-else class="space-y-3">
          <a v-for="t in filteredTickets" :key="t.id" :href="`/help/tickets/${t.id}`" class="block bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-300 transition card-hover">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 text-sm">{{ t.title }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ t.ticket_number }} · {{ t.type }} · {{ formatDate(t.created_at) }}</p>
              </div>
              <span :class="statusColor(t.status)" class="px-2 py-0.5 text-xs rounded-full font-medium">{{ t.status }}</span>
            </div>
          </a>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'
import PublicHeader from '../components/PublicHeader.vue'

const user = ref(null)
const tickets = ref([])
const loading = ref(true)
const activeFilter = ref('')

const filters = [
  { label: 'Semua', value: '' },
  { label: 'Aktif', value: 'active' },
  { label: 'Menunggu', value: 'waiting_user' },
  { label: 'Selesai', value: 'resolved' },
  { label: 'Bug', value: 'bug' },
  { label: 'Fitur', value: 'feature' },
]

const filteredTickets = computed(() => {
  if (!activeFilter.value) return tickets.value
  if (['bug', 'feature', 'account_access'].includes(activeFilter.value)) return tickets.value.filter(t => t.type === activeFilter.value)
  if (activeFilter.value === 'active') return tickets.value.filter(t => !['resolved', 'closed', 'rejected', 'duplicate'].includes(t.status))
  return tickets.value.filter(t => t.status === activeFilter.value)
})

function statusColor(s) {
  const m = { open: 'bg-blue-100 text-blue-700', reviewing: 'bg-yellow-100 text-yellow-700', in_progress: 'bg-purple-100 text-purple-700', needs_info: 'bg-orange-100 text-orange-700', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-500', rejected: 'bg-red-100 text-red-600' }
  return m[s] || 'bg-gray-100 text-gray-600'
}

function formatDate(d) { return d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '' }

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    user.value = session.user
    const { data } = await supabase.from('support_tickets').select('id, ticket_number, type, status, priority, title, created_at, updated_at').eq('user_id', session.user.id).order('created_at', { ascending: false })
    tickets.value = data || []
  }
  loading.value = false
})
</script>
