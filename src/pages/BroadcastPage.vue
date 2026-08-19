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
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
        <option value="cancelled">Cancelled</option>
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
            <th class="text-left px-4 py-3 font-medium text-gray-600">Channels</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Target</th>
            <th class="text-center px-4 py-3 font-medium text-gray-600">Sent</th>
            <th class="text-center px-4 py-3 font-medium text-gray-600">Delivered</th>
            <th class="text-center px-4 py-3 font-medium text-gray-600">Failed</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Scheduled At</th>
            <th class="text-center px-4 py-3 font-medium text-gray-600">Status</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="b in filtered" :key="b.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <p class="font-medium text-gray-900 truncate max-w-[200px]">{{ b.title }}</p>
              <p v-if="b.last_error" class="text-xs text-amber-600 truncate max-w-[220px]">{{ b.last_error }}</p>
            </td>
            <td class="px-4 py-3"><span class="text-xs px-2 py-0.5 bg-gray-100 rounded">{{ b.category }}</span></td>
            <td class="px-4 py-3"><span class="text-xs text-gray-500">{{ (b.channels || []).join(', ') }}</span></td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ targetLabel(b) }} · {{ b.target_count ?? '-' }}</td>
            <td class="px-4 py-3 text-center text-xs">{{ b.sent_count ?? '-' }}</td>
            <td class="px-4 py-3 text-center text-xs">{{ b.delivered_count ?? '-' }}</td>
            <td class="px-4 py-3 text-center text-xs">{{ b.failed_count ?? '-' }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ b.scheduled_at ? formatDate(b.scheduled_at) : '-' }}</td>
            <td class="px-4 py-3 text-center"><span :class="statusClass(b.status)" class="text-xs px-2 py-0.5 rounded-full font-medium">{{ statusLabel(b.status) }}</span></td>
            <td class="px-4 py-3 text-right space-x-2">
              <button v-if="['draft','scheduled'].includes(b.status)" @click="openEditor(b)" class="text-xs text-blue-600 hover:underline">Edit</button>
              <button v-if="['draft','scheduled','failed'].includes(b.status)" @click="sendBroadcast(b)" class="text-xs text-green-600 hover:underline">{{ b.status === 'scheduled' ? 'Send Now' : b.status === 'failed' ? 'Retry' : 'Send' }}</button>
              <button v-if="b.status === 'scheduled'" @click="cancelBroadcast(b)" class="text-xs text-orange-600 hover:underline">Cancel</button>
              <button v-if="['completed','failed'].includes(b.status)" @click="duplicateBroadcast(b)" class="text-xs text-purple-600 hover:underline">Duplicate</button>
              <button v-if="['completed','failed','cancelled'].includes(b.status)" @click="archiveBroadcast(b)" class="text-xs text-gray-500 hover:underline">Archive</button>
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
                <option value="all_users">All Users</option><option value="parents">Parents</option><option value="children">Children</option><option value="premium_users">Premium Users</option><option value="free_users">Free Users</option><option value="consultants">Consultants</option>
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
import { supabase, envInfo } from '../lib/supabase.js'

const broadcasts = ref([])
const loading = ref(true)
const showEditor = ref(false)
const saving = ref(false)
const saveError = ref('')
const search = ref('')
const filterStatus = ref('')
const filterCategory = ref('')

const categories = ['feature_update','maintenance','security','emergency','education','promotion','survey','webinar','finance','system','general']

const defaultForm = { id: null, title: '', body: '', category: 'general', priority: 'normal', channels: ['push','in_app'], target_type: 'all_users', scheduled_at: '', cta_label: '', cta_url: '', banner_url: '' }
const form = ref({ ...defaultForm })

