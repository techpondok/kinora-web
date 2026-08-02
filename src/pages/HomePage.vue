<template>
  <div class="min-h-screen bg-white text-gray-800">
    <!-- Loading -->
    <div v-if="!loaded" class="min-h-screen flex items-center justify-center bg-amber-50">
      <div class="text-center"><div class="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div><p class="mt-3 text-sm text-gray-500">Memuat Kinora...</p></div>
    </div>

    <template v-else>
      <!-- HEADER -->
      <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 transition-shadow duration-300" :class="headerScrolled ? 'header-scrolled' : ''">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <a href="/" class="flex items-center gap-2">
            <img v-if="cfg('general').logo_url" :src="cfg('general').logo_url" alt="Kinora" class="h-7" />
            <span class="font-bold text-xl text-gray-900" style="font-family: 'Bricolage Grotesque', sans-serif">{{ cfg('general').app_name || 'Kinora' }}</span>
          </a>
          <nav class="hidden lg:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" class="hover:text-amber-700 transition">Fitur</a>
            <a href="#how-it-works" class="hover:text-amber-700 transition">Cara Kerja</a>
            <a href="#pricing" class="hover:text-amber-700 transition">Harga</a>
            <a v-if="consultants.length" href="#consultants" class="hover:text-amber-700 transition">Konsultan</a>
            <a v-if="articles.length" href="#articles" class="hover:text-amber-700 transition">Artikel</a>
            <a href="#faq" class="hover:text-amber-700 transition">FAQ</a>
          </nav>
          <div class="flex items-center gap-2">
            <a href="/login" class="hidden sm:inline-block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">Login</a>
            <a :href="cfg('general').web_app || '/register'" class="px-4 py-2 text-sm bg-amber-500 text-white rounded-full hover:bg-amber-600 transition font-medium shadow-sm">Mulai Gratis</a>
          </div>
        </div>
      </header>

      <!-- HERO -->
      <section class="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6">
        <!-- Background decorative -->
        <div class="absolute inset-0 -z-10">
          <div class="absolute top-20 left-10 w-72 h-72 bg-amber-100 rounded-full blur-3xl opacity-40"></div>
          <div class="absolute bottom-10 right-20 w-96 h-96 bg-orange-50 rounded-full blur-3xl opacity-50"></div>
          <div class="absolute top-40 right-40 w-32 h-32 bg-teal-50 rounded-full blur-2xl opacity-60"></div>
        </div>

        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <!-- Left: Copy -->
          <div class="space-y-7 hero-stagger" :class="loaded ? 'hero-visible' : ''">
            <span v-if="cfg('hero').badge" data-animate class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-100/80 text-amber-800 text-xs font-semibold rounded-full backdrop-blur-sm border border-amber-200/50">
              <Heart :size="12" class="text-amber-600" /> {{ cfg('hero').badge }}
            </span>
            <h1 data-animate class="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-gray-900 leading-[1.15] tracking-tight">
              {{ cfg('hero').title || 'Satu aplikasi untuk menjaga, mengatur, dan mendekatkan keluarga.' }}
            </h1>
            <p data-animate class="text-lg text-gray-500 leading-relaxed max-w-lg">
              {{ cfg('hero').description || 'Kinora membantu keluarga tetap terhubung, lebih aman, lebih teratur, dan lebih dekat.' }}
            </p>

            <!-- CTA -->
            <div data-animate class="flex flex-wrap gap-3 pt-2">
              <a :href="cfg('general').web_app || '/register'" class="px-7 py-3.5 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition font-semibold shadow-lg shadow-amber-200/50 text-sm sm:text-base btn-press">
                {{ cfg('hero').cta_primary || 'Mulai Gratis' }}
              </a>
              <a :href="cfg('hero').cta_secondary_link || '#features'" class="px-7 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-full hover:border-amber-300 hover:shadow-md transition font-medium text-sm sm:text-base">
                {{ cfg('hero').cta_secondary || 'Lihat Fitur' }}
              </a>
            </div>
            <!-- Store badges -->
            <div v-if="cfg('general').play_store || cfg('general').app_store" class="flex items-center gap-3 pt-1">
              <a v-if="cfg('general').play_store" :href="cfg('general').play_store" target="_blank" class="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition flex items-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z"/></svg>
                Google Play
              </a>
              <a v-if="cfg('general').app_store" :href="cfg('general').app_store" target="_blank" class="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition flex items-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5M13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/></svg>
                App Store
              </a>
            </div>
          </div>

          <!-- Right: Illustration + Floating Cards -->
          <div class="hidden lg:block relative">
            <div v-if="cfg('hero').image_url" class="relative">
              <img :src="cfg('hero').image_url" alt="Keluarga menggunakan Kinora" class="w-full max-w-lg mx-auto rounded-3xl" loading="eager" />
            </div>
            <div v-else class="relative w-full max-w-lg mx-auto">
              <!-- Storyset illustration placeholder -->
              <img src="https://cdn.storyset.com/illustration/preview/1000/416/family-values-amico.png" alt="Family illustration" class="w-full" loading="eager" />
            </div>

            <!-- Floating cards -->
            <div class="absolute top-8 -left-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-3 animate-float">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><MapPin :size="14" class="text-green-600" /></div>
                <div><p class="text-[11px] font-medium text-gray-900">Raka tiba di sekolah</p><p class="text-[10px] text-green-600">🟢 Safe Zone</p></div>
              </div>
            </div>
            <div class="absolute bottom-16 -left-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-3 animate-float" style="animation-delay: 1s">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><MessageCircle :size="14" class="text-blue-600" /></div>
                <div><p class="text-[11px] font-medium text-gray-900">Family Chat</p><p class="text-[10px] text-gray-400">Papa mengirim pesan</p></div>
              </div>
            </div>
            <div class="absolute top-1/2 -right-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-3 animate-float" style="animation-delay: 2s">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center"><Calendar :size="14" class="text-amber-600" /></div>
                <div><p class="text-[11px] font-medium text-gray-900">Family Time</p><p class="text-[10px] text-gray-400">19.00 · Makan malam</p></div>
              </div>
            </div>
            <div class="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-3 animate-float" style="animation-delay: 0.5s">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"><Heart :size="14" class="text-red-500" /></div>
                <p class="text-[11px] font-medium text-gray-900">Semua anggota aman ❤️</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- TRUST -->
      <section class="py-12 px-4 sm:px-6 border-b border-gray-100">
        <div class="max-w-5xl mx-auto">
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center text-sm text-gray-600">
            <div data-animate="scale" data-delay="0" class="flex flex-col items-center gap-2"><Lock :size="20" class="text-amber-600" /><span>Data keluarga tetap privat</span></div>
            <div data-animate="scale" data-delay="100" class="flex flex-col items-center gap-2"><Eye :size="20" class="text-amber-600" /><span>Monitoring transparan</span></div>
            <div data-animate="scale" data-delay="200" class="flex flex-col items-center gap-2"><AlertTriangle :size="20" class="text-amber-600" /><span>SOS selalu tersedia</span></div>
            <div data-animate="scale" data-delay="300" class="flex flex-col items-center gap-2"><Users :size="20" class="text-amber-600" /><span>Satu akun, satu keluarga</span></div>
            <div data-animate="scale" data-delay="400" class="flex flex-col items-center gap-2"><Settings :size="20" class="text-amber-600" /><span>Sesuaikan per anggota</span></div>
          </div>
        </div>
      </section>

      <!-- STORY SECTION -->
      <section class="py-20 sm:py-28 px-4 sm:px-6">
        <div class="max-w-5xl mx-auto">
          <div class="text-center mb-16">
            <h2 data-animate class="text-2xl sm:text-3xl font-bold text-gray-900">Bagaimana Kinora menjaga keluarga Anda</h2>
            <p class="mt-3 text-gray-500 max-w-2xl mx-auto">Cerita nyata dari keseharian keluarga yang menggunakan Kinora.</p>
          </div>

          <!-- Story cards with illustrations -->
          <div class="space-y-16">
            <!-- Story 1 -->
            <div data-animate class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div class="order-2 lg:order-1">
                <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100">
                  <img src="https://stories.freepiklabs.com/api/vectors/high-school/cuate/render?color=&background=complete&hide=" alt="Anak tiba di sekolah" class="w-full max-w-xs mx-auto" loading="lazy" />
                </div>
              </div>
              <div class="order-1 lg:order-2 space-y-4">
                <span class="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">📍 Safe Zone</span>
                <h3 class="text-xl font-bold text-gray-900">Ayah bekerja dengan tenang</h3>
                <p class="text-gray-500 leading-relaxed">Pagi hari, Ayah berangkat kerja. Kinora otomatis memberi tahu saat Raka tiba di sekolah dengan selamat. Tidak perlu bertanya lewat chat — notifikasi sudah cukup.</p>
                <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><MapPin :size="16" class="text-green-600" /></div>
                    <div><p class="text-sm font-medium text-gray-900">Raka tiba di SD Harapan Bangsa</p><p class="text-xs text-gray-400">07:15 · Safe Zone aktif</p></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Story 2 -->
            <div data-animate class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div class="space-y-4">
                <span class="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">📅 Family Calendar</span>
                <h3 class="text-xl font-bold text-gray-900">Ibu tidak pernah lupa jadwal</h3>
                <p class="text-gray-500 leading-relaxed">Vaksinasi anak, jadwal les, makan malam bersama — semua tercatat di kalender keluarga. Pengingat otomatis memastikan tidak ada yang terlewat.</p>
                <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><Calendar :size="16" class="text-blue-600" /></div>
                    <div><p class="text-sm font-medium text-gray-900">Vaksinasi Raka — Besok 09:00</p><p class="text-xs text-gray-400">Reminder aktif · RS Bunda</p></div>
                  </div>
                </div>
              </div>
              <div>
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100">
                  <img src="https://stories.freepiklabs.com/api/vectors/calendar/bro/render?color=&background=complete&hide=" class="w-full max-w-xs mx-auto" loading="lazy" />
                </div>
              </div>
            </div>

            <!-- Story 3 -->
            <div data-animate class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div class="order-2 lg:order-1">
                <div class="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-8 border border-red-100">
                  <img src="https://stories.freepiklabs.com/api/vectors/emergency-call/pana/render?color=&background=complete&hide=" alt="SOS keamanan" class="w-full max-w-xs mx-auto" loading="lazy" />
                </div>
              </div>
              <div class="order-1 lg:order-2 space-y-4">
                <span class="text-xs font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">🆘 Emergency SOS</span>
                <h3 class="text-xl font-bold text-gray-900">Dalam keadaan darurat, satu sentuhan cukup</h3>
                <p class="text-gray-500 leading-relaxed">Anak menekan tombol SOS. Dalam hitungan detik, kedua orang tua menerima notifikasi beserta lokasi terkini. Tidak perlu telepon, tidak perlu penjelasan panjang.</p>
                <div class="bg-white rounded-xl border border-red-100 p-4 shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><AlertTriangle :size="16" class="text-red-600" /></div>
                    <div><p class="text-sm font-medium text-red-700">🚨 SOS dari Raka</p><p class="text-xs text-gray-400">Lokasi: Jl. Sudirman 45 · Baru saja</p></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Story 4: Keuangan -->
            <div data-animate class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div class="space-y-4">
                <span class="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">💰 Family Finance</span>
                <h3 class="text-xl font-bold text-gray-900">Keuangan keluarga transparan dan terkontrol</h3>
                <p class="text-gray-500 leading-relaxed">Pengeluaran harian, tabungan keluarga, dan anggaran bulanan — semua tercatat bersama. Tidak ada lagi pertanyaan "uangnya ke mana?"</p>
                <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center"><Wallet :size="16" class="text-amber-600" /></div>
                    <div><p class="text-sm font-medium text-gray-900">Pengeluaran Agustus: Rp 4.250.000</p><p class="text-xs text-gray-400">Budget tersisa Rp 1.750.000 · On track ✓</p></div>
                  </div>
                </div>
              </div>
              <div>
                <div class="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-8 border border-amber-100">
                  <img src="https://stories.freepiklabs.com/api/vectors/saving-money/bro/render?color=&background=complete&hide=" alt="Keuangan keluarga" class="w-full max-w-xs mx-auto" loading="lazy" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURES -->
      <section id="features" class="py-20 sm:py-28 px-4 sm:px-6 bg-gradient-to-b from-gray-50/50 to-white">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Semua yang keluarga butuhkan</h2>
            <p class="mt-3 text-gray-500 max-w-2xl mx-auto">Fitur lengkap yang dirancang khusus untuk keluarga Indonesia.</p>
          </div>

          <!-- Feature illustration cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="(group, idx) in featureGroups" :key="group.title" data-animate :data-delay="idx * 100" class="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-amber-200 transition-all duration-300 overflow-hidden relative">
              <!-- Decorative gradient -->
              <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity" :class="[
                idx === 0 ? 'from-emerald-400 to-teal-400' : '',
                idx === 1 ? 'from-blue-400 to-indigo-400' : '',
                idx === 2 ? 'from-pink-400 to-red-400' : '',
                idx === 3 ? 'from-purple-400 to-violet-400' : '',
                idx === 4 ? 'from-amber-400 to-orange-400' : '',
              ]"></div>

              <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" :class="[
                idx === 0 ? 'bg-emerald-50' : '',
                idx === 1 ? 'bg-blue-50' : '',
                idx === 2 ? 'bg-pink-50' : '',
                idx === 3 ? 'bg-purple-50' : '',
                idx === 4 ? 'bg-amber-50' : '',
              ]">
                <component :is="iconComponents[group.icon] || Star" :size="22" :class="[
                  idx === 0 ? 'text-emerald-600' : '',
                  idx === 1 ? 'text-blue-600' : '',
                  idx === 2 ? 'text-pink-600' : '',
                  idx === 3 ? 'text-purple-600' : '',
                  idx === 4 ? 'text-amber-600' : '',
                ]" />
              </div>
              <h3 class="font-bold text-gray-900 mb-1">{{ group.title }}</h3>
              <p class="text-sm text-gray-500 mb-4">{{ group.desc }}</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="f in group.items.slice(0, 4)" :key="f" class="px-2.5 py-1 text-xs bg-gray-50 text-gray-600 rounded-lg">{{ f }}</span>
                <span v-if="group.items.length > 4" class="px-2.5 py-1 text-xs text-amber-600 font-medium">+{{ group.items.length - 4 }}</span>
              </div>
            </div>
          </div>

          <!-- Dynamic features from admin -->
          <div v-if="activeFeatures.length" class="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="f in activeFeatures" :key="f.title" class="bg-white rounded-xl p-5 border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all duration-300">
              <div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3"><component :is="featureIcon(f.icon)" :size="18" class="text-amber-700" /></div>
              <h4 class="font-semibold text-gray-900 text-sm">{{ f.title }}</h4>
              <p class="mt-1.5 text-xs text-gray-500 leading-relaxed">{{ f.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section id="how-it-works" class="py-16 sm:py-20 px-4 sm:px-6">
        <div class="max-w-4xl mx-auto text-center">
          <h2 data-animate class="text-2xl sm:text-3xl font-bold text-gray-900">Cara memulai Kinora</h2>
          <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div data-animate data-delay="0" class="space-y-3">
              <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-xl font-bold text-amber-700 mx-auto animate-pulse-once">1</div>
              <h3 class="font-semibold text-gray-900">Buat Akun</h3>
              <p class="text-sm text-gray-500">Daftar gratis dengan email. Satu akun untuk web dan aplikasi.</p>
            </div>
            <div class="space-y-3">
              <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-xl font-bold text-amber-700 mx-auto">2</div>
              <h3 class="font-semibold text-gray-900">Undang Keluarga</h3>
              <p class="text-sm text-gray-500">Tambahkan anggota keluarga dengan kode undangan atau QR.</p>
            </div>
            <div class="space-y-3">
              <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-xl font-bold text-amber-700 mx-auto">3</div>
              <h3 class="font-semibold text-gray-900">Atur Sesuai Kebutuhan</h3>
              <p class="text-sm text-gray-500">Aktifkan lokasi, screen time, keuangan, dan fitur lainnya.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- FAMILY ROLES -->
      <section class="py-16 sm:py-20 px-4 sm:px-6 bg-gray-50">
        <div class="max-w-5xl mx-auto text-center">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Kinora untuk setiap anggota keluarga</h2>
          <div class="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div class="bg-white rounded-2xl p-5 border border-gray-100 text-left"><Users :size="22" class="text-amber-600 mb-2" /><h4 class="font-semibold text-sm text-gray-900">Orang Tua</h4><p class="text-xs text-gray-500 mt-1">Mengatur keamanan, jadwal, dan kebutuhan keluarga.</p></div>
            <div class="bg-white rounded-2xl p-5 border border-gray-100 text-left"><Baby :size="22" class="text-pink-500 mb-2" /><h4 class="font-semibold text-sm text-gray-900">Anak & Remaja</h4><p class="text-xs text-gray-500 mt-1">Mendapat perlindungan dan dukungan tanpa merasa diawasi diam-diam.</p></div>
            <div class="bg-white rounded-2xl p-5 border border-gray-100 text-left"><Heart :size="22" class="text-red-400 mb-2" /><h4 class="font-semibold text-sm text-gray-900">Pasangan</h4><p class="text-xs text-gray-500 mt-1">Mengelola keuangan, kenangan, dan tujuan bersama.</p></div>
            <div class="bg-white rounded-2xl p-5 border border-gray-100 text-left"><Activity :size="22" class="text-teal-500 mb-2" /><h4 class="font-semibold text-sm text-gray-900">Kakek & Nenek</h4><p class="text-xs text-gray-500 mt-1">Pengingat kesehatan dan komunikasi yang lebih mudah.</p></div>
            <div class="bg-white rounded-2xl p-5 border border-gray-100 text-left"><BookOpen :size="22" class="text-indigo-500 mb-2" /><h4 class="font-semibold text-sm text-gray-900">Wali / Pengasuh</h4><p class="text-xs text-gray-500 mt-1">Memantau aktivitas dan jadwal anak yang diasuh.</p></div>
            <div class="bg-white rounded-2xl p-5 border border-gray-100 text-left"><Heart :size="22" class="text-orange-400 mb-2" /><h4 class="font-semibold text-sm text-gray-900">Hewan Peliharaan</h4><p class="text-xs text-gray-500 mt-1">Jadwal vaksinasi, rutinitas, dan lokasi GPS pet.</p></div>
          </div>
        </div>
      </section>

      <!-- SAFETY -->
      <section class="py-16 sm:py-20 px-4 sm:px-6">
        <div class="max-w-4xl mx-auto">
          <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 sm:p-12 border border-emerald-100">
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Perlindungan yang terasa aman, bukan berlebihan</h2>
            <p class="mt-3 text-gray-600 max-w-2xl">Kinora dirancang dengan prinsip transparansi dan kepercayaan keluarga.</p>
            <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div class="flex items-start gap-3"><CheckCircle :size="16" class="text-green-600 mt-0.5 flex-shrink-0" /><span>Monitoring dilakukan secara transparan — anak diberi tahu.</span></div>
              <div class="flex items-start gap-3"><CheckCircle :size="16" class="text-green-600 mt-0.5 flex-shrink-0" /><span>SOS dan emergency contact selalu diprioritaskan.</span></div>
              <div class="flex items-start gap-3"><CheckCircle :size="16" class="text-green-600 mt-0.5 flex-shrink-0" /><span>Pengaturan dapat disesuaikan per usia dan kebutuhan.</span></div>
              <div class="flex items-start gap-3"><CheckCircle :size="16" class="text-green-600 mt-0.5 flex-shrink-0" /><span>Chat keluarga terenkripsi end-to-end.</span></div>
              <div class="flex items-start gap-3 text-red-600"><AlertTriangle :size="16" class="mt-0.5 flex-shrink-0" /><span>Tidak membaca WhatsApp, Instagram, atau pesan pribadi lain.</span></div>
              <div class="flex items-start gap-3 text-red-600"><AlertTriangle :size="16" class="mt-0.5 flex-shrink-0" /><span>Tidak menggunakan kamera atau mikrofon secara tersembunyi.</span></div>
            </div>
          </div>
        </div>
      </section>

      <!-- COMPARISON -->
      <ComparisonSection />

      <!-- PRICING -->
      <section id="pricing" class="py-16 sm:py-20 px-4 sm:px-6 bg-gray-50">
        <div class="max-w-5xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Pilih paket untuk keluarga</h2>
            <p class="mt-3 text-gray-600">Mulai gratis, upgrade kapan saja sesuai kebutuhan.</p>
          </div>
          <div class="flex flex-wrap justify-center gap-6">
            <div v-for="(plan, idx) in plans" :key="plan.key" data-animate :data-delay="idx * 150" class="bg-white rounded-2xl border-2 p-6 space-y-5 relative w-full sm:w-[340px] card-hover" :class="plan.key === 'plans.family_plus' ? 'border-amber-400 shadow-xl scale-[1.02]' : 'border-gray-200'">
              <div v-if="plan.key === 'plans.family_plus'" class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-white text-xs font-bold rounded-full shadow">Rekomendasi</div>
              <div>
                <h3 class="font-bold text-gray-900 text-lg">{{ plan.label }}</h3>
                <p class="text-xs text-gray-500 mt-1">{{ plan.price_monthly_idr === 0 ? 'Untuk mulai mengatur kebutuhan dasar.' : plan.key === 'plans.family_plus' ? 'Keamanan, kontrol, dan fitur lengkap.' : 'Untuk keluarga besar.' }}</p>
              </div>
              <div>
                <span class="text-3xl font-bold text-gray-900">{{ formatIDR(plan.price_monthly_idr) }}</span>
                <span v-if="plan.price_monthly_idr > 0" class="text-sm text-gray-400">/bulan</span>
                <span v-if="plan.compare_price_monthly_idr && plan.compare_price_monthly_idr > plan.price_monthly_idr" class="ml-2 text-sm text-gray-400 line-through">{{ formatIDR(plan.compare_price_monthly_idr) }}</span>
                <p v-if="plan.price_yearly_idr > 0" class="text-sm text-gray-500 mt-1">
                  <span v-if="plan.compare_price_yearly_idr && plan.compare_price_yearly_idr > plan.price_yearly_idr" class="text-gray-400 line-through mr-1">{{ formatIDR(plan.compare_price_yearly_idr) }}</span>
                  {{ formatIDR(plan.price_yearly_idr) }}/tahun
                  <span v-if="plan.yearly_savings_percent" class="text-amber-600 font-semibold">(hemat {{ plan.yearly_savings_percent }}%)</span>
                </p>
              </div>
              <ul class="space-y-2.5 text-sm text-gray-600">
                <li class="flex items-center gap-2"><Users :size="14" class="text-amber-500" /> {{ plan.member_limit === -1 ? 'Unlimited' : plan.member_limit }} anggota</li>
                <li class="flex items-center gap-2"><Camera :size="14" class="text-amber-500" /> {{ plan.storage_label || '-' }}</li>
                <li v-if="plan.safe_zones" class="flex items-center gap-2"><MapPin :size="14" class="text-amber-500" /> {{ plan.safe_zones === -1 ? 'Unlimited' : plan.safe_zones }} Safe Zone</li>
                <li v-if="!plan.ads_enabled" class="flex items-center gap-2"><Shield :size="14" class="text-amber-500" /> Tanpa iklan</li>
                <li v-if="plan.trial_days_default" class="flex items-center gap-2"><Star :size="14" class="text-amber-500" /> {{ plan.trial_days_default }} hari trial gratis</li>
                <li v-for="feat in (plan.features || []).slice(0, 6)" :key="feat" class="flex items-center gap-2"><CheckCircle :size="14" class="text-green-500" /> {{ feat }}</li>
                <li v-if="(plan.features || []).length > 6" class="text-amber-600 text-xs font-medium">+ {{ plan.features.length - 6 }} fitur lainnya</li>
              </ul>
              <a :href="cfg('general').web_app || '/register'" class="block w-full text-center py-3 rounded-xl font-semibold transition text-sm btn-press" :class="plan.key === 'plans.family_plus' ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
                {{ plan.price_monthly_idr === 0 ? 'Mulai Gratis' : 'Pilih Paket' }}
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- CONSULTANTS -->
      <section v-if="consultants.length" id="consultants" class="py-16 sm:py-20 px-4 sm:px-6">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Butuh bantuan profesional?</h2>
            <p class="mt-3 text-gray-600">Konsultasi langsung dengan ahli keluarga melalui Kinora.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div v-for="c in consultants" :key="c.id" class="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-md transition">
              <div class="w-16 h-16 mx-auto rounded-full bg-amber-50 overflow-hidden mb-3 border-2 border-amber-100">
                <img v-if="c.avatar_url" :src="c.avatar_url" :alt="c.name" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center"><Users :size="24" class="text-amber-300" /></div>
              </div>
              <h3 class="font-semibold text-gray-900 text-sm">{{ c.name }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">{{ c.specialty }}</p>
              <p class="text-sm font-bold text-amber-600 mt-2">{{ formatIDR(c.session_price_amount) }}<span class="text-gray-400 font-normal text-xs">/sesi</span></p>
              <div class="mt-2 flex justify-center gap-1">
                <span v-if="c.chat_enabled" class="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full">Chat</span>
                <span v-if="c.meeting_enabled" class="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">{{ c.meeting_platform }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- WEBINARS -->
      <section v-if="webinars.length" class="py-16 sm:py-20 px-4 sm:px-6 bg-gray-50">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Belajar bersama keluarga</h2>
            <p class="mt-3 text-gray-600">Webinar praktis seputar parenting, keamanan digital, dan keluarga.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div v-for="w in webinars" :key="w.id" class="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition">
              <div class="h-36 bg-gray-100"><img v-if="w.cover_url" :src="w.cover_url" :alt="w.title" class="w-full h-full object-cover" loading="lazy" /></div>
              <div class="p-4 space-y-2">
                <h3 class="font-semibold text-gray-900 text-sm line-clamp-2">{{ w.title }}</h3>
                <p class="text-xs text-gray-500">{{ w.speaker_name }} · {{ formatDate(w.scheduled_at) }}</p>
                <p class="text-sm font-bold" :class="w.is_free ? 'text-green-600' : 'text-amber-600'">{{ w.is_free ? 'Gratis' : formatIDR(w.price_amount) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ARTICLES -->
      <section v-if="articles.length" id="articles" class="py-16 sm:py-20 px-4 sm:px-6">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Panduan untuk keluarga modern</h2>
            <p class="mt-3 text-gray-600">Tips parenting, keamanan digital, kesehatan, dan keuangan keluarga.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <a v-for="a in articles" :key="a.id" :href="`/articles/${a.slug}`" class="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition group card-hover">
              <div class="h-36 bg-gray-100 overflow-hidden"><img v-if="a.cover_url" :src="a.cover_url" :alt="a.cover_alt || a.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" /></div>
              <div class="p-4 space-y-2">
                <span class="text-xs text-amber-600 font-medium">{{ a.category }}</span>
                <h3 class="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-amber-700 transition">{{ a.title }}</h3>
                <p class="text-xs text-gray-500">{{ a.author_name || 'Kinora' }} · {{ formatDate(a.published_at) }}</p>
              </div>
            </a>
          </div>
          <div class="mt-8 text-center"><a href="/articles" class="text-amber-600 text-sm font-semibold hover:underline">Lihat semua artikel →</a></div>
        </div>
      </section>

      <!-- TESTIMONIALS -->
      <section v-if="activeTestimonials.length" class="py-20 sm:py-28 px-4 sm:px-6">
        <div class="max-w-5xl mx-auto">
          <div class="text-center mb-14">
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Dipercaya oleh keluarga Indonesia</h2>
            <p class="mt-3 text-gray-500">Cerita dari keluarga yang telah merasakan manfaat Kinora.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="(t, idx) in activeTestimonials" :key="t.name" data-animate :data-delay="idx * 100" class="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <!-- Rating -->
              <div class="flex gap-0.5 mb-4">
                <Star v-for="i in (t.rating || 5)" :key="i" :size="16" class="text-amber-400 fill-amber-400" />
              </div>
              <!-- Quote -->
              <p class="text-sm text-gray-700 leading-relaxed">"{{ t.text }}"</p>
              <!-- Author -->
              <div class="mt-5 flex items-center gap-3 pt-4 border-t border-gray-50">
                <img v-if="t.photo" :src="t.photo" :alt="t.name" class="w-11 h-11 rounded-full object-cover border-2 border-gray-100" loading="lazy" />
                <div v-else class="w-11 h-11 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-amber-700">{{ t.name?.charAt(0) }}</div>
                <div>
                  <p class="text-sm font-semibold text-gray-900">{{ t.name }}</p>
                  <p class="text-xs text-gray-400">{{ t.role }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="py-16 sm:py-20 px-4 sm:px-6">
        <div class="max-w-3xl mx-auto">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Pertanyaan yang sering diajukan</h2>
          <div class="mt-10 space-y-3">
            <div v-for="(item, i) in activeFaqs" :key="i" data-animate :data-delay="i * 80" class="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button @click="openFaq = openFaq === i ? -1 : i" class="w-full px-5 py-4 text-left flex items-center justify-between gap-4">
                <span class="font-medium text-gray-900 text-sm">{{ item.q }}</span>
                <span class="text-gray-400 text-lg flex-shrink-0 transition-transform duration-300" :class="openFaq === i ? 'rotate-45' : ''">+</span>
              </button>
              <div class="faq-answer" :class="openFaq === i ? 'is-open px-5 pb-4' : 'px-5'">
                <p class="text-sm text-gray-600 leading-relaxed">{{ item.a }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FINAL CTA -->
      <section class="py-20 sm:py-28 px-4 sm:px-6">
        <div class="max-w-4xl mx-auto relative">
          <!-- Decorative blobs -->
          <div class="absolute -top-10 -left-10 w-40 h-40 bg-amber-100 rounded-full blur-3xl opacity-40"></div>
          <div class="absolute -bottom-10 -right-10 w-56 h-56 bg-orange-100 rounded-full blur-3xl opacity-30"></div>

          <div class="relative text-center bg-white rounded-[2rem] p-12 sm:p-16 border border-gray-100 shadow-xl" data-animate="scale">
            <div class="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Heart :size="28" class="text-amber-600" />
            </div>
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Mulai bangun keluarga yang lebih aman, teratur, dan dekat</h2>
            <p class="mt-4 text-gray-500 max-w-xl mx-auto">Gratis untuk memulai. Tidak perlu kartu kredit. Upgrade kapan saja sesuai kebutuhan keluarga.</p>
            <div class="mt-8 flex flex-wrap justify-center gap-3">
              <a :href="cfg('general').web_app || '/register'" class="px-8 py-3.5 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition font-semibold shadow-lg shadow-amber-200/50 btn-press">Mulai Gratis</a>
              <a v-if="cfg('general').play_store" :href="cfg('general').play_store" target="_blank" class="px-6 py-3.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition font-medium text-sm btn-press">Download App</a>
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="py-12 px-4 sm:px-6 bg-gray-900 text-gray-400">
        <div class="max-w-6xl mx-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 class="font-bold text-white text-lg mb-3" style="font-family: 'Bricolage Grotesque', sans-serif">{{ cfg('general').app_name || 'Kinora' }}</h3>
              <p class="text-sm leading-relaxed">{{ cfg('footer').description }}</p>
            </div>
            <div>
              <h4 class="font-medium text-white text-sm mb-3">Produk</h4>
              <div class="space-y-2 text-sm"><a href="#features" class="block hover:text-white transition">Fitur</a><a href="#pricing" class="block hover:text-white transition">Harga</a><a href="/articles" class="block hover:text-white transition">Artikel</a></div>
            </div>
            <div>
              <h4 class="font-medium text-white text-sm mb-3">Bantuan</h4>
              <div class="space-y-2 text-sm">
                <a v-if="cfg('footer').help_url" :href="cfg('footer').help_url" class="block hover:text-white transition">Pusat Bantuan</a>
                <a v-if="cfg('footer').privacy_url" :href="cfg('footer').privacy_url" class="block hover:text-white transition">Kebijakan Privasi</a>
                <a v-if="cfg('footer').terms_url" :href="cfg('footer').terms_url" class="block hover:text-white transition">Syarat & Ketentuan</a>
              </div>
            </div>
            <div>
              <h4 class="font-medium text-white text-sm mb-3">Hubungi</h4>
              <div class="space-y-2 text-sm">
                <p v-if="cfg('general').email_support">{{ cfg('general').email_support }}</p>
                <p v-if="cfg('general').whatsapp">WhatsApp: {{ cfg('general').whatsapp }}</p>
                <div class="flex gap-3 mt-3">
                  <a v-for="(url, platform) in (cfg('footer').social || {})" :key="platform" v-show="url" :href="url" target="_blank" rel="noopener" class="hover:text-white transition capitalize text-xs">{{ platform }}</a>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p class="text-xs">© {{ cfg('footer').copyright || '2026 Kinora. All rights reserved.' }}</p>
            <div class="flex gap-3">
              <a v-if="cfg('general').play_store" :href="cfg('general').play_store" target="_blank" class="px-3 py-1.5 bg-gray-800 text-white rounded text-xs hover:bg-gray-700">Google Play</a>
              <a v-if="cfg('general').app_store" :href="cfg('general').app_store" target="_blank" class="px-3 py-1.5 bg-gray-800 text-white rounded text-xs hover:bg-gray-700">App Store</a>
            </div>
          </div>
        </div>
      </footer>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useLandingData } from '../composables/useLandingData.js'
import { useScrollAnimation } from '../composables/useScrollAnimation.js'
import ComparisonSection from '../components/ComparisonSection.vue'
import { Shield, MapPin, Bell, MessageCircle, Wallet, Heart, Camera, Smartphone, Calendar, ClipboardList, ShoppingCart, UtensilsCrossed, Clock, Baby, Pill, Syringe, Activity, Users, Lock, Eye, AlertTriangle, Settings, Star, BookOpen, CheckCircle } from '@lucide/vue'

const { plans, consultants, webinars, articles, loaded, loadAll, cfg, formatIDR } = useLandingData()
useScrollAnimation(loaded)
const openFaq = ref(-1)

const activeFeatures = computed(() => (cfg('features')?.items || []).filter(f => f.active))
const activeFaqs = computed(() => (cfg('faq')?.items || []).filter(f => f.active))
const activeTestimonials = computed(() => (cfg('testimonials')?.items || []).filter(t => t.active))

const featureGroups = [
  { title: 'Keluarga Lebih Aman', desc: 'Pantau dan lindungi anggota keluarga.', icon: 'shield', items: ['Live Location', 'Safe Zone', 'SOS', 'Emergency Contact', 'Device Protection'] },
  { title: 'Keluarga Lebih Teratur', desc: 'Kelola jadwal dan aktivitas bersama.', icon: 'calendar', items: ['Calendar', 'Tasks', 'Shopping List', 'Meal Planner', 'Reminder'] },
  { title: 'Keluarga Lebih Sehat', desc: 'Catatan kesehatan dan tumbuh kembang.', icon: 'heart', items: ['Growth Tracking', 'Medication', 'Vaccination', 'Health Timeline', 'Menstruation'] },
  { title: 'Keluarga Lebih Dekat', desc: 'Komunikasi dan kenangan keluarga.', icon: 'message', items: ['Family Chat', 'Memories', 'Journey', 'Journal', 'Time Capsule'] },
  { title: 'Keuangan Terkontrol', desc: 'Kelola keuangan keluarga bersama.', icon: 'wallet', items: ['Wallet', 'Transaction', 'Budget', 'Debt', 'Family Goals'] },
]

const iconComponents = { shield: Shield, calendar: Calendar, heart: Heart, message: MessageCircle, wallet: Wallet, location: MapPin, screen: Smartphone, camera: Camera, star: Star, health: Activity, chat: MessageCircle }

function featureIcon(icon) {
  return iconComponents[icon] || Star
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => {
  loadAll()
  const seo = cfg('seo')
  if (seo?.title) document.title = seo.title
})

const headerScrolled = ref(false)
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => { headerScrolled.value = window.scrollY > 10 })
}
</script>
