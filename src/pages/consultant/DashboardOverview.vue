<template>
  <ConsultantLayout>
    <div class="space-y-6">
      <!-- Loading -->
      <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat dashboard...</div>

      <!-- Error -->
      <div v-else-if="error" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p class="text-gray-900 font-semibold text-sm mb-2">{{ error }}</p>
        <button @click="loadDashboard" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Coba Lagi</button>
      </div>

      <template v-else>
      <!-- Greeting -->
      <div>
        <h1 class="text-xl font-bold text-gray-900">{{ greeting }}, {{ consultantName }}</h1>
        <p class="text-sm text-gray-500">Berikut jadwal dan aktivitas konsultasi Anda hari ini.</p>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div v-for="card in summaryCards" :key="card.label" class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-[11px] text-gray-400 uppercase">{{ card.label }}</p>
          <p class="text-lg font-bold mt-1" :class="card.color || 'text-gray-900'">{{ card.value }}</p>
        </div>
      </div>

      <!-- Status Toggle -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-900">Menerima Konsultasi</p>
          <p class="text-xs text-gray-500">Aktifkan untuk menerima permintaan baru</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="acceptingConsultations" class="sr-only peer" />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
        </label>
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-wrap gap-2">
        <router-link to="/consultant/schedule" class="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition">📅 Atur Jadwal</router-link>
        <button class="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition">🔓 Buka Slot</button>
        <button class="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition">⚡ Aktifkan Instan</button>
        <button class="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition">🚫 Tutup Hari Ini</button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Today's Agenda -->
        <section class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="font-semibold text-gray-900 mb-4">Agenda Hari Ini</h2>
          <div v-if="todayAgenda.length === 0" class="text-center py-6 text-gray-400 text-sm">Tidak ada konsultasi hari ini.</div>
          <div v-else class="space-y-3">
            <div v-for="a in todayAgenda" :key="a.id" class="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
              <div class="text-center min-w-[50px]">
                <p class="text-xs font-bold text-gray-900">{{ a.time }}</p>
                <p class="text-[10px] text-gray-400">{{ a.duration }} min</p>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ a.client }}</p>
                <p class="text-xs text-gray-500">{{ a.service }} · {{ a.method === 'chat' ? 'Chat' : 'Google Meet' }}</p>
              </div>
              <span class="px-2 py-0.5 text-[10px] rounded-full font-medium" :class="a.statusClass">{{ a.statusLabel }}</span>
            </div>
          </div>
        </section>

        <!-- Recent Requests -->
        <section class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="font-semibold text-gray-900 mb-4">Permintaan Terbaru</h2>
          <div v-if="recentRequests.length === 0" class="text-center py-6 text-gray-400 text-sm">Belum ada permintaan.</div>
          <div v-else class="space-y-3">
            <div v-for="r in recentRequests" :key="r.id" class="flex items-center justify-between p-3 rounded-lg border border-gray-100">
              <div>
                <p class="text-sm font-medium text-gray-900">{{ r.client }}</p>
                <p class="text-xs text-gray-500">{{ r.service }} · {{ r.date }}</p>
              </div>
              <div class="flex gap-2">
                <button class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Terima</button>
                <button class="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200">Tolak</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Recent Reviews -->
      <section class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="font-semibold text-gray-900 mb-4">Ulasan Terbaru</h2>
        <div class="space-y-3">
          <div v-for="rev in demoReviews" :key="rev.id" class="p-3 rounded-lg border border-gray-100">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm text-amber-500">{{ '⭐'.repeat(rev.rating) }}</span>
              <span class="text-xs text-gray-400">{{ rev.date }}</span>
            </div>
            <p class="text-sm text-gray-700">{{ rev.text }}</p>
            <p class="text-xs text-gray-400 mt-1">— {{ rev.client }} · {{ rev.service }}</p>
          </div>
        </div>
      </section>
      </template>
    </div>
  </ConsultantLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase.js'
