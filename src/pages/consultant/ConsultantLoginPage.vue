<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mx-auto"><span class="text-white font-bold text-xl">K</span></div>
        <h1 class="text-2xl font-bold text-gray-900 mt-4">Konsultan Kinora</h1>
        <p class="text-sm text-gray-500 mt-1">Akses dashboard konsultan dengan akun Kinora Anda</p>
      </div>

      <!-- Loading -->
      <div v-if="checking" class="text-center py-8 text-gray-400 text-sm">Memeriksa akun...</div>

      <!-- Not logged in -->
      <div v-else-if="!user" class="space-y-4 text-center">
        <p class="text-sm text-gray-600">Anda perlu login dengan akun Kinora terlebih dahulu.</p>
        <a href="/login" class="block w-full py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-sm font-semibold shadow-md shadow-amber-200 transition text-center">
          Login dengan Akun Kinora
        </a>
        <p class="text-xs text-gray-400">Belum punya akun? <a href="/register" class="text-amber-600 hover:underline">Daftar dulu</a></p>
      </div>

      <!-- Status: Draft (profile belum lengkap) -->
      <div v-else-if="profileStatus === 'draft'" class="space-y-4 text-center">
        <div class="w-14 h-14 bg-blue-100 rounded-full mx-auto flex items-center justify-center"><span class="text-xl">📝</span></div>
        <h2 class="text-lg font-bold text-gray-900">Lengkapi Profil Konsultan</h2>
        <p class="text-sm text-gray-500">Profil Anda belum lengkap. Lengkapi data untuk mengajukan verifikasi.</p>
        <button @click="$router.push('/consultant/profile')" class="w-full py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-sm font-semibold shadow-md shadow-amber-200 transition">
          Lengkapi Profil
        </button>
      </div>

      <!-- Status: Pending Verification -->
      <div v-else-if="profileStatus === 'pending_review'" class="space-y-4 text-center">
        <div class="w-14 h-14 bg-amber-100 rounded-full mx-auto flex items-center justify-center"><span class="text-xl">⏳</span></div>
        <h2 class="text-lg font-bold text-gray-900">Menunggu Verifikasi</h2>
        <p class="text-sm text-gray-500">Profil konsultan Anda sedang ditinjau oleh tim Kinora. Anda akan menerima notifikasi setelah proses selesai.</p>
        <p class="text-xs text-gray-400">Estimasi proses: 1–3 hari kerja</p>
      </div>

      <!-- Status: Rejected -->
      <div v-else-if="profileStatus === 'rejected'" class="space-y-4 text-center">
        <div class="w-14 h-14 bg-red-100 rounded-full mx-auto flex items-center justify-center"><span class="text-xl">❌</span></div>
        <h2 class="text-lg font-bold text-gray-900">Verifikasi Ditolak</h2>
        <p class="text-sm text-gray-500">{{ rejectionReason || 'Profil Anda belum memenuhi persyaratan.' }}</p>
        <button @click="$router.push('/consultant/profile')" class="w-full py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-sm font-semibold shadow-md shadow-amber-200 transition">
          Perbaiki Profil
        </button>
      </div>

      <!-- Status: Active/Approved → go to dashboard -->
      <div v-else-if="profileStatus === 'approved'" class="space-y-4 text-center">
        <div class="w-14 h-14 bg-green-100 rounded-full mx-auto flex items-center justify-center"><span class="text-xl">✅</span></div>
        <h2 class="text-lg font-bold text-gray-900">Selamat Datang Kembali</h2>
        <p class="text-sm text-gray-500">Anda terverifikasi sebagai Konsultan Kinora.</p>
        <button @click="$router.push('/consultant/dashboard')" class="w-full py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-sm font-semibold shadow-md shadow-amber-200 transition">
          Buka Dashboard Konsultan
        </button>
      </div>

      <!-- Status: No profile yet → Register as consultant -->
      <div v-else-if="profileStatus === 'none'" class="space-y-4 text-center">
        <div class="w-14 h-14 bg-amber-100 rounded-full mx-auto flex items-center justify-center"><span class="text-xl">🩺</span></div>
        <h2 class="text-lg font-bold text-gray-900">Daftar sebagai Konsultan</h2>
        <p class="text-sm text-gray-500">Bergabung sebagai tenaga profesional di Kinora. Akun keluarga Anda tetap dapat digunakan.</p>

        <div v-if="createError" class="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{{ createError }}</div>

        <button @click="createConsultantProfile" :disabled="creating" class="w-full py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-sm font-semibold shadow-md shadow-amber-200 transition disabled:opacity-50">
          {{ creating ? 'Mendaftar...' : 'Daftar sebagai Konsultan' }}
        </button>
        <p class="text-[10px] text-gray-400">Role keluarga Anda tidak akan terpengaruh. Anda tetap bisa menggunakan fitur keluarga.</p>
      </div>

      <!-- Suspended -->
      <div v-else-if="profileStatus === 'suspended'" class="space-y-4 text-center">
        <div class="w-14 h-14 bg-orange-100 rounded-full mx-auto flex items-center justify-center"><span class="text-xl">🚫</span></div>
        <h2 class="text-lg font-bold text-gray-900">Akun Dibekukan</h2>
        <p class="text-sm text-gray-500">Akun konsultan Anda dibekukan sementara. Hubungi support@kinora.app untuk bantuan.</p>
      </div>

      <!-- Footer -->
      <div class="mt-8 pt-6 border-t border-gray-100 text-center">
        <a href="/" class="text-xs text-gray-400 hover:text-amber-600">← kinorafamilies.com</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../composables/useAuth.js'

