<template>
  <div class="rich-editor border border-gray-300 rounded-lg overflow-hidden">
    <!-- Toolbar -->
    <div v-if="editor" class="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="btnClass(editor.isActive('heading', { level: 2 }))" title="H2">H2</button>
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="btnClass(editor.isActive('heading', { level: 3 }))" title="H3">H3</button>
      <div class="w-px h-5 bg-gray-300 mx-1"></div>
      <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="btnClass(editor.isActive('bold'))" title="Bold"><strong>B</strong></button>
      <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="btnClass(editor.isActive('italic'))" title="Italic"><em>I</em></button>
      <div class="w-px h-5 bg-gray-300 mx-1"></div>
      <button type="button" @click="editor.chain().focus().toggleBulletList().run()" :class="btnClass(editor.isActive('bulletList'))" title="Bullet List">• List</button>
      <button type="button" @click="editor.chain().focus().toggleOrderedList().run()" :class="btnClass(editor.isActive('orderedList'))" title="Ordered List">1. List</button>
      <button type="button" @click="editor.chain().focus().toggleBlockquote().run()" :class="btnClass(editor.isActive('blockquote'))" title="Quote">❝</button>
      <div class="w-px h-5 bg-gray-300 mx-1"></div>
      <button type="button" @click="setLink" :class="btnClass(editor.isActive('link'))" title="Link">🔗</button>
      <button type="button" @click="triggerImageUpload" title="Upload Image">🖼️</button>
      <button type="button" @click="addYoutube" title="Video">▶️</button>
      <div class="w-px h-5 bg-gray-300 mx-1"></div>
      <button type="button" @click="editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()" title="Table">📊</button>
      <button type="button" @click="editor.chain().focus().setHorizontalRule().run()" title="Divider">—</button>
      <div class="w-px h-5 bg-gray-300 mx-1"></div>
      <button type="button" @click="editor.chain().focus().undo().run()" title="Undo">↩</button>
      <button type="button" @click="editor.chain().focus().redo().run()" title="Redo">↪</button>
    </div>

    <!-- Editor -->
    <editor-content :editor="editor" class="prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none" />
    <!-- Uploading indicator -->
    <div v-if="uploading" class="px-4 py-2 bg-blue-50 text-blue-700 text-xs border-t border-gray-200">Mengupload gambar...</div>
    <!-- Hidden file input -->
    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="handleImageUpload" />
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import Youtube from '@tiptap/extension-youtube'

const props = defineProps({
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
    }),
    Image.configure({ inline: false, allowBase64: false }),
    Link.configure({ openOnClick: false, autolink: true }),
    Placeholder.configure({ placeholder: 'Tulis isi artikel...' }),
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    Youtube.configure({ inline: false }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => props.modelValue, (val) => {
  if (editor.value && val !== editor.value.getHTML()) {
    editor.value.commands.setContent(val, false)
  }
})

function btnClass(active) {
  return [
    'px-2 py-1 text-xs rounded transition',
    active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200',
  ]
}

function setLink() {
  const url = window.prompt('URL:')
  if (url) {
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  } else {
    editor.value.chain().focus().unsetLink().run()
  }
}

function addImage() {
  const url = window.prompt('URL gambar:')
  if (url) {
    editor.value.chain().focus().setImage({ src: url }).run()
  }
}

const fileInput = ref(null)
const uploading = ref(false)

function triggerImageUpload() {
  fileInput.value?.click()
}

async function handleImageUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    alert('File terlalu besar (max 5MB)')
    return
  }
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    alert('Format harus JPEG, PNG, WebP, atau GIF')
    return
  }

  uploading.value = true
  try {
    const { supabase } = await import('../lib/supabase.js')
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const ext = file.name.split('.').pop()
    const fileName = `editor-${Date.now()}.${ext}`
    const path = `${year}/${month}/${fileName}`

    const { error } = await supabase.storage.from('articles').upload(path, file, { cacheControl: '31536000', upsert: false })
    if (error) {
      alert('Upload gagal: ' + error.message)
    } else {
      const { data: urlData } = supabase.storage.from('articles').getPublicUrl(path)
      if (urlData?.publicUrl) {
        editor.value.chain().focus().setImage({ src: urlData.publicUrl }).run()
      }
    }
  } catch (err) {
    alert('Upload gagal: ' + err.message)
  }
  uploading.value = false
  // Reset input
  if (fileInput.value) fileInput.value.value = ''
}

function addYoutube() {
  const url = window.prompt('URL YouTube:')
  if (url) {
    editor.value.commands.setYoutubeVideo({ src: url })
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
.rich-editor .ProseMirror {
  outline: none;
  min-height: 300px;
}
.rich-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}
.rich-editor .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; }
.rich-editor .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
.rich-editor .ProseMirror ul { list-style: disc; padding-left: 1.5rem; }
.rich-editor .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; }
.rich-editor .ProseMirror blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; color: #6b7280; margin: 0.5rem 0; }
.rich-editor .ProseMirror a { color: #2563eb; text-decoration: underline; }
.rich-editor .ProseMirror img { max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; }
.rich-editor .ProseMirror table { border-collapse: collapse; width: 100%; margin: 0.5rem 0; }
.rich-editor .ProseMirror td, .rich-editor .ProseMirror th { border: 1px solid #d1d5db; padding: 0.5rem; }
.rich-editor .ProseMirror th { background: #f9fafb; font-weight: 600; }
.rich-editor .ProseMirror hr { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
.rich-editor .ProseMirror iframe { max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; }
</style>