import ConsultantLayout from '../../components/ConsultantLayout.vue'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const acceptingConsultations = ref(true)
const consultantName = ref('')
const consultantId = ref(null)
const consultantProfile = ref(null)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
})

// Stats
const todayCount = ref(0)
const upcomingCount = ref(0)
const clientCount = ref(0)
const activeServices = ref(0)
const monthlyEarnings = ref(0)
const availableBalance = ref(0)
const heldBalance = ref(0)
const avgRating = ref(0)
const reviewCount = ref(0)
const completedThisMonth = ref(0)

const summaryCards = computed(() => [
  { label: 'Hari Ini', value: String(todayCount.value), color: 'text-blue-600' },
  { label: 'Mendatang', value: String(upcomingCount.value), color: 'text-amber-600' },
  { label: 'Klien', value: String(clientCount.value) },
  { label: 'Layanan Aktif', value: String(activeServices.value) },
  { label: 'Selesai Bulan Ini', value: String(completedThisMonth.value) },
  { label: 'Rating', value: avgRating.value > 0 ? `${avgRating.value.toFixed(1)} ⭐` : '—', color: 'text-amber-600' },
  { label: 'Pendapatan Bulan Ini', value: formatIDR(monthlyEarnings.value), color: 'text-green-600' },
  { label: 'Saldo Tersedia', value: formatIDR(availableBalance.value), color: 'text-green-600' },
])

const todayAgenda = ref([])
const recentRequests = ref([])
const demoReviews = ref([])

