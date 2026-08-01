<template>
  <div class="min-h-screen bg-gray-50">
    <PublicHeader />
    <div class="flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
      <h1 class="text-xl font-bold text-gray-900 mb-2">Reset Password</h1>
      <p class="text-gray-500 text-sm mb-6">Masukkan email akun Kinora Anda.</p>

      <div v-if="success" class="p-3 bg-green-50 text-green-700 rounded-lg text-sm mb-4">
        Jika email terdaftar, instruksi pemulihan telah dikirim. Periksa inbox Anda.
      </div>
      <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">{{ error }}</div>

      <form v-if="!success" @submit.prevent="handleReset" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input v-model="email" type="email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit" :disabled="loading" class="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
          {{ loading ? 'Mengirim...' : 'Kirim Link Reset' }}
        </button>
      </form>

      <div class="mt-4 text-center">
        <a href="/login" class="text-sm text-blue-600 hover:underline">Kembali ke Login</a>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'
import PublicHeader from '../components/PublicHeader.vue'

const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function handleReset() {
  loading.value = true
  error.value = ''
  const { error: err } = await supabase.auth.resetPasswordForEmail(email.value.trim().toLowerCase(), {
    redirectTo: window.location.origin + '/login',
  })
  if (err) {
    error.value = err.message
  } else {
    success.value = true
  }
  loading.value = false
}
</script>
