<template>
  <ConsultantLayout>
    <div class="space-y-6">
      <!-- Loading -->
      <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat...</div>

      <template v-else>
      <div>
        <h1 class="text-xl font-bold text-gray-900">Catatan Konsultasi</h1>
        <p class="text-sm text-gray-500">Dokumentasi dan catatan dari sesi konsultasi Anda.</p>
      </div>

      <!-- Note Template Info -->
      <div class="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <p class="text-sm font-medium text-blue-900 mb-2">Template Catatan</p>
        <div class="flex flex-wrap gap-2">
          <span class="px-2 py-1 bg-white rounded text-xs text-blue-700 border border-blue-100">Topik</span>
          <span class="px-2 py-1 bg-white rounded text-xs text-blue-700 border border-blue-100">Ringkasan</span>
          <span class="px-2 py-1 bg-white rounded text-xs text-blue-700 border border-blue-100">Rekomendasi</span>
          <span class="px-2 py-1 bg-white rounded text-xs text-blue-700 border border-blue-100">Langkah Selanjutnya</span>
          <span class="px-2 py-1 bg-white rounded text-xs text-blue-700 border border-blue-100">Catatan Pribadi</span>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="notesGrouped.length === 0" class="text-sm text-gray-400 text-center py-8">Belum ada catatan konsultasi.</div>

      <!-- Notes grouped by client -->
      <div v-for="group in notesGrouped" :key="group.client" class="space-y-3">
        <h2 class="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">{{ group.client }}</h2>
        <div v-for="note in group.notes" :key="note.id" class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400">{{ note.date }}</span>
              <span class="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600">{{ note.service }}</span>
            </div>
            <button class="text-xs text-blue-600 hover:underline">Edit</button>
          </div>

          <div class="space-y-2">
            <div>
              <p class="text-[10px] uppercase text-gray-400 font-medium">Topik</p>
              <p class="text-sm text-gray-900">{{ note.topic }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase text-gray-400 font-medium">Ringkasan</p>
              <p class="text-sm text-gray-700">{{ note.summary }}</p>
            </div>
            <div v-if="note.recommendations">
              <p class="text-[10px] uppercase text-gray-400 font-medium">Rekomendasi</p>
              <p class="text-sm text-gray-700">{{ note.recommendations }}</p>
            </div>
            <div v-if="note.nextSteps">
              <p class="text-[10px] uppercase text-gray-400 font-medium">Langkah Selanjutnya</p>
              <p class="text-sm text-gray-700">{{ note.nextSteps }}</p>
            </div>
            <div v-if="note.privateNotes">
              <p class="text-[10px] uppercase text-amber-500 font-medium">🔒 Catatan Pribadi</p>
              <p class="text-sm text-gray-600 italic">{{ note.privateNotes }}</p>
            </div>
          </div>
        </div>
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
const notesGrouped = ref([])

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function loadNotes() {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }

  const { data: profile } = await supabase
    .from('kinora_consultants')
    .select('id')
    .eq('consultant_user_id', user.id)
    .maybeSingle()
  if (!profile) { loading.value = false; return }

  const { data: sessions } = await supabase
    .from('kinora_consultation_sessions')
    .select('id, topic, consultant_notes, completed_at, meeting_platform, user:users!kinora_consultation_sessions_user_id_fkey(display_name)')
    .eq('consultant_id', profile.id)
    .not('consultant_notes', 'is', null)
    .order('completed_at', { ascending: false })

  // Group by client
  const grouped = {}
  for (const s of (sessions || [])) {
    const clientName = s.user?.display_name || 'Klien'
    if (!grouped[clientName]) {
      grouped[clientName] = { client: clientName, notes: [] }
    }

    // Parse consultant_notes - could be JSON or plain text
    let noteData = { summary: '', recommendations: '', nextSteps: '', privateNotes: '' }
    try {
      const parsed = JSON.parse(s.consultant_notes)
      noteData = { ...noteData, ...parsed }
    } catch {
      noteData.summary = s.consultant_notes
    }

    grouped[clientName].notes.push({
      id: s.id,
      date: formatDate(s.completed_at),
      service: s.topic || 'Konsultasi',
      topic: s.topic || '—',
      summary: noteData.summary || s.consultant_notes || '',
      recommendations: noteData.recommendations || null,
      nextSteps: noteData.nextSteps || null,
      privateNotes: noteData.privateNotes || null,
    })
  }

  notesGrouped.value = Object.values(grouped)
  loading.value = false
}

onMounted(loadNotes)
</script>
