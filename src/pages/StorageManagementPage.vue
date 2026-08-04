<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Storage Management</h1>
        <p class="text-sm text-gray-500">Monitor penggunaan Supabase Storage secara real-time.</p>
      </div>
      <button @click="loadData" class="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition">Refresh</button>
    </div>

    <!-- Overview Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-[11px] text-gray-400 uppercase">Total Digunakan</p>
        <p class="text-lg font-bold text-gray-900 mt-1">{{ formatBytes(totalUsed) }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-[11px] text-gray-400 uppercase">Total File</p>
        <p class="text-lg font-bold text-gray-900 mt-1">{{ totalFiles.toLocaleString() }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-[11px] text-gray-400 uppercase">Buckets</p>
        <p class="text-lg font-bold text-gray-900 mt-1">{{ buckets.length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-[11px] text-gray-400 uppercase">Families</p>
        <p class="text-lg font-bold text-gray-900 mt-1">{{ familyCount }}</p>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex items-center justify-between text-sm mb-2">
        <span class="text-gray-600">Penggunaan Storage Global</span>
        <span class="font-medium text-gray-900">{{ formatBytes(totalUsed) }}</span>
      </div>
      <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div class="h-full rounded-full transition-all" :class="usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-green-500'" :style="{ width: Math.min(usagePercent, 100) + '%' }"></div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200 overflow-x-auto">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="['px-4 py-2.5 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px', activeTab === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700']">
        {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat data storage...</div>

    <template v-else>
    <!-- Buckets Tab -->
    <div v-if="activeTab === 'buckets'" class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Bucket</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Files</th>
            <th class="text-center px-4 py-3 font-medium text-gray-600">Public</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="b in buckets" :key="b.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-900">{{ b.name }}</td>
            <td class="px-4 py-3 text-right text-gray-600">{{ b.fileCount || '—' }}</td>
            <td class="px-4 py-3 text-center">
              <span :class="b.public ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'" class="text-xs px-2 py-0.5 rounded-full font-medium">{{ b.public ? 'Public' : 'Private' }}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <button @click="browseBucket(b)" class="text-xs text-blue-600 hover:underline">Browse</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Families Tab -->
    <div v-if="activeTab === 'families'" class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Keluarga</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Storage</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Limit</th>
            <th class="text-center px-4 py-3 font-medium text-gray-600">%</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="f in topFamilies" :key="f.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-900">{{ f.name }}</td>
            <td class="px-4 py-3 text-right">{{ formatBytes(f.storage_used_bytes) }}</td>
            <td class="px-4 py-3"><span class="text-xs px-2 py-0.5 bg-gray-100 rounded">{{ f.subscription_plan }}</span></td>
            <td class="px-4 py-3 text-right text-gray-500">{{ f.limit === -1 ? '∞' : formatBytes(f.limit) }}</td>
            <td class="px-4 py-3 text-center">
              <span :class="f.pct > 90 ? 'text-red-600' : f.pct > 70 ? 'text-amber-600' : 'text-green-600'" class="text-xs font-medium">{{ f.pct }}%</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Browser Tab -->
    <div v-if="activeTab === 'browser'" class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div class="flex items-center gap-3">
        <button @click="selectedBucket = null; browserFiles = []" class="text-xs text-gray-500 hover:underline">← Buckets</button>
        <span class="font-medium text-gray-900">{{ selectedBucket?.name || 'Select bucket' }}</span>
        <input v-model="browserSearch" type="text" placeholder="Search files..." class="ml-auto px-3 py-1.5 border border-gray-200 rounded-lg text-xs w-48 outline-none" />
      </div>
      <div v-if="browserFiles.length === 0" class="text-center py-8 text-gray-400 text-sm">Tidak ada file.</div>
      <div v-else class="space-y-1 max-h-96 overflow-y-auto">
        <div v-for="file in filteredBrowserFiles" :key="file.name" class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xs text-gray-400">📄</span>
            <span class="text-sm text-gray-900 truncate">{{ file.name }}</span>
          </div>
          <div class="flex items-center gap-3 flex-shrink-0">
            <span class="text-xs text-gray-400">{{ formatBytes(file.metadata?.size || 0) }}</span>
            <button @click="deleteFile(file)" class="text-xs text-red-500 hover:underline">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Snapshots Tab -->
    <div v-if="activeTab === 'snapshots'" class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100"><h2 class="font-semibold text-gray-900 text-sm">Storage Snapshots (Recent)</h2></div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Keluarga</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Used</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Limit</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Photos</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Videos</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Docs</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="s in snapshots" :key="s.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-900">{{ s.family_name }}</td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ s.snapshot_date }}</td>
            <td class="px-4 py-3 text-right">{{ formatBytes(s.used_bytes) }}</td>
            <td class="px-4 py-3 text-right text-gray-500">{{ formatBytes(s.limit_bytes) }}</td>
            <td class="px-4 py-3 text-right">{{ s.photo_count }}</td>
            <td class="px-4 py-3 text-right">{{ s.video_count }}</td>
            <td class="px-4 py-3 text-right">{{ s.document_count }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const loading = ref(true)
const activeTab = ref('buckets')
const buckets = ref([])
const topFamilies = ref([])
const snapshots = ref([])
const totalUsed = ref(0)
const totalFiles = ref(0)
const familyCount = ref(0)
const selectedBucket = ref(null)
const browserFiles = ref([])
const browserSearch = ref('')

const tabs = [
  { id: 'buckets', label: 'Buckets' },
  { id: 'families', label: 'Top Families' },
  { id: 'browser', label: 'File Browser' },
  { id: 'snapshots', label: 'Snapshots' },
]

const usagePercent = computed(() => {
  // Assuming 100GB project limit for visual
  const limit = 107374182400
  return Math.round((totalUsed.value / limit) * 100)
})

const filteredBrowserFiles = computed(() => {
  if (!browserSearch.value) return browserFiles.value
  const q = browserSearch.value.toLowerCase()
  return browserFiles.value.filter(f => f.name.toLowerCase().includes(q))
})

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes === -1) return '∞'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

async function loadData() {
  loading.value = true

  // Get buckets from storage API
  try {
    const bucketList = [
      { id: 'articles', name: 'articles', public: true },
      { id: 'assets', name: 'assets', public: true },
      { id: 'avatars', name: 'avatars', public: true },
      { id: 'chat-media', name: 'chat-media', public: true },
      { id: 'dashboard-banners', name: 'dashboard-banners', public: true },
      { id: 'family-vault', name: 'family-vault', public: false },
      { id: 'journey-covers', name: 'journey-covers', public: true },
      { id: 'marketplace-payment-proofs', name: 'marketplace-payment-proofs', public: false },
      { id: 'marketplace-products', name: 'marketplace-products', public: true },
      { id: 'memories', name: 'memories', public: true },
      { id: 'print-designs', name: 'print-designs', public: false },
      { id: 'webinar-proofs', name: 'webinar-proofs', public: false },
    ]
    buckets.value = bucketList
  } catch (e) { /* continue */ }

  // Get family storage stats
  const { data: families } = await supabase
    .from('families')
    .select('id, name, storage_used_bytes, subscription_plan')
    .order('storage_used_bytes', { ascending: false })
    .limit(20)

  totalUsed.value = (families || []).reduce((sum, f) => sum + (f.storage_used_bytes || 0), 0)
  familyCount.value = (families || []).length

  topFamilies.value = (families || []).map(f => {
    const limit = f.subscription_plan === 'family_plus' ? 5368709120 : f.subscription_plan === 'founder' ? -1 : 1073741824
    const pct = limit <= 0 ? 0 : Math.round(((f.storage_used_bytes || 0) / limit) * 100)
    return { ...f, limit, pct }
  })

  // Get recent snapshots
  const { data: snaps } = await supabase
    .from('family_storage_snapshots')
    .select('id, family_id, snapshot_date, used_bytes, limit_bytes, photo_count, video_count, document_count')
    .order('snapshot_date', { ascending: false })
    .limit(20)

  // Get family names for snapshots
  if (snaps?.length) {
    const famIds = [...new Set(snaps.map(s => s.family_id))]
    const { data: famNames } = await supabase.from('families').select('id, name').in('id', famIds)
    const nameMap = Object.fromEntries((famNames || []).map(f => [f.id, f.name]))
    snapshots.value = snaps.map(s => ({ ...s, family_name: nameMap[s.family_id] || '—' }))
  }

  // Estimate total files from memories + documents + vault
  const { count: memCount } = await supabase.from('memories').select('id', { count: 'exact', head: true })
  const { count: docCount } = await supabase.from('vault_documents').select('id', { count: 'exact', head: true })
  const { count: mediaCount } = await supabase.from('memory_media_items').select('id', { count: 'exact', head: true })
  totalFiles.value = (memCount || 0) + (docCount || 0) + (mediaCount || 0)

  loading.value = false
}

async function browseBucket(bucket) {
  selectedBucket.value = bucket
  activeTab.value = 'browser'
  browserFiles.value = []
  browserSearch.value = ''

  const { data } = await supabase.storage.from(bucket.id).list('', { limit: 100 })
  browserFiles.value = data || []
}

async function deleteFile(file) {
  if (!selectedBucket.value) return
  if (!confirm(`Hapus file "${file.name}"?`)) return
  await supabase.storage.from(selectedBucket.value.id).remove([file.name])
  browserFiles.value = browserFiles.value.filter(f => f.name !== file.name)
}

onMounted(loadData)
</script>
