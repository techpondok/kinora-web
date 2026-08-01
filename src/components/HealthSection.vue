<template>
  <section class="py-20 px-5" style="background: white;">
    <div class="max-w-5xl mx-auto">
      <div class="flex flex-col lg:flex-row-reverse gap-14 items-center">
        <!-- Phone mockup -->
        <div class="flex-shrink-0">
          <div class="phone-mockup" style="width: 230px; min-height: 490px;">
            <div class="p-4 pt-7">
              <div class="mb-4">
                <p class="font-bold text-sm mb-0.5" style="font-family: var(--font-display); color: var(--color-text);">Kesehatan Keluarga</p>
                <p class="text-xs" style="color: var(--color-muted);">4 anggota terpantau</p>
              </div>

              <!-- Member health cards -->
              <div class="space-y-2 mb-4">
                <div v-for="m in members" :key="m.name" class="rounded-xl p-3" :style="`background: ${m.bg};`">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold" :style="`background: ${m.color};`">{{ m.initial }}</div>
                      <p class="text-xs font-semibold" style="color: var(--color-text);">{{ m.name }}</p>
                    </div>
                    <span class="text-xs px-2 py-0.5 rounded-full" :style="`background: ${m.color}20; color: ${m.color};`">{{ m.status }}</span>
                  </div>
                  <div class="flex gap-2 flex-wrap">
                    <span v-for="tag in m.tags" :key="tag" class="text-xs px-2 py-0.5 rounded-full" style="background: white; color: var(--color-muted);">{{ tag }}</span>
                  </div>
                </div>
              </div>

              <!-- Upcoming reminders -->
              <p class="text-xs font-semibold mb-2" style="color: var(--color-text);">Pengingat Mendatang</p>
              <div class="space-y-1.5">
                <div v-for="r in reminders" :key="r.title" class="flex items-center gap-2 p-2 rounded-xl" style="background: var(--color-sky);">
                  <div class="w-2 h-2 rounded-full flex-shrink-0" :style="`background: ${r.color};`"></div>
                  <div class="flex-1">
                    <p class="text-xs font-medium" style="color: var(--color-text);">{{ r.title }}</p>
                    <p style="font-size: 0.6rem; color: var(--color-muted);">{{ r.date }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 max-w-lg">
          <div class="section-badge mb-4">
            <span class="inline-block w-2 h-2 rounded-full" style="background: #E53E3E;"></span>
            Health & Family Care
          </div>
          <h2 class="mb-4" style="font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 700; line-height: 1.2; color: var(--color-text);">
            Kesehatan keluarga<br>dalam satu timeline
          </h2>
          <p class="mb-7 leading-relaxed" style="color: var(--color-muted);">
            Rekam alergi, jadwal vaksin, obat rutin, catatan dokter, dan kontak darurat — semua tersimpan rapi dan mudah diakses.
          </p>

          <div class="grid grid-cols-2 gap-3">
            <div v-for="f in features" :key="f.name" class="card p-4">
              <div class="w-8 h-8 rounded-xl mb-3 flex items-center justify-center" :style="`background: ${f.bg};`">
                <div class="w-3 h-3 rounded-full" :style="`background: ${f.dot};`"></div>
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
  name: 'HealthSection',
  data() {
    return {
      members: [
        { name: 'Budi', initial: 'B', color: '#2B6CB0', bg: '#EBF8FF', status: 'Sehat', tags: ['Alergi debu', 'Vitamin D'] },
        { name: 'Sari', initial: 'S', color: '#2C7A7B', bg: '#E6FFFA', status: 'Sehat', tags: ['Thyroid check'] },
        { name: 'Dika', initial: 'D', color: '#D69E2E', bg: '#FFFFF0', status: 'Vaksin due', tags: ['Vaksin MMR', 'Minyak ikan'] },
      ],
      reminders: [
        { title: 'Vaksin MMR — Dika', date: 'Sabtu, 6 Mei', color: '#D69E2E' },
        { title: 'Kontrol Thyroid — Sari', date: 'Senin, 8 Mei', color: '#2C7A7B' },
        { title: 'Minum Vitamin D — Budi', date: 'Setiap hari 08:00', color: '#2B6CB0' },
      ],
      features: [
        { name: 'Alergi & Kondisi', desc: 'Catat kondisi khusus tiap anggota', bg: '#FFF5F5', dot: '#E53E3E' },
        { name: 'Jadwal Vaksin', desc: 'Pengingat otomatis jadwal imunisasi', bg: '#EBF8FF', dot: '#2B6CB0' },
        { name: 'Obat Rutin', desc: 'Reminder minum obat tepat waktu', bg: '#E6FFFA', dot: '#2C7A7B' },
        { name: 'Catatan Dokter', desc: 'Rekam hasil kunjungan & resep', bg: '#FFFFF0', dot: '#D69E2E' },
        { name: 'Kontak Darurat', desc: 'Dokter & rumah sakit siap diakses', bg: '#FAF5FF', dot: '#553C9A' },
        { name: 'Timeline Kesehatan', desc: 'Riwayat lengkap semua anggota', bg: '#F0FFF4', dot: '#38A169' },
      ]
    }
  }
}
</script>
