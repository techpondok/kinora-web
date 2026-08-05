<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Broadcast</h1>
        <p class="text-sm text-gray-500">Kirim pengumuman, update fitur, dan promosi ke pengguna Kinora.</p>
      </div>
      <button @click="openEditor(null)" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Buat Broadcast</button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-xl border border-gray-200 p-3">
        <p class="text-[11px] text-gray-400 uppercase">{{ stat.label }}</p>
        <p class="text-lg font-bold mt-0.5" :class="stat.color || 'text-gray-900'">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <input v-model="search" type="text" placeholder="Cari broadcast..." class="px-3 py-2 border border-gray-300 rounded-lg text-sm w-52 outline-none" />
      <select v-model="filterStatus" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
        <option value="">Semua Status</option>
        <option value="draft">Draft</option>
        <option value="scheduled">Scheduled</option>
        <option value="completed">Completed</option>
        <option value="archived">Archived</option>
      </select>
      <select v-model="filterCategory" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
        <option value="">Semua Kategori</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-8 text-center text-gray-500 text-sm">Memuat...</div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <p class="text-gray-500 text-sm">{{ search || filterStatus ? 'Tidak ditemukan.' : 'Belum ada broadcast.' }}</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Broadcast</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Kategori</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Channel</th>
            <th class="text-center px-4 py-3 font-medium text-gray-600">Delivered</th>
            <th class="text-center px-4 py-3 font-medium text-gray-600">Status</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="b in filtered" :key="b.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <p class="font-medium text-gray-900 truncate max-w-[200px]">{{ b.title }}</p>
              <p class="text-xs text-gray-400">{{ b.scheduled_at ? formatDate(b.scheduled_at) : formatDate(b.created_at) }}</p>
            </td>
            <td class="px-4 py-3"><span class="text-xs px-2 py-0.5 bg-gray-100 rounded">{{ b.category }}</span></td>
            <td class="px-4 py-3"><span class="text-xs text-gray-500">{{ (b.channels || []).join(', ') }}</span></td>
            <td class="px-4 py-3 text-center text-xs">{{ b.delivered_count || 0 }}</td>
            <td class="px-4 py-3 text-center"><span :class="statusClass(b.status)" class="text-xs px-2 py-0.5 rounded-full font-medium">{{ b.status }}</span></td>
            <td class="px-4 py-3 text-right space-x-2">
              <button @click="openEditor(b)" class="text-xs text-blue-600 hover:underline">Edit</button>
              <button v-if="b.status === 'draft'" @click="sendBroadcast(b)" class="text-xs text-green-600 hover:underline">Send</button>
              <button @click="archiveBroadcast(b)" class="text-xs text-gray-500 hover:underline">Archive</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Editor Drawer -->
    <div v-if="showEditor" class="fixed inset-0 z-50 flex justify-end">
      <div @click="showEditor = false" class="absolute inset-0 bg-black/40"></div>
      <div class="relative bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl">
        <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h3 class="font-bold text-gray-900">{{ form.id ? 'Edit Broadcast' : 'Buat Broadcast' }}</h3>
          <button @click="showEditor = false" class="p-2 hover:bg-gray-100 rounded-lg">✕</button>
        </div>
        <div class="p-6 space-y-5">
          <div><label class="block text-xs text-gray-500 mb-1">Judul *</label><input v-model="form.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-xs text-gray-500 mb-1">Kategori</label>
              <select v-model="form.category" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div><label class="block text-xs text-gray-500 mb-1">Prioritas</label>
              <select v-model="form.priority" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div><label class="block text-xs text-gray-500 mb-1">Konten</label><textarea v-model="form.body" rows="6" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
          <div><label class="block text-xs text-gray-500 mb-1">Channels</label>
            <div class="flex gap-3">
              <label v-for="ch in ['push','in_app','email','banner']" :key="ch" class="flex items-center gap-1.5 text-sm"><input type="checkbox" :value="ch" v-model="form.channels" class="rounded" /> {{ ch }}</label>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-xs text-gray-500 mb-1">Target</label>
              <select v-model="form.target_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="all">All Users</option><option value="parents">Parents</option><option value="children">Children</option><option value="premium">Premium</option><option value="free">Free Users</option><option value="consultants">Consultants</option>
              </select>
            </div>
            <div><label class="block text-xs text-gray-500 mb-1">Jadwal</label><input v-model="form.scheduled_at" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-xs text-gray-500 mb-1">CTA Label</label><input v-model="form.cta_label" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Lihat Selengkapnya" /></div>
            <div><label class="block text-xs text-gray-500 mb-1">CTA URL</label><input v-model="form.cta_url" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="/articles/..." /></div>
          </div>
          <div><label class="block text-xs text-gray-500 mb-1">Banner Image URL</label><input v-model="form.banner_url" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>

          <div class="flex gap-3 pt-4 border-t">
            <button @click="saveBroadcast('draft')" :disabled="saving" class="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50">Simpan Draft</button>
            <button @click="saveBroadcast('scheduled')" :disabled="saving" class="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{{ form.scheduled_at ? 'Jadwalkan' : 'Kirim Sekarang' }}</button>
          </div>
          <p v-if="saveError" class="text-xs text-red-600">{{ saveError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const broadcasts = ref([])
const loading = ref(true)
const showEditor = ref(false)
const saving = ref(false)
const saveError = ref('')
const search = ref('')
const filterStatus = ref('')
const filterCategory = ref('')

const categories = ['feature_update','maintenance','security','emergency','education','promotion','survey','webinar','finance','system','general']

const defaultForm = { id: null, title: '', body: '', category: 'general', priority: 'normal', channels: ['push','in_app'], target_type: 'all', scheduled_at: '', cta_label: '', cta_url: '', banner_url: '' }
const form = ref({ ...defaultForm })

const stats = computed(() => {
  const all = broadcasts.value
  return [
    { label: 'Total', value: all.length },
    { label: 'Draft', value: all.filter(b => b.status === 'draft').length },
    { label: 'Scheduled', value: all.filter(b => b.status === 'scheduled').length, color: 'text-blue-600' },
    { label: 'Completed', value: all.filter(b => b.status === 'completed').length, color: 'text-green-600' },
    { label: 'Failed', value: all.filter(b => b.status === 'failed').length, color: 'text-red-600' },
    { label: 'Delivered', value: all.reduce((s, b) => s + (b.delivered_count || 0), 0), color: 'text-amber-600' },
  ]
})

const filtered = computed(() => {
  let list = broadcasts.value
  if (filterStatus.value) list = list.filter(b => b.status === filterStatus.value)
  if (filterCategory.value) list = list.filter(b => b.category === filterCategory.value)
  if (search.value) { const q = search.value.toLowerCase(); list = list.filter(b => b.title.toLowerCase().includes(q)) }
  return list
})

function statusClass(s) {
  const map = { draft: 'bg-gray-100 text-gray-600', scheduled: 'bg-blue-100 text-blue-700', sending: 'bg-amber-100 text-amber-700', completed: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-600', archived: 'bg-gray-100 text-gray-400' }
  return map[s] || 'bg-gray-100 text-gray-500'
}

function formatDate(d) { return d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—' }

async function loadBroadcasts() {
  loading.value = true
  const { data } = await supabase.from('kinora_broadcasts').select('*').order('created_at', { ascending: false })
  broadcasts.value = data || []
  loading.value = false
}

function openEditor(b) {
  if (b) { form.value = { ...b, target_type: b.target_audience?.type || 'all' } }
  else { form.value = { ...defaultForm } }
  saveError.value = ''
  showEditor.value = true
}

async function saveBroadcast(status) {
  if (!form.value.title) { saveError.value = 'Judul wajib diisi.'; return }
  saving.value = true; saveError.value = ''

  const { data: { user } } = await supabase.auth.getUser()
  const payload = {
    title: form.value.title, body: form.value.body, category: form.value.category,
    priority: form.value.priority, channels: form.value.channels,
    target_audience: { type: form.value.target_type },
    scheduled_at: form.value.scheduled_at || null,
    cta_label: form.value.cta_label || null, cta_url: form.value.cta_url || null,
    banner_url: form.value.banner_url || null,
    status: status === 'scheduled' && !form.value.scheduled_at ? 'completed' : status,
    sent_at: status !== 'draft' && !form.value.scheduled_at ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  let error
  if (form.value.id) {
    const res = await supabase.from('kinora_broadcasts').update(payload).eq('id', form.value.id)
    error = res.error
  } else {
    payload.created_by = user?.id
    const res = await supabase.from('kinora_broadcasts').insert(payload)
    error = res.error
  }

  saving.value = false
  if (error) { saveError.value = error.message; return }
  showEditor.value = false
  await loadBroadcasts()
}

async function sendBroadcast(b) {
  if (!confirm(`Kirim broadcast "${b.title}" sekarang?`)) return
  await supabase.from('kinora_broadcasts').update({ status: 'completed', sent_at: new Date().toISOString() }).eq('id', b.id)
  await loadBroadcasts()
}

async function archiveBroadcast(b) {
  await supabase.from('kinora_broadcasts').update({ status: 'archived' }).eq('id', b.id)
  await loadBroadcasts()
}

onMounted(loadBroadcasts)
</script>
