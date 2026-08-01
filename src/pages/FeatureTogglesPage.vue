<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      <button v-for="card in summaryCards" :key="card.key" @click="activeFilter = activeFilter === card.key ? 'all' : card.key"
        :class="['bg-white rounded-xl border p-3 text-left transition hover:shadow-sm', activeFilter === card.key ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200']">
        <p class="text-2xl font-bold text-gray-900">{{ card.count }}</p>
        <p class="text-xs text-gray-500 mt-0.5">{{ card.label }}</p>
      </button>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div class="flex flex-wrap gap-2 items-center">
        <input v-model="search" type="text" placeholder="Cari fitur, key, modul..." class="px-3 py-2 border border-gray-300 rounded-lg text-sm w-56 outline-none focus:ring-2 focus:ring-blue-300" />
        <select v-model="categoryFilter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">Semua Modul</option>
          <option v-for="cat in allCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button @click="fetchToggles" class="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition">Refresh</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="n in 6" :key="n" class="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div class="flex-1"><div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div><div class="h-3 bg-gray-100 rounded w-1/2"></div></div>
          <div class="w-12 h-6 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <p class="text-gray-900 font-semibold text-sm mb-1">Gagal memuat Feature Toggle</p>
      <p class="text-gray-500 text-xs mb-4">Terjadi kesalahan saat mengambil data.</p>
      <button @click="fetchToggles" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Coba Lagi</button>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredToggles.length === 0 && !search && !categoryFilter" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <p class="text-gray-900 font-semibold text-sm mb-1">Feature Toggle belum tersedia</p>
      <p class="text-gray-500 text-xs">Sinkronkan fitur Kinora yang sudah ada agar dapat dikontrol dari Web Admin.</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Feature</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Module</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Platform</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Plan</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Rollout</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Maintenance</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Enabled</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="ft in filteredToggles" :key="ft.id" class="hover:bg-gray-50 transition">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span v-if="ft.is_critical" class="text-red-500 text-xs font-bold" title="Critical">⚠️</span>
                  <div>
                    <p class="font-medium text-gray-900">{{ ft.feature_name }}</p>
                    <p class="text-xs text-gray-400 font-mono">{{ ft.feature_key }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <span class="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{{ ft.category || 'general' }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <span v-for="p in (ft.platform || ['web','android','ios'])" :key="p" class="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{{ p }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span v-for="plan in (ft.enabled_plans || [])" :key="plan" class="text-xs px-1.5 py-0.5 rounded"
                    :class="plan === 'free' ? 'bg-green-50 text-green-700' : plan === 'founder' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'">
                    {{ plan }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs font-medium" :class="ft.rollout_percentage === 100 ? 'text-green-600' : ft.rollout_percentage === 0 ? 'text-red-500' : 'text-amber-600'">
                  {{ ft.rollout_percentage ?? 100 }}%
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span v-if="ft.is_maintenance" class="inline-block w-2.5 h-2.5 bg-orange-400 rounded-full" title="Maintenance"></span>
                <span v-else class="inline-block w-2.5 h-2.5 bg-gray-200 rounded-full"></span>
              </td>
              <td class="px-4 py-3 text-center">
                <button @click="quickToggle(ft)" :disabled="ft.is_critical && !confirmCritical"
                  :class="['relative w-10 h-5 rounded-full transition-colors', ft.is_enabled ? 'bg-green-500' : 'bg-gray-300']">
                  <span :class="['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', ft.is_enabled ? 'translate-x-5' : 'translate-x-0.5']"></span>
                </button>
              </td>
              <td class="px-4 py-3 text-right">
                <button @click="openDetail(ft)" class="text-blue-600 hover:text-blue-800 text-xs font-medium">Detail</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Drawer -->
    <div v-if="selectedToggle" class="fixed inset-0 z-50 flex justify-end">
      <div @click="selectedToggle = null" class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div class="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl animate-slide-in">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 class="font-bold text-gray-900">{{ selectedToggle.feature_name }}</h3>
            <p class="text-xs text-gray-400 font-mono">{{ selectedToggle.feature_key }}</p>
          </div>
          <button @click="selectedToggle = null" class="p-2 hover:bg-gray-100 rounded-lg text-gray-500">✕</button>
        </div>

        <div class="p-6 space-y-6">
          <!-- Info -->
          <section>
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Informasi Fitur</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><span class="text-gray-500">Module:</span> <span class="font-medium">{{ selectedToggle.category }}</span></div>
              <div><span class="text-gray-500">Beta:</span> <span class="font-medium">{{ selectedToggle.is_beta ? 'Ya' : 'Tidak' }}</span></div>
              <div><span class="text-gray-500">Critical:</span> <span :class="selectedToggle.is_critical ? 'text-red-600 font-bold' : ''">{{ selectedToggle.is_critical ? 'Ya ⚠️' : 'Tidak' }}</span></div>
              <div><span class="text-gray-500">Rollout:</span> <span class="font-medium">{{ editForm.rollout_percentage }}%</span></div>
            </div>
            <div v-if="selectedToggle.description" class="mt-3 text-sm text-gray-600">{{ selectedToggle.description }}</div>
          </section>

          <!-- Status -->
          <section>
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Status & Kontrol</h4>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm">Enabled</span>
                <button @click="editForm.is_enabled = !editForm.is_enabled"
                  :class="['relative w-12 h-6 rounded-full transition-colors', editForm.is_enabled ? 'bg-green-500' : 'bg-gray-300']">
                  <span :class="['absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', editForm.is_enabled ? 'translate-x-6' : 'translate-x-0.5']"></span>
                </button>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">Maintenance</span>
                <button @click="editForm.is_maintenance = !editForm.is_maintenance"
                  :class="['relative w-12 h-6 rounded-full transition-colors', editForm.is_maintenance ? 'bg-orange-500' : 'bg-gray-300']">
                  <span :class="['absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', editForm.is_maintenance ? 'translate-x-6' : 'translate-x-0.5']"></span>
                </button>
              </div>
              <div v-if="editForm.is_maintenance">
                <label class="text-xs text-gray-500">Pesan Maintenance</label>
                <input v-model="editForm.maintenance_message" type="text" class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Fitur sedang dalam pemeliharaan..." />
              </div>
            </div>
          </section>

          <!-- Rollout -->
          <section>
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Rollout</h4>
            <div class="flex items-center gap-3">
              <input v-model.number="editForm.rollout_percentage" type="range" min="0" max="100" step="5" class="flex-1" />
              <span class="text-sm font-medium w-10 text-right">{{ editForm.rollout_percentage }}%</span>
            </div>
            <p class="text-xs text-gray-400 mt-1">Persentase user yang menerima fitur ini.</p>
          </section>

          <!-- Platform -->
          <section>
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Platform</h4>
            <div class="flex gap-2">
              <label v-for="p in ['web', 'android', 'ios']" :key="p" class="flex items-center gap-1.5 text-sm">
                <input type="checkbox" :value="p" v-model="editForm.platform" class="rounded" />
                {{ p }}
              </label>
            </div>
          </section>

          <!-- Plans -->
          <section>
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Paket</h4>
            <div class="flex gap-2 flex-wrap">
              <label v-for="plan in ['free', 'family_plus', 'family_pro', 'founder']" :key="plan" class="flex items-center gap-1.5 text-sm">
                <input type="checkbox" :value="plan" v-model="editForm.enabled_plans" class="rounded" />
                {{ plan }}
              </label>
            </div>
          </section>

          <!-- Roles -->
          <section>
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Role</h4>
            <div class="flex gap-2 flex-wrap">
              <label v-for="role in ['parent', 'child', 'teen', 'adult', 'guardian']" :key="role" class="flex items-center gap-1.5 text-sm">
                <input type="checkbox" :value="role" v-model="editForm.allowed_roles" class="rounded" />
                {{ role }}
              </label>
            </div>
          </section>

          <!-- Routes -->
          <section>
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Representasi Aplikasi</h4>
            <div class="space-y-2">
              <div><label class="text-xs text-gray-500">Web Route</label><input v-model="editForm.web_route" type="text" class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none font-mono" placeholder="/feature-path" /></div>
              <div><label class="text-xs text-gray-500">Mobile Route</label><input v-model="editForm.mobile_route" type="text" class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none font-mono" placeholder="/mobile-path" /></div>
              <div><label class="text-xs text-gray-500">Menu Location</label><input v-model="editForm.menu_location" type="text" class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="sidebar, tab, home" /></div>
            </div>
          </section>

          <!-- Dependencies -->
          <section v-if="selectedToggle.dependencies?.length">
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Dependencies</h4>
            <div class="flex flex-wrap gap-1">
              <span v-for="dep in selectedToggle.dependencies" :key="dep" class="text-xs px-2 py-1 bg-gray-100 rounded font-mono">{{ dep }}</span>
            </div>
          </section>

          <!-- Reason -->
          <section>
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Alasan Perubahan</h4>
            <textarea v-model="editForm.change_reason" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Alasan perubahan..."></textarea>
          </section>

          <!-- Critical Warning -->
          <div v-if="selectedToggle.is_critical && !editForm.is_enabled" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-800 font-medium">⚠️ Fitur Kritis</p>
            <p class="text-xs text-red-600 mt-1">Menonaktifkan fitur kritis dapat berdampak pada keselamatan pengguna. Pastikan ini disengaja.</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-4 border-t border-gray-200">
            <button @click="saveToggle" :disabled="saving" class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
              {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
            <button @click="selectedToggle = null" class="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Batal</button>
          </div>

          <!-- Save Error -->
          <p v-if="saveError" class="text-xs text-red-600">{{ saveError }}</p>

          <!-- Audit History -->
          <section v-if="auditLog.length">
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Riwayat Perubahan</h4>
            <div class="space-y-2 max-h-60 overflow-y-auto">
              <div v-for="log in auditLog" :key="log.id" class="text-xs border-l-2 border-gray-200 pl-3 py-1">
                <p class="text-gray-700"><span class="font-medium">{{ log.field_changed }}</span>: {{ log.old_value || '–' }} → {{ log.new_value }}</p>
                <p class="text-gray-400">{{ new Date(log.created_at).toLocaleString('id') }} {{ log.reason ? `• ${log.reason}` : '' }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const toggles = ref([])
const loading = ref(true)
const error = ref(false)
const search = ref('')
const categoryFilter = ref('')
const activeFilter = ref('all')
const selectedToggle = ref(null)
const saving = ref(false)
const saveError = ref('')
const auditLog = ref([])
const confirmCritical = ref(false)

const editForm = ref({
  is_enabled: true,
  is_maintenance: false,
  maintenance_message: '',
  rollout_percentage: 100,
  platform: ['web', 'android', 'ios'],
  enabled_plans: [],
  allowed_roles: [],
  web_route: '',
  mobile_route: '',
  menu_location: '',
  change_reason: ''
})

const allCategories = computed(() => {
  const cats = new Set(toggles.value.map(t => t.category).filter(Boolean))
  return [...cats].sort()
})

const summaryCards = computed(() => {
  const all = toggles.value
  return [
    { key: 'all', label: 'Total', count: all.length },
    { key: 'active', label: 'Active', count: all.filter(t => t.is_enabled).length },
    { key: 'disabled', label: 'Disabled', count: all.filter(t => !t.is_enabled).length },
    { key: 'maintenance', label: 'Maintenance', count: all.filter(t => t.is_maintenance).length },
    { key: 'beta', label: 'Beta', count: all.filter(t => t.is_beta).length },
    { key: 'critical', label: 'Critical', count: all.filter(t => t.is_critical).length },
    { key: 'partial', label: 'Partial Rollout', count: all.filter(t => (t.rollout_percentage ?? 100) < 100 && (t.rollout_percentage ?? 100) > 0).length },
  ]
})

const filteredToggles = computed(() => {
  let list = toggles.value

  // Active filter from summary cards
  if (activeFilter.value === 'active') list = list.filter(t => t.is_enabled)
  else if (activeFilter.value === 'disabled') list = list.filter(t => !t.is_enabled)
  else if (activeFilter.value === 'maintenance') list = list.filter(t => t.is_maintenance)
  else if (activeFilter.value === 'beta') list = list.filter(t => t.is_beta)
  else if (activeFilter.value === 'critical') list = list.filter(t => t.is_critical)
  else if (activeFilter.value === 'partial') list = list.filter(t => (t.rollout_percentage ?? 100) < 100 && (t.rollout_percentage ?? 100) > 0)

  // Category filter
  if (categoryFilter.value) list = list.filter(t => t.category === categoryFilter.value)

  // Search
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(t =>
      t.feature_name.toLowerCase().includes(q) ||
      t.feature_key.toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q) ||
      (t.web_route || '').toLowerCase().includes(q)
    )
  }

  return list
})

async function fetchToggles() {
  loading.value = true
  error.value = false
  try {
    const { data, error: err } = await supabase
      .from('feature_toggles')
      .select('*')
      .order('category', { ascending: true })
      .order('feature_name', { ascending: true })
    if (err) throw err
    toggles.value = data || []
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

function openDetail(ft) {
  selectedToggle.value = ft
  editForm.value = {
    is_enabled: ft.is_enabled,
    is_maintenance: ft.is_maintenance || false,
    maintenance_message: ft.maintenance_message || '',
    rollout_percentage: ft.rollout_percentage ?? 100,
    platform: ft.platform || ['web', 'android', 'ios'],
    enabled_plans: ft.enabled_plans || [],
    allowed_roles: ft.allowed_roles || ['parent', 'child', 'teen', 'adult'],
    web_route: ft.web_route || '',
    mobile_route: ft.mobile_route || '',
    menu_location: ft.menu_location || '',
    change_reason: ''
  }
  saveError.value = ''
  fetchAuditLog(ft.feature_key)
}

async function fetchAuditLog(featureKey) {
  const { data } = await supabase
    .from('feature_toggle_audit')
    .select('*')
    .eq('feature_key', featureKey)
    .order('created_at', { ascending: false })
    .limit(20)
  auditLog.value = data || []
}

async function quickToggle(ft) {
  if (ft.is_critical) {
    if (!confirm(`⚠️ "${ft.feature_name}" adalah fitur kritis. Yakin ingin mengubah status?`)) return
  }
  const newVal = !ft.is_enabled
  const { error: err } = await supabase
    .from('feature_toggles')
    .update({ is_enabled: newVal, updated_at: new Date().toISOString() })
    .eq('id', ft.id)
  if (!err) {
    ft.is_enabled = newVal
    // Audit
    await supabase.from('feature_toggle_audit').insert({
      feature_key: ft.feature_key,
      field_changed: 'is_enabled',
      old_value: String(!newVal),
      new_value: String(newVal),
      reason: 'Quick toggle'
    })
  }
}

async function saveToggle() {
  if (!selectedToggle.value) return
  if (selectedToggle.value.is_critical && !editForm.value.is_enabled && !editForm.value.change_reason) {
    saveError.value = 'Fitur kritis membutuhkan alasan perubahan.'
    return
  }

  saving.value = true
  saveError.value = ''

  const updates = {
    is_enabled: editForm.value.is_enabled,
    is_maintenance: editForm.value.is_maintenance,
    maintenance_message: editForm.value.maintenance_message || null,
    rollout_percentage: editForm.value.rollout_percentage,
    platform: editForm.value.platform,
    enabled_plans: editForm.value.enabled_plans,
    allowed_roles: editForm.value.allowed_roles,
    web_route: editForm.value.web_route || null,
    mobile_route: editForm.value.mobile_route || null,
    menu_location: editForm.value.menu_location || null,
    change_reason: editForm.value.change_reason || null,
    updated_at: new Date().toISOString()
  }

  try {
    const { error: err } = await supabase
      .from('feature_toggles')
      .update(updates)
      .eq('id', selectedToggle.value.id)

    if (err) throw err

    // Record audit entries for changed fields
    const auditEntries = []
    const original = selectedToggle.value
    if (original.is_enabled !== updates.is_enabled) auditEntries.push({ field_changed: 'is_enabled', old_value: String(original.is_enabled), new_value: String(updates.is_enabled) })
    if (original.is_maintenance !== updates.is_maintenance) auditEntries.push({ field_changed: 'is_maintenance', old_value: String(original.is_maintenance || false), new_value: String(updates.is_maintenance) })
    if ((original.rollout_percentage ?? 100) !== updates.rollout_percentage) auditEntries.push({ field_changed: 'rollout_percentage', old_value: String(original.rollout_percentage ?? 100), new_value: String(updates.rollout_percentage) })
    if (JSON.stringify(original.enabled_plans) !== JSON.stringify(updates.enabled_plans)) auditEntries.push({ field_changed: 'enabled_plans', old_value: JSON.stringify(original.enabled_plans), new_value: JSON.stringify(updates.enabled_plans) })

    if (auditEntries.length) {
      await supabase.from('feature_toggle_audit').insert(
        auditEntries.map(e => ({ ...e, feature_key: original.feature_key, reason: editForm.value.change_reason || null }))
      )
    }

    // Update local state
    Object.assign(selectedToggle.value, updates)
    selectedToggle.value = null
    await fetchToggles()
  } catch (e) {
    saveError.value = 'Gagal menyimpan perubahan. Periksa permission.'
  } finally {
    saving.value = false
  }
}

onMounted(fetchToggles)
</script>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.25s ease;
}
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
