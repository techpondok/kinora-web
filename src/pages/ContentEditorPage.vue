<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="$emit('navigate', 'content')" class="text-gray-500 hover:text-gray-700">← Kembali</button>
        <h1 class="text-xl font-bold text-gray-900">{{ isEdit ? 'Edit Konten' : 'Tambah Konten' }}</h1>
      </div>
      <div class="flex gap-2">
        <button @click="saveDraft" :disabled="saving" class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
          Simpan Draft
        </button>
        <button @click="savePublish" :disabled="saving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {{ saving ? 'Menyimpan...' : 'Publish' }}
        </button>
      </div>
    </div>

    <!-- Error/Success -->
    <div v-if="error" class="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{{ error }}</div>
    <div v-if="success" class="p-3 bg-green-50 text-green-700 text-sm rounded-lg">{{ success }}</div>

    <!-- Loading -->
    <div v-if="loadingData" class="text-center py-12 text-gray-500">Memuat...</div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Title -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Judul</label>
            <input v-model="form.title" @input="autoSlug" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Judul artikel..." />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input v-model="form.slug" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="slug-artikel" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ringkasan</label>
            <textarea v-model="form.summary" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ringkasan singkat..."></textarea>
          </div>
        </div>

        <!-- Body -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Isi Artikel</label>
          <RichTextEditor v-model="form.body" />
        </div>

        <!-- SEO -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h3 class="font-semibold text-gray-900 text-sm">SEO</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">SEO Title</label>
              <input v-model="form.seo_title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="SEO title..." />
              <p class="text-xs mt-0.5" :class="(form.seo_title||'').length > 60 ? 'text-red-500' : 'text-gray-400'">{{ (form.seo_title||'').length }}/60</p>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Focus Keyword</label>
              <input v-model="form.focus_keyword" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="keyword utama" />
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Meta Description</label>
            <textarea v-model="form.meta_description" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Deskripsi untuk search engine..."></textarea>
            <p class="text-xs mt-0.5" :class="(form.meta_description||'').length > 160 ? 'text-red-500' : 'text-gray-400'">{{ (form.meta_description||'').length }}/160</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Canonical URL</label>
              <input v-model="form.canonical_url" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Secondary Keywords (koma)</label>
              <input v-model="secondaryKwStr" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="keyword1, keyword2" />
            </div>
          </div>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="form.robots_index" class="rounded" /> Index</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="form.robots_follow" class="rounded" /> Follow</label>
          </div>

          <!-- SEO Score -->
          <div class="border-t pt-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">SEO Score</span>
              <span :class="seoScore >= 70 ? 'text-green-600' : seoScore >= 40 ? 'text-yellow-600' : 'text-red-600'" class="text-sm font-bold">{{ seoScore }}/100</span>
            </div>
            <div class="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div :class="seoScore >= 70 ? 'bg-green-500' : seoScore >= 40 ? 'bg-yellow-500' : 'bg-red-400'" class="h-full rounded-full transition-all" :style="{width: seoScore + '%'}"></div>
            </div>
          </div>
        </div>

        <!-- Open Graph -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h3 class="font-semibold text-gray-900 text-sm">Open Graph & Twitter</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">OG Title</label>
              <input v-model="form.og_title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Twitter Title</label>
              <input v-model="form.twitter_title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">OG Description</label>
              <textarea v-model="form.og_description" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Twitter Description</label>
              <textarea v-model="form.twitter_description" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <!-- Publish settings -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h3 class="font-semibold text-gray-900 text-sm">Publikasi</h3>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Tipe Konten</label>
            <select v-model="form.content_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option v-for="t in contentTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Kategori</label>
            <input v-model="form.category" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="general" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Status</label>
            <select v-model="form.status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div v-if="form.status === 'scheduled'">
            <label class="block text-xs text-gray-500 mb-1">Jadwal Publikasi</label>
            <input v-model="form.scheduled_at" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Penulis</label>
            <input v-model="form.author_name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Nama penulis" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Tags (koma)</label>
            <input v-model="tagsStr" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="tag1, tag2" />
          </div>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="form.is_featured" class="rounded" /> Featured</label>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="form.allow_comments" class="rounded" /> Izinkan komentar</label>
        </div>

        <!-- Thumbnail -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 class="font-semibold text-gray-900 text-sm">Thumbnail</h3>
          <div v-if="form.cover_url" class="relative">
            <img :src="form.cover_url" class="w-full h-32 object-cover rounded-lg" />
            <button @click="removeCover" class="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded">×</button>
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" @change="handleCoverUpload" class="text-xs" />
          <div>
            <label class="block text-xs text-gray-500 mb-1">Alt Text</label>
            <input v-model="form.cover_alt" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Deskripsi gambar" />
          </div>
          <p v-if="uploadError" class="text-xs text-red-600">{{ uploadError }}</p>
        </div>

        <!-- Source (for news) -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 class="font-semibold text-gray-900 text-sm">Sumber</h3>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Nama Sumber</label>
            <input v-model="form.source_name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Nama media/sumber" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">URL Sumber</label>
            <input v-model="form.source_url" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="https://..." />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useArticles } from '../composables/useArticles.js'
