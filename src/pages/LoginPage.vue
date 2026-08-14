<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex flex-col">
    <!-- Top Bar -->
    <header class="px-6 py-4">
      <a href="/" class="inline-flex items-center gap-2 text-gray-700 hover:text-blue-600 transition text-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Kembali ke Beranda
      </a>
    </header>

    <!-- Login Card -->
    <div class="flex-1 flex items-center justify-center px-4 pb-12">
      <div class="w-full max-w-sm">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="flex items-center justify-center gap-2">
            <img v-if="appLogo" :src="appLogo" alt="Kinora" class="h-9" />
            <div v-else class="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center"><span class="text-white font-bold text-lg">K</span></div>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mt-4" style="font-family: 'Bricolage Grotesque', sans-serif">Masuk ke Kinora</h1>
          <p class="text-sm text-gray-500 mt-1">Admin, Konsultan, atau User</p>
        </div>

        <!-- Lockout Warning -->
        <div v-if="isLockedOut" class="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
          <p class="text-sm text-amber-800 font-medium">Terlalu banyak percobaan gagal</p>
          <p class="text-xs text-amber-600 mt-1">Coba lagi dalam <span class="font-bold">{{ lockoutDisplay }}</span></p>
          <a href="/forgot-password" class="inline-block mt-3 text-xs text-blue-600 hover:underline font-medium">Lupa password? Reset di sini</a>
        </div>

        <!-- Error -->
        <div v-if="error && !isLockedOut" class="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
          {{ error }}
          <p v-if="failedAttempts >= 2" class="text-xs text-red-500 mt-1">Percobaan gagal: {{ failedAttempts }}x</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
            <input v-model="email" type="email" required autocomplete="email" :disabled="isLockedOut"
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="email@example.com" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
            <input v-model="password" type="password" required autocomplete="current-password" :disabled="isLockedOut"
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="••••••••" />
          </div>
          <button type="submit" :disabled="loading || isLockedOut"
            class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-md shadow-blue-200 disabled:opacity-50 disabled:shadow-none">
            {{ loading ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>

        <!-- Links -->
        <div class="mt-5 flex items-center justify-between text-xs">
          <a href="/forgot-password" class="text-blue-600 hover:underline">Lupa password?</a>
          <a href="/register" class="text-blue-600 hover:underline">Buat akun baru</a>
        </div>

        <!-- Dev Login Helper (development only) -->
        <div v-if="isDev" class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p class="text-xs font-semibold text-yellow-800 mb-2">Development Accounts (Supabase DEV)</p>
          <div class="flex flex-wrap gap-2">
            <button @click="devLogin('founder@kinora.local')" type="button"
              class="px-3 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded-lg transition font-medium">
              Founder
            </button>
            <button @click="devLogin('parent@kinora.local')" type="button"
              class="px-3 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded-lg transition font-medium">
              Parent
            </button>
            <button @click="devLogin('child@kinora.local')" type="button"
              class="px-3 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded-lg transition font-medium">
              Child
            </button>
          </div>
          <p class="text-[10px] text-yellow-600 mt-2">Password: Kinora123! · Run <code>npm run seed:dev</code></p>
        </div>

        <!-- Divider -->
        <div class="mt-8 pt-6 border-t border-gray-100 text-center">
          <p class="text-xs text-gray-400">Platform keluarga digital</p>
          <a href="/" class="inline-block mt-2 text-xs text-gray-500 hover:text-blue-600 transition">← kinorafamilies.com</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase.js'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const appLogo = ref('')

// Dev mode detection
const isDev = import.meta.env.VITE_APP_ENV === 'development'

function devLogin(devEmail) {
  email.value = devEmail
  password.value = 'Kinora123!'
  handleLogin()
}

// --- Progressive Delay ---
const DELAY_STEPS = [30, 300, 900, 3600] // 30s, 5min, 15min, 1hr
const STORAGE_KEY = 'kinora_login_attempts'

const failedAttempts = ref(0)
const lockedUntil = ref(0)
const lockoutRemaining = ref(0)
let lockoutTimer = null

// Restore state from sessionStorage
function restoreAttemptState() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')
    failedAttempts.value = stored.attempts || 0
    lockedUntil.value = stored.lockedUntil || 0
    if (lockedUntil.value > Date.now()) {
      startLockoutTimer()
    } else {
      lockedUntil.value = 0
    }
  } catch { /* ignore */ }
}

