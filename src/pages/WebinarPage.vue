<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Webinar</h1>
      <button @click="editingWebinar = {}; showEditor = true" class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">+ Buat Webinar</button>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-500">Memuat...</div>

    <div v-else-if="webinars.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div class="text-4xl mb-3">🎓</div>
      <p class="text-gray-500">Belum ada webinar.</p>
    </div>

    <div v-else class="space-y-4">
      <div v-for="w in webinars" :key="w.id" class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition">
        <div class="flex">
          <div class="w-40 h-24 bg-gray-100 flex-shrink-0">
            <img v-if="w.cover_url" :src="w.cover_url" :alt="w.title" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-2xl text-gray-300">🎓</div>
          </div>
          <div class="flex-1 min-w-0 p-4 flex items-center gap-4">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 text-sm truncate">{{ w.title }}</p>
              <p class="text-xs text-gray-500">{{ w.speaker_name || '-' }} · {{ formatDate(w.scheduled_at) }}</p>
              <div class="flex gap-2 mt-1">
                <span :class="w.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="px-2 py-0.5 text-xs rounded-full">{{ w.is_published ? 'Published' : 'Draft' }}</span>
                <span v-if="!w.cover_url" class="px-2 py-0.5 text-xs rounded-full bg-amber-50 text-amber-600">No Poster</span>
                <span class="text-xs text-gray-400">{{ w.is_free ? 'Gratis' : 'Rp ' + Number(w.price_amount).toLocaleString('id-ID') }}</span>
                <span class="text-xs text-gray-400">{{ w.meeting_platform }}</span>
              </div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <button @click="viewRegistrations(w)" class="text-xs text-purple-600 hover:underline">Peserta</button>
              <button @click="editingWebinar = prepareForEdit(w); showEditor = true" class="text-xs text-blue-600 hover:underline">Edit</button>
              <button @click="togglePublish(w)" class="text-xs" :class="w.is_published ? 'text-orange-600' : 'text-green-600'">{{ w.is_published ? 'Unpublish' : 'Publish' }}</button>
              <button @click="confirmDelete(w)" class="text-xs text-red-600 hover:underline">Hapus</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor Modal -->
    <div v-if="showEditor" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-4">
        <h3 class="font-semibold text-gray-900">{{ editingWebinar.id ? 'Edit Webinar' : 'Buat Webinar' }}</h3>
        <div v-if="editorError" class="p-2 bg-red-50 text-red-700 text-xs rounded">{{ editorError }}</div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">Judul</label>
          <input v-model="editingWebinar.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Deskripsi</label>
          <textarea v-model="editingWebinar.description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Pembicara</label>
            <input v-model="editingWebinar.speaker_name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Platform</label>
            <select v-model="editingWebinar.meeting_platform" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="zoom">Zoom</option>
              <option value="gmeet">Google Meet</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Meeting URL</label>
          <input v-model="editingWebinar.meeting_url" type="url" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Jadwal</label>
            <input v-model="editingWebinar.scheduled_at" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Selesai</label>
            <input v-model="editingWebinar.end_at" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="editingWebinar.is_free" class="rounded" /> Gratis (semua peserta)</label>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Pricing Strategy</label>
            <select v-model="editingWebinar.pricing_strategy" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" :disabled="editingWebinar.is_free">
              <option value="fixed">Harga Tetap</option>
              <option value="tiered">3-Tier Pricing</option>
            </select>
          </div>
        </div>

        <!-- Fixed Price -->
        <div v-if="!editingWebinar.is_free && editingWebinar.pricing_strategy !== 'tiered'">
          <label class="block text-xs text-gray-500 mb-1">Harga Normal (IDR)</label>
          <input v-model.number="editingWebinar.price_amount" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
        </div>

        <!-- 3-Tier Pricing Configuration -->
        <div v-if="!editingWebinar.is_free && editingWebinar.pricing_strategy === 'tiered'" class="border-t border-gray-100 pt-4 space-y-4">
          <h4 class="text-xs font-semibold text-gray-500 uppercase">3-Tier Pricing</h4>

          <!-- TIER 1: Free Early Bird -->
          <div class="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
            <label class="flex items-center gap-2 text-sm font-medium text-green-800">
              <input type="checkbox" v-model="editingWebinar.free_early_bird_enabled" class="rounded text-green-600" /> 🎁 FREE EARLY BIRD
            </label>
            <div v-if="editingWebinar.free_early_bird_enabled">
              <label class="block text-xs text-gray-500 mb-1">Quota (peserta gratis)</label>
              <input v-model.number="editingWebinar.free_early_bird_quota" type="number" min="1" class="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="10" />
            </div>
          </div>

          <!-- TIER 2: Early Price -->
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
            <label class="flex items-center gap-2 text-sm font-medium text-amber-800">
              <input type="checkbox" v-model="editingWebinar.early_price_enabled" class="rounded text-amber-600" /> 🔥 EARLY PRICE
            </label>
            <div v-if="editingWebinar.early_price_enabled" class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Harga Early (IDR)</label>
                <input v-model.number="editingWebinar.early_price_amount" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="25000" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Quota</label>
                <input v-model.number="editingWebinar.early_price_quota" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="20" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Period Start (optional)</label>
                <input v-model="editingWebinar.early_price_start" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Period End (optional)</label>
                <input v-model="editingWebinar.early_price_end" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
              </div>
            </div>
          </div>

          <!-- TIER 3: Normal Price -->
          <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
            <p class="text-sm font-medium text-gray-700">💰 NORMAL PRICE</p>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Harga Normal (IDR)</label>
              <input v-model.number="editingWebinar.normal_price_amount" type="number" min="0" class="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="50000" />
            </div>
          </div>

          <!-- Preview -->
          <div class="text-[10px] text-gray-400 bg-gray-50 rounded p-2">
            <p v-if="editingWebinar.free_early_bird_enabled">Peserta #1–#{{ editingWebinar.free_early_bird_quota || '?' }} → GRATIS</p>
            <p v-if="editingWebinar.early_price_enabled">Peserta #{{ (editingWebinar.free_early_bird_enabled ? (editingWebinar.free_early_bird_quota || 0) : 0) + 1 }}–#{{ (editingWebinar.free_early_bird_enabled ? (editingWebinar.free_early_bird_quota || 0) : 0) + (editingWebinar.early_price_quota || 0) }} → Rp{{ Number(editingWebinar.early_price_amount || 0).toLocaleString('id-ID') }}</p>
            <p>Peserta selanjutnya → Rp{{ Number(editingWebinar.normal_price_amount || 0).toLocaleString('id-ID') }}</p>
          </div>
        </div>

        <!-- Payment Configuration (paid only) -->
        <div v-if="!editingWebinar.is_free" class="border-t border-gray-100 pt-4 space-y-3">
          <h4 class="text-xs font-semibold text-gray-500 uppercase">Pembayaran</h4>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Payment Gateway</label>
            <select v-model="editingWebinar.payment_method" class="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="sumopod">SumoPod</option>
              <option value="manual">Transfer Manual</option>
            </select>
          </div>
          <!-- Global App Fee (read-only preview) -->
          <div class="p-3 bg-gray-50 border border-gray-100 rounded-lg space-y-1">
            <p class="text-xs font-medium text-gray-600">Biaya Aplikasi</p>
            <p class="text-xs text-gray-500">
              <span v-if="globalWebinarFee.fixed">Rp{{ Number(globalWebinarFee.fixed).toLocaleString('id-ID') }} + </span>
              <span v-if="globalWebinarFee.percent">{{ globalWebinarFee.percent }}%</span>
              <span v-if="!globalWebinarFee.fixed && !globalWebinarFee.percent">Tidak ada biaya</span>
              <span class="ml-2 text-gray-400">· Ditanggung {{ globalWebinarFee.bearer === 'customer' ? 'Customer' : 'Platform' }}</span>
            </p>
            <p v-if="editingWebinar.price_amount && (globalWebinarFee.fixed || globalWebinarFee.percent)" class="text-xs text-purple-700 font-medium">
              Estimasi: Rp{{ calculatedWebinarFee.toLocaleString('id-ID') }} →
              Total Customer: Rp{{ (Number(editingWebinar.price_amount) + (globalWebinarFee.bearer === 'customer' ? calculatedWebinarFee : 0)).toLocaleString('id-ID') }}
            </p>
            <p class="text-[10px] text-gray-400 mt-1">Pengaturan ini mengikuti App Fee global. <button @click="$emit('navigate', 'settings')" type="button" class="text-purple-600 hover:underline">Ubah Pengaturan Biaya →</button></p>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="editingWebinar.allow_manual_payment" class="rounded" />
            Izinkan Transfer Manual (fallback)
          </label>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Poster / Pamflet Webinar</label>
          <p class="text-[10px] text-gray-400 mb-1">Rasio 16:9 disarankan. Maks 5MB. Format: JPEG, PNG, WebP.</p>
          <div v-if="editingWebinar.cover_url" class="mb-2 relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
            <img :src="editingWebinar.cover_url" class="w-full h-full object-cover" />
            <button @click="editingWebinar.cover_url = ''" class="absolute top-2 right-2 bg-red-500/90 text-white text-xs px-2 py-1 rounded-md hover:bg-red-600 transition">Hapus Poster</button>
          </div>
          <div v-else class="mb-2 w-full aspect-video rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
            <span class="text-2xl text-gray-300">🖼️</span>
            <span class="text-xs text-gray-400 mt-1">Belum ada poster</span>
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" @change="handleCoverUpload" class="text-xs" />
          <p v-if="coverUploading" class="text-xs text-blue-600 mt-1">Mengupload poster...</p>
          <p v-if="coverUploadError" class="text-xs text-red-600 mt-1">{{ coverUploadError }}</p>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Payment Instructions (jika berbayar)</label>
          <textarea v-model="editingWebinar.payment_instructions" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea>
        </div>

        <!-- Registration & Quota -->
        <div class="border-t border-gray-100 pt-4 space-y-3">
          <h4 class="text-xs font-semibold text-gray-500 uppercase">Pendaftaran & Kuota</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Mode Pendaftaran</label>
              <select v-model="editingWebinar.registration_mode" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="open">Auto Approve (langsung terdaftar)</option>
                <option value="approval">Manual Approval (Admin approve)</option>
                <option value="invitation">Undangan Saja</option>
              </select>
              <p class="text-[10px] text-gray-400 mt-1">
                <template v-if="editingWebinar.is_free && editingWebinar.registration_mode === 'open'">Gratis + Auto: User langsung terdaftar saat mendaftar.</template>
                <template v-else-if="editingWebinar.is_free && editingWebinar.registration_mode === 'approval'">Gratis + Manual: User mendaftar → Admin approve → terdaftar.</template>
                <template v-else-if="!editingWebinar.is_free && editingWebinar.registration_mode === 'open'">Berbayar + Auto: Bayar → otomatis terdaftar.</template>
                <template v-else-if="!editingWebinar.is_free && editingWebinar.registration_mode === 'approval'">Berbayar + Manual: Bayar → Admin approve → terdaftar.</template>
                <template v-else>Hanya user yang diundang bisa mendaftar.</template>
              </p>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Maks Peserta</label>
              <input v-model.number="editingWebinar.max_participants" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="0 = tanpa batas" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Deadline Pendaftaran</label>
              <input v-model="editingWebinar.registration_deadline" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Link Tampil (menit sebelum)</label>
              <input v-model.number="editingWebinar.link_visible_before_minutes" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="60" />
            </div>
          </div>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="editingWebinar.allow_waiting_list" class="rounded" /> Izinkan Waiting List</label>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Slug</label>
            <input v-model="editingWebinar.slug" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" placeholder="auto-generated" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button @click="showEditor = false; editorError = ''" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
          <button @click="saveWebinar" :disabled="savingWebinar" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ savingWebinar ? 'Menyimpan...' : (editingWebinar.id ? 'Simpan Perubahan' : 'Simpan') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Registrations Drawer -->
    <div v-if="showRegistrations" class="fixed inset-0 z-50 flex justify-end">
      <div @click="showRegistrations = false" class="absolute inset-0 bg-black/40"></div>
      <div class="relative bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl">
        <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 class="font-bold text-gray-900">Peserta Webinar</h3>
            <p class="text-xs text-gray-500">{{ selectedWebinar?.title }}</p>
          </div>
          <button @click="showRegistrations = false" class="p-2 hover:bg-gray-100 rounded-lg">✕</button>
        </div>
        <div class="p-6 space-y-4">
          <!-- Stats -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="text-center p-2 bg-green-50 rounded-lg"><p class="text-lg font-bold text-green-700">{{ confirmedCount }}</p><p class="text-[10px] text-gray-500">Terdaftar</p></div>
            <div class="text-center p-2 bg-amber-50 rounded-lg"><p class="text-lg font-bold text-amber-700">{{ pendingApprovalCount }}</p><p class="text-[10px] text-gray-500">Menunggu Persetujuan</p></div>
            <div class="text-center p-2 bg-purple-50 rounded-lg"><p class="text-lg font-bold text-purple-700">{{ pendingPaymentCount }}</p><p class="text-[10px] text-gray-500">Menunggu Pembayaran</p></div>
            <div class="text-center p-2 bg-blue-50 rounded-lg"><p class="text-lg font-bold text-blue-700">{{ registrations.filter(r => r.status === 'waitlisted').length }}</p><p class="text-[10px] text-gray-500">Waitlist</p></div>
          </div>

          <!-- Info -->
          <div class="text-xs text-gray-500 flex gap-3">
            <span>Mode: <strong>{{ selectedWebinar?.is_free ? 'Gratis' : 'Berbayar' }}</strong></span>
            <span>Approval: <strong>{{ selectedWebinar?.registration_mode === 'approval' ? 'Manual' : 'Auto' }}</strong></span>
          </div>

          <!-- List -->
          <div v-if="registrations.length === 0" class="text-center py-8 text-gray-400 text-sm">Belum ada peserta.</div>
          <div v-else class="space-y-2">
            <div v-for="r in registrations" :key="r.id" class="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
              <div>
                <p class="text-sm font-medium text-gray-900">{{ r.user_name || 'User' }}</p>
                <p class="text-xs text-gray-500">{{ formatDate(r.registered_at) }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="regStatusClass(getDisplayStatus(r))">{{ getDisplayLabel(r) }}</span>
                <!-- Show Approve/Reject only when manual approval is needed -->
                <template v-if="canApprove(r)">
                  <button @click="approveReg(r)" class="text-xs text-green-600 hover:underline">Approve</button>
                  <button @click="rejectReg(r)" class="text-xs text-red-600 hover:underline">Reject</button>
                </template>
                <button v-if="r.status === 'waitlisted'" @click="promoteReg(r)" class="text-xs text-blue-600 hover:underline">Promote</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete modal -->
    <div v-if="deletingWebinar" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h3 class="font-semibold text-gray-900">Hapus Webinar</h3>
        <p class="text-sm text-gray-600 mt-2">Yakin hapus "<strong>{{ deletingWebinar.title }}</strong>"?</p>
        <div class="flex justify-end gap-3 mt-5">
          <button @click="deletingWebinar = null" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
          <button @click="doDelete" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Hapus</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const emit = defineEmits(['navigate'])

const webinars = ref([])
const loading = ref(true)
const showEditor = ref(false)
const editingWebinar = ref({})
const savingWebinar = ref(false)
const editorError = ref('')
const deletingWebinar = ref(null)
const coverUploading = ref(false)
const coverUploadError = ref('')

// Global App Fee for Webinar (loaded from kinora_payment_settings)
const globalWebinarFee = ref({ fixed: 0, percent: 0, bearer: 'customer' })

const calculatedWebinarFee = computed(() => {
  const price = Number(editingWebinar.value.price_amount) || 0
  const fixed = Number(globalWebinarFee.value.fixed) || 0
  const percent = Number(globalWebinarFee.value.percent) || 0
  return Math.round(fixed + (price * percent / 100))
})

async function loadGlobalFee() {
  const { data } = await supabase
    .from('kinora_payment_settings')
    .select('webinar_app_fee_fixed, webinar_app_fee_percent, webinar_fee_bearer')
    .eq('id', 1)
    .single()
  if (data) {
    globalWebinarFee.value = {
      fixed: data.webinar_app_fee_fixed || 0,
      percent: data.webinar_app_fee_percent || 0,
      bearer: data.webinar_fee_bearer || 'customer',
    }
  }
}

async function handleCoverUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  coverUploadError.value = ''

  if (file.size > 5 * 1024 * 1024) { coverUploadError.value = 'Max 5MB'; return }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { coverUploadError.value = 'Format: JPEG, PNG, WebP'; return }

  coverUploading.value = true
  const date = new Date()
  const path = `webinars/${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/cover-${Date.now()}.${file.name.split('.').pop()}`

  const { error } = await supabase.storage.from('articles').upload(path, file, { cacheControl: '31536000', upsert: false })
  if (error) {
    coverUploadError.value = error.message
  } else {
    const { data: urlData } = supabase.storage.from('articles').getPublicUrl(path)
    editingWebinar.value.cover_url = urlData.publicUrl
  }
  coverUploading.value = false
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Convert ISO/DB timestamp to datetime-local format (YYYY-MM-DDTHH:MM) */
function toDatetimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (isNaN(date.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Prepare webinar for editing — convert timestamps for datetime-local inputs */
function prepareForEdit(webinar) {
  return {
    ...webinar,
    scheduled_at: toDatetimeLocal(webinar.scheduled_at),
    end_at: toDatetimeLocal(webinar.end_at),
    registration_deadline: toDatetimeLocal(webinar.registration_deadline),
    payment_method: webinar.payment_method || 'sumopod',
    allow_manual_payment: webinar.allow_manual_payment || false,
  }
}

async function loadWebinars() {
  loading.value = true
  const { data } = await supabase.from('kinora_webinars').select('*').order('scheduled_at', { ascending: false })
  webinars.value = data || []
  loading.value = false
}

async function saveWebinar() {
  editorError.value = ''
  if (!editingWebinar.value.title) { editorError.value = 'Judul wajib diisi'; return }
  if (!editingWebinar.value.scheduled_at) { editorError.value = 'Jadwal wajib diisi'; return }

  // Validate end_at > scheduled_at
  if (editingWebinar.value.end_at && editingWebinar.value.scheduled_at) {
    if (new Date(editingWebinar.value.end_at) <= new Date(editingWebinar.value.scheduled_at)) {
      editorError.value = 'Waktu selesai harus setelah waktu mulai.'
      return
    }
  }

  savingWebinar.value = true

  // Build payload with only the columns that exist in the database
  const form = editingWebinar.value
  const payload = {
    title: form.title,
    description: form.description || null,
    speaker_name: form.speaker_name || null,
    meeting_platform: form.meeting_platform || 'zoom',
    meeting_url: form.meeting_url || null,
    scheduled_at: form.scheduled_at || null,
    end_at: form.end_at || null,
    is_free: form.is_free ?? true,
    price_amount: form.is_free ? 0 : (Number(form.price_amount) || Number(form.normal_price_amount) || 0),
    cover_url: form.cover_url || null,
    payment_instructions: form.payment_instructions || null,
    payment_method: form.payment_method || 'sumopod',
    allow_manual_payment: form.allow_manual_payment || false,
    registration_mode: form.registration_mode || 'open',
    max_participants: Number(form.max_participants) || null,
    registration_deadline: form.registration_deadline || null,
    link_visible_before_minutes: Number(form.link_visible_before_minutes) || 60,
    allow_waiting_list: form.allow_waiting_list || false,
    slug: form.slug || null,
    // 3-Tier Pricing
    pricing_strategy: form.pricing_strategy || 'fixed',
    free_early_bird_enabled: form.free_early_bird_enabled || false,
    free_early_bird_quota: Number(form.free_early_bird_quota) || 0,
    early_price_enabled: form.early_price_enabled || false,
    early_price_amount: Number(form.early_price_amount) || 0,
    early_price_quota: Number(form.early_price_quota) || 0,
    early_price_start: form.early_price_start || null,
    early_price_end: form.early_price_end || null,
    normal_price_amount: Number(form.normal_price_amount) || Number(form.price_amount) || 0,
  }

  if (import.meta.env.VITE_APP_ENV === 'development') {
    console.log('[WEBINAR_EDIT][SUBMIT]', { webinarId: form.id || '(new)', payload })
  }

  let result
  if (form.id) {
    // UPDATE existing
    result = await supabase
      .from('kinora_webinars')
      .update(payload)
      .eq('id', form.id)
      .select()
      .single()
  } else {
    // INSERT new
    const { data: { user } } = await supabase.auth.getUser()
    payload.created_by = user?.id
    result = await supabase
      .from('kinora_webinars')
      .insert(payload)
      .select()
      .single()
  }

  if (result.error) {
    editorError.value = 'Gagal memperbarui webinar: ' + result.error.message
    if (import.meta.env.VITE_APP_ENV === 'development') {
      console.error('[WEBINAR_EDIT][ERROR]', { status: result.error.code, message: result.error.message })
    }
  } else {
    if (import.meta.env.VITE_APP_ENV === 'development') {
      console.log('[WEBINAR_EDIT][SUCCESS]', { webinarId: result.data?.id, updated: result.data })
    }
    showEditor.value = false
    editorError.value = ''
    loadWebinars()
  }
  savingWebinar.value = false
}

async function togglePublish(w) {
  await supabase.from('kinora_webinars').update({ is_published: !w.is_published }).eq('id', w.id)
  loadWebinars()
}

function confirmDelete(w) { deletingWebinar.value = w }

async function doDelete() {
  await supabase.from('kinora_webinars').delete().eq('id', deletingWebinar.value.id)
  deletingWebinar.value = null
  loadWebinars()
}

// --- Registrations ---
const showRegistrations = ref(false)
const selectedWebinar = ref(null)
const registrations = ref([])

async function viewRegistrations(w) {
  selectedWebinar.value = w
  showRegistrations.value = true
  const { data } = await supabase
    .from('kinora_webinar_registrations')
    .select('*, user:users!kinora_webinar_registrations_user_id_fkey(display_name)')
    .eq('webinar_id', w.id)
    .order('registered_at', { ascending: true })
  registrations.value = (data || []).map(r => ({ ...r, user_name: r.user?.display_name }))
}

function regStatusClass(s) {
  const map = {
    pending_payment: 'bg-purple-100 text-purple-700',
    pending_approval: 'bg-amber-100 text-amber-700',
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    registered: 'bg-green-100 text-green-700',
    paid: 'bg-green-100 text-green-700',
    paid_pending_approval: 'bg-blue-100 text-blue-700',
    waitlisted: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-600',
    cancelled: 'bg-gray-100 text-gray-500',
    attended: 'bg-emerald-100 text-emerald-700',
    expired: 'bg-gray-100 text-gray-500',
    failed: 'bg-red-50 text-red-500',
  }
  return map[s] || 'bg-gray-100 text-gray-500'
}

// Computed counters
const confirmedCount = computed(() => registrations.value.filter(r => ['approved', 'registered', 'paid', 'attended'].includes(r.status)).length)
const pendingApprovalCount = computed(() => registrations.value.filter(r => needsApproval(r)).length)
const pendingPaymentCount = computed(() => registrations.value.filter(r => isPendingPayment(r)).length)

/**
 * Determine display status for a registration based on webinar config.
 */
function getDisplayStatus(r) {
  const webinar = selectedWebinar.value
  if (!webinar) return r.status

  // Confirmed states
  if (['approved', 'registered', 'attended'].includes(r.status)) return 'approved'
  if (r.status === 'paid' && webinar.registration_mode !== 'approval') return 'approved'

  // Paid + manual approval
  if (r.status === 'paid' && webinar.registration_mode === 'approval') return 'paid_pending_approval'

  // Pending with payment_id but webinar is paid → payment pending
  if (r.status === 'pending' && !webinar.is_free && r.payment_id) return 'pending_payment'

  // Pending without payment for paid webinar → payment pending
  if (r.status === 'pending' && !webinar.is_free && !r.payment_id) return 'pending_payment'

  // Pending for free webinar with manual approval → pending approval
  if (r.status === 'pending' && webinar.is_free && webinar.registration_mode === 'approval') return 'pending_approval'

  // Pending for free + auto → should have been auto-approved
  if (r.status === 'pending' && webinar.is_free && webinar.registration_mode === 'open') return 'pending_approval'

  return r.status
}

/**
 * Human-readable label for the registration.
 */
function getDisplayLabel(r) {
  const ds = getDisplayStatus(r)
  const labels = {
    approved: 'Terdaftar',
    registered: 'Terdaftar',
    attended: 'Hadir',
    paid_pending_approval: 'Sudah Bayar — Menunggu Persetujuan',
    pending_approval: 'Menunggu Persetujuan',
    pending_payment: 'Menunggu Pembayaran',
    pending: 'Pending',
    waitlisted: 'Waitlist',
    rejected: 'Ditolak',
    cancelled: 'Dibatalkan',
    expired: 'Kedaluwarsa',
    failed: 'Gagal',
  }
  return labels[ds] || r.status
}

/**
 * Whether this registration should show Approve/Reject buttons.
 */
function canApprove(r) {
  const webinar = selectedWebinar.value
  if (!webinar) return false

  // Free + Manual Approval → pending registrations need approval
  if (webinar.is_free && webinar.registration_mode === 'approval' && r.status === 'pending') return true

  // Paid + Manual Approval → paid registrations need approval
  if (!webinar.is_free && webinar.registration_mode === 'approval' && r.status === 'paid') return true

  return false
}

/**
 * Check if registration is pending payment (for counter).
 */
function isPendingPayment(r) {
  const webinar = selectedWebinar.value
  if (!webinar || webinar.is_free) return false
  return r.status === 'pending'
}

/**
 * Check if registration needs manual approval (for counter).
 */
function needsApproval(r) {
  return canApprove(r)
}

async function approveReg(r) {
  await supabase.from('kinora_webinar_registrations').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', r.id)
  r.status = 'approved'
}

async function rejectReg(r) {
  await supabase.from('kinora_webinar_registrations').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', r.id)
  r.status = 'rejected'
}

async function promoteReg(r) {
  await supabase.from('kinora_webinar_registrations').update({ status: 'approved', promoted_at: new Date().toISOString() }).eq('id', r.id)
  r.status = 'approved'
}

onMounted(() => {
  loadWebinars()
  loadGlobalFee()
})
</script>
