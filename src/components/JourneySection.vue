<template>
  <section class="py-20 px-5 relative overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-10 right-0 w-72 h-72 rounded-full opacity-10" style="background: radial-gradient(circle, #BEE3F8, transparent 70%);"></div>
    </div>
    <div class="max-w-5xl mx-auto relative">
      <div class="flex flex-col lg:flex-row gap-14 items-center">
        <!-- Content -->
        <div class="flex-1 max-w-lg">
          <div class="section-badge mb-4">
            <span class="inline-block w-2 h-2 rounded-full" style="background: #553C9A;"></span>
            Journey & Memories
          </div>
          <h2 class="mb-4" style="font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 700; line-height: 1.2; color: var(--color-text);">
            Simpan perjalanan<br>dan kenangan keluarga
          </h2>
          <p class="mb-7 leading-relaxed" style="color: var(--color-muted);">
            Setiap momen bersama terdokumentasi. Foto, video, cerita, dan lokasi — tersusun rapi dalam timeline keluarga.
          </p>

          <div class="grid grid-cols-3 gap-3 mb-7">
            <div v-for="f in features" :key="f.name" class="card p-3 text-center">
              <div class="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center" :style="`background: ${f.bg};`">
                <div class="rounded" :style="`width: ${f.sw}; height: ${f.sh}; background: ${f.dot};`"></div>
              </div>
              <p class="text-xs font-semibold" style="color: var(--color-text);">{{ f.name }}</p>
            </div>
          </div>

          <!-- On This Day highlight -->
          <div class="card p-4 flex gap-4 items-center" style="border-color: #D6BCFA; background: linear-gradient(135deg, #FAF5FF, #EBF8FF);">
            <div class="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center" style="background: #553C9A;">
              <div style="width: 20px; height: 20px; background: white; border-radius: 50%; opacity: 0.9;"></div>
            </div>
            <div>
              <p class="font-semibold text-sm mb-1" style="color: var(--color-text);">On This Day</p>
              <p class="text-xs leading-relaxed" style="color: var(--color-muted);">3 tahun lalu hari ini — Kinora mengingatkan momen spesial keluargamu secara otomatis.</p>
            </div>
          </div>

          <button class="btn-primary mt-6">Bangun cerita keluarga bersama</button>
        </div>

        <!-- Phone mockup -->
        <div class="flex-shrink-0">
          <div class="phone-mockup" style="width: 230px; min-height: 490px;">
            <div class="p-4 pt-7">
              <p class="font-bold text-sm mb-1" style="font-family: var(--font-display); color: var(--color-text);">Family Journey</p>
              <p class="text-xs mb-4" style="color: var(--color-muted);">12 perjalanan tersimpan</p>

              <!-- Journey cards -->
              <div class="space-y-3">
                <div v-for="j in journeys" :key="j.title" class="rounded-xl overflow-hidden" :style="`background: ${j.bg};`">
                  <!-- Color banner -->
                  <div class="h-16 relative flex items-end p-3" :style="`background: linear-gradient(135deg, ${j.c1}, ${j.c2});`">
                    <div class="absolute inset-0 opacity-20" style="background: repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.3) 4px, rgba(255,255,255,0.3) 5px);"></div>
                    <span class="text-white text-xs font-semibold relative z-10">{{ j.title }}</span>
                  </div>
                  <div class="p-2.5">
                    <div class="flex justify-between items-center">
                      <p class="text-xs" style="color: var(--color-muted);">{{ j.date }}</p>
                      <div class="flex gap-1">
                        <div class="w-4 h-4 rounded" style="background: var(--color-border);"></div>
                        <div class="w-4 h-4 rounded" style="background: var(--color-border);"></div>
                        <div class="w-4 h-4 rounded" style="background: var(--color-border);"></div>
                      </div>
                    </div>
                    <div class="flex gap-2 mt-1.5">
                      <span class="text-xs px-2 py-0.5 rounded-full" style="background: white; color: var(--color-muted);">{{ j.photos }} foto</span>
                      <span class="text-xs px-2 py-0.5 rounded-full" style="background: white; color: var(--color-muted);">{{ j.budget }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- On This Day mini -->
              <div class="mt-3 rounded-xl p-2.5" style="background: linear-gradient(135deg, #FAF5FF, #EBF8FF);">
                <p class="text-xs font-semibold mb-1" style="color: #553C9A;">Hari ini 3 tahun lalu</p>
                <div class="h-8 rounded-lg" style="background: linear-gradient(90deg, #D6BCFA, #BEE3F8);"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'JourneySection',
  data() {
    return {
      features: [
        { name: 'Location Pin', bg: '#EBF8FF', dot: '#2B6CB0', sw: '10px', sh: '10px' },
        { name: 'Album & Foto', bg: '#FAF5FF', dot: '#553C9A', sw: '12px', sh: '9px' },
        { name: 'Budget Trip', bg: '#E6FFFA', dot: '#2C7A7B', sw: '10px', sh: '10px' },
        { name: 'Timeline', bg: '#FFFFF0', dot: '#D69E2E', sw: '10px', sh: '3px' },
        { name: 'Story', bg: '#FFF5F5', dot: '#E53E3E', sw: '10px', sh: '10px' },
        { name: 'On This Day', bg: '#F0FFF4', dot: '#38A169', sw: '10px', sh: '10px' },
      ],
      journeys: [
        { title: 'Bandung Family Trip', date: 'Apr 2024', photos: 48, budget: 'Rp 2.4jt', c1: '#2B6CB0', c2: '#2C7A7B', bg: '#EBF8FF' },
        { title: 'Pantai Anyer Weekend', date: 'Feb 2024', photos: 31, budget: 'Rp 1.8jt', c1: '#553C9A', c2: '#2C7A7B', bg: '#FAF5FF' },
      ]
    }
  }
}
</script>
