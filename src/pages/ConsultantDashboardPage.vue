<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside :class="['fixed top-0 left-0 h-full w-56 bg-white border-r border-gray-200 z-30 transition-transform lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full']">
      <div class="p-5 border-b border-gray-200">
        <h1 class="text-lg font-bold text-gray-900">Kinora</h1>
        <p class="text-xs text-gray-500">Konsultan</p>
      </div>
      <nav class="p-3 space-y-0.5">
        <button v-for="item in menuItems" :key="item.id" @click="activeTab = item.id; sidebarOpen = false"
          :class="['w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition', activeTab === item.id ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-100']">
          <span class="text-sm">{{ item.icon }}</span> {{ item.label }}
        </button>
      </nav>
      <div class="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200">
        <div class="flex items-center gap-2 mb-2 px-2">
          <div class="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center text-xs font-bold text-teal-700">{{ consultant?.name?.charAt(0) || '?' }}</div>
          <p class="text-xs text-gray-700 truncate flex-1">{{ consultant?.name }}</p>
        </div>
        <button @click="handleSignOut" class="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg">Logout</button>
      </div>
    </aside>
    <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black/30 z-20 lg:hidden"></div>

    <!-- Main -->
    <div class="lg:ml-56">
      <header class="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button @click="sidebarOpen = !sidebarOpen" class="lg:hidden"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg></button>
        <h2 class="text-sm font-semibold text-gray-900">{{ currentLabel }}</h2>
      </header>
      <main class="p-5">

        <!-- Loading -->
        <div v-if="pageLoading" class="text-center py-12 text-gray-400 text-sm">Memuat dashboard...</div>

        <!-- Suspended -->
        <div v-else-if="!consultant?.is_active" class="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p class="text-red-700 font-medium">Akun Anda saat ini tidak aktif.</p>
          <p class="text-sm text-red-500 mt-1">Hubungi admin Kinora untuk informasi lebih lanjut.</p>
        </div>

        <template v-else>
        <!-- DASHBOARD -->
        <div v-if="activeTab === 'dashboard'" class="space-y-5">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-white border border-gray-200 rounded-xl p-4">
              <p class="text-[10px] text-gray-400 uppercase">Sesi Hari Ini</p>
              <p class="text-xl font-bold text-gray-900 mt-1">{{ stats.todaySessions }}</p>
            </div>
            <div class="bg-white border border-gray-200 rounded-xl p-4">
              <p class="text-[10px] text-gray-400 uppercase">Chat Aktif</p>
              <p class="text-xl font-bold text-teal-700 mt-1">{{ stats.activeChats }}</p>
            </div>
            <div class="bg-white border border-gray-200 rounded-xl p-4">
              <p class="text-[10px] text-gray-400 uppercase">Pendapatan Bulan Ini</p>
              <p class="text-xl font-bold text-green-700 mt-1">{{ formatCurrency(stats.monthlyEarning) }}</p>
            </div>
            <div class="bg-white border border-gray-200 rounded-xl p-4">
              <p class="text-[10px] text-gray-400 uppercase">Rating</p>
              <p class="text-xl font-bold text-yellow-600 mt-1">{{ stats.avgRating || '-' }}</p>
            </div>
          </div>
          <!-- Upcoming -->
          <div class="bg-white border border-gray-200 rounded-xl p-4">
            <h3 class="text-xs font-semibold text-gray-500 uppercase mb-3">Sesi Akan Datang</h3>
            <div v-if="upcomingSessions.length === 0" class="text-xs text-gray-400 text-center py-4">Tidak ada sesi terjadwal.</div>
            <div v-else class="space-y-2">
              <div v-for="s in upcomingSessions" :key="s.id" class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p class="text-xs font-medium text-gray-800">{{ s.user_name }}</p>
                  <p class="text-[10px] text-gray-400">{{ s.duration_minutes }} menit · {{ s.meeting_platform }}</p>
                </div>
                <div class="text-right">
                  <p class="text-[10px] text-gray-500">{{ formatDate(s.started_at || s.created_at) }}</p>
                  <span class="px-1.5 py-0.5 text-[9px] rounded" :class="sessionStatusColor(s.status)">{{ s.status }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SERVICES -->
        <div v-if="activeTab === 'services'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">Layanan Saya</h3>
            <button @click="showServiceForm = true; editingService = null" class="px-3 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700">+ Tambah Layanan</button>
          </div>
          <div v-if="services.length === 0" class="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">Belum ada layanan.</div>
          <div v-else class="space-y-3">
            <div v-for="svc in services" :key="svc.id" class="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900">{{ svc.name || (svc.meeting_platform === 'chat_only' ? 'Chat' : 'Zoom') + ' ' + svc.session_duration_minutes + ' menit' }}</p>
                <p class="text-xs text-gray-400">{{ svc.meeting_platform }} · {{ svc.session_duration_minutes }} menit · {{ formatCurrency(svc.session_price_amount) }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-[10px] rounded-full" :class="svc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">{{ svc.is_active ? 'Aktif' : 'Nonaktif' }}</span>
                <button @click="editService(svc)" class="text-xs text-blue-600 hover:underline">Edit</button>
              </div>
            </div>
          </div>
          <!-- Service Form Modal -->
          <Teleport to="body">
          <div v-if="showServiceForm" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" @click.self="showServiceForm = false">
            <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
              <h3 class="font-semibold text-gray-900">{{ editingService ? 'Edit Layanan' : 'Tambah Layanan' }}</h3>
              <div class="space-y-3">
                <div><label class="block text-xs text-gray-500 mb-1">Platform *</label>
                  <select v-model="serviceForm.meeting_platform" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                    <option value="chat_only">Chat</option><option value="zoom">Zoom</option><option value="gmeet">Google Meet</option>
                  </select>
                </div>
                <div><label class="block text-xs text-gray-500 mb-1">Durasi (menit) *</label><input v-model.number="serviceForm.session_duration_minutes" type="number" min="15" max="180" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
                <div><label class="block text-xs text-gray-500 mb-1">Harga (IDR) *</label><input v-model.number="serviceForm.session_price_amount" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
                <div class="p-2 bg-gray-50 rounded text-xs text-gray-500">
                  <p>Harga user: {{ formatCurrency(serviceForm.session_price_amount) }}</p>
                  <p>Platform fee (~20%): {{ formatCurrency(serviceForm.session_price_amount * 0.2) }}</p>
                  <p class="font-medium text-gray-700">Pendapatan Anda: {{ formatCurrency(serviceForm.session_price_amount * 0.8) }}</p>
                </div>
                <div><label class="block text-xs text-gray-500 mb-1">Bio layanan</label><textarea v-model="serviceForm.bio" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Deskripsi singkat..."></textarea></div>
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="serviceForm.is_active" class="rounded" /> Aktif</label>
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="serviceForm.chat_enabled" class="rounded" /> Chat enabled</label>
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="serviceForm.meeting_enabled" class="rounded" /> Meeting enabled</label>
              </div>
              <div v-if="serviceError" class="text-xs text-red-600">{{ serviceError }}</div>
              <div class="flex justify-end gap-3">
                <button @click="showServiceForm = false" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button @click="saveService" :disabled="serviceSaving" class="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">{{ serviceSaving ? 'Saving...' : 'Simpan' }}</button>
              </div>
            </div>
          </div>
          </Teleport>
        </div>

        <!-- SESSIONS -->
        <div v-if="activeTab === 'sessions'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">Konsultasi</h3>
            <select v-model="sessionFilter" @change="loadSessions" class="px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none">
              <option value="">Semua</option><option value="active">Aktif</option><option value="completed">Selesai</option><option value="cancelled">Dibatalkan</option>
            </select>
          </div>
          <div v-if="sessions.length === 0" class="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">Belum ada sesi.</div>
          <div v-else class="space-y-2">
            <a v-for="s in sessions" :key="s.id" :href="`/consultant/chat/${s.id}`" class="block bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-300 transition">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ s.user_name }}</p>
                  <p class="text-xs text-gray-400">{{ s.topic || '-' }} · {{ s.duration_minutes }} menit · {{ s.meeting_platform }}</p>
                </div>
                <div class="text-right">
                  <span class="px-2 py-0.5 text-[10px] rounded-full" :class="sessionStatusColor(s.status)">{{ s.status }}</span>
                  <p class="text-[10px] text-gray-400 mt-1">{{ formatDate(s.started_at || s.created_at) }}</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        <!-- EARNINGS -->
        <div v-if="activeTab === 'earnings'" class="space-y-4">
          <h3 class="text-sm font-semibold text-gray-700">Pendapatan</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-white border border-gray-200 rounded-xl p-4"><p class="text-[10px] text-gray-400 uppercase">Bulan Ini</p><p class="text-lg font-bold text-green-700 mt-1">{{ formatCurrency(stats.monthlyEarning) }}</p></div>
            <div class="bg-white border border-gray-200 rounded-xl p-4"><p class="text-[10px] text-gray-400 uppercase">Sesi Dibayar</p><p class="text-lg font-bold text-gray-900 mt-1">{{ earnings.length }}</p></div>
            <div class="bg-white border border-gray-200 rounded-xl p-4"><p class="text-[10px] text-gray-400 uppercase">Saldo Tersedia</p><p class="text-lg font-bold text-blue-700 mt-1">{{ formatCurrency(stats.availableBalance) }}</p></div>
            <div class="bg-white border border-gray-200 rounded-xl p-4"><p class="text-[10px] text-gray-400 uppercase">Total Payout</p><p class="text-lg font-bold text-gray-600 mt-1">{{ formatCurrency(stats.totalPaid) }}</p></div>
          </div>
          <div v-if="earnings.length > 0" class="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-xs text-gray-500"><tr><th class="text-left px-4 py-2">Tanggal</th><th class="text-left px-4 py-2">Harga User</th><th class="text-left px-4 py-2">Platform Fee</th><th class="text-left px-4 py-2">Net</th><th class="text-left px-4 py-2">Status</th></tr></thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="e in earnings" :key="e.id">
                  <td class="px-4 py-2 text-xs text-gray-500">{{ formatDate(e.created_at) }}</td>
                  <td class="px-4 py-2 text-xs">{{ formatCurrency(e.gross_amount) }}</td>
                  <td class="px-4 py-2 text-xs text-gray-400">{{ formatCurrency(e.platform_fee) }}</td>
                  <td class="px-4 py-2 text-xs font-medium">{{ formatCurrency(e.net_earning) }}</td>
                  <td class="px-4 py-2"><span class="px-1.5 py-0.5 text-[9px] rounded-full" :class="e.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">{{ e.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- RATING -->
        <div v-if="activeTab === 'ratings'" class="space-y-4">
          <h3 class="text-sm font-semibold text-gray-700">Rating & Review</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p class="text-3xl font-bold text-yellow-600">{{ stats.avgRating || '-' }}</p>
              <p class="text-[10px] text-gray-400">Rata-rata</p>
            </div>
            <div class="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p class="text-3xl font-bold text-gray-900">{{ ratings.length }}</p>
              <p class="text-[10px] text-gray-400">Total Review</p>
            </div>
          </div>
          <div v-if="ratings.length === 0" class="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">Belum ada rating.</div>
          <div v-else class="space-y-2">
            <div v-for="r in ratings" :key="r.id" class="bg-white border border-gray-200 rounded-xl p-4">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-gray-800">{{ '⭐'.repeat(r.rating) }}</p>
                <p class="text-[10px] text-gray-400">{{ formatDate(r.created_at) }}</p>
              </div>
              <p v-if="r.user_review" class="text-xs text-gray-600 mt-1">{{ r.user_review }}</p>
            </div>
          </div>
        </div>

        <!-- PROFILE -->
        <div v-if="activeTab === 'profile'" class="space-y-4">
          <h3 class="text-sm font-semibold text-gray-700">Profil Konsultan</h3>
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label class="block text-xs text-gray-500 mb-1">Nama</label><input v-model="profileForm.name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Keahlian</label><input v-model="profileForm.specialty" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            </div>
            <div><label class="block text-xs text-gray-500 mb-1">Bio</label><textarea v-model="profileForm.bio" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
            <button @click="saveProfile" :disabled="profileSaving" class="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-50">{{ profileSaving ? 'Saving...' : 'Simpan Profil' }}</button>
            <div v-if="profileSuccess" class="text-xs text-green-600">Profil tersimpan.</div>
          </div>
        </div>

        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase.js'

const router = useRouter()
const sidebarOpen = ref(false)
const activeTab = ref('dashboard')
const pageLoading = ref(true)

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'services', label: 'Layanan', icon: '🛎️' },
  { id: 'sessions', label: 'Konsultasi', icon: '💬' },
  { id: 'earnings', label: 'Pendapatan', icon: '💰' },
  { id: 'ratings', label: 'Rating', icon: '⭐' },
  { id: 'profile', label: 'Profil', icon: '👤' },
]
const currentLabel = computed(() => menuItems.find(m => m.id === activeTab.value)?.label || '')