const stats = computed(() => {
  const all = broadcasts.value
  return [
    { label: 'Total', value: all.length },
    { label: 'Draft', value: all.filter(b => b.status === 'draft').length },
    { label: 'Scheduled', value: all.filter(b => b.status === 'scheduled').length, color: 'text-blue-600' },
    { label: 'Processing', value: all.filter(b => b.status === 'processing').length, color: 'text-amber-600' },
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
  const map = { draft: 'bg-gray-100 text-gray-600', scheduled: 'bg-blue-100 text-blue-700', processing: 'bg-amber-100 text-amber-700', completed: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-600', cancelled: 'bg-orange-100 text-orange-700', archived: 'bg-gray-100 text-gray-400' }
  return map[s] || 'bg-gray-100 text-gray-500'
}

function statusLabel(s) {
  return { draft: 'Draft', scheduled: 'Scheduled', processing: 'Processing', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled', archived: 'Archived' }[s] || s
}

function targetLabel(b) {
  return ({ all_users: 'All Users', all: 'All Users', free_users: 'Free Users', premium_users: 'Premium Users', parents: 'Parents', children: 'Children', consultants: 'Consultants' })[b.target_audience?.type] || b.target_audience?.type || '-'
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
}

async function loadBroadcasts() {
  loading.value = true
  console.info('[BROADCAST][ENV]', { environment: envInfo.env, project_ref: envInfo.projectRef })
  await supabase.rpc('process_due_kinora_broadcasts', { p_limit: 10 })
  const { data } = await supabase.from('kinora_broadcasts').select('*').order('created_at', { ascending: false })
  broadcasts.value = data || []
  loading.value = false
}

function openEditor(b) {
  if (b) {
    let localScheduled = ''
    if (b.scheduled_at) {
      const d = new Date(b.scheduled_at)
      const offset = d.getTimezoneOffset()
      const local = new Date(d.getTime() - offset * 60000)
      localScheduled = local.toISOString().slice(0, 16)
    }
    form.value = { ...b, target_type: b.target_audience?.type || 'all', scheduled_at: localScheduled }
  } else {
    form.value = { ...defaultForm }
  }
  saveError.value = ''
  showEditor.value = true
}

async function saveBroadcast(status) {
  if (!form.value.title) { saveError.value = 'Judul wajib diisi.'; return }
  if (!form.value.channels?.length) { saveError.value = 'Pilih minimal satu channel.'; return }
  saving.value = true; saveError.value = ''

  try {
    const { data: { user } } = await supabase.auth.getUser()

    // Convert datetime-local to proper ISO with timezone
    let scheduledAt = null
    if (form.value.scheduled_at) {
      // datetime-local gives "2026-08-05T22:43" in local time
      // Convert to ISO string with timezone offset
      const localDate = new Date(form.value.scheduled_at)
      scheduledAt = localDate.toISOString()
      console.info('[BROADCAST][TIME]', {
        scheduled_at_utc: scheduledAt,
        scheduled_at_local: localDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        server_now_utc: new Date().toISOString(),
        timezone: 'Asia/Jakarta'
      })
      if (status === 'scheduled' && localDate <= new Date()) {
        saveError.value = 'Jadwal harus lebih besar dari waktu sekarang. Gunakan Kirim Sekarang untuk mengirim langsung.'
        saving.value = false
        return
      }
    }

    const payload = {
      title: form.value.title,
      body: form.value.body || '',
      category: form.value.category || 'general',
      priority: form.value.priority || 'normal',
      channels: form.value.channels || ['push', 'in_app'],
      target_audience: { type: form.value.target_type || 'all' },
      scheduled_at: scheduledAt,
      cta_label: form.value.cta_label || null,
      cta_url: form.value.cta_url || null,
      banner_url: form.value.banner_url || null,
      status: status === 'scheduled' && !scheduledAt ? 'processing' : status,
      sent_at: null,
      updated_at: new Date().toISOString(),
    }

    let error
    if (form.value.id) {
      const res = await supabase.from('kinora_broadcasts').update(payload).eq('id', form.value.id).select('id').single()
      if (!res.error && payload.status === 'processing') await supabase.rpc('admin_execute_kinora_broadcast', { p_broadcast_id: form.value.id })
      error = res.error
    } else {
      payload.created_by = user?.id
      const res = await supabase.from('kinora_broadcasts').insert(payload).select('id').single()
      if (!res.error && payload.status === 'processing') await supabase.rpc('admin_execute_kinora_broadcast', { p_broadcast_id: res.data.id })
      error = res.error
    }

    saving.value = false
    if (error) { saveError.value = error.message; return }
    showEditor.value = false
    await loadBroadcasts()
  } catch (e) {
    saving.value = false
    saveError.value = e.message || 'Gagal menyimpan.'
  }
}

async function sendBroadcast(b) {
  if (!confirm(`Kirim broadcast "${b.title}" sekarang?`)) return
  await supabase.from('kinora_broadcasts').update({ status: 'processing', scheduled_at: null, updated_at: new Date().toISOString() }).eq('id', b.id)
  await supabase.rpc('admin_execute_kinora_broadcast', { p_broadcast_id: b.id })
  await loadBroadcasts()
}

async function cancelBroadcast(b) {
  await supabase.from('kinora_broadcasts').update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', b.id)
  await loadBroadcasts()
}

function duplicateBroadcast(b) {
  const copy = { ...b, id: null, title: `${b.title} Copy`, status: 'draft', scheduled_at: '', target_type: b.target_audience?.type || 'all_users' }
  delete copy.created_at
  delete copy.updated_at
  form.value = copy
  saveError.value = ''
  showEditor.value = true
}

async function archiveBroadcast(b) {
  await supabase.from('kinora_broadcasts').update({ status: 'archived', archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', b.id)
  await loadBroadcasts()
}

onMounted(loadBroadcasts)
</script>
