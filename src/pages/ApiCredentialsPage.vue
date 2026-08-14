<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">API Credentials & Integrations</h1>
        <p class="text-sm text-gray-500">Kelola API key, secret, dan konfigurasi provider.</p>
      </div>
    </div>

    <!-- Category tabs -->
    <div class="flex gap-1 border-b border-gray-200 overflow-x-auto">
      <button v-for="cat in categories" :key="cat.id" @click="activeCat = cat.id"
        :class="activeCat === cat.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
        class="px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap">
        {{ cat.label }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-500">Memuat konfigurasi...</div>
    <div v-else-if="loadError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{{ loadError }}</div>

    <div v-else class="space-y-4">
      <!-- Map Provider Switcher (only in Maps category) -->
      <div v-if="activeCat === 'maps'" class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <h3 class="font-medium text-gray-900 text-sm">Map Provider</h3>
          <p class="text-xs text-gray-500 mt-0.5">Penyedia peta aktif untuk aplikasi. Perubahan akan berlaku setelah Mobile refresh config.</p>
        </div>
        <div class="flex gap-2">
          <button
            @click="setMapProvider('google_maps')"
            class="flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium text-center transition"
            :class="mapProvider === 'google_maps' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'"
          >
            <span class="block">Google Maps</span>
            <span v-if="mapProvider === 'google_maps'" class="text-[10px] font-normal text-blue-500 mt-0.5 block">● Aktif</span>
          </button>
          <button
            @click="setMapProvider('openstreetmap')"
            class="flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium text-center transition"
            :class="mapProvider === 'openstreetmap' ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-200' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'"
          >
            <span class="block">OpenStreetMap</span>
            <span v-if="mapProvider === 'openstreetmap'" class="text-[10px] font-normal text-green-500 mt-0.5 block">● Aktif</span>
          </button>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-green-500"></span>
          <span class="text-xs text-gray-600">Status: <strong>{{ mapProvider === 'google_maps' ? 'Google Maps' : 'OpenStreetMap' }}</strong> aktif</span>
        </div>
        <div v-if="mapProvider === 'google_maps' && !hasGoogleMapsKey" class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p class="text-xs text-amber-700">Google Maps belum dikonfigurasi. Tambahkan API Key di bawah terlebih dahulu.</p>
        </div>
        <div v-if="mapProvider === 'openstreetmap' && hasGoogleMapsKey" class="text-xs text-gray-400">
          Google Maps API Key: Tersimpan • Tidak aktif
        </div>
        <p v-if="mapProviderSaved" class="text-xs text-green-600">✓ Provider tersimpan</p>
      </div>

      <!-- Secrets for active category -->
      <div v-for="secret in filteredSecrets" :key="secret.secret_key" class="bg-white border border-gray-200 rounded-xl p-5">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-medium text-gray-900 text-sm">{{ secret.label }}</h3>
            <p class="text-xs text-gray-500">{{ secret.description }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span :class="secret.scope === 'server' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'" class="px-2 py-0.5 text-xs rounded-full">
              {{ secret.scope === 'server' ? '🔒 Server' : '🌐 Client' }}
            </span>
            <span v-if="secret.value_hint" class="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">Configured</span>
            <span v-else class="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">Not Set</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Key display (masked) -->
          <div>
            <label class="block text-xs text-gray-500 mb-1">Current Value</label>
            <div class="flex items-center gap-2">
              <span class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-400 flex-1">
                {{ secret.value_hint || '(tidak tersimpan)' }}
              </span>
            </div>
          </div>

          <!-- New value input -->
          <div>
            <label class="block text-xs text-gray-500 mb-1">Update Value</label>
            <div class="flex items-center gap-2">
              <input
                v-model="editValues[secret.secret_key]"
                :type="showValues[secret.secret_key] ? 'text' : 'password'"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan value baru..."
              />
              <button @click="showValues[secret.secret_key] = !showValues[secret.secret_key]" class="px-2 py-2 text-gray-400 hover:text-gray-700 text-sm">
                {{ showValues[secret.secret_key] ? '🙈' : '👁️' }}
              </button>
              <button
                @click="saveSecret(secret.secret_key)"
                :disabled="!editValues[secret.secret_key] || savingKey === secret.secret_key"
                class="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {{ savingKey === secret.secret_key ? '...' : 'Save' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Success/Error per key -->
        <p v-if="saveSuccess === secret.secret_key" class="text-xs text-green-600 mt-2">✓ Tersimpan</p>
        <p v-if="saveError && saveErrorKey === secret.secret_key" class="text-xs text-red-600 mt-2">{{ saveError }}</p>
      </div>

      <!-- Empty state -->
      <div v-if="filteredSecrets.length === 0" class="bg-white rounded-xl border p-8 text-center text-gray-400">
        Tidak ada konfigurasi untuk kategori ini.
      </div>
    </div>

    <!-- Info panel -->
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-2">
      <p class="font-medium">Catatan Keamanan:</p>
      <ul class="list-disc list-inside text-xs space-y-1 text-blue-700">
        <li>Secret lama tidak dapat dilihat kembali setelah disimpan — hanya hint terakhir yang ditampilkan.</li>
        <li>Secret bertipe <strong>Server</strong> tidak pernah dikirim ke aplikasi mobile.</li>
        <li>Perubahan secret diproses melalui Edge Function <code>manage-app-secrets</code>.</li>
        <li>Aplikasi hanya mengambil config publik melalui <code>get-client-config</code>.</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const secrets = ref([])
const loading = ref(true)
const loadError = ref('')
const activeCat = ref('payment')
const editValues = ref({})
const showValues = ref({})
const savingKey = ref(null)
const saveSuccess = ref(null)
const saveError = ref('')
const saveErrorKey = ref(null)
const mapProvider = ref('google_maps')
const mapProviderSaved = ref(false)
const hasGoogleMapsKey = computed(() => {
  const mapsSecret = secrets.value.find(s => s.secret_key === 'GOOGLE_MAPS_API_KEY' || s.secret_key === 'google_maps_api_key')
  return !!mapsSecret?.value_hint
})

const categories = [
  { id: 'maps', label: 'Maps' },
  { id: 'payment', label: 'Payment' },
  { id: 'ppob', label: 'PPOB' },
  { id: 'email', label: 'Email' },
  { id: 'firebase', label: 'Firebase' },
  { id: 'ai', label: 'AI' },
  { id: 'media', label: 'Media' },
]

const filteredSecrets = computed(() => secrets.value.filter(s => s.category === activeCat.value))

async function loadSecrets() {
  loading.value = true
  loadError.value = ''
  const { data, error } = await supabase
    .from('kinora_app_secrets')
    .select('secret_key, category, label, description, scope, value_hint, sort_order')
    .order('sort_order')
  if (error) {
    loadError.value = error.message
  } else {
    secrets.value = data || []
  }
  loading.value = false
}

async function saveSecret(key) {
  const value = editValues.value[key]
  if (!value) return

  savingKey.value = key
  saveSuccess.value = null
  saveError.value = ''
  saveErrorKey.value = null

  const { error } = await supabase.rpc('founder_update_app_secret', { p_key: key, p_value: value })

  if (error) {
    saveError.value = error.message
    saveErrorKey.value = key
  } else {
    saveSuccess.value = key
    editValues.value[key] = ''
    // Update hint locally
    const s = secrets.value.find(s => s.secret_key === key)
    if (s) s.value_hint = value.length > 4 ? '••••' + value.slice(-4) : '••••'
    setTimeout(() => { if (saveSuccess.value === key) saveSuccess.value = null }, 3000)
  }
  savingKey.value = null
}

async function setMapProvider(provider) {
  // Validate Google Maps has API key configured
  if (provider === 'google_maps' && !hasGoogleMapsKey.value) return

  mapProvider.value = provider
  mapProviderSaved.value = false

  // Load existing mobile_config to merge, not overwrite
  const { data: existing } = await supabase
    .from('kinora_landing_config')
    .select('value')
    .eq('key', 'mobile_config')
    .maybeSingle()

  const currentValue = existing?.value || {}
  const newValue = { ...currentValue, map_provider: provider }

  const { error } = await supabase
    .from('kinora_landing_config')
    .upsert({
      key: 'mobile_config',
      value: newValue,
      status: 'published',
    }, { onConflict: 'key' })

  if (!error) {
    mapProviderSaved.value = true
    setTimeout(() => { mapProviderSaved.value = false }, 3000)
  }
}

async function loadMapProvider() {
  const { data } = await supabase
    .from('kinora_landing_config')
    .select('value')
    .eq('key', 'mobile_config')
    .eq('status', 'published')
    .maybeSingle()
  if (data?.value?.map_provider) {
    mapProvider.value = data.value.map_provider
  }
}

onMounted(async () => {
  await loadSecrets()
  await loadMapProvider()
})
</script>