// Data
const consultant = ref(null)
const consultantId = ref(null)
const stats = ref({ todaySessions: 0, activeChats: 0, monthlyEarning: 0, avgRating: 0, availableBalance: 0, totalPaid: 0 })
const upcomingSessions = ref([])
const sessions = ref([])
const sessionFilter = ref('')
const services = ref([])
const earnings = ref([])
const ratings = ref([])

// Service form
const showServiceForm = ref(false)
const editingService = ref(null)
const serviceForm = ref({ meeting_platform: 'chat_only', session_duration_minutes: 30, session_price_amount: 0, bio: '', is_active: true, chat_enabled: true, meeting_enabled: false })
const serviceSaving = ref(false)
const serviceError = ref('')

// Profile
const profileForm = ref({ name: '', specialty: '', bio: '' })
const profileSaving = ref(false)
const profileSuccess = ref(false)

async function loadConsultant() {
  pageLoading.value = true
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) { router.push('/login'); return }

  const { data: c } = await supabase.from('kinora_consultants').select('*').eq('consultant_user_id', session.user.id).maybeSingle()
  if (!c) { router.push('/portal'); return }

  consultant.value = c
  consultantId.value = c.id
  profileForm.value = { name: c.name || '', specialty: c.specialty || '', bio: c.bio || '' }

  await Promise.all([loadStats(), loadUpcoming(), loadSessions(), loadServices(), loadEarnings(), loadRatings()])
  pageLoading.value = false
}

