<template>
  <div class="group">
    <!-- Deleted comment placeholder -->
    <div v-if="comment.status === 'deleted'" class="flex gap-3 opacity-60">
      <div class="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0"></div>
      <div class="flex-1">
        <p class="text-sm text-gray-400 italic">Komentar telah dihapus.</p>
      </div>
    </div>

    <!-- Normal comment -->
    <div v-else class="flex gap-3">
      <!-- Avatar -->
      <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img v-if="comment.avatar_url" :src="comment.avatar_url" class="w-full h-full object-cover" />
        <span v-else class="text-xs font-semibold text-purple-700">{{ (comment.display_name || '?')[0].toUpperCase() }}</span>
      </div>

      <div class="flex-1 min-w-0">
        <!-- Header -->
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-900">{{ comment.display_name }}</span>
          <span class="text-xs text-gray-400">{{ relativeTime(comment.created_at) }}</span>
          <span v-if="comment.is_edited" class="text-xs text-gray-400">(diedit)</span>
        </div>

        <!-- Body or edit mode -->
        <div v-if="editing" class="mt-1">
          <textarea v-model="editBody" rows="2" maxlength="2000" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200 resize-none"></textarea>
          <div class="flex gap-2 mt-1">
            <button @click="saveEdit" class="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg">Simpan</button>
            <button @click="editing = false" class="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
          </div>
        </div>
        <p v-else class="mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words">{{ comment.body }}</p>

        <!-- Actions -->
        <div class="flex items-center gap-3 mt-2">
          <button @click="$emit('like', comment.id)" class="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21H6a2 2 0 01-2-2v-7a2 2 0 012-2h2l3-4.5V3a1 1 0 011-1h.5a2.5 2.5 0 012.5 2.5V10z" /></svg>
            <span v-if="comment.likes_count">{{ comment.likes_count }}</span>
          </button>

          <button v-if="!comment.parent_id" @click="showReply = !showReply" class="text-xs text-gray-500 hover:text-purple-600 transition">
            Balas
          </button>

          <button v-if="isOwn" @click="startEdit" class="text-xs text-gray-500 hover:text-purple-600 transition">Edit</button>
          <button v-if="isOwn || isAdmin" @click="$emit('delete', comment.id)" class="text-xs text-gray-500 hover:text-red-600 transition">Hapus</button>
          <button v-if="!isOwn && currentUserId" @click="$emit('report', comment.id)" class="text-xs text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100">Laporkan</button>
        </div>

        <!-- Reply composer -->
        <div v-if="showReply" class="mt-3">
          <CommentComposer
            :avatar-url="null"
            :display-name="''"
            :posting="replyPosting"
            placeholder="Tulis balasan..."
            @submit="submitReply"
          />
        </div>

        <!-- Replies -->
        <div v-if="comment.replies_count > 0 && !comment.parent_id" class="mt-3">
          <button v-if="!comment.repliesLoaded" @click="$emit('load-replies', comment.id)" class="text-xs text-purple-600 hover:text-purple-800 font-medium">
            Lihat {{ comment.replies_count }} balasan
          </button>
          <div v-else class="space-y-4 mt-3 pl-4 border-l-2 border-gray-100">
            <CommentItem
              v-for="reply in comment.replies"
              :key="reply.id"
              :comment="reply"
              :current-user-id="currentUserId"
              :is-admin="isAdmin"
              @like="$emit('like', $event)"
              @edit="$emit('edit', $event)"
              @delete="$emit('delete', $event)"
              @report="$emit('report', $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import CommentComposer from './CommentComposer.vue'

const props = defineProps({
  comment: { type: Object, required: true },
  currentUserId: String,
  isAdmin: Boolean,
})

const emit = defineEmits(['reply', 'edit', 'delete', 'like', 'report', 'load-replies'])

const showReply = ref(false)
const replyPosting = ref(false)
const editing = ref(false)
const editBody = ref('')

const isOwn = computed(() => props.currentUserId && props.comment.user_id === props.currentUserId)

function startEdit() {
  editBody.value = props.comment.body
  editing.value = true
}

function saveEdit() {
  if (!editBody.value.trim()) return
  emit('edit', { commentId: props.comment.id, body: editBody.value.trim() })
  editing.value = false
}

async function submitReply(body) {
  replyPosting.value = true
  emit('reply', { commentId: props.comment.id, body })
  showReply.value = false
  replyPosting.value = false
}

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const d = new Date(dateStr).getTime()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'baru saja'
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu'
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu'
  if (diff < 604800) return Math.floor(diff / 86400) + ' hari lalu'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
