<template>
  <ConsultantLayout>
    <div class="space-y-6">
      <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat...</div>

      <template v-else>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-gray-900">Layanan Saya</h1>
            <p class="text-sm text-gray-500">Kelola layanan konsultasi yang Anda tawarkan.</p>
          </div>
          <button @click="openEditor(null)" class="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition">+ Tambah Layanan</button>
        </div>

        <!-- Empty state -->
        <div v-if="services.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p class="text-gray-500 text-sm mb-2">Belum ada layanan.</p>
          <button @click="openEditor(null)" class="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600">Tambah Layanan Pertama</button>
        </div>

        <!-- Services List -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="s in services" :key="s.id" class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="text-sm font-semibold text-gray-900">{{ s.name }}</h3>
                <p class="text-xs text-gray-500">{{ s.category }}</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" :checked="s.is_active" @change="toggleActive(s)" class="sr-only peer" />
                <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            <p v-if="s.description" class="text-xs text-gray-500 mb-3">{{ s.description }}</p>

            <div class="grid grid-cols-2 gap-2 mb-3">
              <div class="bg-gray-50 rounded-lg p-2">
                <p class="text-[10px] text-gray-400 uppercase">Durasi</p>
                <p class="text-sm font-medium text-gray-900">{{ s.duration_minutes }} menit</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-2">
                <p class="text-[10px] text-gray-400 uppercase">Harga</p>
                <p class="text-sm font-medium text-gray-900">{{ formatPrice(s.price) }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2 mb-3">
              <span v-for="m in s.methods" :key="m" class="px-2 py-0.5 text-[10px] rounded-full font-medium" :class="m === 'chat' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'">
                {{ m === 'chat' ? '💬 Chat' : '📹 Google Meet' }}
              </span>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
              <span class="text-xs" :class="s.is_active ? 'text-green-600' : 'text-gray-400'">{{ s.is_active ? 'Aktif' : 'Nonaktif' }}</span>
              <div class="flex gap-2">
                <button @click="openEditor(s)" class="text-xs text-blue-600 hover:underline">Edit</button>
                <button @click="deleteService(s)" class="text-xs text-red-500 hover:underline">Hapus</button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Editor Modal -->
      <div v-if="showEditor" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="showEditor = false" class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4">
          <h3 class="font-bold text-gray-900">{{ form.id ? 'Edit Layanan' : 'Tambah Layanan' }}</h3>

          <div v-if="saveError" class="p-2 bg-red-50 text-red-700 text-xs rounded-lg">{{ saveError }}</div>

          <div>
            <label class="block text-xs text-gray-500 mb-1">Nama Layanan *</label>
            <input v-model="form.name" type="text" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="Konseling Keluarga" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Kategori *</label>
            <select v-model="form.category" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500">
              <option value="kesehatan_umum">Kesehatan Umum</option>
              <option value="kesehatan_anak">Kesehatan Anak</option>
              <option value="psikologi">Psikologi</option>
              <option value="psikologi_anak">Psikologi Anak</option>
              <option value="parenting">Parenting</option>
              <option value="konseling_keluarga">Konseling Keluarga</option>
              <option value="konseling_pernikahan">Konseling Pernikahan</option>
              <option value="konseling_remaja">Konseling Remaja</option>
              <option value="gizi">Gizi</option>
              <option value="pendidikan">Pendidikan</option>
              <option value="karier">Karier</option>
              <option value="keuangan_keluarga">Keuangan Keluarga</option>
              <option value="tumbuh_kembang">Tumbuh Kembang</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Deskripsi</label>
            <textarea v-model="form.description" rows="2" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none" placeholder="Deskripsi singkat layanan..."></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Durasi (menit) *</label>
              <input v-model.number="form.duration_minutes" type="number" min="15" step="15" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Harga (IDR) *</label>
              <input v-model.number="form.price" type="number" min="0" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Metode Konsultasi *</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="methodChat" class="rounded" /> 💬 Chat Kinora</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="methodMeet" class="rounded" /> 📹 Google Meet</label>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="form.allow_scheduled" class="rounded" /> Konsultasi Terjadwal</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="form.allow_instant" class="rounded" /> Konsultasi Instan</label>
          </div>
          <div v-if="form.allow_instant">
            <label class="block text-xs text-gray-500 mb-1">Harga Instan (IDR)</label>
            <input v-model.number="form.instant_price" type="number" min="0" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500" />
          </div>

          <div class="flex gap-3 pt-2">
            <button @click="saveService" :disabled="saving" class="flex-1 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition">
              {{ saving ? 'Menyimpan...' : (form.id ? 'Simpan' : 'Buat Layanan') }}
            </button>
            <button @click="showEditor = false" class="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition">Batal</button>
          </div>
        </div>
      </div>
    </div>
  </ConsultantLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase.js'
import ConsultantLayout from '../../components/ConsultantLayout.vue'

const loading = ref(true)
const services = ref([])
const consultantId = ref(null)
const showEditor = ref(false)
const saving = ref(false)
const saveError = ref('')
const methodChat = ref(true)
const methodMeet = ref(false)

const defaultForm = { id: null, name: '', category: 'lainnya', description: '', duration_minutes: 30, price: 0, instant_price: 0, allow_scheduled: true, allow_instant: false }
const form = ref({ ...defaultForm })

function formatPrice(amount) {
  if (!amount) return 'Gratis'
  return 'Rp ' + Number(amount).toLocaleString('id-ID')
}

async function loadServices() {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }

  const { data: profile } = await supabase.from('kinora_consultants').select('id').eq('consultant_user_id', user.id).maybeSingle()
  if (!profile) { loading.value = false; return }
  consultantId.value = profile.id

  const { data } = await supabase
    .from('kinora_consultant_services')
    .select('*')
    .eq('consultant_id', profile.id)
    .order('created_at', { ascending: false })

  services.value = data || []
  loading.value = false
}