async function loadStats() {
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [todayRes, activeRes, earningsRes, ratingRes] = await Promise.all([
    supabase.from('kinora_consultation_sessions').select('id', { count: 'exact', head: true }).eq('consultant_id', consultantId.value).gte('created_at', today),
    supabase.from('kinora_consultation_sessions').select('id', { count: 'exact', head: true }).eq('consultant_id', consultantId.value).eq('status', 'active'),
    supabase.from('kinora_consultant_earnings').select('net_earning, status').eq('consultant_id', consultantId.value),
    supabase.from('kinora_consultation_sessions').select('user_rating').eq('consultant_id', consultantId.value).not('user_rating', 'is', null),
  ])

  const allEarnings = earningsRes.data || []
  const monthlyEarning = allEarnings.filter(e => e.status !== 'cancelled').reduce((s, e) => s + Number(e.net_earning || 0), 0)
  const availableBalance = allEarnings.filter(e => e.status === 'confirmed').reduce((s, e) => s + Number(e.net_earning || 0), 0)
  const totalPaid = allEarnings.filter(e => e.status === 'paid').reduce((s, e) => s + Number(e.net_earning || 0), 0)

  const allRatings = ratingRes.data || []
  const avgRating = allRatings.length > 0 ? (allRatings.reduce((s, r) => s + r.user_rating, 0) / allRatings.length).toFixed(1) : 0

  stats.value = {
    todaySessions: todayRes.count || 0,
    activeChats: activeRes.count || 0,
    monthlyEarning,
    avgRating,
    availableBalance,
    totalPaid,
  }
}

