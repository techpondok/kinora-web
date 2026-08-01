<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <a href="/dashboard" class="text-gray-500 hover:text-gray-700 text-sm">← Dashboard</a>
        <h1 class="font-semibold text-gray-900">Konsultasi Chat</h1>
      </div>
      <div v-if="session" class="flex items-center gap-3">
        <span :class="statusColor(session.status)" class="px-2 py-0.5 text-xs rounded-full">{{ session.status }}</span>
        <div v-if="session.status === 'active'" class="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg">
          <span class="text-xs text-blue-600">Sisa:</span>
          <span class="font-mono font-bold text-blue-700">{{ formatTimer(remainingSeconds) }}</span>
        </div>
      </div>
    </header>

    <div class="max-w-4xl mx-auto p-4 flex flex-col" style="height: calc(100vh - 60px)">
      <!-- Loading -->
      <div v-if="loading" class="flex-1 flex items-center justify-center text-gray-500">Memuat sesi...</div>

      <!-- Not found -->
      <div v-else-if="!session" class="flex-1 flex items-center justify-center text-gray-500">Sesi tidak ditemukan.</div>

      <template v-else>
        <!-- Session info bar -->
        <div class="bg-white rounded-xl border border-gray-200 p-3 mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="text-sm">
              <span class="font-medium text-gray-900">{{ session.user_name || 'User' }}</span>
              <span class="text-gray-400 mx-2">·</span>
              <span class="text-gray-500">{{ session.topic || 'Tidak ada topik' }}</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button v-if="session.status === 'paid' || session.status === 'waiting_consultant'" @click="startSession" class="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">Mulai Sesi</button>
            <button v-if="session.status === 'active'" @click="endSession" class="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">Akhiri</button>
          </div>
        </div>

        <!-- Messages -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto space-y-3 mb-4 px-2">
          <div v-for="msg in messages" :key="msg.id" :class="msg.sender_id === currentUserId ? 'flex justify-end' : 'flex justify-start'">
            <div :class="msg.sender_id === currentUserId ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-900'" class="max-w-[70%] rounded-xl px-4 py-2 text-sm">
              <p>{{ msg.content }}</p>
              <p class="text-xs mt-1 opacity-60">{{ formatTime(msg.created_at) }}</p>
            </div>
          </div>
          <div v-if="messages.length === 0" class="text-center text-gray-400 text-sm py-8">Belum ada pesan.</div>
        </div>

        <!-- Chat locked -->
        <div v-if="session.chat_locked || session.status === 'completed'" class="p-3 bg-gray-100 rounded-lg text-center text-sm text-gray-500 mb-2">
          🔒 Chat dikunci. Sesi konsultasi telah selesai.
        </div>

        <!-- Warning near end -->
        <div v-else-if="session.status === 'active' && remainingSeconds <= 300 && remainingSeconds > 0" class="p-2 bg-orange-50 border border-orange-200 rounded-lg text-center text-xs text-orange-700 mb-2">
          ⚠️ Sesi akan berakhir dalam {{ Math.ceil(remainingSeconds / 60) }} menit.
        </div>

        <!-- Input -->
        <div v-if="!session.chat_locked && session.status === 'active'" class="flex gap-2">
          <input v-model="newMessage" @keydown.enter="sendMessage" type="text" placeholder="Ketik pesan..." class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" :disabled="sending" />
          <button @click="sendMessage" :disabled="!newMessage.trim() || sending" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">Kirim</button>
        </div>

        <!-- Waiting state -->
        <div v-else-if="session.status !== 'active' && session.status !== 'completed'" class="p-3 bg-blue-50 rounded-lg text-center text-sm text-blue-700">
          Sesi belum dimulai. Klik "Mulai Sesi" untuk mengaktifkan timer dan membuka chat.
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase.js'

const route = useRoute()
const sessionId = route.params.sessionId

const loading = ref(true)
const session = ref(null)
const messages = ref([])
const newMessage = ref('')
const sending = ref(false)
const currentUserId = ref(null)
const remainingSeconds = ref(0)
const messagesContainer = ref(null)

