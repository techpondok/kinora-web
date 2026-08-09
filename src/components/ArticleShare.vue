<template>
  <div class="relative inline-block" ref="containerRef">
    <button
      @click="handleShare"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
      </svg>
      <span>Bagikan</span>
    </button>

    <!-- Desktop Popover -->
    <Teleport to="body">
      <div
        v-if="showPopover"
        class="fixed inset-0 z-50"
        @click="showPopover = false"
        @keydown.escape="showPopover = false"
      >
        <div
          class="absolute bg-white border border-gray-200 rounded-xl shadow-lg w-[260px] py-2 z-50"
          :style="popoverStyle"
          @click.stop
        >
          <p class="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Bagikan artikel</p>
          <a
            v-for="opt in shareOptions"
            :key="opt.id"
            :href="opt.href"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            @click="showPopover = false"
          >
            <span class="w-5 h-5 flex items-center justify-center flex-shrink-0" v-html="opt.icon"></span>
            <span>{{ opt.label }}</span>
          </a>
          <button
            @click="handleCopy"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
          >
            <span class="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
              </svg>
              <svg v-else class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </span>
            <span>{{ copied ? 'Link tersalin' : 'Salin Link' }}</span>
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Mobile Bottom Sheet (fallback when native share not available) -->
    <Teleport to="body">
      <div
        v-if="showSheet"
        class="fixed inset-0 z-50 flex items-end justify-center"
        @click.self="showSheet = false"
      >
        <div class="absolute inset-0 bg-black/30" @click="showSheet = false"></div>
        <div class="relative w-full max-w-lg bg-white rounded-t-2xl pb-safe z-10 animate-slide-up">
          <div class="flex justify-center pt-3 pb-1">
            <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
          </div>
          <div class="px-5 pt-2 pb-4">
            <p class="text-sm font-semibold text-gray-900">Bagikan artikel</p>
            <p class="text-xs text-gray-500 mt-0.5 line-clamp-1">{{ title }}</p>
          </div>
          <div class="px-3 pb-4 space-y-0.5">
            <a
              v-for="opt in shareOptions"
              :key="opt.id"
              :href="opt.href"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
              @click="showSheet = false"
            >
              <span class="w-5 h-5 flex items-center justify-center flex-shrink-0" v-html="opt.icon"></span>
              <span>{{ opt.label }}</span>
            </a>
            <button
              @click="handleCopy"
              class="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition text-left"
            >
              <span class="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                </svg>
                <svg v-else class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </span>
              <span>{{ copied ? 'Link tersalin' : 'Salin Link' }}</span>
            </button>
          </div>
          <button
            @click="showSheet = false"
            class="w-full px-5 py-3 text-sm font-medium text-gray-500 border-t border-gray-100 hover:bg-gray-50 transition"
          >Tutup</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  url: { type: String, required: true },
})

const containerRef = ref(null)
const showPopover = ref(false)
const showSheet = ref(false)
const copied = ref(false)
const popoverStyle = ref({})

const shareText = computed(() => `${props.title} ${props.url}`)

const shareOptions = computed(() => [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    href: `https://wa.me/?text=${encodeURIComponent(shareText.value)}`,
    icon: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(props.url)}`,
    icon: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(props.url)}`,
    icon: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z"/></svg>',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    href: `https://t.me/share/url?url=${encodeURIComponent(props.url)}&text=${encodeURIComponent(props.title)}`,
    icon: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
  },
])

// Detect mobile (< 768px or touch device)
function isMobile() {
  return window.innerWidth < 768 || 'ontouchstart' in window
}

async function handleShare() {
  // Mobile: prefer native Web Share API
  if (isMobile() && navigator.share) {
    try {
      await navigator.share({ title: props.title, url: props.url })
    } catch (e) {
      // User cancelled or error — ignore
    }
    return
  }

  // Mobile without native share: show bottom sheet
  if (isMobile()) {
    showSheet.value = true
    return
  }

  // Desktop: show popover anchored to button
  showPopover.value = true
  await nextTick()
  positionPopover()
}

function positionPopover() {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const popoverWidth = 260

  // Position below and aligned to button start
  let left = rect.left
  // If it would overflow right edge, shift left
  if (left + popoverWidth > window.innerWidth - 16) {
    left = window.innerWidth - popoverWidth - 16
  }

  popoverStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${Math.max(16, left)}px`,
  }
}

function handleCopy() {
  navigator.clipboard.writeText(props.url)
  copied.value = true
  setTimeout(() => {
    copied.value = false
    showPopover.value = false
    showSheet.value = false
  }, 1500)
}
</script>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.2s ease-out;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 16px);
}
</style>