const router = useRouter()
const { user } = useAuth()

const checking = ref(true)
const profileStatus = ref('')
const rejectionReason = ref('')
const creating = ref(false)
const createError = ref('')

onMounted(async () => {
  // Wait for auth to load
  await new Promise(resolve => {
    const check = () => {
      if (user.value !== undefined) { resolve(); return }
      setTimeout(check, 100)
    }
    // Give auth 2 seconds max
    setTimeout(resolve, 2000)
    check()
  })

  if (!user.value) {
    checking.value = false
    return
  }

  await checkConsultantProfile()
  checking.value = false
})

async function checkConsultantProfile() {
  const { data: consultant } = await supabase
    .from('kinora_consultants')
    .select('id, is_active, profile_status, rejection_reason')
    .eq('consultant_user_id', user.value.id)
    .maybeSingle()

  if (!consultant) {
    profileStatus.value = 'none'
    return
  }

  if (!consultant.is_active && consultant.profile_status === 'approved') {
    profileStatus.value = 'suspended'
    return
  }

  profileStatus.value = consultant.profile_status || 'draft'
  rejectionReason.value = consultant.rejection_reason || ''
}

async function createConsultantProfile() {
  creating.value = true
  createError.value = ''

  // Double-check no existing profile
  const { data: existing } = await supabase
    .from('kinora_consultants')
    .select('id')
    .eq('consultant_user_id', user.value.id)
    .maybeSingle()

  if (existing) {
    // Profile already exists, refresh status
    await checkConsultantProfile()
    creating.value = false
    return
  }

  // Get user display info
  const { data: userProfile } = await supabase
    .from('users')
    .select('display_name, email, avatar_url')
    .eq('id', user.value.id)
    .maybeSingle()

  // Create consultant profile with status draft
  const { error: insertErr } = await supabase.from('kinora_consultants').insert({
    consultant_user_id: user.value.id,
    name: userProfile?.display_name || user.value.email?.split('@')[0] || '',
    avatar_url: userProfile?.avatar_url || null,
    specialty: '',
    bio: '',
    is_active: false,
    profile_status: 'draft',
    session_duration_minutes: 30,
    session_price_amount: 0,
    price_currency: 'IDR',
    chat_enabled: true,
    meeting_enabled: false,
  })

  if (insertErr) {
    if (insertErr.message.includes('duplicate') || insertErr.message.includes('unique')) {
      // Race condition - profile was created meanwhile
      await checkConsultantProfile()
    } else {
      createError.value = 'Gagal mendaftar: ' + insertErr.message
    }
    creating.value = false
    return
  }

  // Success - redirect to complete profile
  profileStatus.value = 'draft'
  creating.value = false
  router.push('/consultant/profile')
}
</script>
