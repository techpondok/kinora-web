<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Support Tickets</h1>
      <div class="flex gap-2">
        <select v-model="filterStatus" @change="load" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Semua Status</option>
          <option value="open">Open</option><option value="reviewing">Reviewing</option><option value="in_progress">In Progress</option>
          <option value="needs_info">Needs Info</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
        </select>
        <select v-model="filterType" @change="load" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Semua Tipe</option><option value="bug">Bug</option><option value="feature">Feature</option><option value="account_access">Account</option><option value="general">General</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-500">Memuat...</div>
    <div v-else-if="tickets.length === 0" class="bg-white rounded-xl border p-8 text-center text-gray-400">Tidak ada tiket.</div>
    <div v-else class="space-y-3">
      <div v-for="t in tickets" :key="t.id" class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 text-sm">{{ t.title }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ t.ticket_number }} · {{ t.type }} · {{ t.contact_email || t.user_email || '-' }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span :class="priorityColor(t.priority)" class="px-2 py-0.5 text-xs rounded-full">{{ t.priority }}</span>
            <select v-model="t.status" @change="updateStatus(t)" class="px-2 py-1 border border-gray-200 rounded text-xs">
              <option value="open">Open</option><option value="reviewing">Reviewing</option><option value="in_progress">In Progress</option>
              <option value="needs_info">Needs Info</option><option value="resolved">Resolved</option><option value="closed">Closed</option><option value="rejected">Rejected</option><option value="duplicate">Duplicate</option>
            </select>
          </div>
        </div>
        <p v-if="t.description" class="text-xs text-gray-600 mt-2 line-clamp-2">{{ t.description }}</p>
        <div class="mt-2 flex gap-2">
          <button @click="replyTarget = t; replyText = ''" class="text-xs text-blue-600 hover:underline">Balas</button>
          <span class="text-xs text-gray-400">{{ formatDate(t.created_at) }}</span>
        </div>
      </div>
    </div>

    <!-- Reply modal -->
    <div v-if="replyTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-xl w-full max-w-md shadow-xl p-6 space-y-4">
        <h3 class="font-semibold text-gray-900 text-sm">Balas: {{ replyTarget.ticket_number }}</h3>
        <textarea v-model="replyText" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Tulis balasan..."></textarea>
        <label class="flex items-center gap-2 text-xs text-gray-500"><input type="checkbox" v-model="replyInternal" class="rounded" /> Catatan internal (tidak terlihat user)</label>
        <div class="flex justify-end gap-3">
          <button @click="replyTarget = null" class="px-4 py-2 text-sm text-gray-600">Batal</button>
          <button @click="sendReply" :disabled="!replyText" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">Kirim</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const tickets = ref([])
const loading = ref(true)
const filterStatus = ref('')
const filterType = ref('')
const replyTarget = ref(null)
const replyText = ref('')
const replyInternal = ref(false)

function priorityColor(p) {
  const m = { low: 'bg-gray-100 text-gray-600', normal: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' }
  return m[p] || 'bg-gray-100 text-gray-600'
}
function formatDate(d) { return d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '' }

async function load() {
  loading.value = true
  let q = supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(50)
  if (filterStatus.value) q = q.eq('status', filterStatus.value)
  if (filterType.value) q = q.eq('type', filterType.value)
  const { data } = await q
  tickets.value = data || []
  loading.value = false
}

async function updateStatus(t) {
  await supabase.from('support_tickets').update({ status: t.status, updated_at: new Date().toISOString() }).eq('id', t.id)
}

async function sendReply() {
  if (!replyText.value || !replyTarget.value) return
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('ticket_messages').insert({
    ticket_id: replyTarget.value.id,
    sender_id: user?.id,
    sender_type: 'admin',
    content: replyText.value,
    is_internal: replyInternal.value,
  })
  // Update ticket status if needed
  if (replyTarget.value.status === 'open') {
    await supabase.from('support_tickets').update({ status: 'reviewing', updated_at: new Date().toISOString() }).eq('id', replyTarget.value.id)
  }
  replyTarget.value = null
  load()
}

onMounted(load)
</script>
