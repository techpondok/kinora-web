<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">About Kinora</h1>
        <p class="text-sm text-gray-500">Kelola konten halaman About yang tampil di website.</p>
      </div>
      <div class="flex gap-2">
        <button @click="save" :disabled="saving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{{ saving ? 'Menyimpan...' : 'Simpan' }}</button>
        <a href="/about" target="_blank" class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Preview</a>
      </div>
    </div>

    <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat...</div>
    <div v-else-if="saveMsg" class="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{{ saveMsg }}</div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200 overflow-x-auto" v-if="!loading">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="['px-4 py-2.5 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px', activeTab === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700']">
        {{ tab.label }}
      </button>
    </div>

    <div v-if="!loading" class="space-y-4">
      <!-- Hero -->
      <div v-if="activeTab === 'hero'" class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 class="font-semibold text-gray-900 text-sm">Hero Section</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Judul Utama</label><input v-model="data.hero.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Subtitle</label><textarea v-model="data.hero.subtitle" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
          <div><label class="block text-xs text-gray-500 mb-1">CTA Primary</label><input v-model="data.hero.cta_primary" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">CTA Primary Link</label><input v-model="data.hero.cta_primary_link" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">CTA Secondary</label><input v-model="data.hero.cta_secondary" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">CTA Secondary Link</label><input v-model="data.hero.cta_secondary_link" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        </div>
      </div>

      <!-- Story -->
      <div v-if="activeTab === 'story'" class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 class="font-semibold text-gray-900 text-sm">Our Story</h3>
        <div><label class="block text-xs text-gray-500 mb-1">Title</label><input v-model="data.story.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <div><label class="block text-xs text-gray-500 mb-1">Content</label><textarea v-model="data.story.content" rows="8" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
      </div>

      <!-- Vision -->
      <div v-if="activeTab === 'vision'" class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 class="font-semibold text-gray-900 text-sm">Vision</h3>
        <div><label class="block text-xs text-gray-500 mb-1">Title</label><input v-model="data.vision.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <div><label class="block text-xs text-gray-500 mb-1">Description</label><textarea v-model="data.vision.description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
      </div>

      <!-- Missions -->
      <div v-if="activeTab === 'missions'" class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 text-sm">Missions</h3>
          <button @click="data.missions.push({icon:'', title:'', description:''})" class="text-xs text-blue-600 hover:underline">+ Tambah</button>
        </div>
        <div v-for="(m, i) in data.missions" :key="i" class="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
          <div class="col-span-1"><label class="block text-xs text-gray-500 mb-1">Icon</label><input v-model="m.icon" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none text-center" /></div>
          <div class="col-span-3"><label class="block text-xs text-gray-500 mb-1">Title</label><input v-model="m.title" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" /></div>
          <div class="col-span-7"><label class="block text-xs text-gray-500 mb-1">Description</label><input v-model="m.description" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" /></div>
          <div class="col-span-1 text-center"><button @click="data.missions.splice(i, 1)" class="text-red-500 text-sm">✕</button></div>
        </div>
      </div>

      <!-- Values -->
      <div v-if="activeTab === 'values'" class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 text-sm">Core Values</h3>
          <button @click="data.values.push({title:'', description:''})" class="text-xs text-blue-600 hover:underline">+ Tambah</button>
        </div>
        <div v-for="(v, i) in data.values" :key="i" class="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
          <div class="col-span-3"><label class="block text-xs text-gray-500 mb-1">Title</label><input v-model="v.title" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" /></div>
          <div class="col-span-8"><label class="block text-xs text-gray-500 mb-1">Description</label><input v-model="v.description" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" /></div>
          <div class="col-span-1 text-center"><button @click="data.values.splice(i, 1)" class="text-red-500 text-sm">✕</button></div>
        </div>
      </div>

      <!-- Founder -->
      <div v-if="activeTab === 'founder'" class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 class="font-semibold text-gray-900 text-sm">Founder</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block text-xs text-gray-500 mb-1">Nama</label><input v-model="data.founder.name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">Title/Jabatan</label><input v-model="data.founder.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Photo URL</label><input v-model="data.founder.photo_url" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Bio</label><textarea v-model="data.founder.bio" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
          <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Quote</label><input v-model="data.founder.quote" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        </div>
      </div>

      <!-- Team Roles -->
      <div v-if="activeTab === 'team'" class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 text-sm">Behind Kinora (Roles)</h3>
          <button @click="data.team_roles.push({icon:'', title:'', description:''})" class="text-xs text-blue-600 hover:underline">+ Tambah</button>
        </div>
        <div v-for="(t, i) in data.team_roles" :key="i" class="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
          <div class="col-span-1"><input v-model="t.icon" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none text-center" /></div>
          <div class="col-span-3"><input v-model="t.title" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" placeholder="Title" /></div>
          <div class="col-span-7"><input v-model="t.description" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" placeholder="Description" /></div>
          <div class="col-span-1 text-center"><button @click="data.team_roles.splice(i, 1)" class="text-red-500 text-sm">✕</button></div>
        </div>
      </div>

      <!-- Contact & SEO -->
      <div v-if="activeTab === 'contact'" class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 class="font-semibold text-gray-900 text-sm">Contact & SEO</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block text-xs text-gray-500 mb-1">Email</label><input v-model="data.contact.email" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">Phone</label><input v-model="data.contact.phone" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">SEO Title</label><input v-model="data.seo.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Meta Description</label><textarea v-model="data.seo.description" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
        </div>
      </div>

      <!-- Commitments -->
      <div v-if="activeTab === 'commitments'" class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 text-sm">Commitments</h3>
          <button @click="data.commitments.push('')" class="text-xs text-blue-600 hover:underline">+ Tambah</button>
        </div>
        <div v-for="(c, i) in data.commitments" :key="i" class="flex gap-2">
          <input v-model="data.commitments[i]" type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          <button @click="data.commitments.splice(i, 1)" class="text-red-500 text-sm px-2">✕</button>
        </div>
      </div>

      <!-- Future Areas -->
      <div v-if="activeTab === 'future'" class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 text-sm">Future Areas</h3>
          <button @click="data.future_areas.push('')" class="text-xs text-blue-600 hover:underline">+ Tambah</button>
        </div>
        <div v-for="(a, i) in data.future_areas" :key="i" class="flex gap-2">
          <input v-model="data.future_areas[i]" type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          <button @click="data.future_areas.splice(i, 1)" class="text-red-500 text-sm px-2">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const loading = ref(true)
