<template>
  <div class="min-h-screen bg-gray-50">
    <PublicHeader />

    <!-- Tab Navigation -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4 overflow-x-auto">
        <div class="flex gap-5 text-sm text-gray-600 py-2">
          <button @click="tab = 'home'" :class="tab === 'home' ? 'text-blue-700 font-medium' : ''">Home</button>
          <button @click="tab = 'family'" :class="tab === 'family' ? 'text-blue-700 font-medium' : ''">Family</button>
          <button @click="tab = 'subscription'" :class="tab === 'subscription' ? 'text-blue-700 font-medium' : ''">Subscription</button>
          <button @click="tab = 'payments'" :class="tab === 'payments' ? 'text-blue-700 font-medium' : ''">Payments</button>
          <button @click="tab = 'webinars'" :class="tab === 'webinars' ? 'text-blue-700 font-medium' : ''">Webinars</button>
          <button @click="tab = 'consultations'" :class="tab === 'consultations' ? 'text-blue-700 font-medium' : ''">Konsultasi</button>
          <router-link to="/security" class="hover:text-blue-600">Keamanan</router-link>
        </div>
      </div>
    </div>

    <main class="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12 text-gray-400 text-sm">Memuat...</div>

      <template v-else>

      <!-- HOME -->
      <div v-if="tab === 'home'" class="space-y-5">
        <!-- Welcome -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-lg font-bold text-blue-700">
              {{ profile?.display_name?.charAt(0)?.toUpperCase() || '?' }}
            </div>
            <div>
              <p class="font-semibold text-gray-900">Halo, {{ profile?.display_name || 'User' }}!</p>
              <p class="text-xs text-gray-500">{{ profile?.email }}</p>
            </div>
          </div>
        </div>

        <!-- Quick Info -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-[11px] text-gray-400 uppercase">Family</p>
            <p class="text-sm font-semibold text-gray-900 mt-1">{{ family?.name || 'Belum ada' }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-[11px] text-gray-400 uppercase">Paket</p>
            <p class="text-sm font-semibold text-gray-900 mt-1">{{ family?.subscription_plan || 'Free' }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-[11px] text-gray-400 uppercase">Anggota</p>
            <p class="text-sm font-semibold text-gray-900 mt-1">{{ family?.member_count || 0 }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-[11px] text-gray-400 uppercase">Role</p>
            <p class="text-sm font-semibold text-gray-900 mt-1">{{ membership?.role || '-' }}</p>
          </div>
        </div>

        <!-- CTA: Open App -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <p class="font-semibold text-lg">Buka Aplikasi Kinora</p>
          <p class="text-sm opacity-80 mt-1">Gunakan aplikasi Kinora untuk menikmati seluruh fitur keluarga, keamanan, komunikasi, dan aktivitas harian.</p>
          <a href="https://kinorafamilies.com/download" target="_blank" class="inline-block mt-4 px-5 py-2.5 bg-white text-blue-700 font-semibold text-sm rounded-lg hover:bg-blue-50 transition">
            Download / Buka Aplikasi
          </a>
        </div>

        <!-- Recent Payment -->
        <div v-if="recentPayment" class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-400 uppercase mb-2">Pembayaran Terbaru</p>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900">{{ recentPayment.product_type }} · {{ formatCurrency(recentPayment.total_amount) }}</p>
              <p class="text-xs text-gray-400">{{ formatDate(recentPayment.created_at) }}</p>
            </div>
            <span class="px-2 py-0.5 text-[10px] rounded-full" :class="statusColor(recentPayment.status)">{{ recentPayment.status }}</span>
          </div>
        </div>
      </div>

      <!-- FAMILY -->
      <div v-if="tab === 'family'" class="space-y-4">
        <h2 class="text-lg font-bold text-gray-900">Family</h2>
        <div v-if="!family" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p class="text-gray-500 text-sm">Belum bergabung dengan family.</p>
          <p class="text-xs text-gray-400 mt-1">Buat atau bergabung ke family melalui aplikasi Kinora.</p>
          <a href="https://kinorafamilies.com/download" target="_blank" class="inline-block mt-3 px-4 py-2 bg-blue-600 text-white text-xs rounded-lg">Buka Aplikasi</a>
        </div>
        <div v-else class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-sm">🏠</div>
            <div>
              <p class="font-semibold text-gray-900">{{ family.name }}</p>
              <p class="text-xs text-gray-500">{{ family.member_count }} anggota · {{ family.subscription_plan }}</p>
            </div>
          </div>
          <div v-if="members.length > 0" class="space-y-2">
            <p class="text-xs text-gray-400 uppercase">Anggota</p>
            <div v-for="m in members" :key="m.id" class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div class="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs">{{ m.display_name?.charAt(0)?.toUpperCase() || '?' }}</div>
              <div class="flex-1">
                <p class="text-sm text-gray-800">{{ m.display_name || '-' }}</p>
              </div>
              <span class="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{{ m.role }}</span>
            </div>
          </div>
          <p class="text-xs text-gray-400 italic">Kelola family melalui aplikasi Kinora.</p>
        </div>
      </div>

      <!-- SUBSCRIPTION -->
      <div v-if="tab === 'subscription'" class="space-y-4">
        <h2 class="text-lg font-bold text-gray-900">Subscription</h2>
        <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ family?.subscription_plan || 'Free' }}</p>
              <p class="text-xs text-gray-400">{{ family?.subscription_expires_at ? 'Berakhir ' + formatDate(family.subscription_expires_at) : 'Selamanya' }}</p>
            </div>
            <span class="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Aktif</span>
          </div>
          <a href="https://kinorafamilies.com/download" target="_blank" class="inline-block px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">Upgrade via Aplikasi</a>
        </div>
      </div>

      <!-- PAYMENTS -->
      <div v-if="tab === 'payments'" class="space-y-4">
        <h2 class="text-lg font-bold text-gray-900">Riwayat Pembayaran</h2>
        <div v-if="payments.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">Belum ada pembayaran.</div>
        <div v-else class="space-y-3">
          <div v-for="p in payments" :key="p.id" class="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900">{{ sourceLabel(p.product_type) }} · {{ formatCurrency(p.total_amount) }}</p>
              <p class="text-xs text-gray-400">{{ p.payment_method }} · {{ formatDate(p.created_at) }}</p>
            </div>
            <div class="text-right">
              <span class="px-2 py-0.5 text-[10px] rounded-full" :class="statusColor(p.status)">{{ p.status }}</span>
              <button v-if="p.status === 'resubmission_required' || (p.status === 'pending' && p.payment_method === 'manual')" @click="openUploadProof(p)" class="block mt-1 text-[10px] text-blue-600 hover:underline">Upload Bukti</button>
            </div>
          </div>
        </div>
      </div>

      <!-- WEBINARS -->
      <div v-if="tab === 'webinars'" class="space-y-4">
        <h2 class="text-lg font-bold text-gray-900">Webinar</h2>
        <div v-if="webinars.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">Belum ada webinar yang diikuti.</div>
        <div v-else class="space-y-3">
          <div v-for="w in webinars" :key="w.id" class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-sm font-medium text-gray-900">{{ w.webinar_title || 'Webinar' }}</p>
            <p class="text-xs text-gray-400">{{ formatDate(w.registered_at) }} · {{ w.status }}</p>
            <a v-if="w.status === 'approved' && w.meeting_url" :href="w.meeting_url" target="_blank" class="inline-block mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg">Buka Meeting</a>
          </div>
        </div>
      </div>

      <!-- CONSULTATIONS -->
      <div v-if="tab === 'consultations'" class="space-y-4">
        <h2 class="text-lg font-bold text-gray-900">Konsultasi</h2>
        <div v-if="consultations.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">Belum ada konsultasi.</div>
        <div v-else class="space-y-3">
          <div v-for="c in consultations" :key="c.id" class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900">{{ c.consultant_name || 'Konsultan' }}</p>
                <p class="text-xs text-gray-400">{{ c.duration_minutes }} menit · {{ formatDate(c.started_at || c.created_at) }}</p>
              </div>
              <span class="px-2 py-0.5 text-[10px] rounded-full" :class="consultStatusColor(c.status)">{{ c.status }}</span>
            </div>
            <a v-if="c.status === 'active'" href="https://kinorafamilies.com/download" target="_blank" class="inline-block mt-2 px-3 py-1.5 bg-teal-600 text-white text-xs rounded-lg">Buka di Aplikasi</a>
          </div>
        </div>
      </div>

      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase.js'
import PublicHeader from '../components/PublicHeader.vue'

const router = useRouter()
const loading = ref(true)
const tab = ref('home')

const profile = ref(null)
const family = ref(null)
const membership = ref(null)
const members = ref([])
const payments = ref([])
const webinars = ref([])
const consultations = ref([])
const recentPayment = ref(null)

async function loadData() {
  loading.value = true
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) { router.push('/login'); return }

  const userId = session.user.id

  // Profile
  const { data: userProfile } = await supabase.from('users').select('display_name, email, avatar_url').eq('id', userId).single()
  profile.value = userProfile

  // Membership & Family
  const { data: mem } = await supabase.from('family_members').select('family_id, role, status').eq('user_id', userId).eq('status', 'active').limit(1).maybeSingle()
  membership.value = mem

  if (mem?.family_id) {
    const { data: fam } = await supabase.from('families').select('id, name, avatar_url, member_count, subscription_plan, subscription_expires_at').eq('id', mem.family_id).single()
    family.value = fam

    // Members
    const { data: mems } = await supabase
      .from('family_members')
      .select('id, user_id, role, users!family_members_user_id_fkey(display_name, avatar_url)')
      .eq('family_id', mem.family_id)
      .eq('status', 'active')
      .limit(20)
    members.value = (mems || []).map(m => ({ ...m, display_name: m.users?.display_name, avatar_url: m.users?.avatar_url }))
  }

  // Payments
  const { data: pays } = await supabase
    .from('kinora_marketplace_payments')
    .select('id, product_type, total_amount, payment_method, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  payments.value = pays || []
  recentPayment.value = pays?.[0] || null

  // Webinars
  const { data: webs } = await supabase
    .from('kinora_webinar_registrations')
    .select('id, status, registered_at, kinora_webinars!kinora_webinar_registrations_webinar_id_fkey(title, meeting_url, scheduled_at)')
    .eq('user_id', userId)
    .order('registered_at', { ascending: false })
    .limit(10)
  webinars.value = (webs || []).map(w => ({
    ...w,
    webinar_title: w.kinora_webinars?.title,
    meeting_url: w.kinora_webinars?.meeting_url,
  }))

  // Consultations
  const { data: cons } = await supabase
    .from('kinora_consultation_sessions')
    .select('id, status, duration_minutes, started_at, created_at, kinora_consultants!kinora_consultation_sessions_consultant_id_fkey(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)
  consultations.value = (cons || []).map(c => ({
    ...c,
    consultant_name: c.kinora_consultants?.name,
  }))

  loading.value = false
}

async function signOut() {
  await supabase.auth.signOut()
  router.push('/login')
}

function openUploadProof(payment) {
  // Simple file upload for manual payment proof
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/jpeg,image/png,image/webp,application/pdf'
  input.onchange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('File terlalu besar (max 5MB)'); return }

    const ext = file.name.split('.').pop()
    const path = `manual-payments/${new Date().getFullYear()}/${payment.id}/${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage.from('marketplace-payment-proofs').upload(path, file)
    if (uploadErr) { alert('Upload gagal: ' + uploadErr.message); return }

    const { data: urlData } = supabase.storage.from('marketplace-payment-proofs').getPublicUrl(path)

    await supabase.from('kinora_marketplace_payments').update({
      payment_proof_url: urlData.publicUrl,
      proof_submitted_at: new Date().toISOString(),
      status: 'waiting_verification',
    }).eq('id', payment.id)

    alert('Bukti pembayaran berhasil diupload!')
    loadData()
  }
  input.click()
}

// Helpers
function formatCurrency(n) {
  if (n == null) return 'Rp 0'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}
function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
function sourceLabel(s) {
  const map = { subscription: 'Subscription', webinar: 'Webinar', consultation: 'Konsultasi', print: 'Print', storage_addon: 'Storage', ppob: 'PPOB' }
  return map[s] || s || '-'
}
function statusColor(s) {
  const map = { paid: 'bg-green-100 text-green-700', verified: 'bg-green-100 text-green-700', pending: 'bg-gray-100 text-gray-600', waiting_verification: 'bg-yellow-100 text-yellow-700', under_review: 'bg-blue-100 text-blue-700', failed: 'bg-red-100 text-red-700', rejected: 'bg-red-100 text-red-700', expired: 'bg-gray-100 text-gray-500', cancelled: 'bg-gray-100 text-gray-500', resubmission_required: 'bg-orange-100 text-orange-700' }
  return map[s] || 'bg-gray-100 text-gray-600'
}
function consultStatusColor(s) {
  const map = { active: 'bg-green-100 text-green-700', completed: 'bg-gray-100 text-gray-600', requested: 'bg-yellow-100 text-yellow-700', cancelled: 'bg-red-100 text-red-700' }
  return map[s] || 'bg-gray-100 text-gray-600'
}

onMounted(() => { loadData() })
</script>
