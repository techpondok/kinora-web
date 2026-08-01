<template>
  <section class="py-16 sm:py-20 px-4 sm:px-6 bg-white">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h2 data-animate class="text-2xl sm:text-3xl font-bold text-gray-900">Lebih dari Sekadar Aplikasi Pelacak Keluarga</h2>
        <p data-animate class="mt-3 text-gray-600 max-w-2xl mx-auto">Kinora membantu keluarga tetap terhubung, aman, dan terorganisir melalui fitur yang dirancang untuk kebutuhan keluarga sehari-hari.</p>
      </div>

      <!-- Desktop Table -->
      <div class="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left px-5 py-4 font-semibold text-gray-700 w-52">Kemampuan</th>
              <th class="px-5 py-4 font-semibold text-amber-800 bg-amber-50 text-center min-w-[140px]">Kinora</th>
              <th class="px-5 py-4 font-medium text-gray-600 text-center min-w-[130px]">Aplikasi Pelacak</th>
              <th class="px-5 py-4 font-medium text-gray-600 text-center min-w-[130px]">Parental Control</th>
              <th class="px-5 py-4 font-medium text-gray-600 text-center min-w-[130px]">Pengelola Keluarga</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in comparisonData" :key="row.feature"
              class="border-b border-gray-100 hover:bg-gray-50/50 transition"
              :class="{ 'comparison-row-enter': true }"
              :style="{ animationDelay: `${idx * 60}ms` }"
            >
              <td class="px-5 py-3.5 text-gray-800 font-medium">{{ row.feature }}</td>
              <td class="px-5 py-3.5 text-center bg-amber-50/40">
                <span class="inline-flex items-center gap-1.5 text-amber-800 font-medium text-xs">
                  <svg v-if="row.kinora === 'Tersedia'" class="w-4 h-4 text-amber-600" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.15"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {{ row.kinora }}
                </span>
                <span v-if="row.kinora_note" class="block text-[10px] text-amber-600/70 mt-0.5">{{ row.kinora_note }}</span>
              </td>
              <td class="px-5 py-3.5 text-center text-gray-500 text-xs">{{ row.tracker }}</td>
              <td class="px-5 py-3.5 text-center text-gray-500 text-xs">{{ row.parental }}</td>
              <td class="px-5 py-3.5 text-center text-gray-500 text-xs">{{ row.manager }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="md:hidden space-y-3">
        <div v-for="(row, idx) in comparisonData" :key="row.feature"
          data-animate :data-delay="idx * 50"
          class="bg-white rounded-xl border border-gray-200 p-4 space-y-2"
        >
          <h4 class="font-semibold text-gray-900 text-sm">{{ row.feature }}</h4>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-amber-50 rounded-lg px-3 py-2">
              <p class="text-[10px] text-amber-600 uppercase font-semibold mb-0.5">Kinora</p>
              <p class="text-amber-800 font-medium">{{ row.kinora }}</p>
              <p v-if="row.kinora_note" class="text-[10px] text-amber-600/70 mt-0.5">{{ row.kinora_note }}</p>
            </div>
            <div class="bg-gray-50 rounded-lg px-3 py-2">
              <p class="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Pelacak</p>
              <p class="text-gray-600">{{ row.tracker }}</p>
            </div>
            <div class="bg-gray-50 rounded-lg px-3 py-2">
              <p class="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Parental Control</p>
              <p class="text-gray-600">{{ row.parental }}</p>
            </div>
            <div class="bg-gray-50 rounded-lg px-3 py-2">
              <p class="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Pengelola</p>
              <p class="text-gray-600">{{ row.manager }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Highlight -->
      <div data-animate class="mt-10 text-center bg-amber-50/60 rounded-2xl border border-amber-100 p-6 sm:p-8">
        <p class="text-sm sm:text-base text-gray-700 leading-relaxed max-w-2xl mx-auto">
          Kinora dirancang untuk <strong class="text-gray-900">mendampingi keluarga</strong>, bukan sekadar memantau anggota keluarga. Satu aplikasi untuk komunikasi, keamanan, parenting, aktivitas, keuangan, dan kenangan keluarga.
        </p>
      </div>

      <!-- Disclaimer -->
      <p class="mt-6 text-[11px] text-gray-400 text-center max-w-xl mx-auto leading-relaxed">
        Ketersediaan fitur pada aplikasi lain dapat berbeda berdasarkan produk, paket, negara, dan platform. Perbandingan ini menggambarkan kategori aplikasi secara umum.
      </p>

      <!-- CTA -->
      <div data-animate class="mt-8 text-center">
        <p class="text-gray-600 text-sm mb-4">Temukan cara yang lebih mudah untuk menjaga keluarga tetap terhubung.</p>
        <div class="flex flex-wrap justify-center gap-3">
          <a href="/register" class="px-6 py-3 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition font-semibold shadow-md text-sm">Mulai Gratis</a>
          <a href="#features" class="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-full hover:border-amber-300 hover:bg-amber-50 transition font-medium text-sm">Download Sekarang</a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const comparisonData = [
  { feature: 'Live Location', kinora: 'Tersedia', tracker: 'Umumnya tersedia', parental: 'Terkadang tersedia', manager: 'Jarang tersedia' },
  { feature: 'Safe Zone', kinora: 'Tersedia', tracker: 'Umumnya tersedia', parental: 'Terkadang tersedia', manager: 'Jarang tersedia' },
  { feature: 'SOS Keluarga', kinora: 'Tersedia', tracker: 'Terkadang tersedia', parental: 'Terkadang tersedia', manager: 'Jarang tersedia' },
  { feature: 'Chat Keluarga', kinora: 'Tersedia', kinora_note: 'Terenkripsi E2E', tracker: 'Terbatas', parental: 'Jarang tersedia', manager: 'Terkadang tersedia' },
  { feature: 'Kalender Keluarga', kinora: 'Tersedia', tracker: 'Jarang tersedia', parental: 'Jarang tersedia', manager: 'Umumnya tersedia' },
  { feature: 'Tugas & Chores', kinora: 'Tersedia', tracker: 'Jarang tersedia', parental: 'Terkadang tersedia', manager: 'Umumnya tersedia' },
  { feature: 'Parenting & Tumbuh Kembang', kinora: 'Tersedia', tracker: 'Tidak umum', parental: 'Terbatas', manager: 'Terkadang tersedia' },
  { feature: 'Finance Keluarga', kinora: 'Tersedia', tracker: 'Tidak umum', parental: 'Tidak umum', manager: 'Terkadang tersedia' },
  { feature: 'Memories & Journey', kinora: 'Tersedia', tracker: 'Tidak umum', parental: 'Tidak umum', manager: 'Terkadang tersedia' },
  { feature: 'Kontrol Perangkat Anak', kinora: 'Tersedia', kinora_note: 'Transparan', tracker: 'Tidak selalu tersedia', parental: 'Umumnya tersedia', manager: 'Tidak umum' },
  { feature: 'Konsultasi Keluarga', kinora: 'Tersedia', kinora_note: 'Jika aktif', tracker: 'Tidak umum', parental: 'Tidak umum', manager: 'Tidak umum' },
  { feature: 'Webinar & Artikel', kinora: 'Tersedia', tracker: 'Tidak umum', parental: 'Terkadang tersedia', manager: 'Terkadang tersedia' },
  { feature: 'Pengelolaan Terpadu', kinora: 'Tersedia', tracker: 'Terbatas', parental: 'Terbatas', manager: 'Tersedia sebagian' },
]
</script>

<style scoped>
.comparison-row-enter {
  opacity: 0;
  transform: translateY(8px);
  animation: rowFadeIn 0.4s ease forwards;
}

@keyframes rowFadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
