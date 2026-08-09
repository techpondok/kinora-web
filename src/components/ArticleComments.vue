<template>
  <section class="mt-12 border-t border-gray-200 pt-10">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-2">
      <h3 class="text-lg font-bold text-gray-900">Diskusi Keluarga</h3>
      <span v-if="totalCount > 0" class="text-sm text-gray-500">({{ totalCount }})</span>
    </div>
    <p class="text-sm text-gray-500 mb-6">Bagikan pengalaman atau pendapatmu. Jaga ruang ini tetap nyaman dan saling menghargai.</p>

    <!-- Disabled state -->
    <div v-if="!commentsEnabled" class="text-sm text-gray-400 italic">
      Diskusi untuk artikel ini dinonaktifkan.
    </div>

    <template v-else>
      <!-- Comment composer -->
      <div v-if="user" class="mb-8">
        <CommentComposer
          :avatar-url="userProfile.avatar_url"
          :display-name="userProfile.display_name"
          :posting="posting"
          @submit="handlePost"
        />
      </div>
      <div v-else class="mb-8 p-4 bg-gray-50 rounded-xl text-center">
        <p class="text-sm text-gray-600 mb-2">Masuk untuk bergabung dalam diskusi.</p>
        <a :href="`/login?redirect=${encodeURIComponent(currentPath)}`" class="inline-block px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition font-medium">Masuk</a>
      </div>

      <!-- Sort -->
      <div v-if="comments.length" class="flex items-center gap-2 mb-4">
        <button @click="sortBy = 'newest'" :class="sortBy === 'newest' ? 'text-purple-700 font-medium' : 'text-gray-500'" class="text-xs hover:text-purple-600 transition">Terbaru</button>
        <span class="text-gray-300">·</span>
        <button @click="sortBy = 'helpful'" :class="sortBy === 'helpful' ? 'text-purple-700 font-medium' : 'text-gray-500'" class="text-xs hover:text-purple-600 transition">Paling membantu</button>
      </div>

      <!-- Loading -->
      <div v-if="loading && comments.length === 0" class="space-y-4">
        <div v-for="n in 3" :key="n" class="flex gap-3 animate-pulse">
          <div class="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div class="flex-1 space-y-2"><div class="h-3 bg-gray-200 rounded w-1/4"></div><div class="h-3 bg-gray-100 rounded w-3/4"></div></div>
        </div>
      </div>

      <!-- Comments list -->
      <div v-else class="space-y-6">
        <CommentItem
          v-for="comment in sortedComments"
          :key="comment.id"
          :comment="comment"
          :current-user-id="user?.id"
          :is-admin="isAdmin"
          @reply="handleReply"
          @edit="handleEdit"
          @delete="handleDelete"
          @like="handleLike"
          @report="handleReport"
          @load-replies="handleLoadReplies"
        />
      </div>

      <!-- Load more -->
      <button v-if="hasMore" @click="loadMore" :disabled="loading" class="mt-6 w-full py-2.5 text-sm text-purple-700 bg-purple-50 rounded-xl hover:bg-purple-100 transition font-medium disabled:opacity-50">
        {{ loading ? 'Memuat...' : 'Muat lebih banyak komentar' }}
      </button>

      <!-- Empty -->
      <div v-if="!loading && comments.length === 0" class="text-center py-8">
        <p class="text-sm text-gray-400">Belum ada diskusi. Jadilah yang pertama berkomentar!</p>
      </div>
    </template>

    <!-- Report modal -->
    <Teleport to="body">
      <div v-if="reportingComment" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" @click.self="reportingComment = null">
        <div class="bg-white rounded-xl w-full max-w-sm shadow-xl p-5 space-y-4">
          <h4 class="font-semibold text-gray-900">Laporkan Komentar</h4>
          <div class="space-y-2">
            <label v-for="r in reportReasons" :key="r.value" class="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" :value="r.value" v-model="reportReason" class="text-purple-600" />
              <span>{{ r.label }}</span>
            </label>
          </div>
          <div class="flex justify-end gap-3">
            <button @click="reportingComment = null" class="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
            <button @click="submitReport" :disabled="!reportReason" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Kirim Laporan</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { useComments } from '../composables/useComments.js'
import { supabase } from '../lib/supabase.js'
import CommentComposer from './CommentComposer.vue'
import CommentItem from './CommentItem.vue'

const props = defineProps({
  contentId: { type: String, required: true },
  contentType: { type: String, default: 'article' },
  commentsEnabled: { type: Boolean, default: true },
})

const route = useRoute()
const { user } = useAuth()
const {
  comments, totalCount, loading, hasMore, error,
  loadComments, loadReplies, postComment, editComment, deleteComment, toggleLike, reportComment,
} = useComments(props.contentId, props.contentType)

const currentPath = computed(() => route.fullPath)
const posting = ref(false)
const sortBy = ref('newest')
const isAdmin = ref(false)
const reportingComment = ref(null)
const reportReason = ref('')

const reportReasons = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Pelecehan / Bullying' },
  { value: 'inappropriate', label: 'Konten tidak pantas' },
  { value: 'misinformation', label: 'Informasi menyesatkan' },
  { value: 'privacy', label: 'Pelanggaran privasi' },
  { value: 'other', label: 'Lainnya' },
]

const userProfile = computed(() => {
  if (!user.value) return {}
  return {
    display_name: user.value.user_metadata?.full_name || user.value.email?.split('@')[0] || 'Pengguna',
    avatar_url: user.value.user_metadata?.avatar_url || null,
  }
})

const sortedComments = computed(() => {
  if (sortBy.value === 'helpful') {
    return [...comments.value].sort((a, b) => b.likes_count - a.likes_count)
  }
  return comments.value
})

async function handlePost(body) {
  posting.value = true
  try { await postComment(body) }
  catch (e) { console.warn(e.message) }
  finally { posting.value = false }
}

async function handleReply({ commentId, body }) {
  await postComment(body, commentId)
}

async function handleEdit({ commentId, body }) {
  await editComment(commentId, body)
}

async function handleDelete(commentId) {
  if (!confirm('Hapus komentar ini?')) return
  await deleteComment(commentId)
}

async function handleLike(commentId) {
  await toggleLike(commentId)
}

function handleReport(commentId) {
  reportingComment.value = commentId
  reportReason.value = ''
}

async function submitReport() {
  if (!reportingComment.value || !reportReason.value) return
  await reportComment(reportingComment.value, reportReason.value)
  reportingComment.value = null
}

async function handleLoadReplies(commentId) {
  await loadReplies(commentId)
}

function loadMore() {
  loadComments(false)
}

onMounted(async () => {
  if (props.commentsEnabled) {
    await loadComments()
  }
  // Check admin
  if (user.value) {
    const { data } = await supabase.from('founders').select('id').eq('user_id', user.value.id).maybeSingle()
    isAdmin.value = !!data
  }
})
</script>
