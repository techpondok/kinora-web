<template>
  <ConsultantLayout>
    <div class="space-y-6">
      <!-- Loading -->
      <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat...</div>

      <template v-else>
      <div>
        <h1 class="text-xl font-bold text-gray-900">Pengaturan</h1>
        <p class="text-sm text-gray-500">Kelola preferensi akun dan konsultasi Anda.</p>
      </div>

      <!-- Account -->
      <section class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="font-semibold text-gray-900 mb-4">Akun</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input type="email" v-model="settings.email" disabled class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Bahasa</label>
            <select v-model="settings.language" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 outline-none">
              <option value="id">Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Zona Waktu</label>
            <select v-model="settings.timezone" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 outline-none">
              <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Password</label>
            <button class="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-700">Ubah Password</button>
          </div>
        </div>
      </section>

      <!-- Schedule Preferences -->
      <section class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="font-semibold text-gray-900 mb-4">Preferensi Jadwal</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-900">Buffer antar sesi</p>
              <p class="text-xs text-gray-500">Jeda waktu antara sesi konsultasi</p>
            </div>
            <select v-model="settings.bufferTime" class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
              <option value="0">Tanpa buffer</option>
              <option value="10">10 menit</option>
              <option value="15">15 menit</option>
              <option value="30">30 menit</option>
            </select>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-900">Booking minimum advance</p>
              <p class="text-xs text-gray-500">Waktu minimum sebelum sesi bisa dipesan</p>
            </div>
            <select v-model="settings.minAdvance" class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
              <option value="1">1 jam</option>
              <option value="3">3 jam</option>
              <option value="6">6 jam</option>
              <option value="24">24 jam</option>
            </select>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-900">Auto-accept booking</p>
              <p class="text-xs text-gray-500">Terima permintaan konsultasi otomatis</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="settings.autoAccept" class="sr-only peer" />
              <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
        </div>
      </section>

      <!-- Consultation Preferences -->
      <section class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="font-semibold text-gray-900 mb-4">Preferensi Konsultasi</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-900">Notifikasi pengingat</p>
              <p class="text-xs text-gray-500">Kirim pengingat sebelum sesi dimulai</p>
            </div>
            <select v-model="settings.reminderTime" class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
              <option value="15">15 menit</option>
              <option value="30">30 menit</option>
              <option value="60">1 jam</option>
            </select>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-900">Maks konsultasi per hari</p>
              <p class="text-xs text-gray-500">Batas maksimum sesi dalam sehari</p>
            </div>
            <select v-model="settings.maxPerDay" class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
              <option value="3">3 sesi</option>
              <option value="5">5 sesi</option>
              <option value="8">8 sesi</option>
              <option value="0">Tanpa batas</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Integrations -->
      <section class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="font-semibold text-gray-900 mb-4">Integrasi</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 rounded-lg border border-gray-100">
            <div class="flex items-center gap-3">
              <span class="text-lg">📅</span>
              <div>
                <p class="text-sm font-medium text-gray-900">Google Calendar</p>
                <p class="text-xs text-gray-500">Sinkronisasi jadwal dengan Google Calendar</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="settings.googleCalendar" class="sr-only peer" />
              <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg border border-gray-100">
            <div class="flex items-center gap-3">
              <span class="text-lg">📹</span>
              <div>
                <p class="text-sm font-medium text-gray-900">Google Meet Auto-Create</p>
                <p class="text-xs text-gray-500">Buat link Google Meet otomatis untuk sesi video</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="settings.googleMeetAuto" class="sr-only peer" />
              <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
        </div>
      </section>

      <!-- Privacy -->
      <section class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="font-semibold text-gray-900 mb-4">Privasi</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-900">Tampilkan di direktori publik</p>
              <p class="text-xs text-gray-500">Profil Anda terlihat di halaman pencarian konsultan</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="settings.publicDirectory" class="sr-only peer" />
              <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-900">Tampilkan rating di profil</p>
              <p class="text-xs text-gray-500">Klien dapat melihat rating Anda</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="settings.showRating" class="sr-only peer" />
              <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
        </div>
      </section>

      <!-- Save -->
      <div class="flex items-center justify-end gap-3">
        <span v-if="saveMessage" class="text-xs text-green-600">{{ saveMessage }}</span>
        <button @click="saveSettings" :disabled="saving" class="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
          {{ saving ? 'Menyimpan...' : 'Simpan Pengaturan' }}
        </button>
      </div>
      </template>
    </div>
  </ConsultantLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase.js'
import ConsultantLayout from '../../components/ConsultantLayout.vue'

const loading = ref(true)
const saving = ref(false)
const saveMessage = ref('')

const settings = ref({
  email: '',
  language: 'id',
  timezone: 'Asia/Jakarta',
  bufferTime: '15',
  minAdvance: '3',
  autoAccept: false,
  reminderTime: '30',
  maxPerDay: '5',
  googleCalendar: false,
  googleMeetAuto: false,
  publicDirectory: true,
  showRating: true,
})

let consultantId = null

async function loadSettings() {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }

  settings.value.email = user.email || ''

  const { data: profile } = await supabase
    .from('kinora_consultants')
    .select('id, is_active, meeting_enabled')
    .eq('consultant_user_id', user.id)
    .maybeSingle()

  if (profile) {
    consultantId = profile.id
    settings.value.publicDirectory = profile.is_active ?? true
  }

  loading.value = false
}

async function saveSettings() {
  saving.value = true
  saveMessage.value = ''

  if (consultantId) {
    await supabase
      .from('kinora_consultants')
      .update({ is_active: settings.value.publicDirectory })
      .eq('id', consultantId)
  }

  saving.value = false
  saveMessage.value = 'Tersimpan!'
  setTimeout(() => { saveMessage.value = '' }, 3000)
}

onMounted(loadSettings)
</script>
