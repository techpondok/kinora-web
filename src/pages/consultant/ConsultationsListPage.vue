<template>
  <ConsultantLayout>
    <div class="space-y-5">
      <!-- Loading -->
      <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat konsultasi...</div>

      <template v-else>
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900">Konsultasi</h1>
        <div class="flex gap-2">
          <input v-model="search" type="text" placeholder="Cari klien..." class="px-3 py-2 border border-gray-200 rounded-lg text-sm w-40 outline-none" />
        </div>
      </div>

      <!-- Tabs -->
      <div class="overflow-x-auto border-b border-gray-200">
        <div class="flex gap-1 min-w-max">
          <button v-for="t in tabs" :key="t.key" @click="activeTab = t.key"
            :class="[activeTab === t.key ? 'border-amber-500 text-amber-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700', 'px-3 py-2 text-sm border-b-2 transition whitespace-nowrap']">
            {{ t.label }}
            <span v-if="t.count" class="ml-1 px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded-full">{{ t.count }}</span>
          </button>
        </div>
      </div>

      <!-- Consultation Cards -->
      <div v-if="filteredConsultations.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p class="text-gray-400 text-sm">Tidak ada konsultasi dalam kategori ini.</p>
      </div>
      <div v-else class="space-y-3">
        <div v-for="c in filteredConsultations" :key="c.id" class="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                {{ c.clientInitial }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ c.client }}</p>
                <p class="text-xs text-gray-500">{{ c.service }} · {{ c.category }}</p>
                <div class="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <span>{{ c.date }}</span>
                  <span>·</span>
                  <span>{{ c.time }}</span>
                  <span>·</span>
                  <span>{{ c.duration }} min</span>
                  <span>·</span>
                  <span>{{ c.method === 'chat' ? '💬 Chat' : '📹 Meet' }}</span>
                </div>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1 flex-shrink-0">
              <span class="px-2 py-0.5 text-[10px] rounded-full font-medium" :class="statusClass(c.status)">{{ statusLabel(c.status) }}</span>
              <span class="text-[10px] text-gray-400 font-mono">{{ c.code }}</span>
            </div>
          </div>
          <div v-if="c.topic" class="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">💭 {{ c.topic }}</div>
          <!-- Actions -->
          <div class="mt-3 flex gap-2 flex-wrap">
            <router-link :to="`/consultant/consultations/${c.id}`" class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Detail</router-link>
            <button v-if="c.status === 'pending'" class="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Terima</button>
            <button v-if="c.status === 'pending'" class="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200">Tolak</button>
            <button v-if="c.status === 'scheduled'" class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Mulai</button>
            <button v-if="c.status === 'in_progress'" class="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200">Selesaikan</button>
          </div>
        </div>
      </div>
      </template>
    </div>
  </ConsultantLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase.js'
import ConsultantLayout from '../../components/ConsultantLayout.vue'

const search = ref('')
const activeTab = ref('all')
const loading = ref(true)
const consultations = ref([])

const tabs = computed(() => {
  const all = consultations.value
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  return [
    { key: 'all', label: 'Semua', count: all.length },
    { key: 'pending', label: 'Permintaan Baru', count: all.filter(c => ['paid', 'waiting_consultant'].includes(c.status)).length },
    { key: 'scheduled', label: 'Terjadwal', count: all.filter(c => c.status === 'scheduled' || c.status === 'ready').length },
    { key: 'today', label: 'Hari Ini', count: all.filter(c => c._date === todayStr && !['cancelled', 'expired', 'completed'].includes(c.status)).length },
    { key: 'active', label: 'Berlangsung', count: all.filter(c => c.status === 'active').length },
    { key: 'completed', label: 'Selesai', count: all.filter(c => c.status === 'completed').length },
    { key: 'cancelled', label: 'Dibatalkan', count: all.filter(c => ['cancelled', 'expired'].includes(c.status)).length },
  ]
})

const filteredConsultations = computed(() => {
  let list = consultations.value
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  if (activeTab.value === 'pending') list = list.filter(c => ['paid', 'waiting_consultant'].includes(c.status))
  else if (activeTab.value === 'scheduled') list = list.filter(c => ['scheduled', 'ready'].includes(c.status))
  else if (activeTab.value === 'today') list = list.filter(c => c._date === todayStr && !['cancelled', 'expired', 'completed'].includes(c.status))
  else if (activeTab.value === 'active') list = list.filter(c => c.status === 'active')
  else if (activeTab.value === 'completed') list = list.filter(c => c.status === 'completed')
  else if (activeTab.value === 'cancelled') list = list.filter(c => ['cancelled', 'expired'].includes(c.status))

  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(c => c.client.toLowerCase().includes(q) || c.service.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }
  return list
})

function statusClass(s) {
  const map = { paid: 'bg-amber-100 text-amber-700', waiting_consultant: 'bg-amber-100 text-amber-700', scheduled: 'bg-blue-100 text-blue-700', ready: 'bg-blue-100 text-blue-700', active: 'bg-green-100 text-green-700', completed: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-600', expired: 'bg-red-100 text-red-600' }
  return map[s] || 'bg-gray-100 text-gray-600'
}

function statusLabel(s) {
  const map = { paid: 'Permintaan', waiting_consultant: 'Menunggu', scheduled: 'Terjadwal', ready: 'Siap', active: 'Berlangsung', completed: 'Selesai', cancelled: 'Dibatalkan', expired: 'Kedaluwarsa' }
  return map[s] || s
}

function formatTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function loadConsultations() {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('kinora_consultants')
    .select('id')
    .eq('consultant_user_id', user.id)
    .maybeSingle()
  if (!profile) { loading.value = false; return }

  const { data: sessions } = await supabase
    .from('kinora_consultation_sessions')
    .select('id, user_id, status, duration_minutes, meeting_platform, started_at, topic, session_price_amount, chat_enabled, meeting_enabled, user:users!kinora_consultation_sessions_user_id_fkey(display_name)')
    .eq('consultant_id', profile.id)
    .order('started_at', { ascending: false })
    .limit(100)

  consultations.value = (sessions || []).map((s, i) => ({
    id: s.id,
    code: `KNR-${s.id.slice(0, 8).toUpperCase()}`,
    client: s.user?.display_name || 'Klien',
    clientInitial: (s.user?.display_name || 'K').charAt(0).toUpperCase(),
    service: s.topic || 'Konsultasi',
    category: s.meeting_enabled ? 'Meeting' : 'Chat',
    method: s.meeting_platform || (s.chat_enabled ? 'chat' : 'google_meet'),
    date: formatDate(s.started_at),
    time: formatTime(s.started_at),
    duration: s.duration_minutes,
    status: s.status,
    topic: s.topic || '',
    _date: s.started_at ? s.started_at.slice(0, 10) : '',
  }))

  loading.value = false
}

onMounted(loadConsultations)
</script>
