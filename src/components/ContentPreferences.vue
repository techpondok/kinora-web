<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-lg font-bold text-gray-900">Preferensi Konten</h2>
      <p class="text-sm text-gray-500 mt-0.5">Atur jenis konten dan topik yang ingin kamu ikuti.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">Memuat preferensi...</div>

    <template v-else>
      <!-- 1. Master Toggle: Update Konten Baru -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-gray-900">Update Konten Baru</p>
            <p class="text-xs text-gray-500 mt-0.5">Dapatkan notifikasi saat ada artikel, panduan, atau webinar baru dari Kinora.</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="prefs.content_updates_enabled" @change="save" class="sr-only peer" />
            <div class="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
          </label>
        </div>
      </div>

      <!-- 2. Follow Mode (only if updates enabled) -->
      <div v-if="prefs.content_updates_enabled" class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <p class="text-sm font-semibold text-gray-900">Ikuti Konten</p>

        <!-- Radio: Semua Konten -->
        <label class="flex items-start gap-3 cursor-pointer group">
          <input
            type="radio"
            :value="true"
            v-model="prefs.follow_all_content"
            @change="save"
            class="mt-0.5 w-4 h-4 text-amber-500 border-gray-300 focus:ring-amber-400"
          />
          <div>
            <p class="text-sm font-medium text-gray-800 group-hover:text-gray-900">Semua konten Kinora</p>
            <p class="text-xs text-gray-500">Terima update untuk semua artikel, panduan, webinar, dan resources keluarga.</p>
          </div>
        </label>

        <!-- Radio: Topik Pilihan -->
        <label class="flex items-start gap-3 cursor-pointer group">
          <input
            type="radio"
            :value="false"
            v-model="prefs.follow_all_content"
            @change="save"
            class="mt-0.5 w-4 h-4 text-amber-500 border-gray-300 focus:ring-amber-400"
          />
          <div>
            <p class="text-sm font-medium text-gray-800 group-hover:text-gray-900">Topik pilihan</p>
            <p class="text-xs text-gray-500">Terima update hanya dari topik yang kamu pilih.</p>
          </div>
        </label>

        <!-- Topic List (shown when Topik Pilihan selected) -->
        <div v-if="!prefs.follow_all_content" class="pl-7 pt-2 space-y-2">
          <div v-if="topicsLoading" class="text-xs text-gray-400">Memuat topik...</div>
          <div v-else-if="topics.length === 0" class="text-xs text-gray-400">Belum ada topik tersedia.</div>
          <label
            v-for="topic in topics"
            :key="topic.slug"
            class="flex items-center gap-2.5 cursor-pointer group"
          >
            <input
              type="checkbox"
              :value="topic.slug"
              v-model="prefs.followed_topics"
              @change="save"
              class="w-4 h-4 rounded text-amber-500 border-gray-300 focus:ring-amber-400"
            />
            <div>
              <span class="text-sm text-gray-700 group-hover:text-gray-900">{{ topic.name }}</span>
              <span v-if="topic.description" class="text-xs text-gray-400 ml-1">· {{ topic.description }}</span>
            </div>
          </label>
        </div>
      </div>

      <!-- 3. Newsletter Email -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-gray-900">Newsletter Email</p>
            <p class="text-xs text-gray-500 mt-0.5">Terima ringkasan konten terbaru melalui email secara berkala.</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="prefs.newsletter_email_enabled" @change="save" class="sr-only peer" />
            <div class="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
          </label>
        </div>
      </div>

      <!-- Save feedback -->
      <p v-if="saved" class="text-xs text-green-600 font-medium">✓ Preferensi tersimpan</p>
      <p v-if="saveError" class="text-xs text-red-500">Gagal menyimpan. Coba lagi.</p>

      <!-- Info -->
      <p class="text-xs text-gray-400">Pengaturan ini tidak memengaruhi email penting seperti keamanan akun, pembayaran, atau notifikasi darurat keluarga.</p>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'
import { useContentCategories } from '../composables/useContentCategories.js'

const { categories: topics, loading: topicsLoading, loadCategories } = useContentCategories()

const loading = ref(true)
const saved = ref(false)
const saveError = ref(false)

const prefs = reactive({
  content_updates_enabled: true,
  follow_all_content: true,
  newsletter_email_enabled: true,
  followed_topics: [],
})

let userId = null

async function loadPreferences() {
  loading.value = true
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) { loading.value = false; return }
  userId = session.user.id

  // Load categories for topic selection
  await loadCategories()

  // Load user preferences
  const { data } = await supabase
    .from('kinora_content_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (data) {
    prefs.content_updates_enabled = data.content_updates_enabled ?? true
    prefs.follow_all_content = data.follow_all_content ?? true
    prefs.newsletter_email_enabled = data.newsletter_email_enabled ?? true
    prefs.followed_topics = data.followed_topics || []
  }

  loading.value = false
}

let saveTimeout = null

async function save() {
  if (!userId) return
  saveError.value = false
  saved.value = false

  // Debounce rapid toggles
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    const { error } = await supabase
      .from('kinora_content_preferences')
      .upsert({
        user_id: userId,
        content_updates_enabled: prefs.content_updates_enabled,
        follow_all_content: prefs.follow_all_content,
        newsletter_email_enabled: prefs.newsletter_email_enabled,
        followed_topics: prefs.followed_topics,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) {
      saveError.value = true
    } else {
      saved.value = true
      setTimeout(() => { saved.value = false }, 2000)
    }
  }, 500)
}

onMounted(loadPreferences)
</script>