import RichTextEditor from '../components/RichTextEditor.vue'

const props = defineProps({ articleId: { type: String, default: null } })
const emit = defineEmits(['navigate'])

const { fetchArticle, saveArticle, uploadImage, deleteImage, generateSlug, calculateSeoScore, loading: loadingData } = useArticles()

const saving = ref(false)
const error = ref('')
const success = ref('')
const uploadError = ref('')
const slugManuallyEdited = ref(false)

const contentTypes = [
  { value: 'article', label: 'Artikel' },
  { value: 'news', label: 'Berita' },
  { value: 'tips_keluarga', label: 'Tips Keluarga' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'keuangan_keluarga', label: 'Keuangan Keluarga' },
  { value: 'kesehatan_keluarga', label: 'Kesehatan Keluarga' },
  { value: 'keamanan_digital', label: 'Keamanan Digital' },
  { value: 'teknologi_keluarga', label: 'Teknologi Keluarga' },
  { value: 'update_produk', label: 'Update Produk' },
  { value: 'pengumuman', label: 'Pengumuman' },
  { value: 'press_release', label: 'Press Release' },
]

const form = ref({
  title: '', slug: '', summary: '', body: '',
  content_type: 'article', category: 'general', status: 'draft',
  tags: [], author_name: '', source_url: '', source_name: '',
  cover_url: '', cover_alt: '', is_featured: false, allow_comments: true,
  scheduled_at: '', published_at: null,
  seo_title: '', meta_description: '', focus_keyword: '',
  secondary_keywords: [], canonical_url: '',
  og_title: '', og_description: '', og_image: '',
  twitter_title: '', twitter_description: '', twitter_image: '',
  robots_index: true, robots_follow: true,
  related_article_ids: [], seo_score: 0,
})

const tagsStr = computed({
  get: () => (form.value.tags || []).join(', '),
  set: (v) => { form.value.tags = v.split(',').map(s => s.trim()).filter(Boolean) }
})
const secondaryKwStr = computed({
  get: () => (form.value.secondary_keywords || []).join(', '),
  set: (v) => { form.value.secondary_keywords = v.split(',').map(s => s.trim()).filter(Boolean) }
})

const isEdit = computed(() => !!props.articleId)
const seoScore = computed(() => calculateSeoScore(form.value))

function autoSlug() {
  if (!slugManuallyEdited.value && !isEdit.value) {
    form.value.slug = generateSlug(form.value.title)
  }
}

watch(() => form.value.slug, (newVal, oldVal) => {
  if (oldVal && newVal !== generateSlug(form.value.title)) {
    slugManuallyEdited.value = true
  }
})

async function handleCoverUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploadError.value = ''

  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'File terlalu besar (max 5MB)'
    return
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    uploadError.value = 'Format harus JPEG, PNG, atau WebP'
    return
  }

  const { url, error: err } = await uploadImage(file, form.value.slug)
  if (err) {
    uploadError.value = err
  } else {
    form.value.cover_url = url
    form.value.og_image = url
    form.value.twitter_image = url
  }
}

async function removeCover() {
  await deleteImage(form.value.cover_url)
  form.value.cover_url = ''
}

async function doSave(status) {
  saving.value = true
  error.value = ''
  success.value = ''

  if (!form.value.title) { error.value = 'Judul wajib diisi'; saving.value = false; return }
  if (!form.value.slug) { form.value.slug = generateSlug(form.value.title) }
  if (!form.value.source_url) { form.value.source_url = `/articles/${form.value.slug}` }

  form.value.status = status
  form.value.seo_score = seoScore.value

  const payload = { ...form.value }
  if (isEdit.value) payload.id = props.articleId

  // Convert empty strings to null for timestamp fields
  if (!payload.scheduled_at) payload.scheduled_at = null
  if (!payload.published_at) payload.published_at = null
  delete payload.expires_at

  const { data, error: err } = await saveArticle(payload)
  if (err) {
    error.value = err.message?.includes('idx_kinora_articles_slug') ? 'Slug sudah digunakan.' : (err.message || 'Gagal menyimpan')
  } else {
    success.value = status === 'published' ? 'Artikel berhasil dipublikasikan!' : 'Draft tersimpan!'
    if (!isEdit.value && data) {
      emit('navigate', 'content-editor', data.id)
    }
  }
  saving.value = false
}

function saveDraft() { doSave('draft') }
function savePublish() { doSave('published') }

onMounted(async () => {
  if (props.articleId) {
    const { data } = await fetchArticle(props.articleId)
    if (data) {
      form.value = { ...form.value, ...data }
      slugManuallyEdited.value = true
    }
  }
})
</script>
