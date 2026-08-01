<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Back -->
    <button @click="$emit('back')" class="text-sm text-blue-600 hover:underline">← Kembali</button>

    <!-- Step 1: Choose Type -->
    <div v-if="step === 1" class="space-y-4">
      <h2 class="text-lg font-bold text-gray-900">Create User</h2>
      <p class="text-sm text-gray-500">Pilih tipe akun yang ingin dibuat.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button @click="userType = 'admin'; step = 2"
          class="p-6 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-blue-500 transition">
          <p class="font-semibold text-gray-900">🛡️ Administrator</p>
          <p class="text-xs text-gray-500 mt-1">Akun internal pengelola Kinora</p>
        </button>
        <button @click="userType = 'consultant'; step = 2"
          class="p-6 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-teal-500 transition">
          <p class="font-semibold text-gray-900">💼 Konsultan</p>
          <p class="text-xs text-gray-500 mt-1">Profesional layanan konsultasi</p>
        </button>
      </div>
    </div>

    <!-- Step 2: Form -->
    <div v-if="step === 2" class="space-y-5">
      <div class="flex items-center gap-3">
        <button @click="step = 1" class="text-gray-400 hover:text-gray-600">←</button>
        <h2 class="text-lg font-bold text-gray-900">{{ userType === 'admin' ? 'Create Administrator' : 'Create Consultant' }}</h2>
      </div>

      <!-- Common Fields -->
      <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 class="text-sm font-semibold text-gray-700">Informasi Akun</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Nama Lengkap *</label>
            <input v-model="form.display_name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nama lengkap" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Email *</label>
            <input v-model="form.email" type="email" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@domain.com" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Telepon</label>
            <input v-model="form.phone" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="+62..." />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Metode Aktivasi *</label>
            <select v-model="form.method" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="invite">Kirim Undangan Email</option>
              <option value="password">Password Sementara</option>
            </select>
          </div>
          <div v-if="form.method === 'password'" class="md:col-span-2">
            <label class="block text-xs text-gray-500 mb-1">Password Sementara * (min 8 karakter)</label>
            <input v-model="form.password" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Minimal 8 karakter" />
            <p class="text-[10px] text-gray-400 mt-1">User wajib mengganti password saat login pertama.</p>
          </div>
        </div>
      </div>

      <!-- Admin-specific fields -->
      <div v-if="userType === 'admin'" class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 class="text-sm font-semibold text-gray-700">Role & Permission</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Role *</label>
            <select v-model="form.role" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="">Pilih role...</option>
              <option v-for="r in adminRoles" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Jabatan</label>
            <input v-model="form.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Product Manager" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Departemen</label>
            <input v-model="form.department" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Engineering" />
          </div>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-2">Permissions</label>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <label v-for="perm in availablePermissions" :key="perm" class="flex items-center gap-2 text-xs text-gray-700">
              <input type="checkbox" :value="perm" v-model="form.permissions" class="rounded" />
              {{ perm.replace(/_/g, ' ') }}
            </label>
          </div>
        </div>
        <div v-if="form.role === 'founder' || form.role === 'superadmin'" class="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p class="text-xs text-orange-700">⚠️ Akun ini akan memiliki akses administratif tinggi ke sistem Kinora.</p>
        </div>
      </div>

      <!-- Consultant-specific fields -->
      <div v-if="userType === 'consultant'" class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 class="text-sm font-semibold text-gray-700">Profil Konsultan</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Bidang Keahlian *</label>
            <input v-model="form.specialty" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Parenting, Psikologi Anak" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Durasi Sesi (menit)</label>
            <input v-model.number="form.session_duration" type="number" min="15" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Harga Sesi (IDR)</label>
            <input v-model.number="form.session_price" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Platform</label>
            <select v-model="form.meeting_platform" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="chat_only">Chat Only</option>
              <option value="zoom">Zoom</option>
              <option value="gmeet">Google Meet</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Bio</label>
          <textarea v-model="form.bio" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Deskripsi singkat konsultan..."></textarea>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ error }}</div>

      <!-- Actions -->
      <div class="flex justify-between items-center">
        <button @click="step = 1" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Kembali</button>
        <button @click="step = 3" :disabled="!canProceed" class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
          Review & Confirm
        </button>
      </div>
    </div>

    <!-- Step 3: Review & Confirm -->
    <div v-if="step === 3" class="space-y-5">
      <div class="flex items-center gap-3">
        <button @click="step = 2" class="text-gray-400 hover:text-gray-600">←</button>
        <h2 class="text-lg font-bold text-gray-900">Konfirmasi</h2>
      </div>

      <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-500">Tipe:</span> <span class="font-medium">{{ userType === 'admin' ? 'Administrator' : 'Konsultan' }}</span></div>
          <div><span class="text-gray-500">Nama:</span> <span class="font-medium">{{ form.display_name }}</span></div>
          <div><span class="text-gray-500">Email:</span> <span class="font-medium">{{ form.email }}</span></div>
          <div><span class="text-gray-500">Metode:</span> <span class="font-medium">{{ form.method === 'invite' ? 'Email Undangan' : 'Password Sementara' }}</span></div>
          <div v-if="userType === 'admin'"><span class="text-gray-500">Role:</span> <span class="font-medium">{{ form.role }}</span></div>
          <div v-if="userType === 'admin'"><span class="text-gray-500">Permissions:</span> <span class="font-medium">{{ form.permissions.length }} modul</span></div>
          <div v-if="userType === 'consultant'"><span class="text-gray-500">Keahlian:</span> <span class="font-medium">{{ form.specialty }}</span></div>
          <div v-if="userType === 'consultant'"><span class="text-gray-500">Harga:</span> <span class="font-medium">Rp {{ (form.session_price || 0).toLocaleString('id-ID') }}</span></div>
        </div>
      </div>

      <div v-if="form.role === 'founder' || form.role === 'superadmin'" class="p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
        ⚠️ Akun ini akan memiliki akses administratif tinggi ke sistem Kinora. Pastikan Anda yakin.
      </div>

      <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ error }}</div>
      <div v-if="success" class="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{{ success }}</div>

      <div class="flex justify-between items-center">
        <button @click="step = 2" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Edit</button>
        <button @click="submitCreate" :disabled="submitting" class="px-5 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
          {{ submitting ? 'Membuat akun...' : 'Buat Akun' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase.js'

const emit = defineEmits(['back', 'created'])

const step = ref(1)
const userType = ref('')
const submitting = ref(false)
const error = ref('')
const success = ref('')

const form = ref({
  display_name: '',
  email: '',
  phone: '',
  method: 'invite',
  password: '',
  role: '',
  permissions: [],
  title: '',
  department: '',
  specialty: '',
  session_duration: 30,
  session_price: 0,
  meeting_platform: 'chat_only',
  bio: '',
})

const adminRoles = [
  { value: 'founder', label: 'Founder' },
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'admin_user', label: 'Admin User & Family' },
  { value: 'admin_payment', label: 'Admin Payment' },
  { value: 'admin_consultant', label: 'Admin Consultant' },
  { value: 'admin_consultation', label: 'Admin Consultation' },
  { value: 'admin_webinar', label: 'Admin Webinar' },
  { value: 'admin_content', label: 'Admin Content' },
  { value: 'admin_subscription', label: 'Admin Subscription' },
  { value: 'admin_support', label: 'Customer Support' },
  { value: 'admin_monitoring', label: 'System Monitoring' },
  { value: 'auditor', label: 'Read-Only Auditor' },
]

const availablePermissions = [
  'view_users', 'create_internal_user', 'edit_user', 'suspend_user',
  'view_family', 'suspend_family',
  'view_payment', 'verify_payment', 'reject_payment', 'process_refund',
  'view_consultant', 'create_consultant', 'verify_consultant', 'suspend_consultant',
  'view_consultation', 'manage_schedule', 'handle_dispute',
  'create_webinar', 'edit_webinar', 'publish_webinar',
  'create_article', 'edit_article', 'publish_article',
  'view_subscription', 'activate_subscription', 'manage_discount',
  'view_system', 'view_audit_logs', 'manage_settings',
]

const canProceed = computed(() => {
  if (!form.value.display_name || !form.value.email) return false
  if (form.value.method === 'password' && (!form.value.password || form.value.password.length < 8)) return false
  if (userType.value === 'admin' && !form.value.role) return false
  if (userType.value === 'consultant' && !form.value.specialty) return false
  return true
})

async function submitCreate() {
  submitting.value = true
  error.value = ''
  success.value = ''

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Session expired')

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

    if (userType.value === 'admin') {
      const res = await fetch(`${supabaseUrl}/functions/v1/create-admin-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: form.value.email.trim().toLowerCase(),
          display_name: form.value.display_name.trim(),
          role: form.value.role,
          permissions: form.value.permissions,
          title: form.value.title || null,
          department: form.value.department || null,
          method: form.value.method,
          password: form.value.method === 'password' ? form.value.password : undefined,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Gagal membuat administrator')
      success.value = `Administrator ${form.value.display_name} berhasil dibuat! ${form.value.method === 'invite' ? 'Email undangan telah dikirim.' : 'Gunakan password sementara untuk login pertama.'}`
    } else {
      // Consultant
      const res = await fetch(`${supabaseUrl}/functions/v1/create-consultant-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: form.value.email.trim().toLowerCase(),
          password: form.value.method === 'password' ? form.value.password : 'KinoraTemp' + Date.now(),
          display_name: form.value.display_name.trim(),
          name: form.value.display_name.trim(),
          specialty: form.value.specialty,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Gagal membuat konsultan')

      // Update consultant profile with extra data
      if (result.consultant_id) {
        await supabase.from('kinora_consultants').update({
          session_duration_minutes: form.value.session_duration,
          session_price_amount: form.value.session_price,
          meeting_platform: form.value.meeting_platform,
          bio: form.value.bio || null,
        }).eq('id', result.consultant_id)
      }

      success.value = `Konsultan ${form.value.display_name} berhasil dibuat!`
    }

    emit('created')
  } catch (e) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>