function persistAttemptState() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    attempts: failedAttempts.value,
    lockedUntil: lockedUntil.value,
  }))
}

function getDelayForAttempt(attempt) {
  const idx = Math.min(attempt - 1, DELAY_STEPS.length - 1)
  return DELAY_STEPS[Math.max(0, idx)] * 1000
}

function applyLockout() {
  const delay = getDelayForAttempt(failedAttempts.value)
  lockedUntil.value = Date.now() + delay
  persistAttemptState()
  startLockoutTimer()
}

function startLockoutTimer() {
  clearInterval(lockoutTimer)
  lockoutTimer = setInterval(() => {
    const remaining = lockedUntil.value - Date.now()
    if (remaining <= 0) {
      lockoutRemaining.value = 0
      clearInterval(lockoutTimer)
    } else {
      lockoutRemaining.value = remaining
    }
  }, 1000)
  lockoutRemaining.value = lockedUntil.value - Date.now()
}

function resetAttempts() {
  failedAttempts.value = 0
  lockedUntil.value = 0
  lockoutRemaining.value = 0
  clearInterval(lockoutTimer)
  sessionStorage.removeItem(STORAGE_KEY)
}

const isLockedOut = computed(() => lockoutRemaining.value > 0)

const lockoutDisplay = computed(() => {
  const sec = Math.ceil(lockoutRemaining.value / 1000)
  if (sec >= 3600) return `${Math.floor(sec / 3600)} jam ${Math.floor((sec % 3600) / 60)} menit`
  if (sec >= 60) return `${Math.floor(sec / 60)} menit ${sec % 60} detik`
  return `${sec} detik`
})

restoreAttemptState()
onUnmounted(() => clearInterval(lockoutTimer))

// --- Logo ---
supabase.from('kinora_landing_config').select('value').eq('key', 'general').eq('status', 'published').maybeSingle().then(({ data }) => {
  if (data?.value?.logo_url) appLogo.value = data.value.logo_url
})

// --- Error Translation (generic message) ---
function translateError(message) {
  if (message.includes('Too many requests') || message.includes('rate limit')) {
    return 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.'
  }
  // Always generic to prevent email enumeration
  return 'Email atau password tidak sesuai.'
}

// --- Login Handler ---
async function handleLogin() {
  if (isLockedOut.value) return

  loading.value = true
  error.value = ''

  const { data, error: authErr } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  })

  if (authErr) {
    // Handle rate limit (429)
    if (authErr.status === 429 || authErr.message?.includes('Too many requests')) {
      error.value = 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.'
      failedAttempts.value++
      applyLockout()
      loading.value = false
      return
    }

    // Failed attempt
    failedAttempts.value++
    persistAttemptState()

    // Apply progressive delay after 3+ failures
    if (failedAttempts.value >= 3) {
      applyLockout()
    }

    error.value = translateError(authErr.message)
    loading.value = false
    return
  }

  if (!data.session) {
    error.value = 'Gagal membuat session. Coba lagi.'
    loading.value = false
    return
  }

  // Success: reset attempts
  resetAttempts()

  // Call login-audit edge function
  const sessionId = data.session?.access_token ? data.session.access_token.substring(0, 32) : ''
  try {
    await supabase.functions.invoke('login-audit', {
      body: {
        event_type: 'login_success',
        user_agent: navigator.userAgent,
        device_name: navigator.platform,
        device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'android' : 'web',
        browser: navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[1] || 'Unknown',
        os: navigator.platform,
        session_id: sessionId,
      }
    })
  } catch { /* non-blocking */ }

  // Determine where to redirect
  const userId = data.user.id

  const { data: founder } = await supabase.from('founders').select('id').eq('user_id', userId).maybeSingle()
  if (founder) { router.push('/dashboard'); return }

  const { data: adminRole } = await supabase.from('kinora_admin_roles').select('id').eq('user_id', userId).eq('status', 'active').maybeSingle()
  if (adminRole) { router.push('/dashboard'); return }

  const { data: consultant } = await supabase.from('kinora_consultants').select('id').eq('consultant_user_id', userId).maybeSingle()
  if (consultant) { router.push('/consultant/dashboard'); return }

  router.push('/portal')
}
</script>