async function loadUpcoming() {
  const { data } = await supabase
    .from('kinora_consultation_sessions')
    .select('id, status, duration_minutes, meeting_platform, started_at, created_at, topic, users!kinora_consultation_sessions_user_id_fkey(display_name)')
    .eq('consultant_id', consultantId.value)
    .in('status', ['active', 'requested'])
    .order('created_at', { ascending: false })
    .limit(5)
  upcomingSessions.value = (data || []).map(s => ({ ...s, user_name: s.users?.display_name || 'User' }))
}

async function loadSessions() {
  let query = supabase
    .from('kinora_consultation_sessions')
    .select('id, status, duration_minutes, meeting_platform, started_at, created_at, topic, users!kinora_consultation_sessions_user_id_fkey(display_name)')
    .eq('consultant_id', consultantId.value)
    .order('created_at', { ascending: false })
    .limit(30)
  if (sessionFilter.value) query = query.eq('status', sessionFilter.value)
  const { data } = await query
  sessions.value = (data || []).map(s => ({ ...s, user_name: s.users?.display_name || 'User' }))
}

async function loadServices() {
  const { data } = await supabase.from('kinora_consultants').select('*').eq('id', consultantId.value)
  // Services are modeled as consultant records with different config
  // For now, use the consultant's own config as primary service
  services.value = data || []
}

