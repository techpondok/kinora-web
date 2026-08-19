<template>
  <div class="min-h-screen bg-gray-50">
    <main class="max-w-2xl mx-auto px-4 py-10">
      <div class="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
        <h1 class="text-xl font-bold text-gray-900 mb-1">Usulkan Fitur</h1>
        <p class="text-sm text-gray-500 mb-6">Ceritakan fitur apa yang ingin Anda lihat di Kinora.</p>

        <div v-if="submitted" class="text-center py-8">
          <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
          <p class="font-semibold text-gray-900">Terima kasih!</p>
          <p class="text-sm text-gray-500 mt-1">Usulan Anda telah dicatat. Tim kami akan meninjau permintaan ini.</p>
          <a href="/help" class="inline-block mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">Kembali ke Pusat Bantuan</a>
        </div>

        <form v-else @submit.prevent="submitFeature" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Judul Fitur *</label>
            <input v-model="form.title" type="text" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="Contoh: Fitur reminder jadwal vaksinasi" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Deskripsi *</label>
            <textarea v-model="form.description" required rows="4" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none" placeholder="Jelaskan bagaimana fitur ini membantu Anda..."></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Prioritas</label>
            <select v-model="form.priority" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500">
              <option value="low">Rendah - Nice to have</option>
              <option value="medium">Sedang - Cukup penting</option>
              <option value="high">Tinggi - Sangat dibutuhkan</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Email (opsional)</label>
            <input v-model="form.email" type="email" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="Untuk follow-up jika perlu" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Attachment (opsional)</label>
            <input type="file" accept="image/*" @change="handleFile" class="text-xs" />
          </div>

          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ error }}</div>

          <div class="flex gap-3 pt-2">
            <button type="submit" :disabled="saving" class="flex-1 py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition">
              {{ saving ? 'Mengirim...' : 'Kirim Usulan' }}
            </button>
            <a href="/help" class="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Batal</a>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createSupportTicket, validateSupportAttachment } from '../lib/supportTickets.js'

const form = ref({ title: '', description: '', priority: 'medium', email: '' })
const saving = ref(false)
const submitted = ref(false)
const error = ref('')
const attachment = ref(null)

function handleFile(e) {
  const file = e.target.files?.[0] || null
  const validation = validateSupportAttachment(file)
  if (validation) {
    attachment.value = null
    error.value = validation
    e.target.value = ''
    return
  }
  attachment.value = file
  error.value = ''
}

async function submitFeature() {
  if (!form.value.title || !form.value.description) { error.value = 'Judul dan deskripsi wajib diisi.'; return }
  if (saving.value) return
  saving.value = true
  error.value = ''

  try {
    await createSupportTicket({
      type: 'feature',
      title: form.value.title,
      description: form.value.description,
      priority: form.value.priority === 'high' ? 'high' : form.value.priority === 'low' ? 'low' : 'normal',
      contactEmail: form.value.email,
      attachment: attachment.value,
      metadata: { priority_preference: form.value.priority },
    })
    form.value = { title: '', description: '', priority: 'medium', email: '' }
    attachment.value = null
    submitted.value = true
  } catch (err) {
    error.value = err.message === 'AUTH_REQUIRED' ? 'Silakan login untuk mengirim usulan fitur.' : 'Gagal mengirim laporan. Silakan coba lagi.'
  } finally {
    saving.value = false
  }
}
</script>
