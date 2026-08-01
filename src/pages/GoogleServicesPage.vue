<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Google Services</h1>
        <p class="text-sm text-gray-500">Kelola Search Console, AdSense, Sitemap, dan robots.txt</p>
      </div>
      <button @click="saveAll" :disabled="saving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
        {{ saving ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200 overflow-x-auto">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="['px-4 py-2.5 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px',
          activeTab === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700']">
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat konfigurasi...</div>

    <!-- Error -->
    <div v-else-if="loadError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ loadError }}</div>

    <div v-else>
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="item in overviewItems" :key="item.label" class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-gray-700">{{ item.label }}</p>
            <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', statusClass(item.status)]">{{ item.status }}</span>
          </div>
          <p class="text-xs text-gray-400">{{ item.detail }}</p>
        </div>
      </div>

      <!-- Search Console Tab -->
      <div v-if="activeTab === 'search_console'" class="space-y-4">
        <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 class="font-semibold text-gray-900 text-sm">Verification Meta Tag</h3>
          <p class="text-xs text-gray-500">Masukkan kode verifikasi dari Google Search Console. Hanya nilai pada atribut <code>content</code>.</p>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Verification Code</label>
            <input v-model="config.search_console.verification_code" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" placeholder="xxxxxxxxxxxxxx" @input="normalizeVerification" />
            <p class="text-xs text-gray-400 mt-1">Atau paste tag lengkap, akan diekstrak otomatis.</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Property Type</label>
              <select v-model="config.search_console.property_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="url_prefix">URL Prefix (meta tag)</option>
                <option value="domain">Domain (DNS)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Status</label>
              <select v-model="config.search_console.status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="not_configured">Belum dikonfigurasi</option>
                <option value="configured">Sudah dikonfigurasi</option>
                <option value="pending">Menunggu verifikasi</option>
                <option value="verified">Terverifikasi</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
          </div>
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            Status diperbarui secara manual. Verifikasi sesungguhnya harus dilakukan melalui Google Search Console.
          </div>
          <!-- Preview -->
          <div v-if="config.search_console.verification_code" class="p-3 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 mb-1">Preview meta tag:</p>
            <code class="text-xs text-gray-700 break-all">&lt;meta name="google-site-verification" content="{{ config.search_console.verification_code }}" /&gt;</code>
          </div>
        </div>
      </div>

      <!-- Sitemap & Robots Tab -->
      <div v-if="activeTab === 'sitemap'" class="space-y-4">
        <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 class="font-semibold text-gray-900 text-sm">Sitemap</h3>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="config.sitemap.enabled" class="rounded" /> Aktifkan sitemap</label>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="config.sitemap.include_articles" class="rounded" /> Include articles</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="config.sitemap.include_help" class="rounded" /> Include help articles</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="config.sitemap.include_webinars" class="rounded" /> Include webinars</label>
          </div>
          <p class="text-xs text-gray-400">URL: {{ domain }}/sitemap.xml</p>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 class="font-semibold text-gray-900 text-sm">Robots.txt</h3>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="config.robots.enabled" class="rounded" /> Aktifkan robots.txt</label>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Disallow paths (satu per baris)</label>
            <textarea v-model="robotsDisallowText" rows="6" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" placeholder="/admin/&#10;/dashboard/"></textarea>
          </div>
          <div class="p-3 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 mb-1">Preview robots.txt:</p>
            <pre class="text-xs text-gray-700 whitespace-pre-wrap">{{ robotsPreview }}</pre>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h3 class="font-semibold text-gray-900 text-sm">Domain</h3>
          <input v-model="config.domain" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="https://kinora.app" />
          <p class="text-xs text-gray-400">Domain production untuk sitemap dan robots.txt.</p>
        </div>
      </div>

      <!-- AdSense Tab -->
      <div v-if="activeTab === 'adsense'" class="space-y-4">
        <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 class="font-semibold text-gray-900 text-sm">Google AdSense</h3>
          <div class="grid grid-cols-2 gap-4">
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="config.adsense.enabled" class="rounded" /> AdSense Aktif</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="config.adsense.script_enabled" class="rounded" /> Load Script</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="config.adsense.auto_ads" class="rounded" /> Auto Ads</label>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Publisher ID</label>
            <input v-model="config.adsense.publisher_id" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" placeholder="ca-pub-1234567890123456" />
            <p v-if="config.adsense.publisher_id && !isValidPublisherId" class="text-xs text-red-500 mt-1">Format tidak valid. Gunakan ca-pub-XXXXXXXXXXXXXXXX</p>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Status</label>
            <select v-model="config.adsense.status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="not_configured">Belum dikonfigurasi</option>
              <option value="configured">Sudah dikonfigurasi</option>
              <option value="pending_review">Menunggu review Google</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            Status persetujuan diperbarui manual. Situs harus ditinjau melalui akun Google AdSense.
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 class="font-semibold text-gray-900 text-sm">ads.txt</h3>
          <p class="text-xs text-gray-500">Konten file ads.txt yang dapat diakses di {{ domain }}/ads.txt</p>
          <textarea v-model="config.adsense.ads_txt" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" placeholder="google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0"></textarea>
          <p class="text-xs text-gray-400">Format: domain, publisher-id, relationship, certification-authority-id</p>
        </div>
      </div>

      <!-- Ads Placement Tab -->
      <div v-if="activeTab === 'placement'" class="space-y-4">
        <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 class="font-semibold text-gray-900 text-sm">Halaman yang Menampilkan Iklan</h3>
          <p class="text-xs text-gray-500">Pilih halaman publik yang boleh menampilkan iklan.</p>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <label v-for="page in availablePages" :key="page.id" class="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg hover:bg-gray-50">
              <input type="checkbox" :value="page.id" v-model="config.adsense.allowed_pages" class="rounded" />
              {{ page.label }}
            </label>
          </div>
        </div>
        <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 class="font-semibold text-gray-900 text-sm">Halaman yang Dilarang Menampilkan Iklan</h3>
          <p class="text-xs text-gray-500">Halaman ini tidak akan menampilkan iklan dalam kondisi apapun.</p>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <label v-for="page in blockedPagesList" :key="page.id" class="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg hover:bg-gray-50">
              <input type="checkbox" :value="page.id" v-model="config.adsense.blocked_pages" class="rounded" />
              {{ page.label }}
            </label>
          </div>
        </div>
      </div>

      <!-- Validation Tab -->
      <div v-if="activeTab === 'validation'" class="space-y-4">
        <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 class="font-semibold text-gray-900 text-sm">Pemeriksaan Konfigurasi</h3>
          <button @click="runValidation" :disabled="validating" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
            {{ validating ? 'Memeriksa...' : 'Jalankan Validasi' }}
          </button>
          <div v-if="validationResults.length" class="space-y-2 mt-4">
            <div v-for="(result, i) in validationResults" :key="i" class="flex items-start gap-2 text-sm p-2 rounded-lg" :class="result.ok ? 'bg-green-50' : 'bg-red-50'">
              <span>{{ result.ok ? '✓' : '✗' }}</span>
              <div>
                <p :class="result.ok ? 'text-green-800' : 'text-red-800'" class="font-medium">{{ result.label }}</p>
                <p v-if="result.detail" class="text-xs" :class="result.ok ? 'text-green-600' : 'text-red-600'">{{ result.detail }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h3 class="font-semibold text-gray-900 text-sm">Edge Function URLs</h3>
          <p class="text-xs text-gray-500">File publik disajikan melalui Edge Functions. Konfigurasikan reverse proxy untuk menyajikan di root domain.</p>
          <div class="space-y-2 text-xs font-mono">
            <div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span class="text-gray-500">/sitemap.xml →</span>
              <a :href="supabaseUrl + '/functions/v1/sitemap'" target="_blank" class="text-blue-600 hover:underline truncate">{{ supabaseUrl }}/functions/v1/sitemap</a>
            </div>
            <div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span class="text-gray-500">/robots.txt →</span>
              <a :href="supabaseUrl + '/functions/v1/robots-txt'" target="_blank" class="text-blue-600 hover:underline truncate">{{ supabaseUrl }}/functions/v1/robots-txt</a>
            </div>
            <div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span class="text-gray-500">/ads.txt →</span>
              <a :href="supabaseUrl + '/functions/v1/ads-txt'" target="_blank" class="text-blue-600 hover:underline truncate">{{ supabaseUrl }}/functions/v1/ads-txt</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save feedback -->
    <div v-if="saveSuccess" class="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg">Tersimpan ✓</div>
    <div v-if="saveError" class="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg">{{ saveError }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'search_console', label: 'Search Console' },
  { id: 'sitemap', label: 'Sitemap & Robots' },
  { id: 'adsense', label: 'AdSense' },
  { id: 'placement', label: 'Ads Placement' },
  { id: 'validation', label: 'Validation' },
]

const activeTab = ref('overview')
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')
const validating = ref(false)
const validationResults = ref([])
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''

const config = ref({
  search_console: { verification_code: '', property_type: 'url_prefix', status: 'not_configured' },
  adsense: { enabled: false, publisher_id: '', auto_ads: false, script_enabled: false, ads_txt: '', status: 'not_configured', allowed_pages: [], blocked_pages: [] },
  analytics: { enabled: false, measurement_id: '' },
  tag_manager: { enabled: false, container_id: '' },
  sitemap: { enabled: true, include_articles: true, include_help: true, include_webinars: false },
  robots: { enabled: true, disallow: [] },
  domain: ''
})

const availablePages = [
  { id: 'home', label: 'Homepage' },
  { id: 'articles', label: 'Article List' },
  { id: 'article_detail', label: 'Article Detail' },
  { id: 'help', label: 'Help Center' },
  { id: 'help_article', label: 'Help Article' },
  { id: 'webinar', label: 'Webinar Public' },
  { id: 'pricing', label: 'Pricing' },
]

const blockedPagesList = [
  { id: 'login', label: 'Login' },
  { id: 'register', label: 'Register' },
  { id: 'terms', label: 'Terms' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'admin', label: 'Admin' },
  { id: 'consultant', label: 'Consultant' },
  { id: 'portal', label: 'User Portal' },
]

const domain = computed(() => config.value.domain || 'https://kinora.app')

const robotsDisallowText = computed({
  get: () => (config.value.robots.disallow || []).join('\n'),
  set: (val) => { config.value.robots.disallow = val.split('\n').map(s => s.trim()).filter(Boolean) }
})

const robotsPreview = computed(() => {
  const lines = ['User-agent: *', 'Allow: /']
  for (const path of (config.value.robots.disallow || [])) {
    lines.push(`Disallow: ${path}`)
  }
  lines.push('', `Sitemap: ${domain.value}/sitemap.xml`)
  return lines.join('\n')
})

const isValidPublisherId = computed(() => {
  const id = config.value.adsense.publisher_id
  if (!id) return true
  return /^ca-pub-\d{10,20}$/.test(id)
})

const overviewItems = computed(() => {
  const sc = config.value.search_console
  const ad = config.value.adsense
  return [
    { label: 'Domain', detail: config.value.domain || 'Belum diatur', status: config.value.domain ? 'Configured' : 'Belum dikonfigurasi' },
    { label: 'Search Console', detail: sc.verification_code ? 'Code: ' + sc.verification_code.slice(0, 12) + '...' : 'Belum ada code', status: sc.status === 'verified' ? 'Valid' : sc.verification_code ? 'Configured' : 'Belum dikonfigurasi' },
    { label: 'Sitemap', detail: `${domain.value}/sitemap.xml`, status: config.value.sitemap.enabled ? 'Active' : 'Disabled' },
    { label: 'Robots.txt', detail: `${config.value.robots.disallow?.length || 0} blocked paths`, status: config.value.robots.enabled ? 'Active' : 'Disabled' },
    { label: 'AdSense', detail: ad.publisher_id || 'Belum diatur', status: ad.enabled ? 'Active' : ad.publisher_id ? 'Configured' : 'Belum dikonfigurasi' },
    { label: 'ads.txt', detail: ad.ads_txt ? 'Tersedia' : 'Kosong', status: ad.ads_txt ? 'Valid' : 'Belum dikonfigurasi' },
  ]
})

function statusClass(status) {
  if (['Active', 'Valid', 'Configured'].includes(status)) return 'bg-green-100 text-green-700'
  if (status === 'Disabled') return 'bg-gray-100 text-gray-500'
  return 'bg-amber-100 text-amber-700'
}

function normalizeVerification() {
  const val = config.value.search_console.verification_code
  // Extract content from full meta tag if pasted
  const match = val.match(/content="([^"]+)"/)
  if (match) {
    config.value.search_console.verification_code = match[1]
  }
}

async function fetchConfig() {
  loading.value = true
  loadError.value = ''
  try {
    const { data, error } = await supabase
      .from('kinora_landing_config')
      .select('value')
      .eq('key', 'google_services')
      .maybeSingle()
    if (error) throw error
    if (data?.value) {
      // Deep merge with defaults
      config.value = { ...config.value, ...data.value }
      if (data.value.search_console) config.value.search_console = { ...config.value.search_console, ...data.value.search_console }
      if (data.value.adsense) config.value.adsense = { ...config.value.adsense, ...data.value.adsense }
      if (data.value.sitemap) config.value.sitemap = { ...config.value.sitemap, ...data.value.sitemap }
      if (data.value.robots) config.value.robots = { ...config.value.robots, ...data.value.robots }
      if (data.value.analytics) config.value.analytics = { ...config.value.analytics, ...data.value.analytics }
      if (data.value.tag_manager) config.value.tag_manager = { ...config.value.tag_manager, ...data.value.tag_manager }
    }
  } catch (e) {
    loadError.value = 'Gagal memuat konfigurasi.'
  } finally {
    loading.value = false
  }
}

async function saveAll() {
  // Validate publisher ID
  if (config.value.adsense.publisher_id && !isValidPublisherId.value) {
    saveError.value = 'Publisher ID tidak valid.'
    setTimeout(() => saveError.value = '', 3000)
    return
  }

  saving.value = true
  saveSuccess.value = false
  saveError.value = ''
  try {
    const { error } = await supabase
      .from('kinora_landing_config')
      .update({ value: config.value, updated_at: new Date().toISOString() })
      .eq('key', 'google_services')
    if (error) throw error

    // Also update app_secrets for client-accessible values
    const secretUpdates = [
      { secret_key: 'GOOGLE_SEARCH_CONSOLE_VERIFICATION', value_encrypted: config.value.search_console.verification_code || '' },
      { secret_key: 'GOOGLE_ADSENSE_PUBLISHER_ID', value_encrypted: config.value.adsense.publisher_id || '' },
      { secret_key: 'GOOGLE_ADSENSE_ENABLED', value_encrypted: String(config.value.adsense.enabled) },
      { secret_key: 'GOOGLE_ADSENSE_AUTO_ADS', value_encrypted: String(config.value.adsense.auto_ads) },
      { secret_key: 'GOOGLE_ADS_TXT_CONTENT', value_encrypted: config.value.adsense.ads_txt || '' },
    ]
    for (const s of secretUpdates) {
      await supabase.from('kinora_app_secrets').update({ value_encrypted: s.value_encrypted, updated_at: new Date().toISOString() }).eq('secret_key', s.secret_key)
    }

    saveSuccess.value = true
    setTimeout(() => saveSuccess.value = false, 2000)
  } catch (e) {
    saveError.value = 'Gagal menyimpan. Periksa permission.'
    setTimeout(() => saveError.value = '', 3000)
  } finally {
    saving.value = false
  }
}

function runValidation() {
  validating.value = true
  const results = []
  const sc = config.value.search_console
  const ad = config.value.adsense

  // Search Console
  results.push({
    label: 'Search Console Verification Code',
    ok: !!sc.verification_code,
    detail: sc.verification_code ? 'Code tersedia' : 'Belum diisi'
  })

  // Sitemap
  results.push({
    label: 'Sitemap enabled',
    ok: config.value.sitemap.enabled,
    detail: config.value.sitemap.enabled ? 'Aktif' : 'Nonaktif'
  })

  // Robots
  results.push({
    label: 'Robots.txt enabled',
    ok: config.value.robots.enabled,
    detail: config.value.robots.enabled ? `${config.value.robots.disallow.length} path diblokir` : 'Nonaktif'
  })

  // Domain
  results.push({
    label: 'Domain production',
    ok: !!config.value.domain && config.value.domain.startsWith('https://'),
    detail: config.value.domain || 'Belum diatur'
  })

  // AdSense Publisher ID
  results.push({
    label: 'AdSense Publisher ID',
    ok: !ad.publisher_id || isValidPublisherId.value,
    detail: ad.publisher_id ? (isValidPublisherId.value ? 'Format valid' : 'Format tidak valid') : 'Belum diisi'
  })

  // AdSense Script
  if (ad.enabled) {
    results.push({
      label: 'AdSense Script',
      ok: ad.script_enabled && !!ad.publisher_id,
      detail: ad.script_enabled ? 'Script akan dimuat' : 'Script tidak aktif'
    })
  }

  // ads.txt
  results.push({
    label: 'ads.txt',
    ok: !ad.enabled || !!ad.ads_txt,
    detail: ad.ads_txt ? 'Tersedia' : (ad.enabled ? 'AdSense aktif tapi ads.txt kosong' : 'Tidak diperlukan')
  })

  // Blocked pages
  results.push({
    label: 'Halaman sensitif diblokir dari iklan',
    ok: (ad.blocked_pages || []).includes('terms') && (ad.blocked_pages || []).includes('privacy'),
    detail: 'Terms dan Privacy harus bebas iklan'
  })

  validationResults.value = results
  validating.value = false
}

onMounted(fetchConfig)
</script>