const saving = ref(false)
const saveMsg = ref('')
const activeTab = ref('hero')

const tabs = [
  { id: 'hero', label: 'Hero' },
  { id: 'story', label: 'Story' },
  { id: 'vision', label: 'Vision' },
  { id: 'missions', label: 'Missions' },
  { id: 'values', label: 'Values' },
  { id: 'founder', label: 'Founder' },
  { id: 'team', label: 'Team' },
  { id: 'commitments', label: 'Commitments' },
  { id: 'future', label: 'Future' },
  { id: 'contact', label: 'Contact & SEO' },
]

const data = ref({
  hero: { title: '', subtitle: '', cta_primary: '', cta_primary_link: '', cta_secondary: '', cta_secondary_link: '' },
  story: { title: '', content: '' },
  vision: { title: '', description: '' },
  missions: [],
  values: [],
  founder: { name: '', title: '', photo_url: '', bio: '', quote: '' },
  team_roles: [],
  commitments: [],
  future_areas: [],
  contact: { email: '', phone: '' },
  seo: { title: '', description: '' },
})

async function load() {
  loading.value = true
  const { data: row } = await supabase
    .from('kinora_landing_config')
    .select('value')
    .eq('key', 'about')
    .maybeSingle()
  if (row?.value) {
    data.value = { ...data.value, ...row.value }
  }
  loading.value = false
}

async function save() {
  saving.value = true
  saveMsg.value = ''
  const { error } = await supabase
    .from('kinora_landing_config')
    .update({ value: data.value, updated_at: new Date().toISOString() })
    .eq('key', 'about')
  saving.value = false
  saveMsg.value = error ? 'Gagal menyimpan.' : 'Tersimpan!'
  setTimeout(() => { saveMsg.value = '' }, 3000)
}

onMounted(load)
</script>
