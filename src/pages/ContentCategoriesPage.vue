<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Kategori Konten</h1>
        <p class="text-sm text-gray-500">Kelola kategori artikel dan berita.</p>
      </div>
      <button @click="openEditor(null)" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Tambah Kategori</button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500 text-sm">Memuat...</div>

    <div v-else-if="categories.length === 0" class="bg-white rounded-xl border p-12 text-center">
      <p class="text-gray-400 text-sm">Belum ada kategori.</p>
    </div>

    <div v-else class="space-y-2">
      <div v-for="(cat, idx) in categories" :key="cat.id" class="bg-white rounded-xl border p-4 flex items-center gap-4">
        <div class="flex flex-col gap-0.5">
          <button @click="moveUp(idx)" :disabled="idx === 0" class="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs">▲</button>
          <button @click="moveDown(idx)" :disabled="idx === categories.length - 1" class="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs">▼</button>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-900">{{ cat.name }}</span>
            <span class="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600">{{ cat.slug }}</span>
            <span class="px-1.5 py-0.5 text-[10px] rounded bg-blue-50 text-blue-700">{{ cat.content_type }}</span>
          </div>
          <p v-if="cat.description" class="text-xs text-gray-500 mt-0.5">{{ cat.description }}</p>
        </div>
        <button @click="toggleActive(cat)" :class="cat.is_active ? 'bg-green-500' : 'bg-gray-300'" class="relative w-9 h-5 rounded-full transition-colors">
          <span :class="cat.is_active ? 'translate-x-4' : 'translate-x-0.5'" class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"></span>
        </button>
        <button @click="openEditor(cat)" class="text-xs text-blue-600 hover:underline">Edit</button>
        <button @click="confirmDelete(cat)" class="text-xs text-red-600 hover:underline">Hapus</button>
      </div>
    </div>

    <!-- Editor Modal -->
    <Teleport to="body">
      <div v-if="showEditor" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" @click.self="showEditor = false">
        <div class="bg-white rounded-xl w-full max-w-md shadow-xl p-6 space-y-4">
          <h3 class="font-semibold text-gray-900">{{ form.id ? 'Edit Kategori' : 'Tambah Kategori' }}</h3>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Nama *</label>
            <input v-model="form.name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Parenting" @input="autoSlug" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Slug *</label>
            <input v-model="form.slug" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" placeholder="parenting" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Deskripsi</label>
            <input v-model="form.description" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Tipe Konten</label>
            <select v-model="form.content_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="all">Semua (Artikel & Berita)</option>
              <option value="article">Artikel saja</option>
              <option value="news">Berita saja</option>
            </select>
          </div>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="form.is_active" class="rounded" /> Aktif</label>
          <div v-if="saveError" class="text-xs text-red-600">{{ saveError }}</div>
          <div class="flex justify-end gap-3 pt-2">
            <button @click="showEditor = false" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
            <button @click="saveCategory" :disabled="saving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{{ saving ? 'Saving...' : 'Simpan' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const categories = ref([])
const loading = ref(true)
const showEditor = ref(false)
const saving = ref(false)
const saveError = ref('')

const emptyForm = { id: null, name: '', slug: '', description: '', content_type: 'all', is_active: true, display_order: 0 }
const form = ref({ ...emptyForm })

async function loadCategories() {
  loading.value = true
  const { data } = await supabase
    .from('kinora_content_categories')
    .select('*')
    .order('display_order', { ascending: true })
  categories.value = data || []
  loading.value = false
}

function openEditor(cat) {
  form.value = cat ? { ...cat } : { ...emptyForm, display_order: categories.value.length }
  saveError.value = ''
  showEditor.value = true
}

function autoSlug() {
  if (!form.value.id) {
    form.value.slug = form.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
}

async function saveCategory() {
  saveError.value = ''
  if (!form.value.name || !form.value.slug) { saveError.value = 'Nama dan slug wajib diisi.'; return }

  saving.value = true
  const { id, created_at, updated_at, ...payload } = form.value
  payload.updated_at = new Date().toISOString()

  let result
  if (id) {
    result = await supabase.from('kinora_content_categories').update(payload).eq('id', id)
  } else {
    result = await supabase.from('kinora_content_categories').insert(payload)
  }

  if (result.error) { saveError.value = result.error.message }
  else { showEditor.value = false; await loadCategories() }
  saving.value = false
}

async function toggleActive(cat) {
  await supabase.from('kinora_content_categories').update({ is_active: !cat.is_active, updated_at: new Date().toISOString() }).eq('id', cat.id)
  cat.is_active = !cat.is_active
}

async function moveUp(idx) { if (idx > 0) await swapOrder(idx, idx - 1) }
async function moveDown(idx) { if (idx < categories.value.length - 1) await swapOrder(idx, idx + 1) }

async function swapOrder(a, b) {
  const catA = categories.value[a], catB = categories.value[b]
  const oA = catA.display_order, oB = catB.display_order
  await Promise.all([
    supabase.from('kinora_content_categories').update({ display_order: oB }).eq('id', catA.id),
    supabase.from('kinora_content_categories').update({ display_order: oA }).eq('id', catB.id),
  ])
  catA.display_order = oB; catB.display_order = oA
  categories.value.sort((x, y) => x.display_order - y.display_order)
}

async function confirmDelete(cat) {
  if (!confirm(`Hapus kategori "${cat.name}"?`)) return
  await supabase.from('kinora_content_categories').delete().eq('id', cat.id)
  await loadCategories()
}

onMounted(loadCategories)
</script>
