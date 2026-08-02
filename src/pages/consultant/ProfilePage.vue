<template>
  <ConsultantLayout>
    <div class="space-y-6">
      <!-- Loading -->
      <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat...</div>

      <template v-else>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">Profil Konsultan</h1>
          <p class="text-sm text-gray-500">Kelola informasi profil publik Anda.</p>
        </div>
        <span class="px-3 py-1 text-xs rounded-full font-medium" :class="profile.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">{{ profile.is_active ? '✓ Aktif' : 'Nonaktif' }}</span>
      </div>

      <!-- Photo & Basic -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-center gap-4 mb-6">
          <div v-if="profile.avatar_url" class="w-20 h-20 rounded-full overflow-hidden">
            <img :src="profile.avatar_url" alt="Avatar" class="w-full h-full object-cover" />
          </div>
          <div v-else class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-2xl font-bold">{{ initials }}</div>
          <div>
            <p class="text-sm font-semibold text-gray-900">{{ profile.name }}</p>
            <p class="text-xs text-gray-500">{{ profile.specialty }}</p>
            <button class="mt-2 text-xs text-blue-600 hover:underline">Ganti Foto</button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Nama Lengkap</label>
            <input type="text" v-model="profile.name" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Spesialisasi</label>
            <input type="text" v-model="profile.specialty" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Harga Sesi (Rp)</label>
            <input type="number" v-model="profile.session_price_amount" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Durasi Sesi (menit)</label>
            <input type="number" v-model="profile.session_duration_minutes" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Platform Meeting</label>
            <input type="text" v-model="profile.meeting_platform" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 outline-none" placeholder="Google Meet" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">URL Meeting</label>
            <input type="url" v-model="profile.meeting_url" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 outline-none" placeholder="https://meet.google.com/..." />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-4">
          <div class="flex items-center gap-2">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="profile.chat_enabled" class="sr-only peer" />
              <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
            </label>
            <span class="text-sm text-gray-700">Chat Enabled</span>
          </div>
          <div class="flex items-center gap-2">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="profile.meeting_enabled" class="sr-only peer" />
              <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
            </label>
            <span class="text-sm text-gray-700">Meeting Enabled</span>
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-xs font-medium text-gray-500 mb-1">Bio</label>
          <textarea v-model="profile.bio" rows="4" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 outline-none resize-none"></textarea>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex items-center justify-end gap-3">
        <span v-if="saveMessage" class="text-xs text-green-600">{{ saveMessage }}</span>
        <button @click="saveProfile" :disabled="saving" class="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
          {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>
      </template>
    </div>
  </ConsultantLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase.js'
import ConsultantLayout from '../../components/ConsultantLayout.vue'

const loading = ref(true)
const saving = ref(false)
const saveMessage = ref('')
const profile = ref({
  id: null,
  name: '',
  specialty: '',
  bio: '',
  avatar_url: '',
  session_price_amount: 0,
  session_duration_minutes: 30,
  chat_enabled: false,
  meeting_enabled: false,
  meeting_platform: '',
  meeting_url: '',
  is_active: false,
})

const initials = computed(() => {
  const parts = (profile.value.name || '').split(' ')
  return parts.map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase()
})

async function loadProfile() {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }

  const { data } = await supabase
    .from('kinora_consultants')
    .select('id, name, specialty, bio, avatar_url, session_price_amount, session_duration_minutes, chat_enabled, meeting_enabled, meeting_platform, meeting_url, is_active')
    .eq('consultant_user_id', user.id)
    .maybeSingle()

  if (data) {
    profile.value = { ...data }
  }

  loading.value = false
}

async function saveProfile() {
  saving.value = true
  saveMessage.value = ''

  const { error } = await supabase
    .from('kinora_consultants')
    .update({
      name: profile.value.name,
      specialty: profile.value.specialty,
      bio: profile.value.bio,
      session_price_amount: profile.value.session_price_amount,
      session_duration_minutes: profile.value.session_duration_minutes,
      chat_enabled: profile.value.chat_enabled,
      meeting_enabled: profile.value.meeting_enabled,
      meeting_platform: profile.value.meeting_platform,
      meeting_url: profile.value.meeting_url,
    })
    .eq('id', profile.value.id)

  saving.value = false
  saveMessage.value = error ? 'Gagal menyimpan.' : 'Tersimpan!'
  setTimeout(() => { saveMessage.value = '' }, 3000)
}

onMounted(loadProfile)
</script>
