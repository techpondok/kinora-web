<template>
  <div class="flex gap-3">
    <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
      <img v-if="avatarUrl" :src="avatarUrl" class="w-full h-full object-cover" />
      <span v-else class="text-xs font-semibold text-purple-700">{{ (displayName || '?')[0].toUpperCase() }}</span>
    </div>
    <div class="flex-1">
      <textarea
        ref="textareaRef"
        v-model="body"
        :placeholder="placeholder"
        rows="2"
        maxlength="2000"
        class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 resize-none transition"
        @input="autoResize"
      ></textarea>
      <div class="flex items-center justify-between mt-2">
        <span class="text-xs text-gray-400">{{ body.length }}/2000</span>
        <button
          @click="submit"
          :disabled="!body.trim() || posting"
          class="px-4 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ posting ? 'Mengirim...' : 'Kirim' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  avatarUrl: String,
  displayName: String,
  posting: Boolean,
  placeholder: { type: String, default: 'Tulis komentar...' },
})

const emit = defineEmits(['submit'])
const body = ref('')
const textareaRef = ref(null)

function autoResize() {
  const el = textareaRef.value
  if (el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }
}

function submit() {
  if (!body.value.trim()) return
  emit('submit', body.value.trim())
  body.value = ''
  if (textareaRef.value) textareaRef.value.style.height = 'auto'
}
</script>
