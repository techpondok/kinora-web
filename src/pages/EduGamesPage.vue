<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Educational Games</h1>
        <p class="text-sm text-gray-500">Kelola mini games edukasi untuk anak-anak Kinora.</p>
      </div>
      <button @click="showQuestionEditor = true; editingQuestion = {}" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Tambah Soal</button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="['px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition', activeTab === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500']">
        {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="py-8 text-center text-gray-500 text-sm">Memuat...</div>

    <template v-else>
    <!-- Games Tab -->
    <div v-if="activeTab === 'games'" class="space-y-3">
      <div v-for="g in games" :key="g.id" class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
        <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-xl">🎮</div>
        <div class="flex-1">
          <p class="font-medium text-gray-900 text-sm">{{ g.name }}</p>
          <p class="text-xs text-gray-500">{{ g.game_type }} · Usia {{ g.min_age }}-{{ g.max_age }} · {{ g.default_question_count }} soal</p>
        </div>
        <span :class="g.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="text-xs px-2 py-0.5 rounded-full">{{ g.status }}</span>
      </div>
    </div>

    <!-- Categories Tab -->
    <div v-if="activeTab === 'categories'" class="space-y-3">
      <div class="flex justify-end"><button @click="addCategory" class="text-xs text-blue-600 hover:underline">+ Tambah Kategori</button></div>
      <div v-for="c in categories" :key="c.id" class="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p class="font-medium text-gray-900 text-sm">{{ c.name }}</p>
          <p class="text-xs text-gray-500">{{ c.slug }} · Usia {{ c.min_age || '?' }}-{{ c.max_age || '?' }}</p>
        </div>
        <span :class="c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="text-xs px-2 py-0.5 rounded-full">{{ c.is_active ? 'Active' : 'Inactive' }}</span>
      </div>
    </div>

    <!-- Questions Tab -->
    <div v-if="activeTab === 'questions'" class="space-y-3">
      <div v-if="questions.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">Belum ada soal.</div>
      <div v-for="q in questions" :key="q.id" class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
        <div v-if="q.image_url" class="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0"><img :src="q.image_url" class="w-full h-full object-cover" /></div>
        <div v-else class="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">🖼️</div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 text-sm">{{ q.prompt }}</p>
          <p class="text-xs text-gray-500">Jawaban: {{ q.correct_answer }} · {{ q.difficulty }} · Usia {{ q.min_age }}-{{ q.max_age }}</p>
        </div>
        <div class="flex gap-2">
          <button @click="editingQuestion = {...q}; showQuestionEditor = true" class="text-xs text-blue-600 hover:underline">Edit</button>
          <button @click="deleteQuestion(q)" class="text-xs text-red-500 hover:underline">Hapus</button>
        </div>
      </div>
    </div>

    <!-- Sessions Tab -->
    <div v-if="activeTab === 'sessions'" class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div v-if="sessions.length === 0" class="p-8 text-center text-gray-400 text-sm">Belum ada sesi bermain.</div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 border-b"><tr><th class="text-left px-4 py-3 text-gray-600">Child</th><th class="text-left px-4 py-3 text-gray-600">Pack</th><th class="text-center px-4 py-3 text-gray-600">Score</th><th class="text-center px-4 py-3 text-gray-600">Accuracy</th><th class="text-left px-4 py-3 text-gray-600">Date</th></tr></thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="s in sessions" :key="s.id">
            <td class="px-4 py-3">{{ s.child_name || s.child_id?.slice(0,8) }}</td>
            <td class="px-4 py-3">{{ s.pack_name || '—' }}</td>
            <td class="px-4 py-3 text-center">{{ s.correct_answers }}/{{ s.total_questions }}</td>
            <td class="px-4 py-3 text-center">{{ s.accuracy }}%</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ formatDate(s.started_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    </template>

    <!-- Question Editor Modal -->
    <div v-if="showQuestionEditor" class="fixed inset-0 z-50 flex items-center justify-center">
      <div @click="showQuestionEditor = false" class="absolute inset-0 bg-black/40"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <h3 class="font-bold text-gray-900">{{ editingQuestion.id ? 'Edit Soal' : 'Tambah Soal' }}</h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Prompt / Kata</label><input v-model="editingQuestion.prompt" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Apel" /></div>
          <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Jawaban Benar</label><input v-model="editingQuestion.correct_answer" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="apel" /></div>
          <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Gambar URL</label><input v-model="editingQuestion.image_url" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="https://..." /></div>
          <div><label class="block text-xs text-gray-500 mb-1">Kategori</label>
            <select v-model="editingQuestion.category_id" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div><label class="block text-xs text-gray-500 mb-1">Kesulitan</label>
            <select v-model="editingQuestion.difficulty" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </div>
          <div><label class="block text-xs text-gray-500 mb-1">Usia Min</label><input v-model.number="editingQuestion.min_age" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">Usia Max</label><input v-model.number="editingQuestion.max_age" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        </div>
        <div class="flex gap-3 pt-2">
          <button @click="saveQuestion" :disabled="saving" class="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{{ saving ? 'Menyimpan...' : 'Simpan' }}</button>
          <button @click="showQuestionEditor = false" class="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm">Batal</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const tabs = [
  { id: 'games', label: 'Games' },
  { id: 'categories', label: 'Kategori' },
  { id: 'questions', label: 'Question Bank' },
  { id: 'sessions', label: 'Player Progress' },
]

const activeTab = ref('questions')
const loading = ref(true)
const saving = ref(false)
const games = ref([])
const categories = ref([])
const questions = ref([])
const sessions = ref([])
const showQuestionEditor = ref(false)
const editingQuestion = ref({})

function formatDate(d) { return d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—' }

async function loadAll() {
  loading.value = true
  const [g, c, q, s] = await Promise.all([
    supabase.from('educational_games').select('*').order('sort_order'),
    supabase.from('educational_game_categories').select('*').order('sort_order'),
    supabase.from('educational_game_questions').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('educational_game_sessions').select('*').order('started_at', { ascending: false }).limit(30),
  ])
  games.value = g.data || []
  categories.value = c.data || []
  questions.value = q.data || []
  sessions.value = s.data || []
  loading.value = false
}

async function saveQuestion() {
  if (!editingQuestion.value.prompt || !editingQuestion.value.correct_answer) return
  saving.value = true
  const payload = {
    prompt: editingQuestion.value.prompt,
    correct_answer: editingQuestion.value.correct_answer,
    image_url: editingQuestion.value.image_url || null,
    category_id: editingQuestion.value.category_id || null,
    difficulty: editingQuestion.value.difficulty || 'easy',
    min_age: editingQuestion.value.min_age || 3,
    max_age: editingQuestion.value.max_age || 12,
    game_type: 'word_picture_match',
    is_active: true,
    updated_at: new Date().toISOString(),
  }

  if (editingQuestion.value.id) {
    await supabase.from('educational_game_questions').update(payload).eq('id', editingQuestion.value.id)
  } else {
    await supabase.from('educational_game_questions').insert(payload)
  }

  saving.value = false
  showQuestionEditor.value = false
  await loadAll()
}

async function deleteQuestion(q) {
  if (!confirm(`Hapus soal "${q.prompt}"?`)) return
  await supabase.from('educational_game_questions').delete().eq('id', q.id)
  await loadAll()
}

async function addCategory() {
  const name = prompt('Nama kategori:')
  if (!name) return
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  await supabase.from('educational_game_categories').insert({ name, slug })
  await loadAll()
}

onMounted(loadAll)
</script>