async function loadEarnings() {
  const { data } = await supabase
    .from('kinora_consultant_earnings')
    .select('id, gross_amount, platform_fee, net_earning, status, created_at')
    .eq('consultant_id', consultantId.value)
    .order('created_at', { ascending: false })
    .limit(30)
  earnings.value = data || []
}

async function loadRatings() {
  const { data } = await supabase
    .from('kinora_consultation_sessions')
    .select('id, user_rating, user_review, created_at')
    .eq('consultant_id', consultantId.value)
    .not('user_rating', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20)
  ratings.value = (data || []).map(r => ({ ...r, rating: r.user_rating }))
}

function editService(svc) {
  editingService.value = svc
  serviceForm.value = {
    meeting_platform: svc.meeting_platform || 'chat_only',
    session_duration_minutes: svc.session_duration_minutes || 30,
    session_price_amount: svc.session_price_amount || 0,
    bio: svc.bio || '',
    is_active: svc.is_active ?? true,
    chat_enabled: svc.chat_enabled ?? true,
    meeting_enabled: svc.meeting_enabled ?? false,
  }
  showServiceForm.value = true
}

async function saveService() {
  serviceSaving.value = true
  serviceError.value = ''
  const payload = {
    meeting_platform: serviceForm.value.meeting_platform,
    session_duration_minutes: serviceForm.value.session_duration_minutes,
    session_price_amount: serviceForm.value.session_price_amount,
    bio: serviceForm.value.bio || null,
    is_active: serviceForm.value.is_active,
    chat_enabled: serviceForm.value.chat_enabled,
    meeting_enabled: serviceForm.value.meeting_enabled,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('kinora_consultants').update(payload).eq('id', consultantId.value)
  if (error) { serviceError.value = error.message }
  else { showServiceForm.value = false; loadServices() }
  serviceSaving.value = false
}

async function saveProfile() {
  profileSaving.value = true
  profileSuccess.value = false
  await supabase.from('kinora_consultants').update({
    name: profileForm.value.name,
    specialty: profileForm.value.specialty,
    bio: profileForm.value.bio,
    updated_at: new Date().toISOString(),
  }).eq('id', consultantId.value)
  profileSaving.value = false
  profileSuccess.value = true
  consultant.value.name = profileForm.value.name
  setTimeout(() => profileSuccess.value = false, 3000)
}

async function handleSignOut() {
  await supabase.auth.signOut()
  router.push('/login')
}

// Helpers
function formatCurrency(n) { return n == null ? 'Rp 0' : 'Rp ' + Number(n).toLocaleString('id-ID') }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-' }
function sessionStatusColor(s) {
  const map = { active: 'bg-green-100 text-green-700', completed: 'bg-gray-100 text-gray-600', requested: 'bg-yellow-100 text-yellow-700', cancelled: 'bg-red-100 text-red-700' }
  return map[s] || 'bg-gray-100 text-gray-600'
}

onMounted(() => { loadConsultant() })
</script>