let timerInterval = null
let realtimeChannel = null

function statusColor(s) {
  const map = { active: 'bg-green-100 text-green-700', completed: 'bg-gray-100 text-gray-500', paused: 'bg-yellow-100 text-yellow-700', paid: 'bg-blue-100 text-blue-700', waiting_consultant: 'bg-orange-100 text-orange-700' }
  return map[s] || 'bg-gray-100 text-gray-600'
}

function formatTimer(sec) {
  if (sec <= 0) return '00:00'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

async function loadSession() {
  const { data: { user } } = await supabase.auth.getUser()
  currentUserId.value = user?.id

  const { data, error } = await supabase
    .from('kinora_consultation_sessions')
    .select('*, kinora_consultants!kinora_consultation_sessions_consultant_id_fkey(name, consultant_user_id)')
    .eq('id', sessionId)
    .single()

  if (data) {
    session.value = data
    await loadMessages()
    syncTimer()
  }
  loading.value = false
}

async function syncTimer() {
  const { data } = await supabase.rpc('consultation_get_timer', { p_session_id: sessionId })
  if (data && data.remaining_seconds !== undefined) {
    remainingSeconds.value = data.remaining_seconds
    session.value.status = data.status
    session.value.chat_locked = data.chat_locked

    // Auto-lock if time up
    if (data.status === 'active' && data.remaining_seconds <= 0) {
      session.value.chat_locked = true
      session.value.status = 'completed'
    }
  }
}

function startTimerTick() {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (session.value?.status === 'active' && remainingSeconds.value > 0) {
      remainingSeconds.value--
      if (remainingSeconds.value <= 0) {
        session.value.chat_locked = true
        syncTimer() // Confirm with server
      }
    }
  }, 1000)
}

async function loadMessages() {
  if (!session.value?.chat_room_id) return
  const { data } = await supabase
    .from('messages')
    .select('id, sender_id, content, message_type, created_at')
    .eq('room_id', session.value.chat_room_id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(200)

  messages.value = data || []
  await nextTick()
  scrollToBottom()
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

async function sendMessage() {
  if (!newMessage.value.trim() || sending.value) return
  if (session.value.chat_locked || remainingSeconds.value <= 0) return

  sending.value = true
  const content = newMessage.value.trim()
  newMessage.value = ''

  const { error } = await supabase.from('messages').insert({
    room_id: session.value.chat_room_id,
    sender_id: currentUserId.value,
    content,
    message_type: 'text',
  })

  if (error) {
    newMessage.value = content // Restore on failure
  }
  sending.value = false
}

async function startSession() {
  const { data, error } = await supabase.rpc('consultation_start_session', { p_session_id: sessionId })
  if (!error && data) {
    session.value.status = 'active'
    session.value.chat_locked = false
    session.value.started_at = data.started_at
    session.value.ends_at = data.ends_at
    syncTimer()
  }
}

async function endSession() {
  if (!confirm('Yakin akhiri sesi? Sisa waktu tidak dikembalikan otomatis.')) return
  await supabase.rpc('consultation_end_session', { p_session_id: sessionId, p_reason: 'consultant_ended' })
  session.value.status = 'completed'
  session.value.chat_locked = true
  remainingSeconds.value = 0
}

function setupRealtime() {
  if (!session.value?.chat_room_id) return
  realtimeChannel = supabase
    .channel(`consultation-${sessionId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${session.value.chat_room_id}`,
    }, (payload) => {
      const msg = payload.new
      if (!messages.value.find(m => m.id === msg.id)) {
        messages.value.push(msg)
        nextTick(scrollToBottom)
      }
    })
    .subscribe()
}

onMounted(async () => {
  await loadSession()
  startTimerTick()
  setupRealtime()

  // Sync timer every 30s
  const syncInterval = setInterval(syncTimer, 30000)
  onUnmounted(() => clearInterval(syncInterval))
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})
</script>
