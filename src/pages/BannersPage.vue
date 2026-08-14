<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Dynamic Banners</h1>
        <p class="text-sm text-gray-500">Manage promotional and informational banners for Mobile & Web.</p>
      </div>
      <button @click="openEditor(null)" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Create Banner</button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-white rounded-xl border border-gray-200 p-3 text-center">
        <p class="text-lg font-bold text-gray-900">{{ banners.length }}</p><p class="text-[10px] text-gray-500">Total</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-3 text-center">
        <p class="text-lg font-bold text-green-700">{{ banners.filter(b => isActive(b)).length }}</p><p class="text-[10px] text-gray-500">Active</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-3 text-center">
        <p class="text-lg font-bold text-blue-700">{{ banners.filter(b => isScheduled(b)).length }}</p><p class="text-[10px] text-gray-500">Scheduled</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-3 text-center">
        <p class="text-lg font-bold text-amber-700">{{ totalClicks }}</p><p class="text-[10px] text-gray-500">Total Clicks</p>
      </div>
    </div>

    <!-- Filter -->
    <div class="flex flex-wrap gap-3">
      <select v-model="filterPlacement" class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
        <option value="">All Placements</option>
        <option v-for="p in placements" :key="p" :value="p">{{ p }}</option>
      </select>
      <select v-model="filterAudience" class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
        <option value="">All Audiences</option>
        <option value="all">All Users</option>
        <option value="free">Free</option>
        <option value="family_plus">Family Plus</option>
        <option value="parent">Parent</option>
        <option value="new_user">New User</option>
      </select>
    </div>

    <!-- List -->
    <div v-if="loading" class="text-center py-8 text-gray-400 text-sm">Memuat...</div>
    <div v-else-if="filtered.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <p class="text-gray-500">Belum ada banner.</p>
    </div>
    <div v-else class="space-y-3">
      <div v-for="b in filtered" :key="b.id" class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition">
        <div class="flex">
          <div class="w-32 h-20 bg-gray-100 flex-shrink-0">
            <img v-if="b.image_url" :src="b.image_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-xl text-gray-300">🖼</div>
          </div>
          <div class="flex-1 min-w-0 p-3 flex items-center gap-4">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ b.title }}</p>
              <div class="flex flex-wrap gap-1.5 mt-1">
                <span class="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600">{{ b.placement }}</span>
                <span class="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600">{{ b.audience }}</span>
                <span class="px-1.5 py-0.5 text-[10px] rounded" :class="b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'">{{ bannerStatus(b) }}</span>
                <span v-if="b.dismissible" class="px-1.5 py-0.5 text-[10px] rounded bg-blue-50 text-blue-600">dismissible</span>
              </div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <button @click="openEditor(b)" class="text-xs text-blue-600 hover:underline">Edit</button>
              <button @click="toggleActive(b)" class="text-xs" :class="b.is_active ? 'text-orange-600' : 'text-green-600'">{{ b.is_active ? 'Off' : 'On' }}</button>
              <button @click="deleteBanner(b)" class="text-xs text-red-600 hover:underline">Del</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor Modal -->
    <div v-if="showEditor" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-4">
        <h3 class="font-semibold text-gray-900">{{ editing.id ? 'Edit Banner' : 'Create Banner' }}</h3>
        <div v-if="editorError" class="p-2 bg-red-50 text-red-700 text-xs rounded">{{ editorError }}</div>

        <div><label class="block text-xs text-gray-500 mb-1">Title *</label><input v-model="editing.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Banner title" /></div>
        <div><label class="block text-xs text-gray-500 mb-1">Description</label><textarea v-model="editing.description" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Short description"></textarea></div>
        <div><label class="block text-xs text-gray-500 mb-1">Image URL</label><input v-model="editing.image_url" type="url" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="https://..." />
          <div v-if="editing.image_url" class="mt-2 w-full h-24 bg-gray-100 rounded-lg overflow-hidden"><img :src="editing.image_url" class="w-full h-full object-cover" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs text-gray-500 mb-1">Label</label><input v-model="editing.label" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="NEW, PROMO" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">Display Variant</label>
            <select v-model="editing.display_variant" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="card">Card</option><option value="hero">Hero</option><option value="compact">Compact</option><option value="inline">Inline</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs text-gray-500 mb-1">Button Text</label><input v-model="editing.button_text" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Lihat Detail" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">Button Link</label><input v-model="editing.button_link" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="/webinar or https://..." /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs text-gray-500 mb-1">Placement *</label>
            <select v-model="editing.placement" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option v-for="p in placements" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div><label class="block text-xs text-gray-500 mb-1">Target Type</label>
            <select v-model="editing.target_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="internal">Internal (Mobile Route)</option><option value="web">Kinora Web</option><option value="external">External URL</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs text-gray-500 mb-1">Audience</label>
            <select v-model="editing.audience" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="all">All Users</option><option value="free">Free</option><option value="family_plus">Family Plus</option><option value="parent">Parent</option><option value="adult">Adult</option><option value="new_user">New User</option>
            </select>
          </div>
          <div><label class="block text-xs text-gray-500 mb-1">Order</label><input v-model.number="editing.display_order" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs text-gray-500 mb-1">Start At</label><input v-model="editing.start_at" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">End At</label><input v-model="editing.end_at" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        </div>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="editing.dismissible" class="rounded" /> Dismissible</label>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="editing.is_active" class="rounded" /> Active</label>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button @click="showEditor = false" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button @click="saveBanner" :disabled="saving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const banners = ref([])
