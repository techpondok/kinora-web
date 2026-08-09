<template>
  <div class="min-h-screen bg-gray-50">
    <div class="flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <!-- Step: Choose -->
        <div v-if="step === 'choose'" class="space-y-4 text-center">
          <h1 class="text-2xl font-bold text-gray-900" style="font-family: 'Bricolage Grotesque', sans-serif">Bergabung dengan Kinora</h1>
          <p class="text-sm text-gray-500">Satu akun untuk web dan aplikasi</p>
          <div class="space-y-3 pt-4">
            <button @click="step = 'register'" class="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-semibold shadow-md shadow-blue-200">Buat Akun Baru</button>
            <button @click="$router.push('/login')" class="w-full py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm text-gray-700">Saya Sudah Punya Akun</button>
            <button @click="step = 'invitation'" class="w-full py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm text-gray-700">Punya Kode Undangan</button>
          </div>
        </div>

        <!-- Step: Register -->
        <div v-else-if="step === 'register'" class="space-y-5">
          <button @click="step = 'choose'" class="text-xs text-gray-500 hover:text-gray-700">← Kembali</button>
          <h2 class="text-xl font-bold text-gray-900">Buat Akun</h2>

          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{{ error }}</div>

          <!-- Account Type Selection -->
          <div class="space-y-2">
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Daftar sebagai:</label>
            <label class="flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition" :class="form.accountType === 'user' ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'">
              <input type="radio" v-model="form.accountType" value="user" class="mt-0.5" />
              <div>
                <p class="text-sm font-medium text-gray-900">Pengguna Kinora</p>
                <p class="text-xs text-gray-500">Untuk mengelola keluarga, keamanan, keuangan, dan aktivitas keluarga.</p>
              </div>
            </label>
            <label class="flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition" :class="form.accountType === 'consultant' ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'">
              <input type="radio" v-model="form.accountType" value="consultant" class="mt-0.5" />
              <div>
                <p class="text-sm font-medium text-gray-900">Konsultan Kinora</p>
                <p class="text-xs text-gray-500">Untuk menyediakan layanan konsultasi bagi keluarga di Kinora.</p>
              </div>
            </label>
          </div>

          <form @submit.prevent="handleRegister" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Nama Lengkap</label>
              <input v-model="form.name" type="text" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" placeholder="Nama lengkap" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
              <input v-model="form.email" type="email" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" placeholder="email@example.com" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <input v-model="form.password" type="password" required minlength="8" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" placeholder="Minimal 8 karakter" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Konfirmasi Password</label>
              <input v-model="form.confirmPassword" type="password" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" placeholder="Ulangi password" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Negara</label>
              <select v-model="form.country" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="ID">🇮🇩 Indonesia</option>
                <option value="MY">🇲🇾 Malaysia</option>
                <option value="SG">🇸🇬 Singapore</option>
                <option value="US">🇺🇸 United States</option>
              </select>
            </div>
            <label class="flex items-start gap-2 text-xs text-gray-600">
              <input v-model="form.agree" type="checkbox" required class="mt-0.5 rounded" />
              <span>Saya menyetujui <a href="/terms-and-conditions" target="_blank" class="text-blue-600 hover:underline">Syarat & Ketentuan</a> dan <a href="/privacy-policy" target="_blank" class="text-blue-600 hover:underline">Kebijakan Privasi</a>.</span>
            </label>
            <button type="submit" :disabled="loading" class="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold text-sm shadow-md shadow-blue-200 disabled:opacity-50 disabled:shadow-none">
              {{ loading ? 'Mendaftar...' : 'Daftar' }}
            </button>
          </form>
          <p class="text-center text-xs text-gray-400">Sudah punya akun? <a href="/login" class="text-blue-600 hover:underline">Masuk</a></p>
        </div>

        <!-- Step: Verify Email -->
        <div v-else-if="step === 'verify'" class="text-center space-y-4">
          <div class="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
            <span class="text-2xl">🔐</span>
          </div>
          <h2 class="text-xl font-bold text-gray-900">Verifikasi Email</h2>
          <p class="text-sm text-gray-500">Masukkan kode OTP 6 digit yang dikirim ke</p>
          <p class="text-sm font-medium text-gray-800">{{ form.email }}</p>

          <div v-if="otpError" class="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{{ otpError }}</div>

          <!-- OTP Input -->
          <div class="flex justify-center gap-2 pt-2">
            <input v-for="(_, i) in 6" :key="i" :ref="el => otpRefs[i] = el"
              type="text" inputmode="numeric" maxlength="1"
              class="w-11 h-13 text-center text-lg font-bold border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              @input="onOtpInput(i, $event)" @keydown="onOtpKeydown(i, $event)" @paste="onOtpPaste($event)" />
          </div>

          <p class="text-xs text-gray-400">Kode berlaku selama 10 menit</p>

          <button @click="verifyOtp" :disabled="otpLoading || otpCode.length < 6" class="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold text-sm shadow-md shadow-blue-200 disabled:opacity-50">
            {{ otpLoading ? 'Memverifikasi...' : 'Verifikasi' }}
          </button>

          <button @click="resendOtp" :disabled="resendCooldown > 0" class="px-4 py-2 text-xs text-gray-500 hover:text-blue-600 disabled:opacity-50">
            {{ resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : 'Kirim Ulang Kode OTP' }}
          </button>
        </div>

        <!-- Step: Invitation -->
        <div v-else-if="step === 'invitation'" class="space-y-4">
          <button @click="step = 'choose'" class="text-xs text-gray-500 hover:text-gray-700">← Kembali</button>
          <h2 class="text-xl font-bold text-gray-900">Kode Undangan</h2>
          <p class="text-sm text-gray-500">Masukkan kode dari anggota keluarga Anda.</p>
          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{{ error }}</div>
          <input v-model="inviteCode" type="text" placeholder="ABCD1234" class="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg font-mono uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" maxlength="12" />
          <button @click="handleInvitation" :disabled="loading || !inviteCode" class="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold text-sm shadow-md shadow-blue-200 disabled:opacity-50">
            {{ loading ? 'Memproses...' : 'Lanjutkan' }}
          </button>
          <p class="text-[10px] text-gray-400 text-center">Anda perlu login terlebih dahulu sebelum bergabung.</p>
        </div>

        <!-- Step: Success -->
        <div v-else-if="step === 'success'" class="text-center space-y-4">
          <div class="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
            <span class="text-2xl">✅</span>
          </div>
          <h2 class="text-xl font-bold text-gray-900">Akun Berhasil Dibuat!</h2>
          <p class="text-sm text-gray-500">Selamat datang, {{ form.name }}. Email Anda telah terverifikasi.</p>

          <!-- User flow -->
          <template v-if="form.accountType === 'user'">
            <p class="text-xs text-gray-400">Buka aplikasi Kinora untuk membuat atau bergabung ke keluarga.</p>
            <div class="space-y-3 pt-4">
              <a href="https://kinorafamilies.com/download" target="_blank" class="block w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold shadow-md shadow-blue-200 transition text-center">
                Buka Aplikasi Kinora
              </a>
              <button @click="$router.push('/portal')" class="w-full py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition">
                Lanjutkan di Web
              </button>
            </div>
          </template>

          <!-- Consultant flow -->
          <template v-else>
            <p class="text-xs text-gray-400">Lengkapi profil konsultan Anda untuk mengajukan verifikasi.</p>
            <div class="space-y-3 pt-4">
              <button @click="$router.push('/consultant/dashboard')" class="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold shadow-md shadow-blue-200 transition">
                Lengkapi Profil Konsultan
              </button>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="mt-8 pt-6 border-t border-gray-100 text-center">
          <a href="/" class="text-xs text-gray-400 hover:text-blue-600">← kinorafamilies.com</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../lib/supabase.js'

