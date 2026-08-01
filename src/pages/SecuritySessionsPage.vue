<template>
  <div class="min-h-screen bg-gray-50">
    <PublicHeader />

    <main class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <div>
      <h1 class="text-xl font-bold text-gray-900">Keamanan & Sesi Aktif</h1>
      <p class="text-sm text-gray-500">Kelola perangkat, sesi login, dan riwayat keamanan.</p>
    </div>

    <!-- Active Sessions -->
    <section class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-gray-900">Perangkat Aktif</h2>
        <button @click="logoutAllDevices" :disabled="loggingOut" class="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
          {{ loggingOut ? 'Memproses...' : 'Logout Semua Perangkat' }}
        </button>
      </div>

      <div v-if="sessionsLoading" class="text-sm text-gray-500 text-center py-6">Memuat sesi...</div>
      <div v-else-if="sessions.length === 0" class="text-sm text-gray-400 text-center py-6">Tidak ada sesi aktif tercatat.</div>
      <div v-else class="space-y-3">
        <div v-for="s in sessions" :key="s.id" class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg" :class="deviceIcon(s.device_type).bg">
              {{ deviceIcon(s.device_type).icon }}
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">
                {{ s.device_name || 'Unknown Device' }}
                <span v-if="s.is_current" class="ml-2 px-2 py-0.5 text-[10px] bg-green-100 text-green-700 rounded-full">Sesi ini</span>
              </p>
              <p class="text-xs text-gray-500">
                {{ s.browser || '' }} {{ s.os ? '• ' + s.os : '' }}
                {{ s.ip_address ? '• ' + s.ip_address : '' }}
              </p>
              <p class="text-xs text-gray-400">Terakhir aktif: {{ formatDate(s.last_active_at) }}</p>
            </div>
          </div>
          <button v-if="!s.is_current" @click="revokeSession(s)" class="text-xs text-red-500 hover:underline">Hapus</button>
        </div>
      </div>
    </section>

    <!-- Login History -->
    <section class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 class="font-semibold text-gray-900">Riwayat Login (30 hari terakhir)</h2>

      <div v-if="auditLoading" class="text-sm text-gray-500 text-center py-6">Memuat riwayat...</div>
      <div v-else-if="auditLogs.length === 0" class="text-sm text-gray-400 text-center py-6">Belum ada riwayat login.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-3 py-2 font-medium text-gray-600">Waktu</th>
              <th class="text-left px-3 py-2 font-medium text-gray-600">Event</th>
              <th class="text-left px-3 py-2 font-medium text-gray-600">IP</th>
              <th class="text-left px-3 py-2 font-medium text-gray-600">Perangkat</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-gray-50">
              <td class="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{{ formatDate(log.created_at) }}</td>
              <td class="px-3 py-2">
                <span :class="eventBadge(log.event_type)" class="px-2 py-0.5 text-xs rounded-full font-medium">{{ eventLabel(log.event_type) }}</span>
              </td>
              <td class="px-3 py-2 text-xs text-gray-500 font-mono">{{ log.ip_address || '—' }}</td>
              <td class="px-3 py-2 text-xs text-gray-500">{{ log.metadata?.browser || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Security Settings -->
    <section class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 class="font-semibold text-gray-900">Pengaturan Keamanan</h2>
      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 rounded-lg border border-gray-100">
          <div>
            <p class="text-sm font-medium text-gray-900">Ubah Password</p>
            <p class="text-xs text-gray-500">Semua sesi akan dicabut setelah ubah password.</p>
          </div>
          <button @click="goChangePassword" class="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">Ubah</button>
        </div>
        <div v-if="isAdmin" class="flex items-center justify-between p-3 rounded-lg border border-gray-100">
          <div>
            <p class="text-sm font-medium text-gray-900">Multi-Factor Authentication (MFA)</p>
            <p class="text-xs text-gray-500">Wajib untuk Admin & Founder. Gunakan Authenticator app.</p>
          </div>
          <span class="px-2 py-0.5 text-xs rounded-full font-medium" :class="mfaEnrolled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
            {{ mfaEnrolled ? 'Aktif' : 'Belum Aktif' }}
          </span>
        </div>
      </div>
    </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../composables/useAuth.js'
import { useReauth } from '../composables/useReauth.js'
import PublicHeader from '../components/PublicHeader.vue'

const router = useRouter()
const { user } = useAuth()
const { requireReauth } = useReauth()

const sessions = ref([])
const sessionsLoading = ref(true)
const auditLogs = ref([])
const auditLoading = ref(true)
const loggingOut = ref(false)
const isAdmin = ref(false)
const mfaEnrolled = ref(false)

onMounted(async () => {
  await Promise.all([fetchSessions(), fetchAuditLogs(), checkAdminStatus()])
})

async function fetchSessions() {
  sessionsLoading.value = true
  const { data } = await supabase
    .from('kinora_active_sessions')
    .select('*')
    .eq('user_id', user.value?.id)
    .order('last_active_at', { ascending: false })
  sessions.value = data || []
  sessionsLoading.value = false
}

async function fetchAuditLogs() {
  auditLoading.value = true
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('kinora_login_audit')
    .select('*')
    .eq('user_id', user.value?.id)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(50)
  auditLogs.value = data || []
  auditLoading.value = false
}

async function checkAdminStatus() {
  if (!user.value) return
  const { data: founder } = await supabase.from('founders').select('id').eq('user_id', user.value.id).maybeSingle()
  const { data: adminRole } = await supabase.from('kinora_admin_roles').select('id').eq('user_id', user.value.id).eq('status', 'active').maybeSingle()
  isAdmin.value = !!(founder || adminRole)

  // Check MFA
  const { data: { totp } } = await supabase.auth.mfa.listFactors()
  mfaEnrolled.value = totp && totp.length > 0
}

async function revokeSession(session) {
  if (!confirm('Hapus sesi ini? Perangkat akan logout.')) return
  await supabase.from('kinora_active_sessions').delete().eq('id', session.id)

  // Log the revocation
  await supabase.from('kinora_login_audit').insert({
    user_id: user.value.id,
    email: user.value.email,
    event_type: 'session_revoked',
    metadata: { revoked_session: session.device_name, ip: session.ip_address },
  })

  sessions.value = sessions.value.filter(s => s.id !== session.id)
}

async function logoutAllDevices() {
  try {
    await requireReauth()
  } catch { return }

  loggingOut.value = true

  // Use server-side global signout via Edge Function
  const { error } = await supabase.functions.invoke('session-manager', {
    body: { action: 'logout_all' }
  })

  if (error) {
    alert('Gagal logout semua perangkat: ' + error.message)
    loggingOut.value = false
    return
  }

  // Redirect to login since current session is also revoked
  window.location.href = '/login'
}

function goChangePassword() {
  window.location.href = '/forgot-password'
}

function deviceIcon(type) {
  switch (type) {
    case 'android': return { icon: '📱', bg: 'bg-green-50' }
    case 'ios': return { icon: '📱', bg: 'bg-blue-50' }
    case 'desktop': return { icon: '💻', bg: 'bg-purple-50' }
    default: return { icon: '🌐', bg: 'bg-gray-50' }
  }
}

function eventBadge(type) {
  switch (type) {
    case 'login_success': return 'bg-green-100 text-green-700'
    case 'login_failed': return 'bg-red-100 text-red-700'
    case 'new_device': return 'bg-blue-100 text-blue-700'
    case 'password_reset': return 'bg-amber-100 text-amber-700'
    case 'session_revoked': return 'bg-orange-100 text-orange-700'
    case 'mfa_verified': return 'bg-purple-100 text-purple-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function eventLabel(type) {
  const labels = {
    login_success: 'Login Berhasil',
    login_failed: 'Login Gagal',
    new_device: 'Perangkat Baru',
    password_reset: 'Reset Password',
    session_revoked: 'Sesi Dicabut',
    mfa_challenge: 'MFA Challenge',
    mfa_verified: 'MFA Verified',
    account_locked: 'Akun Terkunci',
  }
  return labels[type] || type
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