function formatIDR(val) {
  if (!val) return 'Rp 0'
  if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`
  if (val >= 1000) return `Rp ${Math.round(val / 1000)}rb`
  return `Rp ${val}`
}

function formatTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function loadDashboard() {
  loading.value = true
  error.value = ''

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Get consultant profile
    const { data: profile } = await supabase
      .from('kinora_consultants')
      .select('*')
      .eq('consultant_user_id', user.id)
      .maybeSingle()

    if (!profile) { router.push('/consultant/profile'); return }
    if (!profile.is_active) {
      // Handle inactive states - still show dashboard but with limited info
      consultantProfile.value = profile
      consultantName.value = profile.name || ''
      consultantId.value = profile.id
      loading.value = false
      return
    }

    consultantProfile.value = profile
    consultantName.value = profile.name || ''
    consultantId.value = profile.id
    acceptingConsultations.value = profile.is_active

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Today's sessions
    const { data: todaySessions } = await supabase
      .from('kinora_consultation_sessions')
      .select('id, user_id, status, duration_minutes, meeting_platform, started_at, topic, user:users!kinora_consultation_sessions_user_id_fkey(display_name)')
      .eq('consultant_id', profile.id)
      .gte('started_at', todayStart)
      .lt('started_at', todayEnd)
      .not('status', 'in', '("cancelled","expired")')
      .order('started_at')

    todayCount.value = todaySessions?.length || 0
    todayAgenda.value = (todaySessions || []).slice(0, 5).map(s => ({
      id: s.id,
      time: formatTime(s.started_at),
      duration: s.duration_minutes,
      client: s.user?.display_name || 'Klien',
      service: s.topic || 'Konsultasi',
      method: s.meeting_platform || 'chat',
      statusLabel: mapStatus(s.status),
      statusClass: mapStatusClass(s.status),
    }))

    // Upcoming sessions
    const { count: upcoming } = await supabase
      .from('kinora_consultation_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('consultant_id', profile.id)
      .gt('started_at', now.toISOString())
      .not('status', 'in', '("cancelled","expired","completed")')
    upcomingCount.value = upcoming || 0

    // Unique clients
    const { data: clients } = await supabase
      .from('kinora_consultation_sessions')
      .select('user_id')
      .eq('consultant_id', profile.id)
    clientCount.value = new Set((clients || []).map(c => c.user_id)).size

    // Completed this month
    const { count: monthCompleted } = await supabase
      .from('kinora_consultation_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('consultant_id', profile.id)
      .eq('status', 'completed')
      .gte('started_at', monthStart)
    completedThisMonth.value = monthCompleted || 0

    // Earnings this month
    const { data: earnings } = await supabase
      .from('kinora_consultant_earnings')
      .select('net_earning, status')
      .eq('consultant_id', profile.id)
      .gte('created_at', monthStart)
    monthlyEarnings.value = (earnings || [])
      .filter(e => ['confirmed', 'paid'].includes(e.status))
      .reduce((s, e) => s + Number(e.net_earning || 0), 0)
    availableBalance.value = (earnings || [])
      .filter(e => e.status === 'confirmed')
      .reduce((s, e) => s + Number(e.net_earning || 0), 0)
    heldBalance.value = (earnings || [])
      .filter(e => e.status === 'pending')
      .reduce((s, e) => s + Number(e.net_earning || 0), 0)

    // Rating
    const { data: sessions } = await supabase
      .from('kinora_consultation_sessions')
      .select('user_rating')
      .eq('consultant_id', profile.id)
      .not('user_rating', 'is', null)
    if (sessions?.length) {
      avgRating.value = sessions.reduce((s, r) => s + r.user_rating, 0) / sessions.length
      reviewCount.value = sessions.length
    }

    // Recent requests (pending/paid sessions)
    const { data: requests } = await supabase
      .from('kinora_consultation_sessions')
      .select('id, user_id, topic, started_at, status, user:users!kinora_consultation_sessions_user_id_fkey(display_name)')
      .eq('consultant_id', profile.id)
      .in('status', ['paid', 'scheduled', 'waiting_consultant'])
      .order('created_at', { ascending: false })
      .limit(5)
    recentRequests.value = (requests || []).map(r => ({
      id: r.id,
      client: r.user?.display_name || 'Klien',
      service: r.topic || 'Konsultasi',
      date: formatDate(r.started_at),
    }))

    // Reviews
    const { data: reviewSessions } = await supabase
      .from('kinora_consultation_sessions')
      .select('id, user_rating, user_review, completed_at, topic, user:users!kinora_consultation_sessions_user_id_fkey(display_name)')
      .eq('consultant_id', profile.id)
      .not('user_rating', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(3)
    demoReviews.value = (reviewSessions || []).map(r => ({
      id: r.id,
      rating: r.user_rating,
      text: r.user_review || 'Tanpa komentar.',
      client: r.user?.display_name || 'Klien',
      service: r.topic || 'Konsultasi',
      date: r.completed_at ? formatDate(r.completed_at) : '',
    }))

    // Active services count (using consultant's service price > 0 as proxy)
    activeServices.value = profile.chat_enabled || profile.meeting_enabled ? 1 : 0

  } catch (e) {
    error.value = 'Gagal memuat data dashboard.'
  } finally {
    loading.value = false
  }
}

function mapStatus(status) {
  const map = { active: 'Aktif', scheduled: 'Terjadwal', paid: 'Dibayar', waiting_consultant: 'Menunggu', ready: 'Siap', completed: 'Selesai', cancelled: 'Dibatalkan' }
  return map[status] || status
}

function mapStatusClass(status) {
  if (['active', 'ready'].includes(status)) return 'bg-green-100 text-green-700'
  if (['scheduled', 'paid'].includes(status)) return 'bg-blue-100 text-blue-700'
  if (status === 'waiting_consultant') return 'bg-amber-100 text-amber-700'
  if (status === 'completed') return 'bg-gray-100 text-gray-600'
  return 'bg-gray-100 text-gray-500'
}

async function toggleAccepting() {
  if (!consultantId.value) return
  await supabase.from('kinora_consultants')
    .update({ is_active: acceptingConsultations.value, updated_at: new Date().toISOString() })
    .eq('id', consultantId.value)
}

// Watch toggle
import { watch } from 'vue'
watch(acceptingConsultations, toggleAccepting)

onMounted(loadDashboard)
</script>
