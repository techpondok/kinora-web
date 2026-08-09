<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Social Media & Komunitas</h1>
        <p class="text-sm text-gray-500">Kelola link media sosial, komunitas, dan channel resmi Kinora.</p>
      </div>
      <button @click="openEditor(null)" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Tambah Link</button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500 text-sm">Memuat...</div>

    <div v-else-if="links.length === 0" class="bg-white rounded-xl border p-12 text-center">
      <p class="text-gray-400 text-sm">Belum ada link sosial atau komunitas.</p>
      <button @click="openEditor(null)" class="mt-3 text-sm text-blue-600 hover:underline">Tambah yang pertama</button>
    </div>

    <div v-else class="space-y-2">
      <div v-for="(link, idx) in links" :key="link.id" class="bg-white rounded-xl border p-4 flex items-center gap-4">
        <!-- Reorder -->
        <div class="flex flex-col gap-0.5">
          <button @click="moveUp(idx)" :disabled="idx === 0" class="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs">▲</button>
          <button @click="moveDown(idx)" :disabled="idx === links.length - 1" class="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs">▼</button>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-900">{{ link.display_name }}</span>
            <span class="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600 capitalize">{{ link.link_type.replace('_', ' ') }}</span>
            <span v-if="link.is_featured" class="px-1.5 py-0.5 text-[10px] rounded bg-amber-100 text-amber-700">Featured</span>
            <span v-if="link.is_coming_soon" class="px-1.5 py-0.5 text-[10px] rounded bg-purple-100 text-purple-700">Coming Soon</span>
          </div>
          <p class="text-xs text-gray-500 truncate mt-0.5">{{ link.platform_name }} · {{ link.url || 'No URL' }}</p>
        </div>

        <!-- Status toggle -->
        <button @click="toggleActive(link)" :class="link.is_active ? 'bg-green-500' : 'bg-gray-300'" class="relative w-9 h-5 rounded-full transition-colors">
          <span :class="link.is_active ? 'translate-x-4' : 'translate-x-0.5'" class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"></span>
        </button>

        <!-- Actions -->
        <button @click="openEditor(link)" class="text-xs text-blue-600 hover:underline">Edit</button>
        <button @click="confirmDelete(link)" class="text-xs text-red-600 hover:underline">Hapus</button>
      </div>
    </div>

    <!-- Editor Modal -->
    <Teleport to="body">
      <div v-if="showEditor" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" @click.self="showEditor = false">
        <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-4">
          <h3 class="font-semibold text-gray-900">{{ form.id ? 'Edit Link' : 'Tambah Link' }}</h3>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Platform Key *</label>
              <input v-model="form.platform_key" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="whatsapp, telegram, instagram..." />
              <p class="text-[10px] text-gray-400 mt-0.5">Identifier unik (lowercase, tanpa spasi)</p>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Nama Platform *</label>
              <input v-model="form.platform_name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="WhatsApp, Telegram..." />
            </div>
          </div>

          <div>
            <label class="block text-xs text-gray-500 mb-1">Nama Tampilan *</label>
            <input v-model="form.display_name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Kinora Parents Community" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Tipe *</label>
              <select v-model="form.link_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="social_media">Social Media</option>
                <option value="community_group">Community Group</option>
                <option value="support_channel">Support Channel</option>
                <option value="official_channel">Official Channel</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">CTA Label</label>
              <input v-model="form.cta_label" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Join Community" />
            </div>
          </div>

          <div>
            <label class="block text-xs text-gray-500 mb-1">URL</label>
            <input v-model="form.url" type="url" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="https://..." />
            <p v-if="urlError" class="text-xs text-red-600 mt-0.5">{{ urlError }}</p>
          </div>

          <div>
            <label class="block text-xs text-gray-500 mb-1">Deskripsi</label>
            <textarea v-model="form.description" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Connect, share experiences, and grow together..."></textarea>
          </div>

          <div>
            <label class="block text-xs text-gray-500 mb-1">Visibility</label>
            <div class="flex flex-wrap gap-2 mt-1">
              <label v-for="v in visibilityOptions" :key="v" class="flex items-center gap-1.5 text-xs">
                <input type="checkbox" :value="v" v-model="form.visibility" class="rounded" />
                <span class="capitalize">{{ v }}</span>
              </label>
            </div>
          </div>

          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-xs"><input type="checkbox" v-model="form.is_active" class="rounded" /> Aktif</label>
            <label class="flex items-center gap-2 text-xs"><input type="checkbox" v-model="form.is_featured" class="rounded" /> Featured</label>
            <label class="flex items-center gap-2 text-xs"><input type="checkbox" v-model="form.is_coming_soon" class="rounded" /> Coming Soon</label>
          </div>

          <div v-if="saveError" class="text-xs text-red-600">{{ saveError }}</div>

          <div class="flex justify-end gap-3 pt-2">
            <button @click="showEditor = false" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
            <button @click="saveLink" :disabled="saving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{{ saving ? 'Saving...' : 'Simpan' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const links = ref([])
