<template>
  <div v-if="showReauthModal" class="fixed inset-0 z-[9999] flex items-center justify-center">
    <div @click="cancelReauth" class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
      <h3 class="text-lg font-bold text-gray-900 mb-1">Konfirmasi Identitas</h3>
      <p class="text-sm text-gray-500 mb-4">Masukkan password untuk melanjutkan operasi sensitif.</p>

      <div v-if="reauthError" class="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 text-center">
        {{ reauthError }}
      </div>

      <form @submit.prevent="confirmReauth(password)">
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          required
          autocomplete="current-password"
          class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
        />
        <div class="flex gap-3">
          <button
            type="submit"
            :disabled="reauthLoading"
            class="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {{ reauthLoading ? 'Memverifikasi...' : 'Konfirmasi' }}
          </button>
          <button
            type="button"
            @click="cancelReauth"
            class="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useReauth } from '../composables/useReauth.js'

const { showReauthModal, reauthError, reauthLoading, confirmReauth, cancelReauth } = useReauth()
const password = ref('')
</script>
