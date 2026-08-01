<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        <p class="text-xs text-gray-400 mt-0.5">
          Terakhir diperbarui: {{ lastRefresh }} · 
          <span class="inline-flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full" :class="connected ? 'bg-green-500' : 'bg-red-500'"></span>
            {{ connected ? 'Connected' : 'Disconnected' }}
          </span>
        </p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <select v-model="dateRange" class="px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none">
          <option value="today">Hari ini</option>
          <option value="7d">7 hari</option>
          <option value="30d">30 hari</option>
          <option value="month">Bulan ini</option>
        </select>
        <button @click="refreshAll" :disabled="loading" class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {{ loading ? '⟳' : '↻' }} Refresh
        </button>
      </div>
    </div>

    <!-- Critical Alerts -->
    <div v-if="alerts.length > 0" class="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
      <p class="text-xs font-semibold text-red-700 uppercase">⚠️ Needs Attention</p>
      <div v-for="a in alerts" :key="a.id" class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" :class="a.priority === 'critical' ? 'bg-red-500' : 'bg-orange-400'"></span>
          <span class="text-gray-800">{{ a.title }}</span>
          <span class="text-xs text-gray-400">· {{ a.module }}</span>
        </div>
        <span class="text-xs text-gray-400">{{ a.time }}</span>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div v-for="card in summaryCards" :key="card.label"
        class="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 transition"
        @click="card.action && card.action()">
        <p class="text-[11px] text-gray-400 uppercase tracking-wide">{{ card.label }}</p>
        <p class="text-xl font-bold mt-1" :class="card.color || 'text-gray-900'">{{ card.value }}</p>
        <p v-if="card.sub" class="text-[10px] mt-0.5" :class="card.subColor || 'text-gray-400'">{{ card.sub }}</p>
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Subscription Distribution -->
      <div class="bg-white border border-gray-200 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Subscription Distribution</h3>
        <div class="space-y-3">
          <div v-for="plan in subscriptionDist" :key="plan.name" class="flex items-center gap-3">
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-gray-600">{{ plan.name }}</span>
                <span class="text-xs font-medium text-gray-900">{{ plan.count }}</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all" :style="`width: ${plan.pct}%; background: ${plan.color};`"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pembayaran Pending -->
      <div class="bg-white border border-gray-200 rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-700">Pembayaran Menunggu</h3>
          <span class="text-xs text-gray-400">{{ pendingPayments.length }} transaksi</span>
        </div>
        <div v-if="pendingPayments.length === 0" class="text-xs text-gray-400 text-center py-4">Tidak ada pembayaran pending.</div>
        <div v-else class="space-y-2 max-h-48 overflow-y-auto">
          <div v-for="p in pendingPayments" :key="p.id" class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div>
              <p class="text-xs font-medium text-gray-800">{{ p.user_name }}</p>
              <p class="text-[10px] text-gray-400">{{ p.product_type }} · {{ formatCurrency(p.total_amount) }}</p>
            </div>
            <span class="px-2 py-0.5 text-[10px] rounded-full" :class="paymentStatusColor(p.status)">{{ p.status }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <h3 class="text-sm font-semibold text-gray-700 mb-4">Aktivitas Terbaru</h3>
      <div v-if="recentActivity.length === 0" class="text-xs text-gray-400 text-center py-4">Belum ada aktivitas.</div>
      <div v-else class="space-y-2">
        <div v-for="a in recentActivity" :key="a.id" class="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0" :class="activityIconBg(a.type)">
            {{ activityIcon(a.type) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-gray-800">{{ a.description }}</p>
            <p class="text-[10px] text-gray-400 mt-0.5">{{ a.actor }} · {{ a.time }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Device & Protection + Storage -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Device Status -->
      <div class="bg-white border border-gray-200 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Device & Protection</h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 bg-green-50 rounded-lg text-center">
            <p class="text-lg font-bold text-green-700">{{ deviceStats.online }}</p>
            <p class="text-[10px] text-gray-500">Online</p>
          </div>
          <div class="p-3 bg-gray-50 rounded-lg text-center">
            <p class="text-lg font-bold text-gray-600">{{ deviceStats.offline }}</p>
            <p class="text-[10px] text-gray-500">Offline</p>
          </div>
          <div class="p-3 bg-red-50 rounded-lg text-center">
            <p class="text-lg font-bold text-red-600">{{ deviceStats.sosActive }}</p>
            <p class="text-[10px] text-gray-500">SOS Aktif</p>
          </div>
          <div class="p-3 bg-orange-50 rounded-lg text-center">
            <p class="text-lg font-bold text-orange-600">{{ deviceStats.lowBattery }}</p>
            <p class="text-[10px] text-gray-500">Baterai Rendah</p>
          </div>
        </div>
      </div>

      <!-- Storage -->
      <div class="bg-white border border-gray-200 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Storage Usage</h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 bg-blue-50 rounded-lg text-center">
            <p class="text-lg font-bold text-blue-700">{{ storageStats.totalUsed }}</p>
            <p class="text-[10px] text-gray-500">Total Terpakai</p>
          </div>
          <div class="p-3 bg-orange-50 rounded-lg text-center">
            <p class="text-lg font-bold text-orange-600">{{ storageStats.above75 }}</p>
            <p class="text-[10px] text-gray-500">&gt;75% Kapasitas</p>
          </div>
          <div class="p-3 bg-red-50 rounded-lg text-center">
            <p class="text-lg font-bold text-red-600">{{ storageStats.above90 }}</p>
            <p class="text-[10px] text-gray-500">&gt;90% Kapasitas</p>
          </div>
          <div class="p-3 bg-gray-50 rounded-lg text-center">
            <p class="text-lg font-bold text-gray-600">{{ storageStats.totalFamilies }}</p>
            <p class="text-[10px] text-gray-500">Family Aktif</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Webinar & Consultation -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white border border-gray-200 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Webinar</h3>
        <div class="grid grid-cols-3 gap-3 text-center">
          <div><p class="text-lg font-bold text-blue-700">{{ webinarStats.upcoming }}</p><p class="text-[10px] text-gray-500">Akan Datang</p></div>
          <div><p class="text-lg font-bold text-green-700">{{ webinarStats.registered }}</p><p class="text-[10px] text-gray-500">Terdaftar</p></div>
          <div><p class="text-lg font-bold text-gray-600">{{ webinarStats.completed }}</p><p class="text-[10px] text-gray-500">Selesai</p></div>
        </div>
      </div>
      <div class="bg-white border border-gray-200 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Konsultasi</h3>
        <div class="grid grid-cols-3 gap-3 text-center">
          <div><p class="text-lg font-bold text-teal-700">{{ consultStats.active }}</p><p class="text-[10px] text-gray-500">Aktif</p></div>
          <div><p class="text-lg font-bold text-yellow-600">{{ consultStats.pending }}</p><p class="text-[10px] text-gray-500">Pending</p></div>
          <div><p class="text-lg font-bold text-gray-600">{{ consultStats.completed }}</p><p class="text-[10px] text-gray-500">Selesai</p></div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
      <div class="flex flex-wrap gap-2">
        <button v-for="qa in quickActions" :key="qa.label" @click="qa.action" class="px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-700">
          {{ qa.icon }} {{ qa.label }}
        </button>
      </div>
    </div>

    <!-- System Health -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">System Health</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div v-for="s in systemHealth" :key="s.name" class="text-center p-2">
          <div class="w-3 h-3 rounded-full mx-auto mb-1" :class="healthColor(s.status)"></div>
          <p class="text-[10px] text-gray-600">{{ s.name }}</p>
          <p class="text-[10px]" :class="healthTextColor(s.status)">{{ s.status }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase.js'

const emit = defineEmits(['navigate'])

const loading = ref(false)
const connected = ref(true)
const dateRange = ref('30d')
const lastRefresh = ref('-')

// Data
const alerts = ref([])
const summaryCards = ref([])
const subscriptionDist = ref([])
const pendingPayments = ref([])
const recentActivity = ref([])
const deviceStats = ref({ online: 0, offline: 0, sosActive: 0, lowBattery: 0 })
const storageStats = ref({ totalUsed: '0 GB', above75: 0, above90: 0, totalFamilies: 0 })
const webinarStats = ref({ upcoming: 0, registered: 0, completed: 0 })
const consultStats = ref({ active: 0, pending: 0, completed: 0 })

const systemHealth = ref([
  { name: 'Database', status: 'operational' },
  { name: 'Auth', status: 'operational' },
  { name: 'Storage', status: 'operational' },
  { name: 'Realtime', status: 'operational' },
  { name: 'Push', status: 'operational' },
  { name: 'Payment', status: 'operational' },
])

const quickActions = [
  { icon: '👤', label: 'Lihat Users', action: () => emit('navigate', 'users') },
  { icon: '💳', label: 'Review Payment', action: () => emit('navigate', 'payments') },
  { icon: '📝', label: 'Kelola Konten', action: () => emit('navigate', 'content') },
  { icon: '🎓', label: 'Kelola Webinar', action: () => emit('navigate', 'webinar') },
  { icon: '⚙️', label: 'Pengaturan', action: () => emit('navigate', 'settings') },
]

async function refreshAll() {
  loading.value = true
  lastRefresh.value = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  try {
    await Promise.all([
      loadSummary(),
      loadSubscriptions(),
      loadPendingPayments(),
      loadRecentActivity(),
      loadDeviceStats(),
      loadStorageStats(),
      loadWebinarStats(),
      loadConsultStats(),
      checkAlerts(),
      checkSystemHealth(),
    ])
    connected.value = true
  } catch (e) {
    connected.value = false
  } finally {
    loading.value = false
  }
}

async function loadSummary() {
  const today = new Date().toISOString().split('T')[0]

  const [usersRes, usersToday, familiesRes, membersRes, notifRes, paymentsWaiting] = await Promise.all([
    supabase.from('users').select('id, is_active', { count: 'exact', head: false }),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('families').select('id, is_active, subscription_plan', { count: 'exact', head: false }),
    supabase.from('family_members').select('id, status', { count: 'exact', head: false }),
    supabase.from('notifications').select('id', { count: 'exact', head: true }),
    supabase.from('kinora_marketplace_payments').select('id', { count: 'exact', head: true }).in('status', ['pending', 'waiting_verification', 'under_review']),
  ])

  const users = usersRes.data || []
  const families = familiesRes.data || []
  const members = membersRes.data || []
  const activeUsers = users.filter(u => u.is_active).length
  const activeFamilies = families.filter(f => f.is_active).length

  summaryCards.value = [
    { label: 'Total Users', value: String(usersRes.count || users.length), sub: `+${usersToday.count || 0} hari ini`, subColor: 'text-green-600' },
    { label: 'User Aktif', value: String(activeUsers), color: 'text-green-700' },
    { label: 'Total Family', value: String(familiesRes.count || families.length), sub: `${activeFamilies} aktif`, subColor: 'text-blue-600' },
    { label: 'Anggota', value: String(membersRes.count || members.length), sub: `${members.filter(m => m.status === 'active').length} aktif` },
    { label: 'Notifikasi', value: String(notifRes.count || 0) },
    { label: 'Payment Pending', value: String(paymentsWaiting.count || 0), color: paymentsWaiting.count > 0 ? 'text-orange-600' : 'text-gray-900' },
  ]
}

async function loadSubscriptions() {
  const { data: families } = await supabase.from('families').select('subscription_plan').eq('is_active', true)
  if (!families) return

  const counts = {}
  for (const f of families) {
    const plan = f.subscription_plan || 'free'
    counts[plan] = (counts[plan] || 0) + 1
  }
  const total = families.length || 1
  const colors = { free: '#A0AEC0', pro: '#3182CE', family_plus: '#6B46C1', family_pro: '#D53F8C', founder: '#D69E2E' }
  const labels = { free: 'Free', pro: 'Pro', family_plus: 'Family Plus', family_pro: 'Family Pro', founder: 'Founder' }

  subscriptionDist.value = Object.entries(counts).map(([name, count]) => ({
    name: labels[name] || name,
    count,
    pct: Math.round((count / total) * 100),
    color: colors[name] || '#A0AEC0',
  })).sort((a, b) => b.count - a.count)
}

async function loadPendingPayments() {
  const { data } = await supabase
    .from('kinora_marketplace_payments')
    .select('id, user_id, product_type, total_amount, status, created_at, users!kinora_marketplace_payments_user_id_fkey(display_name)')
    .in('status', ['pending', 'waiting_verification', 'under_review'])
    .order('created_at', { ascending: false })
    .limit(10)

  pendingPayments.value = (data || []).map(p => ({
    ...p,
    user_name: p.users?.display_name || 'Unknown',
  }))
}

async function loadRecentActivity() {
  // Combine recent users, families, payments into activity feed
  const [newUsers, newFamilies, newPayments] = await Promise.all([
    supabase.from('users').select('id, display_name, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('families').select('id, name, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('kinora_marketplace_payments').select('id, product_type, total_amount, status, created_at, users!kinora_marketplace_payments_user_id_fkey(display_name)').order('created_at', { ascending: false }).limit(5),
  ])

  const activities = []

  for (const u of (newUsers.data || [])) {
    activities.push({ id: `u-${u.id}`, type: 'user', description: `${u.display_name || 'User'} mendaftar`, actor: u.display_name || '-', time: timeAgo(u.created_at) })
  }
  for (const f of (newFamilies.data || [])) {
    activities.push({ id: `f-${f.id}`, type: 'family', description: `Family "${f.name}" dibuat`, actor: f.name, time: timeAgo(f.created_at) })
  }
  for (const p of (newPayments.data || [])) {
    activities.push({ id: `p-${p.id}`, type: 'payment', description: `Pembayaran ${p.product_type} ${formatCurrency(p.total_amount)} - ${p.status}`, actor: p.users?.display_name || '-', time: timeAgo(p.created_at) })
  }

  activities.sort((a, b) => a.time > b.time ? -1 : 1)
  recentActivity.value = activities.slice(0, 10)
}

async function loadDeviceStats() {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const [devicesRes, sosRes] = await Promise.all([
    supabase.from('kinora_device_presence').select('is_online, battery_level, updated_at'),
    supabase.from('sos_events').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const devices = devicesRes.data || []
  deviceStats.value = {
    online: devices.filter(d => d.is_online).length,
    offline: devices.filter(d => !d.is_online).length,
    sosActive: sosRes.count || 0,
    lowBattery: devices.filter(d => d.battery_level != null && d.battery_level < 20).length,
  }
}

async function loadStorageStats() {
  const { data: snapshots } = await supabase
    .from('family_storage_snapshots')
    .select('family_id, used_bytes, limit_bytes')
    .order('snapshot_date', { ascending: false })
    .limit(200)

  // Deduplicate by family_id (latest snapshot)
  const familyMap = new Map()
  for (const s of (snapshots || [])) {
    if (!familyMap.has(s.family_id)) familyMap.set(s.family_id, s)
  }

  const families = Array.from(familyMap.values())
  const totalBytes = families.reduce((sum, f) => sum + Number(f.used_bytes || 0), 0)
  const above75 = families.filter(f => f.limit_bytes > 0 && (f.used_bytes / f.limit_bytes) > 0.75).length
  const above90 = families.filter(f => f.limit_bytes > 0 && (f.used_bytes / f.limit_bytes) > 0.9).length

  storageStats.value = {
    totalUsed: formatBytes(totalBytes),
    above75,
    above90,
    totalFamilies: families.length,
  }
}

async function loadWebinarStats() {
  const now = new Date().toISOString()
  const [upcoming, regs, completed] = await Promise.all([
    supabase.from('kinora_webinars').select('id', { count: 'exact', head: true }).eq('is_published', true).gte('scheduled_at', now),
    supabase.from('kinora_webinar_registrations').select('id', { count: 'exact', head: true }),
    supabase.from('kinora_webinars').select('id', { count: 'exact', head: true }).lt('scheduled_at', now),
  ])
  webinarStats.value = { upcoming: upcoming.count || 0, registered: regs.count || 0, completed: completed.count || 0 }
}

async function loadConsultStats() {
  const [active, pending, completed] = await Promise.all([
    supabase.from('kinora_consultation_sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('kinora_consultation_sessions').select('id', { count: 'exact', head: true }).eq('status', 'requested'),
    supabase.from('kinora_consultation_sessions').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
  ])
  consultStats.value = { active: active.count || 0, pending: pending.count || 0, completed: completed.count || 0 }
}

async function checkAlerts() {
  const alertsList = []

  // SOS active
  if (deviceStats.value.sosActive > 0) {
    alertsList.push({ id: 'sos', title: `${deviceStats.value.sosActive} SOS aktif membutuhkan penanganan`, module: 'Safety', priority: 'critical', time: 'Now' })
  }

  // Payments waiting too long
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const { count: oldPayments } = await supabase.from('kinora_marketplace_payments').select('id', { count: 'exact', head: true }).in('status', ['waiting_verification']).lt('created_at', threeDaysAgo)
  if (oldPayments > 0) {
    alertsList.push({ id: 'old-pay', title: `${oldPayments} pembayaran menunggu verifikasi >3 hari`, module: 'Payment', priority: 'warning', time: '>3 hari' })
  }

  // Storage above 90%
  if (storageStats.value.above90 > 0) {
    alertsList.push({ id: 'storage', title: `${storageStats.value.above90} family hampir penuh storage`, module: 'Storage', priority: 'warning', time: '' })
  }

  alerts.value = alertsList
}

async function checkSystemHealth() {
  // Simple health check via auth endpoint
  try {
    const { error } = await supabase.auth.getSession()
    if (error) {
      systemHealth.value[0].status = 'degraded'
      systemHealth.value[1].status = 'degraded'
    } else {
      systemHealth.value[0].status = 'operational'
      systemHealth.value[1].status = 'operational'
    }
  } catch {
    systemHealth.value[0].status = 'error'
  }
}

// Helpers
function formatCurrency(n) {
  if (n == null) return 'Rp 0'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function timeAgo(dateStr) {
  if (!dateStr) return '-'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins}m lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}j lalu`
  const days = Math.floor(hours / 24)
  return `${days}h lalu`
}

function paymentStatusColor(s) {
  const map = { pending: 'bg-gray-100 text-gray-600', waiting_verification: 'bg-yellow-100 text-yellow-700', under_review: 'bg-blue-100 text-blue-700', verified: 'bg-green-100 text-green-700', paid: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }
  return map[s] || 'bg-gray-100 text-gray-600'
}

function activityIcon(type) {
  const map = { user: '👤', family: '🏠', payment: '💳', subscription: '⭐', device: '📱', sos: '🚨' }
  return map[type] || '📋'
}

function activityIconBg(type) {
  const map = { user: 'bg-blue-100', family: 'bg-purple-100', payment: 'bg-green-100', subscription: 'bg-yellow-100', device: 'bg-gray-100', sos: 'bg-red-100' }
  return map[type] || 'bg-gray-100'
}

function healthColor(status) {
  const map = { operational: 'bg-green-500', warning: 'bg-yellow-400', degraded: 'bg-orange-400', error: 'bg-red-500', unknown: 'bg-gray-300' }
  return map[status] || 'bg-gray-300'
}

function healthTextColor(status) {
  const map = { operational: 'text-green-600', warning: 'text-yellow-600', degraded: 'text-orange-600', error: 'text-red-600', unknown: 'text-gray-400' }
  return map[status] || 'text-gray-400'
}

onMounted(() => {
  refreshAll()
})
</script>