const loading = ref(true)
const showEditor = ref(false)
const saving = ref(false)
const saveError = ref('')
const urlError = ref('')

const visibilityOptions = ['all', 'website', 'footer', 'community_section', 'contact', 'mobile_app']

const emptyForm = {
  id: null,
  platform_key: '',
  platform_name: '',
  display_name: '',
  link_type: 'social_media',
  url: '',
  description: '',
  cta_label: 'Kunjungi',
  display_order: 0,
  is_active: true,
  is_featured: false,
  is_coming_soon: false,
  visibility: ['all'],
}

const form = ref({ ...emptyForm })

async function loadLinks() {
  loading.value = true
  const { data } = await supabase
    .from('kinora_social_links')
    .select('*')
    .order('display_order', { ascending: true })
  links.value = data || []
  loading.value = false
}

function openEditor(link) {
  if (link) {
    form.value = { ...link }
  } else {
    form.value = { ...emptyForm, display_order: links.value.length }
  }
  saveError.value = ''
  urlError.value = ''
  showEditor.value = true
}

function validateUrl(url) {
  if (!url) return true // URL optional for coming soon
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

async function saveLink() {
  saveError.value = ''
  urlError.value = ''

  if (!form.value.platform_key || !form.value.platform_name || !form.value.display_name) {
    saveError.value = 'Platform key, nama platform, dan nama tampilan wajib diisi.'
    return
  }

  if (form.value.url && !validateUrl(form.value.url)) {
    urlError.value = 'URL harus valid (https://...)'
    return
  }

  if (!form.value.is_coming_soon && !form.value.url) {
    saveError.value = 'URL wajib diisi kecuali status Coming Soon.'
    return
  }

  saving.value = true
  const { id, ...payload } = form.value
  payload.platform_key = payload.platform_key.toLowerCase().replace(/[^a-z0-9_-]/g, '')
  payload.updated_at = new Date().toISOString()

  let result
  if (id) {
    result = await supabase.from('kinora_social_links').update(payload).eq('id', id)
  } else {
    result = await supabase.from('kinora_social_links').insert(payload)
  }

  if (result.error) {
    saveError.value = result.error.message
  } else {
    showEditor.value = false
    await loadLinks()
  }
  saving.value = false
}

async function toggleActive(link) {
  const newVal = !link.is_active
  await supabase.from('kinora_social_links').update({ is_active: newVal, updated_at: new Date().toISOString() }).eq('id', link.id)
  link.is_active = newVal
}

async function moveUp(idx) {
  if (idx === 0) return
  await swapOrder(idx, idx - 1)
}

async function moveDown(idx) {
  if (idx >= links.value.length - 1) return
  await swapOrder(idx, idx + 1)
}

async function swapOrder(a, b) {
  const linkA = links.value[a]
  const linkB = links.value[b]
  const orderA = linkA.display_order
  const orderB = linkB.display_order

  await Promise.all([
    supabase.from('kinora_social_links').update({ display_order: orderB }).eq('id', linkA.id),
    supabase.from('kinora_social_links').update({ display_order: orderA }).eq('id', linkB.id),
  ])

  linkA.display_order = orderB
  linkB.display_order = orderA
  links.value.sort((x, y) => x.display_order - y.display_order)
}

async function confirmDelete(link) {
  if (!confirm(`Hapus "${link.display_name}"?`)) return
  await supabase.from('kinora_social_links').delete().eq('id', link.id)
  await loadLinks()
}

onMounted(loadLinks)
</script>
