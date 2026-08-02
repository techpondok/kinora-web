<template>
  <ConsultantLayout>
    <div class="space-y-6">
      <!-- Loading -->
      <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat...</div>

      <template v-else>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">Notifikasi</h1>
          <p class="text-sm text-gray-500">Pemberitahuan aktivitas dan update terbaru.</p>
        </div>
        <button @click="markAllRead" class="text-xs text-blue-600 hover:underline">Tandai semua dibaca</button>
      </div>

      <!-- Filter -->
      <div class="flex gap-2">
        <button @click="filter = 'all'" :class="filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'" class="px-3 py-1.5 text-xs font-medium rounded-lg transition">Semua</button>
        <button @click="filter = 'unread'" :class="filter === 'unread' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'" class="px-3 py-1.5 text-xs font-medium rounded-lg transition">Belum Dibaca</button>
      </div>

      <!-- Notifications -->
      <div v-if="filteredNotifications.length === 0" class="text-sm text-gray-400 text-center py-8">Tidak ada notifikasi.</div>
      <div class="space-y-2">
        <div v-for="notif in filteredNotifications" :key="notif.id" class="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3 transition" :class="!notif.is_read ? 'border-l-4 border-l-blue-400' : ''">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm" :class="notif.iconBg">{{ notif.icon }}</div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-900" :class="!notif.is_read ? 'font-semibold' : ''">{{ notif.title }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ notif.body }}</p>
            <p class="text-[10px] text-gray-400 mt-1">{{ notif.time }}</p>
          </div>
          <button v-if="!notif.is_read" @click="markRead(notif)" class="text-[10px] text-blue-600 hover:underline whitespace-nowrap">Tandai dibaca</button>
        </div>
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
const filter = ref('all')
const notifications = ref([])

function getIconForType(type) {
  const map = {
    session_request: { icon: '📩', bg: 'bg-blue-100' },
    payment: { icon: '💰', bg: 'bg-green-100' },
    reminder: { icon: '⏰', bg: 'bg-amber-100' },
    review: { icon: '⭐', bg: 'bg-amber-100' },
    session_complete: { icon: '✅', bg: 'bg-green-100' },
    payout: { icon: '🏦', bg: 'bg-blue-100' },
    system: { icon: '🔔', bg: 'bg-gray-100' },
  }
  return map[type] || { icon: '🔔', bg: 'bg-gray-100' }
}

function timeAgo(dt) {
  if (!dt) return '—'
  const now = new Date()
  const date = new Date(dt)
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} jam lalu`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} hari lalu`
  return new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

const filteredNotifications = computed(() => {
  if (filter.value === 'unread') return notifications.value.filter(n => !n.is_read)
  return notifications.value
})

async function markRead(notif) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id)
  notif.is_read = true
}

async function markAllRead() {
  const unread = notifications.value.filter(n => !n.is_read)
  if (unread.length === 0) return
  const ids = unread.map(n => n.id)
  await supabase.from('notifications').update({ is_read: true }).in('id', ids)
  unread.forEach(n => { n.is_read = true })
}

async function loadNotifications() {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }

  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, body, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  notifications.value = (data || []).map(n => {
    const { icon, bg } = getIconForType(n.type)
    return {
      ...n,
      icon,
      iconBg: bg,
      time: timeAgo(n.created_at),
    }
  })

  loading.value = false
}

onMounted(loadNotifications)
</script>
