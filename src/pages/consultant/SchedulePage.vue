<template>
  <ConsultantLayout>
    <div class="space-y-6">
      <!-- Loading -->
      <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat...</div>

      <template v-else>
      <div>
        <h1 class="text-xl font-bold text-gray-900">Jadwal Konsultasi</h1>
        <p class="text-sm text-gray-500">Atur ketersediaan dan jadwal konsultasi Anda.</p>
      </div>

      <!-- Schedule Mode Toggle -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-900">Mode Jadwal</p>
          <p class="text-xs text-gray-500">{{ scheduleMode === 'fixed' ? 'Jadwal tetap mingguan' : 'Atur slot manual per hari' }}</p>
        </div>
        <div class="flex bg-gray-100 rounded-lg p-0.5">
          <button @click="scheduleMode = 'fixed'" :class="scheduleMode === 'fixed' ? 'bg-white shadow text-gray-900' : 'text-gray-500'" class="px-3 py-1.5 text-xs font-medium rounded-md transition">Tetap</button>
          <button @click="scheduleMode = 'manual'" :class="scheduleMode === 'manual' ? 'bg-white shadow text-gray-900' : 'text-gray-500'" class="px-3 py-1.5 text-xs font-medium rounded-md transition">Manual</button>
        </div>
      </div>

      <!-- Weekly Hours Grid -->
      <section class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="font-semibold text-gray-900 mb-4">Jam Kerja Mingguan</h2>
        <div class="space-y-3">
          <div v-for="day in weeklyHours" :key="day.name" class="flex items-center gap-4 p-3 rounded-lg border border-gray-100">
            <div class="w-16">
              <p class="text-sm font-medium text-gray-900">{{ day.name }}</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="day.active" class="sr-only peer" />
              <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
            </label>
            <template v-if="day.active">
              <input type="time" v-model="day.start" class="px-2 py-1 text-sm border border-gray-200 rounded-lg" />
              <span class="text-gray-400 text-sm">—</span>
              <input type="time" v-model="day.end" class="px-2 py-1 text-sm border border-gray-200 rounded-lg" />
            </template>
            <span v-else class="text-xs text-gray-400">Libur</span>
          </div>
        </div>
      </section>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-2">
        <button class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">+ Tambah Slot</button>
        <button class="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition">🚫 Tutup Tanggal</button>
        <button class="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition">🏖️ Tambah Cuti</button>
      </div>

      <!-- Calendar View -->
      <section class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="font-semibold text-gray-900 mb-4">Kalender Slot</h2>
        <div class="grid grid-cols-7 gap-2 text-center mb-3">
          <div v-for="d in ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']" :key="d" class="text-xs font-medium text-gray-500">{{ d }}</div>
        </div>
        <div class="grid grid-cols-7 gap-2">
          <div v-for="slot in calendarSlots" :key="slot.date" class="p-2 rounded-lg text-center text-xs border" :class="slot.class">
            <p class="font-medium">{{ slot.date }}</p>
            <p class="mt-0.5">{{ slot.label }}</p>
          </div>
        </div>
      </section>

      <!-- Upcoming Sessions -->
      <section class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="font-semibold text-gray-900 mb-4">Slot Mendatang</h2>
        <div v-if="upcomingSessions.length === 0" class="text-sm text-gray-400 text-center py-4">Belum ada jadwal mendatang.</div>
        <div class="space-y-3">
          <div v-for="slot in upcomingSessions" :key="slot.id" class="flex items-center justify-between p-3 rounded-lg border border-gray-100">
            <div>
              <p class="text-sm font-medium text-gray-900">{{ slot.date }} · {{ slot.time }}</p>
              <p class="text-xs text-gray-500">{{ slot.duration }} menit · {{ slot.service || 'Tersedia' }}</p>
            </div>
            <span class="px-2 py-0.5 text-[10px] rounded-full font-medium" :class="slot.statusClass">{{ slot.status }}</span>
          </div>
        </div>
      </section>
      </template>
    </div>
  </ConsultantLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase.js'
import ConsultantLayout from '../../components/ConsultantLayout.vue'

const loading = ref(true)
const scheduleMode = ref('fixed')
const upcomingSessions = ref([])

const weeklyHours = ref([
  { name: 'Senin', active: true, start: '09:00', end: '17:00' },
  { name: 'Selasa', active: true, start: '09:00', end: '17:00' },
  { name: 'Rabu', active: true, start: '09:00', end: '15:00' },
  { name: 'Kamis', active: true, start: '10:00', end: '18:00' },
  { name: 'Jumat', active: true, start: '09:00', end: '12:00' },
  { name: 'Sabtu', active: false, start: '', end: '' },
  { name: 'Minggu', active: false, start: '', end: '' },
])

const calendarSlots = ref([])

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function formatTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function getStatusDisplay(status) {
  const map = {
    scheduled: { label: 'Terjadwal', class: 'bg-blue-100 text-blue-700' },
    in_progress: { label: 'Berlangsung', class: 'bg-green-100 text-green-700' },
    pending: { label: 'Pending', class: 'bg-amber-100 text-amber-700' },
    completed: { label: 'Selesai', class: 'bg-gray-100 text-gray-600' },
  }
  return map[status] || { label: status, class: 'bg-gray-100 text-gray-600' }
}

async function loadSchedule() {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }

  const { data: profile } = await supabase
    .from('kinora_consultants')
    .select('id')
    .eq('consultant_user_id', user.id)
    .maybeSingle()
  if (!profile) { loading.value = false; return }

  const today = new Date().toISOString().split('T')[0]

  const { data: sessions } = await supabase
    .from('kinora_consultation_sessions')
    .select('id, topic, started_at, duration_minutes, status, meeting_platform')
    .eq('consultant_id', profile.id)
    .not('status', 'in', '("cancelled","expired")')
    .gte('started_at', today)
    .order('started_at', { ascending: true })

  upcomingSessions.value = (sessions || []).map(s => {
    const st = getStatusDisplay(s.status)
    return {
      id: s.id,
      date: formatDate(s.started_at),
      time: formatTime(s.started_at),
      duration: s.duration_minutes || 30,
      service: s.topic || null,
      status: st.label,
      statusClass: st.class,
    }
  })

  // Build calendar from sessions in the next 14 days
  const slots = []
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const count = (sessions || []).filter(s => s.started_at && s.started_at.startsWith(dateStr)).length
    const dayNum = d.getDate().toString()
    if (count === 0) {
      slots.push({ date: dayNum, label: '—', class: 'border-gray-200 bg-gray-50 text-gray-400' })
    } else {
      slots.push({ date: dayNum, label: `${count} sesi`, class: 'border-green-200 bg-green-50 text-green-700' })
    }
  }
  calendarSlots.value = slots

  loading.value = false
}

onMounted(loadSchedule)
</script>
