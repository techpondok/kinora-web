<template>
  <div>
    <!-- Closing -->
    <section class="py-24 px-5 relative overflow-hidden" style="background: linear-gradient(135deg, #EBF8FF 0%, #E6FFFA 50%, #F0FFF4 100%);">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-20" style="background: radial-gradient(circle, #BEE3F8, transparent 70%);"></div>
        <div class="absolute -top-10 -left-10 w-60 h-60 rounded-full opacity-15" style="background: radial-gradient(circle, #B2F5EA, transparent 70%);"></div>
      </div>
      <div class="max-w-2xl mx-auto text-center relative">
        <!-- Decorative icon cluster -->
        <div class="flex justify-center gap-2 mb-8">
          <div v-for="d in dots" :key="d.id" class="rounded-2xl flex items-center justify-center" :style="`width: ${d.size}; height: ${d.size}; background: ${d.bg}; transform: rotate(${d.rotate}deg);`">
            <div class="rounded-lg" :style="`width: ${d.iw}; height: ${d.ih}; background: ${d.ic};`"></div>
          </div>
        </div>

        <h2 class="mb-4" style="font-size: clamp(1.8rem, 5vw, 2.8rem); font-weight: 700; line-height: 1.15; color: var(--color-text);">
          Bukan sekadar<br>aplikasi keluarga
        </h2>
        <p class="mb-8 leading-relaxed" style="color: var(--color-muted); font-size: 1.05rem; max-width: 440px; margin-left: auto; margin-right: auto;">
          Kinora membantu keluarga mengelola aktivitas, keuangan, kesehatan, keamanan, dan kenangan dalam satu ekosistem sederhana.
        </p>
        <div class="flex gap-3 justify-center flex-wrap">
          <button class="btn-primary" style="font-size: 1rem; padding: 14px 32px;">Mulai Gratis</button>
          <button class="btn-outline" style="font-size: 1rem; padding: 13px 32px;">Gabung Sekarang</button>
        </div>
        <p class="mt-5 text-sm" style="color: var(--color-muted);">Gratis selamanya · Tidak perlu kartu kredit</p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-14 px-5" style="background: var(--color-text);">
      <div class="max-w-5xl mx-auto">
        <!-- Top -->
        <div class="flex flex-col md:flex-row justify-between gap-10 mb-10">
          <!-- Brand -->
          <div class="max-w-xs">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold" style="background: linear-gradient(135deg, #4299E1, #38B2AC);">K</div>
              <span style="font-family: var(--font-display); font-weight: 700; font-size: 1.15rem; color: white;">kinora</span>
            </div>
            <p class="text-sm leading-relaxed" style="color: #718096;">Family OS untuk keluarga modern Indonesia. Satu aplikasi untuk semua kebutuhan keluarga.</p>
          </div>

          <!-- Links -->
          <div class="grid grid-cols-3 gap-8">
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest mb-3" style="color: #4A5568;">Produk</p>
              <ul class="space-y-2">
                <li v-for="item in productLinks" :key="item"><a href="#" class="text-sm transition-colors hover:text-white" style="color: #718096;">{{ item }}</a></li>
              </ul>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest mb-3" style="color: #4A5568;">Perusahaan</p>
              <ul class="space-y-2">
                <li v-for="item in companyLinks" :key="item"><a href="#" class="text-sm transition-colors hover:text-white" style="color: #718096;">{{ item }}</a></li>
              </ul>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest mb-3" style="color: #4A5568;">Legal</p>
              <ul class="space-y-2">
                <li v-for="item in legalLinks" :key="item"><a href="#" class="text-sm transition-colors hover:text-white" style="color: #718096;">{{ item }}</a></li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Bottom -->
        <div class="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-3" style="border-color: #2D3748;">
          <p class="text-xs" style="color: #4A5568;">© 2025 Kinora. Dibuat dengan penuh kasih untuk keluarga Indonesia.</p>
          <div class="flex gap-3">
            <div v-for="s in socials" :key="s" class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-700" style="background: #2D3748;">
              <div class="w-3 h-3 rounded" style="background: #4A5568;"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'ClosingSection',
  data() {
    return {
      dots: [
        { id: 1, size: '44px', bg: '#EBF8FF', ic: '#2B6CB0', iw: '16px', ih: '16px', rotate: 0 },
        { id: 2, size: '52px', bg: 'linear-gradient(135deg, #2B6CB0, #2C7A7B)', ic: 'white', iw: '18px', ih: '18px', rotate: 8 },
        { id: 3, size: '44px', bg: '#E6FFFA', ic: '#2C7A7B', iw: '16px', ih: '16px', rotate: -6 },
        { id: 4, size: '40px', bg: '#FAF5FF', ic: '#553C9A', iw: '14px', ih: '14px', rotate: 12 },
        { id: 5, size: '44px', bg: '#FFFFF0', ic: '#D69E2E', iw: '16px', ih: '16px', rotate: -3 },
      ],
      productLinks: ['Family', 'Parenting', 'Finance', 'Health', 'Journey', 'Safety'],
      companyLinks: ['Tentang', 'Roadmap', 'Kontak', 'Bantuan'],
      legalLinks: ['Privacy', 'Terms', 'Children Policy', 'Support'],
      socials: [1, 2, 3],
    }
  }
}
</script>