const router = useRouter()
const route = useRoute()

const step = ref('choose')
const loading = ref(false)
const error = ref('')
const resendCooldown = ref(0)
const inviteCode = ref('')

// OTP state
const otpRefs = ref([])
const otpValues = ref(['', '', '', '', '', ''])
const otpError = ref('')
const otpLoading = ref(false)

const otpCode = computed(() => otpValues.value.join(''))

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  country: 'ID',
  agree: false,
  accountType: 'user',
})

onMounted(() => {
  if (route.query.invite) {
    inviteCode.value = route.query.invite
    step.value = 'invitation'
  }
})

function translateError(msg) {
  if (msg.includes('already registered')) return 'Email ini sudah terdaftar. Silakan login.'
  if (msg.includes('valid email')) return 'Email tidak valid.'
  if (msg.includes('at least')) return 'Password minimal 8 karakter.'
  if (msg.includes('rate limit')) return 'Terlalu banyak percobaan. Coba lagi nanti.'
  return msg
}

async function handleRegister() {
  error.value = ''
  if (!form.value.name.trim()) { error.value = 'Nama tidak boleh kosong.'; return }
  if (form.value.password !== form.value.confirmPassword) { error.value = 'Konfirmasi password tidak sama.'; return }
  if (form.value.password.length < 8) { error.value = 'Password minimal 8 karakter.'; return }
  if (!form.value.agree) { error.value = 'Anda harus menyetujui syarat dan kebijakan privasi.'; return }

  loading.value = true
  const email = form.value.email.trim().toLowerCase()

  // Register without auto-confirm (OTP verification required)
  const { data, error: err } = await supabase.auth.signUp({
    email,
    password: form.value.password,
    options: {
      data: { display_name: form.value.name.trim(), country_code: form.value.country },
      emailRedirectTo: window.location.origin + '/register?verified=true',
    },
  })

  if (err) { error.value = translateError(err.message); loading.value = false; return }

  // With "Confirm email" enabled, signUp returns user without session
  // No need to sign out - user is not logged in yet
  // Go to OTP verification step
  step.value = 'verify'
  loading.value = false
  startResendCooldown()
}

