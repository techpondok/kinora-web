<template>
  <div class="min-h-screen bg-gray-50">
    <main class="max-w-2xl mx-auto px-4 py-10">
      <div class="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
        <h1 class="text-xl font-bold text-gray-900 mb-1">Hubungi Dukungan</h1>
        <p class="text-sm text-gray-500 mb-6">Kirim pesan ke tim support Kinora. Kami akan membalas secepat mungkin.</p>

        <div v-if="submitted" class="text-center py-8">
          <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
          <p class="font-semibold text-gray-900">Pesan Terkirim!</p>
          <p class="text-sm text-gray-500 mt-1">Tim kami akan menghubungi Anda melalui email yang diberikan.</p>
          <p v-if="ticketNumber" class="text-xs text-gray-400 mt-2">Nomor tiket: <span class="font-mono font-medium">{{ ticketNumber }}</span></p>
          <a href="/help" class="inline-block mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">Kembali ke Pusat Bantuan</a>
        </div>

        <form v-else @submit.prevent="submitContact" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Nama *</label>
              <input v-model="form.name" type="text" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="Nama lengkap" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input v-model="form.email" type="email" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="email@example.com" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
            <select v-model="form.category" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500">
              <option value="general">Pertanyaan Umum</option>
              <option value="billing">Pembayaran & Langganan</option>
              <option value="account">Akun & Login</option>
              <option value="feature">Fitur Aplikasi</option>
              <option value="partnership">Kerjasama & Partnership</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Subjek *</label>
            <input v-model="form.subject" type="text" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="Ringkasan masalah atau pertanyaan" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Pesan *</label>
            <textarea v-model="form.message" required rows="5" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none" placeholder="Jelaskan secara detail..."></textarea>
          </div>

          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ error }}</div>

          <div class="flex gap-3 pt-2">
            <button type="submit" :disabled="saving" class="flex-1 py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition">
              {{ saving ? 'Mengirim...' : 'Kirim Pesan' }}
            </button>
            <a href="/help" class="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Batal</a>
          </div>
        </form>

        <!-- Contact Info -->
        <div class="mt-8 pt-6 border-t border-gray-100">
          <p class="text-xs text-gray-400 uppercase font-medium mb-3">Kontak Lainnya</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div class="flex items-center gap-2 text-gray-600">
              <span>📧</span> support@kinorafamilies.com
            </div>
            <div class="flex items-center gap-2 text-gray-600">
              <span>💬</span> Chat di aplikasi Kinora
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const form = ref({ name: '', email: '', category: 'general', subject: '', message: '' })
const saving = ref(false)
const submitted = ref(false)
const error = ref('')
const ticketNumber = ref('')

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    form.value.email = session.user.email || ''
    const { data: profile } = await supabase.from('users').select('display_name').eq('id', session.user.id).maybeSingle()
    if (profile?.display_name) form.value.name = profile.display_name
  }
})

async function submitContact() {
  if (!form.value.name || !form.value.email || !form.value.subject || !form.value.message) {
    error.value = 'Semua field wajib diisi.'
    return
  }
  saving.value = true
  error.value = ''

  const { data: { session } } = await supabase.auth.getSession()
  const tNumber = 'CT-' + Date.now().toString(36).toUpperCase()

  const { error: insertErr } = await supabase.from('support_tickets').insert({
    ticket_number: tNumber,
    user_id: session?.user?.id || null,
    type: 'general',
    status: 'open',
    priority: 'normal',
    category: form.value.category,
    title: form.value.subject,
    description: form.value.message,
    contact_email: form.value.email,
    contact_name: form.value.name,
    metadata: { source: 'web_contact_form' },
  })

  if (insertErr) {
    error.value = 'Gagal mengirim: ' + insertErr.message
    saving.value = false
    return
  }

  ticketNumber.value = tNumber
  saving.value = false
  submitted.value = true
}
</script>
