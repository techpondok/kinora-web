<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 class="text-xl font-bold text-gray-900 mb-2">Laporkan Bug</h1>
      <p class="text-sm text-gray-500 mb-6">Bantu kami memperbaiki masalah yang Anda temukan.</p>

      <div v-if="!user" class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <p class="text-sm text-gray-700 mb-3">Silakan login untuk membuat laporan bug.</p>
        <a :href="`/login?redirect=${encodeURIComponent('/help/report-bug')}`" class="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium">Login</a>
      </div>

      <form v-else @submit.prevent="submit" class="space-y-5">
        <div v-if="success" class="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
          <p class="font-semibold text-green-800">Laporan dikirim!</p>
          <p class="text-sm text-green-600 mt-1">Nomor tiket: <strong>{{ ticketNumber }}</strong></p>
          <a href="/help/my-tickets" class="text-sm text-amber-600 hover:underline mt-2 inline-block">Lihat tiket saya</a>
        </div>
        <template v-else>
          <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{{ error }}</div>
          <div><label class="block text-xs text-gray-500 mb-1">Judul masalah *</label><input v-model="form.title" type="text" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400" /></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-xs text-gray-500 mb-1">Kategori</label>
              <select v-model="form.category" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="">Pilih...</option>
                <option v-for="c in bugCategories" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div><label class="block text-xs text-gray-500 mb-1">Dampak</label>
              <select v-model="form.impact" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="low">Rendah</option><option value="medium">Sedang</option><option value="high">Tinggi</option><option value="critical">Kritis</option>
              </select>
            </div>
          </div>
          <div><label class="block text-xs text-gray-500 mb-1">Langkah sebelum masalah terjadi</label><textarea v-model="form.steps_to_reproduce" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-xs text-gray-500 mb-1">Hasil yang diharapkan</label><textarea v-model="form.expected_result" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
            <div><label class="block text-xs text-gray-500 mb-1">Hasil yang terjadi</label><textarea v-model="form.actual_result" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
          </div>
          <div><label class="block text-xs text-gray-500 mb-1">Deskripsi tambahan</label><textarea v-model="form.description" rows="3" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
          <div><label class="block text-xs text-gray-500 mb-1">Screenshot (opsional)</label><input type="file" accept="image/*" @change="handleFile" class="text-xs" /></div>
          <button type="submit" :disabled="submitting" class="w-full py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 btn-press">
            {{ submitting ? 'Mengirim...' : 'Kirim Laporan' }}
          </button>
        </template>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const user = ref(null)
const form = ref({ title: '', category: '', impact: 'medium', steps_to_reproduce: '', expected_result: '', actual_result: '', description: '' })
const submitting = ref(false)
const error = ref('')
const success = ref(false)
const ticketNumber = ref('')
const attachment = ref(null)

const bugCategories = ['Login & Akun', 'Family', 'Subscription', 'Payment', 'Webinar', 'Consultation', 'Notification', 'Location', 'Safety', 'Finance', 'Parenting', 'Health', 'Other']

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) user.value = session.user
})

function handleFile(e) { attachment.value = e.target.files?.[0] || null }

async function submit() {
  if (!form.value.title || !form.value.description) { error.value = 'Judul dan deskripsi wajib diisi'; return }
  submitting.value = true; error.value = ''

  // Generate ticket number
  const { data: numData } = await supabase.rpc('generate_ticket_number', { p_type: 'bug' })
  const tNum = numData || `KNR-BUG-${Date.now()}`

  // Upload attachment
  let attachments = []
  if (attachment.value) {
    const path = `tickets/${tNum}/${Date.now()}.${attachment.value.name.split('.').pop()}`
    const { error: upErr } = await supabase.storage.from('articles').upload(path, attachment.value, { upsert: false })
    if (!upErr) {
      const { data: url } = supabase.storage.from('articles').getPublicUrl(path)
      attachments.push({ name: attachment.value.name, url: url.publicUrl })
    }
  }

  const { error: insertErr } = await supabase.from('support_tickets').insert({
    ticket_number: tNum,
    user_id: user.value.id,
    type: 'bug',
    title: form.value.title,
    description: form.value.description,
    category: form.value.category,
    impact: form.value.impact,
    steps_to_reproduce: form.value.steps_to_reproduce,
    expected_result: form.value.expected_result,
    actual_result: form.value.actual_result,
    platform: 'web',
    browser: navigator.userAgent.split(' ').pop(),
    page_url: window.location.href,
    attachments,
    metadata: { os: navigator.platform },
  })

  if (insertErr) { error.value = insertErr.message } else { success.value = true; ticketNumber.value = tNum }
  submitting.value = false
}
</script>
