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
      <section class="relative overflow-hidden bg-gradient-to-b from-amber-50 to-white py-16 sm:py-24 px-4 sm:px-6">
        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-6 hero-stagger" :class="loaded ? 'hero-visible' : ''">
            <span v-if="cfg('hero').badge" data-animate class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
              <Heart :size="12" class="text-amber-600" /> {{ cfg('hero').badge }}
            </span>
            <h1 data-animate class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              {{ cfg('hero').title || 'Satu aplikasi untuk menjaga, mengatur, dan mendekatkan keluarga.' }}
            </h1>
            <p data-animate class="text-base sm:text-lg text-gray-600 leading-relaxed max-w-lg">
              {{ cfg('hero').description || 'Kinora membantu keluarga tetap terhubung, lebih aman, lebih teratur, dan lebih dekat.' }}
            </p>
            <!-- Benefits mini -->
            <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div class="flex items-center gap-2"><MapPin :size="16" class="text-amber-600" /> Lokasi & Safe Zone</div>
              <div class="flex items-center gap-2"><Shield :size="16" class="text-amber-600" /> SOS & Perlindungan</div>
              <div class="flex items-center gap-2"><MessageCircle :size="16" class="text-amber-600" /> Chat & Kalender</div>
              <div class="flex items-center gap-2"><Wallet :size="16" class="text-amber-600" /> Keuangan & Kesehatan</div>
            </div>
            <!-- CTA -->
            <div data-animate class="flex flex-wrap gap-3 pt-2">
              <a :href="cfg('general').web_app || '/register'" class="px-6 py-3 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition font-semibold shadow-md text-sm sm:text-base btn-press">
                {{ cfg('hero').cta_primary || 'Mulai Gratis' }}
              </a>
              <a :href="cfg('hero').cta_secondary_link || '#features'" class="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-full hover:border-amber-300 hover:bg-amber-50 transition font-medium text-sm sm:text-base">
                {{ cfg('hero').cta_secondary || 'Download Sekarang' }}
              </a>
            </div>
            <!-- Store badges -->
            <div v-if="cfg('general').play_store || cfg('general').app_store" class="flex items-center gap-3 pt-2">
              <a v-if="cfg('general').play_store" :href="cfg('general').play_store" target="_blank" class="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition">Google Play</a>
              <a v-if="cfg('general').app_store" :href="cfg('general').app_store" target="_blank" class="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition">App Store</a>
            </div>
          </div>
          <div class="hidden lg:flex justify-center">
            <div v-if="cfg('hero').image_url" class="relative animate-float">
              <img :src="cfg('hero').image_url" alt="Keluarga menggunakan Kinora" class="w-full max-w-md rounded-3xl shadow-2xl" />
            </div>
            <div v-else class="w-80 h-96 bg-amber-100 rounded-3xl flex items-center justify-center animate-float">
              <Users :size="80" class="text-amber-300" />
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

      <!-- PROBLEMS -->
      <section class="py-16 sm:py-20 px-4 sm:px-6">
        <div class="max-w-5xl mx-auto text-center">
          <h2 data-animate class="text-2xl sm:text-3xl font-bold text-gray-900">Keluarga sering menghadapi hal-hal ini</h2>
          <div class="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div data-animate data-delay="0" class="p-5 bg-red-50 rounded-2xl text-left flex items-start gap-3 card-hover"><MapPin :size="18" class="text-red-400 mt-0.5 flex-shrink-0" /><p class="text-sm text-gray-700">Sulit mengetahui kondisi anggota keluarga saat tidak bersama.</p></div>
            <div data-animate data-delay="100" class="p-5 bg-orange-50 rounded-2xl text-left flex items-start gap-3 card-hover"><Calendar :size="18" class="text-orange-400 mt-0.5 flex-shrink-0" /><p class="text-sm text-gray-700">Jadwal dan tugas keluarga tercecer di banyak tempat.</p></div>
            <div data-animate data-delay="200" class="p-5 bg-yellow-50 rounded-2xl text-left flex items-start gap-3 card-hover"><Smartphone :size="18" class="text-yellow-500 mt-0.5 flex-shrink-0" /><p class="text-sm text-gray-700">Anak terlalu lama menggunakan perangkat tanpa kontrol.</p></div>
            <div data-animate data-delay="300" class="p-5 bg-blue-50 rounded-2xl text-left flex items-start gap-3 card-hover"><Wallet :size="18" class="text-blue-400 mt-0.5 flex-shrink-0" /><p class="text-sm text-gray-700">Pengeluaran keluarga sulit dipantau bersama.</p></div>
            <div data-animate data-delay="400" class="p-5 bg-purple-50 rounded-2xl text-left flex items-start gap-3 card-hover"><Camera :size="18" class="text-purple-400 mt-0.5 flex-shrink-0" /><p class="text-sm text-gray-700">Momen penting keluarga tidak tersimpan rapi.</p></div>
            <div data-animate data-delay="500" class="p-5 bg-green-50 rounded-2xl text-left flex items-start gap-3 card-hover"><Pill :size="18" class="text-green-400 mt-0.5 flex-shrink-0" /><p class="text-sm text-gray-700">Pengingat kesehatan dan vaksinasi sering terlewat.</p></div>
          </div>
          <p class="mt-8 text-base text-gray-600 max-w-2xl mx-auto">Kinora menyatukan kebutuhan keluarga dalam satu tempat yang mudah digunakan.</p>
        </div>
      </section>

      <!-- FEATURES -->
      <section id="features" class="py-16 sm:py-20 px-4 sm:px-6 bg-amber-50/50">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Semua yang keluarga butuhkan</h2>
            <p class="mt-3 text-gray-600 max-w-2xl mx-auto">Fitur lengkap yang dirancang khusus untuk keluarga Indonesia.</p>
          </div>
          <!-- Feature groups -->
          <div class="space-y-12">
            <div v-for="group in featureGroups" :key="group.title" class="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h3 class="font-bold text-gray-900 text-lg mb-1">{{ group.title }}</h3>
              <p class="text-sm text-gray-500 mb-5">{{ group.desc }}</p>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div v-for="f in group.items" :key="f" class="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                  <component :is="iconComponents[group.icon] || Star" :size="14" class="text-amber-600 flex-shrink-0" /> {{ f }}
                </div>
              </div>
            </div>
          </div>
          <!-- Dynamic features from admin -->
          <div v-if="activeFeatures.length" class="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="f in activeFeatures" :key="f.title" class="bg-white rounded-xl p-5 border border-gray-100 hover:border-amber-200 transition">
              <div class="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center mb-3"><component :is="featureIcon(f.icon)" :size="18" class="text-amber-700" /></div>
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
      <section v-if="activeTestimonials.length" class="py-16 sm:py-20 px-4 sm:px-6 bg-amber-50/50">
        <div class="max-w-5xl mx-auto">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Apa kata mereka</h2>
          <div class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div v-for="t in activeTestimonials" :key="t.name" class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div class="flex gap-0.5 mb-3"><Star v-for="i in (t.rating || 5)" :key="i" :size="14" class="text-amber-400 fill-amber-400" /></div>
              <p class="text-sm text-gray-700 leading-relaxed italic">"{{ t.text }}"</p>
              <div class="mt-4 flex items-center gap-3">
                <div class="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-700">{{ t.name?.charAt(0) }}</div>
                <div><p class="text-sm font-semibold text-gray-900">{{ t.name }}</p><p class="text-xs text-gray-500">{{ t.role }}</p></div>
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
      <section class="py-16 sm:py-20 px-4 sm:px-6">
        <div class="max-w-3xl mx-auto text-center bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-10 sm:p-14 border border-amber-100" data-animate="scale">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Mulai bangun keluarga yang lebih aman, teratur, dan dekat</h2>
          <p class="mt-4 text-gray-600">Gratis untuk memulai. Upgrade kapan saja.</p>
          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <a :href="cfg('general').web_app || '/register'" class="px-8 py-3 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition font-semibold shadow-md btn-press">Mulai Gratis</a>
            <a v-if="cfg('general').play_store" :href="cfg('general').play_store" target="_blank" class="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition font-medium text-sm btn-press">Download App</a>
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