const loading = ref(true)
const showEditor = ref(false)
const editing = ref({})
const saving = ref(false)
const editorError = ref('')
const filterPlacement = ref('')
const filterAudience = ref('')

const placements = ['home_top', 'home_middle', 'article', 'webinar', 'marketplace', 'consultation', 'finance', 'family', 'chat', 'profile']
const totalClicks = computed(() => banners.value.reduce((s, b) => s + (b.click_count || 0), 0))

const filtered = computed(() => {
  let list = banners.value
  if (filterPlacement.value) list = list.filter(b => b.placement === filterPlacement.value)
  if (filterAudience.value) list = list.filter(b => b.audience === filterAudience.value)
  return list
})

function isActive(b) {
  if (!b.is_active) return false
  const now = new Date()
  if (b.start_at && new Date(b.start_at) > now) return false
  if (b.end_at && new Date(b.end_at) < now) return false
  return true
}

function isScheduled(b) {
  if (!b.is_active) return false
  return b.start_at && new Date(b.start_at) > new Date()
}

function bannerStatus(b) {
  if (!b.is_active) return 'disabled'
  const now = new Date()
  if (b.start_at && new Date(b.start_at) > now) return 'scheduled'
  if (b.end_at && new Date(b.end_at) < now) return 'expired'
  return 'active'
}

function openEditor(b) {
  editing.value = b ? { ...b } : { title: '', description: '', image_url: '', label: '', button_text: '', button_link: '', placement: 'home_top', display_variant: 'card', target_type: 'internal', audience: 'all', display_order: 0, dismissible: true, is_active: true, start_at: '', end_at: '' }
  showEditor.value = true
  editorError.value = ''
}

async function saveBanner() {
  editorError.value = ''
  if (!editing.value.title) { editorError.value = 'Title required'; return }
  saving.value = true

  const payload = { ...editing.value, updated_at: new Date().toISOString() }
  if (!payload.start_at) payload.start_at = null
  if (!payload.end_at) payload.end_at = null

  let result
  if (payload.id) {
    const { id, created_at, created_by, click_count, impression_count, dismiss_count, ...rest } = payload
    result = await supabase.from('kinora_banners').update(rest).eq('id', id)
  } else {
    const { data: { user } } = await supabase.auth.getUser()
    payload.created_by = user?.id
    delete payload.id
    result = await supabase.from('kinora_banners').insert(payload)
  }

  if (result.error) { editorError.value = result.error.message; saving.value = false; return }
  showEditor.value = false
  saving.value = false
  loadBanners()
}

async function toggleActive(b) {
  await supabase.from('kinora_banners').update({ is_active: !b.is_active, updated_at: new Date().toISOString() }).eq('id', b.id)
  loadBanners()
}

async function deleteBanner(b) {
  if (!confirm(`Delete banner "${b.title}"?`)) return
  await supabase.from('kinora_banners').delete().eq('id', b.id)
  loadBanners()
}

async function loadBanners() {
  loading.value = true
  const { data } = await supabase.from('kinora_banners').select('*').order('display_order').order('created_at', { ascending: false })
  banners.value = data || []
  loading.value = false
}

onMounted(loadBanners)
</script>
