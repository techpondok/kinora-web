<template>
  <div class="min-h-screen bg-gray-50">
    <PublicHeader />
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
          <div class="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
            <span class="text-2xl">📧</span>
          </div>
          <h2 class="text-xl font-bold text-gray-900">Verifikasi Email</h2>
          <p class="text-sm text-gray-500">Kami telah mengirim email verifikasi ke</p>
          <p class="text-sm font-medium text-gray-800">{{ form.email }}</p>
          <p class="text-xs text-gray-400">Periksa inbox dan klik link verifikasi untuk mengaktifkan akun.</p>
          <button @click="resendVerification" :disabled="resendCooldown > 0" class="mt-4 px-4 py-2 border border-gray-200 rounded-xl text-xs hover:bg-gray-50 disabled:opacity-50">
            {{ resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : 'Kirim Ulang Email' }}
          </button>
          <div class="pt-2">
            <a href="/login" class="text-xs text-blue-600 hover:underline">Login setelah verifikasi →</a>
          </div>
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
            <span class="text-2xl">🎉</span>
          </div>
          <h2 class="text-xl font-bold text-gray-900">Selamat Datang!</h2>
          <p class="text-sm text-gray-500">Akun Kinora Anda berhasil dibuat, {{ form.name }}.</p>
          <div class="space-y-3 pt-4">
            <button @click="$router.push('/portal')" class="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold shadow-md shadow-blue-200">Lanjutkan</button>
            <a href="https://kinora.app/download" target="_blank" class="block text-xs text-gray-500 hover:text-blue-600">Download Aplikasi Kinora</a>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 pt-6 border-t border-gray-100 text-center">
          <a href="/" class="text-xs text-gray-400 hover:text-blue-600">← kinora.app</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../lib/supabase.js'
import PublicHeader from '../components/PublicHeader.vue'

const router = useRouter()
const route = useRoute()

const step = ref('choose')
const loading = ref(false)
const error = ref('')
const resendCooldown = ref(0)
const inviteCode = ref('')

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  country: 'ID',
  agree: false,
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

  const { data, error: err } = await supabase.auth.signUp({
    email,
    password: form.value.password,
    options: { data: { display_name: form.value.name.trim(), country_code: form.value.country } },
  })

  if (err) { error.value = translateError(err.message); loading.value = false; return }

  if (data.user && !data.session) {
    step.value = 'verify'
  } else if (data.session) {
    await supabase.from('users').update({ display_name: form.value.name.trim(), country_code: form.value.country }).eq('id', data.user.id)
    step.value = 'success'
  }
  loading.value = false
}

async function resendVerification() {
  if (resendCooldown.value > 0) return
  await supabase.auth.resend({ type: 'signup', email: form.value.email.trim().toLowerCase() })
  resendCooldown.value = 60
  const interval = setInterval(() => { resendCooldown.value--; if (resendCooldown.value <= 0) clearInterval(interval) }, 1000)
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
