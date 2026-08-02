<template>
  <div class="min-h-screen bg-gray-50">
    <PublicHeader />
    <div class="flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-sm text-center space-y-6">
        <div class="w-16 h-16 bg-amber-100 rounded-2xl mx-auto flex items-center justify-center">
          <span class="text-3xl">📱</span>
        </div>
        <h1 class="text-xl font-bold text-gray-900">Membuka Kinora...</h1>
        <p class="text-sm text-gray-500">Jika aplikasi tidak terbuka otomatis, gunakan tombol di bawah.</p>

        <div class="space-y-3 pt-4">
          <a href="kinora://auth/continue" class="block w-full py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-sm font-semibold shadow-md shadow-amber-200 transition text-center">
            Buka Kinora App
          </a>
          <a href="https://kinorafamilies.com/download" class="block w-full py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition text-center">
            Belum punya aplikasi? Download
          </a>
        </div>

        <div class="pt-6 border-t border-gray-100 space-y-2">
          <p class="text-xs text-gray-400">Atau login langsung di web</p>
          <a href="/login" class="text-xs text-blue-600 hover:underline">Login di Browser →</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import PublicHeader from '../components/PublicHeader.vue'

onMounted(() => {
  // Try deep link first, fallback handled by the page buttons
  window.location.href = 'kinora://auth/continue'

  // If deep link fails (app not installed), page stays visible
  // User can click download or login buttons
})
</script>
