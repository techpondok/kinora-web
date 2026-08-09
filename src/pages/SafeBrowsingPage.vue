<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md text-center space-y-6">
        <!-- Shield Icon -->
        <div class="w-20 h-20 bg-amber-100 rounded-full mx-auto flex items-center justify-center">
          <svg class="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>

        <!-- Title -->
        <div>
          <h1 class="text-2xl font-bold text-gray-900" style="font-family: 'Bricolage Grotesque', sans-serif">{{ title }}</h1>
          <p class="mt-3 text-sm text-gray-600 leading-relaxed">{{ message }}</p>
        </div>

        <!-- Reassurance -->
        <p class="text-xs text-gray-400">Tenang, kamu tetap aman bersama Kinora.</p>

        <!-- Actions -->
        <div class="space-y-3 pt-2">
          <a href="https://kinorafamilies.com" class="block w-full py-3 bg-amber-500 text-white rounded-2xl font-semibold text-sm hover:bg-amber-600 transition shadow-sm">
            Kembali ke Beranda Aman
          </a>
          <a href="kinora://safe-browsing/request" class="block w-full py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-medium text-sm hover:border-amber-300 transition">
            Minta Izin ke Orang Tua
          </a>
        </div>

        <!-- Safe Suggestions -->
        <div class="pt-6 border-t border-gray-100">
          <p class="text-xs text-gray-400 mb-3">Coba halaman yang aman:</p>
          <div class="flex flex-wrap justify-center gap-2">
            <a href="/" class="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-amber-300 transition">Beranda</a>
            <a href="/articles" class="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-amber-300 transition">Artikel</a>
            <a href="/help" class="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-amber-300 transition">Bantuan</a>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const allowedReasons = {
  blocked: 'Website ini diblokir oleh aturan keluargamu.',
  category: 'Kategori website ini belum diizinkan.',
  'time-limit': 'Waktu penggunaan web hari ini sudah selesai.',
  'school-mode': 'Mode belajar sedang aktif. Yuk kembali ke aktivitas sekolah.',
  bedtime: 'Sekarang waktunya beristirahat.',
  'unknown-browser': 'Browser ini belum diizinkan oleh orang tua.',
}

const reason = computed(() => {
  const r = route.query.reason
  return allowedReasons[r] ? r : 'blocked'
})

const title = computed(() => {
  if (reason.value === 'time-limit') return 'Waktu Habis'
  if (reason.value === 'school-mode') return 'Mode Belajar Aktif'
  if (reason.value === 'bedtime') return 'Waktunya Istirahat'
  return 'Halaman Ini Tidak Bisa Dibuka'
})

const message = computed(() => allowedReasons[reason.value] || allowedReasons.blocked)

onMounted(() => {
  document.title = 'Safe Browsing | Kinora'
  // Add noindex
  let meta = document.querySelector('meta[name="robots"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'robots')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', 'noindex, nofollow')
})
</script>