function openEditor(service) {
  saveError.value = ''
  if (service) {
    form.value = { ...service }
    methodChat.value = (service.methods || []).includes('chat')
    methodMeet.value = (service.methods || []).includes('google_meet')
  } else {
    form.value = { ...defaultForm }
    methodChat.value = true
    methodMeet.value = false
  }
  showEditor.value = true
}

async function saveService() {
  if (!form.value.name) { saveError.value = 'Nama layanan wajib diisi.'; return }
  if (!form.value.duration_minutes || form.value.duration_minutes < 15) { saveError.value = 'Durasi minimal 15 menit.'; return }
  if (!methodChat.value && !methodMeet.value) { saveError.value = 'Pilih minimal satu metode konsultasi.'; return }

  saving.value = true
  saveError.value = ''

  const methods = []
  if (methodChat.value) methods.push('chat')
  if (methodMeet.value) methods.push('google_meet')

  const payload = {
    consultant_id: consultantId.value,
    name: form.value.name,
    category: form.value.category,
    description: form.value.description || null,
    duration_minutes: form.value.duration_minutes,
    price: form.value.price || 0,
    instant_price: form.value.instant_price || 0,
    methods,
    allow_scheduled: form.value.allow_scheduled,
    allow_instant: form.value.allow_instant,
    is_active: true,
    updated_at: new Date().toISOString(),
  }

  try {
    if (form.value.id) {
      const { error } = await supabase.from('kinora_consultant_services').update(payload).eq('id', form.value.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('kinora_consultant_services').insert(payload)
      if (error) throw error
    }
    showEditor.value = false
    await loadServices()
  } catch (e) {
    saveError.value = e.message || 'Gagal menyimpan layanan.'
  } finally {
    saving.value = false
  }
}

async function toggleActive(service) {
  const newStatus = !service.is_active
  await supabase.from('kinora_consultant_services').update({ is_active: newStatus, updated_at: new Date().toISOString() }).eq('id', service.id)
  service.is_active = newStatus
}

async function deleteService(service) {
  if (!confirm(`Hapus layanan "${service.name}"?`)) return
  const { error } = await supabase.from('kinora_consultant_services').delete().eq('id', service.id)
  if (error) {
    alert('Gagal menghapus: ' + error.message)
    return
  }
  services.value = services.value.filter(s => s.id !== service.id)
}

onMounted(loadServices)
</script>
