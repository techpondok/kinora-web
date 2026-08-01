<template>
  <section class="py-20 px-5" style="background: white;">
    <div class="max-w-5xl mx-auto">
      <!-- Header centered -->
      <div class="text-center mb-14">
        <div class="section-badge mb-4 justify-center">
          <span class="inline-block w-2 h-2 rounded-full" style="background: #E53E3E;"></span>
          Safety
        </div>
        <h2 class="mb-4" style="font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 700; line-height: 1.2; color: var(--color-text);">
          Selalu dekat<br>meski berjauhan
        </h2>
        <p class="mx-auto leading-relaxed" style="color: var(--color-muted); max-width: 420px;">
          Pantau lokasi, kirim sinyal darurat, dan simpan catatan penting — keamanan keluarga ada di genggaman.
        </p>
      </div>

      <div class="flex flex-col lg:flex-row gap-12 items-center">
        <!-- Phone mockup -->
        <div class="flex-shrink-0 mx-auto lg:mx-0">
          <div class="phone-mockup" style="width: 230px; min-height: 480px;">
            <div class="p-4 pt-7">
              <p class="font-bold text-sm mb-1" style="font-family: var(--font-display); color: var(--color-text);">Family Safety</p>
              <p class="text-xs mb-4" style="color: var(--color-muted);">Semua anggota aman</p>

              <!-- Location status -->
              <div class="space-y-2 mb-4">
                <div v-for="m in memberStatus" :key="m.name" class="flex items-center gap-2 p-2.5 rounded-xl" style="background: var(--color-sky);">
                  <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="`background: ${m.safe ? '#38A169' : '#E53E3E'};`"></div>
                  <div class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white font-bold" :style="`background: ${m.color};`">{{ m.initial }}</div>
                  <div class="flex-1">
                    <p class="text-xs font-semibold" style="color: var(--color-text);">{{ m.name }}</p>
                    <p style="font-size: 0.6rem; color: var(--color-muted);">{{ m.location }}</p>
                  </div>
                  <span class="text-xs px-1.5 py-0.5 rounded-full font-medium" :style="`background: ${m.safe ? '#F0FFF4' : '#FFF5F5'}; color: ${m.safe ? '#38A169' : '#E53E3E'};`">{{ m.safe ? 'Aman' : 'SOS' }}</span>
                </div>
              </div>

              <!-- Map placeholder -->
              <div class="rounded-xl overflow-hidden mb-3" style="height: 100px; background: linear-gradient(135deg, #EBF8FF, #E6FFFA); position: relative;">
                <!-- Fake map grid lines -->
                <div class="absolute inset-0" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 19px, #BEE3F8 19px, #BEE3F8 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #BEE3F8 19px, #BEE3F8 20px);"></div>
                <!-- Location pins -->
                <div v-for="pin in pins" :key="pin.id" class="absolute w-3 h-3 rounded-full border-2 border-white" :style="`background: ${pin.color}; top: ${pin.top}; left: ${pin.left};`"></div>
                <!-- Label -->
                <div class="absolute bottom-2 right-2 text-xs px-2 py-1 rounded-lg font-medium" style="background: white; color: var(--color-primary);">Live Location</div>
              </div>

              <!-- SOS button -->
              <button class="w-full py-2.5 rounded-xl text-white text-sm font-bold" style="background: linear-gradient(135deg, #C53030, #E53E3E); letter-spacing: 0.05em;">
                TOMBOL SOS DARURAT
              </button>
            </div>
          </div>
        </div>

        <!-- Features grid -->
        <div class="flex-1">
          <div class="grid grid-cols-2 gap-3">
            <div v-for="f in features" :key="f.name" class="card p-4">
              <div class="w-9 h-9 rounded-xl mb-3 flex items-center justify-center" :style="`background: ${f.bg};`">
                <!-- Geometric icon shape -->
                <div :style="`width: ${f.iw}; height: ${f.ih}; background: ${f.ic}; border-radius: ${f.ir};`"></div>
              </div>
              <p class="font-semibold text-sm mb-1" style="color: var(--color-text);">{{ f.name }}</p>
              <p class="text-xs leading-relaxed" style="color: var(--color-muted);">{{ f.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'SafetySection',
  data() {
    return {
      memberStatus: [
        { name: 'Ayah Budi', initial: 'B', color: '#2B6CB0', location: 'Jl. Sudirman, Jakarta', safe: true },
        { name: 'Ibu Sari', initial: 'S', color: '#2C7A7B', location: 'Mall Taman Anggrek', safe: true },
        { name: 'Dika', initial: 'D', color: '#D69E2E', location: 'SDN Menteng 01', safe: true },
      ],
      pins: [
        { id: 1, color: '#2B6CB0', top: '30%', left: '60%' },
        { id: 2, color: '#2C7A7B', top: '55%', left: '40%' },
        { id: 3, color: '#D69E2E', top: '25%', left: '25%' },
      ],
      features: [
        { name: 'Tombol SOS', desc: 'Kirim sinyal darurat ke semua anggota', bg: '#FFF5F5', ic: '#E53E3E', iw: '12px', ih: '12px', ir: '50%' },
        { name: 'Safe Check', desc: 'Konfirmasi keamanan anggota keluarga', bg: '#F0FFF4', ic: '#38A169', iw: '12px', ih: '12px', ir: '50%' },
        { name: 'Geofence', desc: 'Notifikasi keluar-masuk area aman', bg: '#EBF8FF', ic: '#2B6CB0', iw: '14px', ih: '14px', ir: '3px' },
        { name: 'Live Location', desc: 'Pantau posisi anggota secara real-time', bg: '#E6FFFA', ic: '#2C7A7B', iw: '10px', ih: '14px', ir: '50% 50% 50% 0' },
        { name: 'Kontak Darurat', desc: 'Akses cepat ke kontak & layanan darurat', bg: '#FAF5FF', ic: '#553C9A', iw: '12px', ih: '12px', ir: '2px' },
        { name: 'Catatan Darurat', desc: 'Informasi penting tersimpan offline', bg: '#FFFFF0', ic: '#D69E2E', iw: '14px', ih: '10px', ir: '2px' },
      ]
    }
  }
}
</script>