// OTP Input handlers
function onOtpInput(index, event) {
  const val = event.target.value.replace(/\D/g, '')
  otpValues.value[index] = val.charAt(0) || ''
  event.target.value = otpValues.value[index]
  if (val && index < 5) {
    otpRefs.value[index + 1]?.focus()
  }
}

function onOtpKeydown(index, event) {
  if (event.key === 'Backspace' && !otpValues.value[index] && index > 0) {
    otpRefs.value[index - 1]?.focus()
  }
}

function onOtpPaste(event) {
  const paste = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
  if (paste.length === 6) {
    for (let i = 0; i < 6; i++) {
      otpValues.value[i] = paste[i]
      if (otpRefs.value[i]) otpRefs.value[i].value = paste[i]
    }
    otpRefs.value[5]?.focus()
    event.preventDefault()
  }
}

async function verifyOtp() {
  if (otpCode.value.length < 6) { otpError.value = 'Masukkan 6 digit kode OTP.'; return }
  otpLoading.value = true
  otpError.value = ''

  // Supabase Confirm signup template with {{ .Token }} uses type 'email'
  const { data, error: verifyErr } = await supabase.auth.verifyOtp({
    email: form.value.email.trim().toLowerCase(),
    token: otpCode.value,
    type: 'email',
  })

  if (verifyErr) {
    otpError.value = verifyErr.message.includes('expired')
      ? 'Kode OTP sudah kedaluwarsa. Kirim ulang kode.'
      : 'Kode OTP tidak valid.'
    otpLoading.value = false
    return
  }

  // OTP verified, session created by Supabase - update profile
  if (data.session && data.user) {
    await supabase.from('users').update({
      display_name: form.value.name.trim(),
      country_code: form.value.country,
    }).eq('id', data.user.id)

    // If consultant, create consultant_profile with draft status
    if (form.value.accountType === 'consultant') {
      const { data: existing } = await supabase
        .from('kinora_consultants')
        .select('id')
        .eq('consultant_user_id', data.user.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from('kinora_consultants').insert({
          consultant_user_id: data.user.id,
          name: form.value.name.trim(),
          is_active: false,
          priority: 0,
          session_price_amount: 0,
          price_currency: 'IDR',
          chat_enabled: true,
          meeting_enabled: false,
        })
      }
    }
  }

  // Do NOT sign out - let user proceed
  otpLoading.value = false
  step.value = 'success'
}

async function resendOtp() {
  if (resendCooldown.value > 0) return
  otpError.value = ''

  const { error: err } = await supabase.auth.resend({
    type: 'signup',
    email: form.value.email.trim().toLowerCase(),
  })

  if (err) { otpError.value = 'Gagal mengirim ulang: ' + err.message; return }
  startResendCooldown()
}

function startResendCooldown() {
  resendCooldown.value = 60
  const interval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) clearInterval(interval)
  }, 1000)
}

async function handleInvitation() {
  error.value = ''
  loading.value = true

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    localStorage.setItem('kinora_invite_code', inviteCode.value)
    router.push('/login?redirect=/register&invite=' + inviteCode.value)
    loading.value = false
    return
  }

  const { data: family, error: err } = await supabase.from('families').select('id, name').eq('invite_code', inviteCode.value.toUpperCase()).eq('is_active', true).maybeSingle()
  if (err || !family) { error.value = 'Kode undangan tidak valid.'; loading.value = false; return }

  const { data: existing } = await supabase.from('family_members').select('id').eq('family_id', family.id).eq('user_id', session.user.id).eq('status', 'active').maybeSingle()
  if (existing) { error.value = 'Anda sudah anggota keluarga ini.'; loading.value = false; return }

  const { error: joinErr } = await supabase.from('family_members').insert({ family_id: family.id, user_id: session.user.id, role: 'parent', status: 'active' })
  if (joinErr) { error.value = joinErr.message; loading.value = false; return }

  router.push('/portal')
  loading.value = false
}
</script>
