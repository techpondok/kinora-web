<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="open = !open"
      class="flex items-center justify-between gap-2 w-full sm:w-auto min-w-[180px] px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-purple-300 transition shadow-sm"
      :class="open ? 'border-purple-400 ring-2 ring-purple-100' : ''"
    >
      <span class="truncate">{{ selectedLabel }}</span>
      <svg class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform" :class="open ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown menu -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="open" class="absolute z-50 mt-2 w-full sm:w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden left-0">
        <!-- Search (only if many categories) -->
        <div v-if="categories.length > 8" class="p-2 border-b border-gray-100">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari kategori..."
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-200"
            @click.stop
          />
        </div>

        <div class="max-h-60 overflow-y-auto py-1">
          <!-- All option -->
          <button
            @click="selectCategory(null)"
            class="w-full text-left px-4 py-2.5 text-sm transition flex items-center justify-between"
            :class="!modelValue ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'"
          >
            <span>{{ allLabel }}</span>
            <span v-if="showCounts && totalCount" class="text-xs text-gray-400">{{ totalCount }}</span>
          </button>

          <!-- Category list -->
          <button
            v-for="cat in filteredCategories"
            :key="cat.slug"
            @click="selectCategory(cat.slug)"
            class="w-full text-left px-4 py-2.5 text-sm transition flex items-center justify-between"
            :class="modelValue === cat.slug ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'"
          >
            <span>{{ cat.name }}</span>
            <span v-if="showCounts && cat.count != null" class="text-xs text-gray-400">{{ cat.count }}</span>
          </button>

          <!-- Empty state -->
          <p v-if="filteredCategories.length === 0 && searchQuery" class="px-4 py-3 text-sm text-gray-400 text-center">
            Tidak ditemukan
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: null },
  categories: { type: Array, default: () => [] },
  allLabel: { type: String, default: 'Semua Kategori' },
  showCounts: { type: Boolean, default: false },
  totalCount: { type: Number, default: null },
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const searchQuery = ref('')
const dropdownRef = ref(null)

const selectedLabel = computed(() => {
  if (!props.modelValue) return props.allLabel
  const cat = props.categories.find(c => c.slug === props.modelValue)
  return cat?.name || props.modelValue
})

const filteredCategories = computed(() => {
  if (!searchQuery.value) return props.categories
  const q = searchQuery.value.toLowerCase()
  return props.categories.filter(c => c.name.toLowerCase().includes(q))
})

function selectCategory(slug) {
  emit('update:modelValue', slug || '')
  open.value = false
  searchQuery.value = ''
}

function handleClickOutside(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
