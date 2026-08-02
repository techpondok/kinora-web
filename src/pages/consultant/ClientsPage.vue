<template>
  <ConsultantLayout>
    <div class="space-y-6">
      <!-- Loading -->
      <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat klien...</div>

      <template v-else>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">Klien Saya</h1>
          <p class="text-sm text-gray-500">Daftar klien yang pernah atau sedang berkonsultasi dengan Anda.</p>
        </div>
      </div>

      <!-- Search -->
      <div class="relative">
        <input v-model="search" type="text" placeholder="Cari klien..." class="w-full px-4 py-2.5 pl-10 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none" />
        <svg class="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>

      <!-- Clients -->
      <div class="space-y-3">
        <div v-for="client in filteredClients" :key="client.id" class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">{{ client.initials }}</div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900">{{ client.name }}</p>
            <p class="text-xs text-gray-500">Terakhir: {{ client.lastConsultation }} · {{ client.lastTopic }}</p>
          </div>
          <div class="text-right hidden md:block">
            <p class="text-xs text-gray-500">{{ client.totalConsultations }}x konsultasi</p>
            <p class="text-xs text-gray-400" v-if="client.nextSchedule">Berikutnya: {{ client.nextSchedule }}</p>
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
const loading = ref(true)
const clients = ref([])

const filteredClients = computed(() => {
  if (!search.value) return clients.value
  const q = search.value.toLowerCase()
  return clients.value.filter(c => c.name.toLowerCase().includes(q) || c.lastTopic.toLowerCase().includes(q))
})

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function loadClients() {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }

  const { data: profile } = await supabase
    .from('kinora_consultants')
    .select('id')
    .eq('consultant_user_id', user.id)
    .maybeSingle()
  if (!profile) { loading.value = false; return }

  // Get all sessions for this consultant with user info
  const { data: sessions } = await supabase
    .from('kinora_consultation_sessions')
    .select('user_id, topic, started_at, status, user:users!kinora_consultation_sessions_user_id_fkey(display_name)')
    .eq('consultant_id', profile.id)
    .order('started_at', { ascending: false })

  // Group by user_id
  const grouped = {}
  for (const s of (sessions || [])) {
    const uid = s.user_id
    if (!grouped[uid]) {
      grouped[uid] = {
        id: uid,
        name: s.user?.display_name || 'Klien',
        initials: (s.user?.display_name || 'K').slice(0, 2).toUpperCase(),
        lastConsultation: formatDate(s.started_at),
        lastTopic: s.topic || 'Konsultasi',
        totalConsultations: 0,
        nextSchedule: null,
      }
    }
    grouped[uid].totalConsultations++
    // Check for upcoming
    if (!['cancelled', 'expired', 'completed'].includes(s.status) && s.started_at && new Date(s.started_at) > new Date()) {
      if (!grouped[uid].nextSchedule) {
        grouped[uid].nextSchedule = formatDate(s.started_at)
      }
    }
  }

  clients.value = Object.values(grouped).sort((a, b) => b.totalConsultations - a.totalConsultations)
  loading.value = false
}

onMounted(loadClients)
</script>
