<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Sesi Konsultasi</h1>
      <select v-model="filterStatus" @change="loadSessions" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
        <option value="">Semua</option>
        <option value="active">Aktif</option>
        <option value="paid">Menunggu</option>
        <option value="completed">Selesai</option>
        <option value="cancelled">Dibatalkan</option>
      </select>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-500">Memuat...</div>
    <div v-else-if="sessions.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div class="text-4xl mb-3">💬</div>
      <p class="text-gray-500">Belum ada sesi konsultasi.</p>
    </div>

    <div v-else class="space-y-3">
      <a v-for="s in sessions" :key="s.id" :href="`/consultant/chat/${s.id}`"
        class="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
              {{ (s.user_name || 'U').charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="font-medium text-gray-900 text-sm">{{ s.user_name || 'User' }}</p>
              <p class="text-xs text-gray-500">{{ s.topic || 'Tanpa topik' }} · {{ s.duration_minutes }} menit</p>
            </div>
          </div>
          <div class="text-right">
            <span :class="statusColor(s.status)" class="px-2 py-0.5 text-xs rounded-full">{{ s.status }}</span>
            <p class="text-xs text-gray-400 mt-1">{{ formatDate(s.created_at) }}</p>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const sessions = ref([])
const loading = ref(true)
const filterStatus = ref('')

function statusColor(s) {
  const map = { active: 'bg-green-100 text-green-700', completed: 'bg-gray-100 text-gray-500', paid: 'bg-blue-100 text-blue-700', waiting_consultant: 'bg-orange-100 text-orange-700', cancelled: 'bg-red-100 text-red-600' }
  return map[s] || 'bg-gray-100 text-gray-600'
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function loadSessions() {
  loading.value = true
  let query = supabase
    .from('kinora_consultation_sessions')
    .select('id, user_id, status, duration_minutes, topic, created_at, started_at, ends_at, chat_locked')
    .order('created_at', { ascending: false })

  if (filterStatus.value) query = query.eq('status', filterStatus.value)

  const { data } = await query.limit(50)
  sessions.value = (data || []).map(s => ({ ...s, user_name: null }))

  // Fetch user names
  const userIds = [...new Set(sessions.value.map(s => s.user_id).filter(Boolean))]
  if (userIds.length) {
    const { data: users } = await supabase.from('users').select('id, display_name').in('id', userIds)
    const userMap = {}
    for (const u of (users || [])) userMap[u.id] = u.display_name
    for (const s of sessions.value) s.user_name = userMap[s.user_id] || null
  }

  loading.value = false
}

onMounted(loadSessions)
</script>
