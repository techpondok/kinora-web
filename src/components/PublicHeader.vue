<template>
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 transition-shadow duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2">
        <img v-if="logoUrl" :src="logoUrl" alt="Kinora" class="h-7" />
        <span class="font-bold text-xl text-gray-900" style="font-family: 'Bricolage Grotesque', sans-serif">Kinora</span>
      </a>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-6 text-sm text-gray-600">
        <a
          v-for="item in currentNavItems"
          :key="item.label"
          :href="item.href"
          class="hover:text-amber-700 transition"
          :class="{ 'text-amber-700 font-medium': isNavActive(item) }"
        >{{ item.label }}</a>
      </nav>

      <!-- Right Actions -->
      <div class="flex items-center gap-2">
        <!-- Auth Loading -->
        <template v-if="authLoading">
          <div class="w-[100px] h-9 rounded-full bg-gray-100 animate-pulse"></div>
        </template>
        <!-- Authenticated -->
        <template v-else-if="user">
          <div class="relative">
            <button
              class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition text-sm font-medium text-gray-700"
              @click="showDropdown = !showDropdown"
            >
              <div class="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-xs font-semibold">
                {{ userInitial }}
              </div>
              <span class="hidden lg:inline">{{ displayName }}</span>
            </button>
            <div v-if="showDropdown" class="absolute top-11 right-0 min-w-[170px] bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
              <a href="/portal" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" @click="showDropdown=false">Portal Saya</a>
              <a href="/security" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" @click="showDropdown=false">Keamanan</a>
              <button @click="handleSignOut" class="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50">Keluar</button>
            </div>
          </div>
        </template>
        <!-- Guest -->
        <template v-else>
          <a href="/login" class="hidden sm:inline-block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">Login</a>
          <a href="/register" class="px-4 py-2 text-sm bg-amber-500 text-white rounded-full hover:bg-amber-600 transition font-medium shadow-sm">Mulai Gratis</a>
        </template>
        <!-- Mobile hamburger -->
        <button @click="mobileOpen = !mobileOpen" class="md:hidden p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg ml-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
    <!-- Mobile nav -->
    <div v-if="mobileOpen" class="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
      <a
        v-for="item in currentNavItems"
        :key="item.label"
        :href="item.href"
        class="block text-sm text-gray-700 hover:text-amber-700 transition"
        :class="{ 'text-amber-700 font-medium': isNavActive(item) }"
        @click="mobileOpen=false"
      >{{ item.label }}</a>
      <div class="pt-3 border-t border-gray-100 space-y-2">
        <template v-if="authLoading">
          <div class="w-24 h-8 rounded bg-gray-100 animate-pulse"></div>
        </template>
        <template v-else-if="user">
          <a href="/portal" class="block text-sm text-gray-700 hover:text-amber-700 transition" @click="mobileOpen=false">Portal Saya</a>
          <a href="/security" class="block text-sm text-gray-700 hover:text-amber-700 transition" @click="mobileOpen=false">Keamanan</a>
          <button @click="handleSignOut" class="block text-sm text-red-500 hover:text-red-700 transition">Keluar</button>
        </template>
        <template v-else>
          <a href="/login" class="block text-sm text-gray-700 hover:text-amber-700 transition" @click="mobileOpen=false">Login</a>
          <a href="/register" class="block text-center text-sm bg-amber-500 text-white rounded-full py-2 hover:bg-amber-600 transition font-medium" @click="mobileOpen=false">Mulai Gratis</a>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../composables/useAuth.js'

const props = defineProps({
  /** Override nav items for special pages (e.g. HomePage with anchor links) */
  navItems: { type: Array, default: null },
})

const route = useRoute()
const { user, loading: authLoading, signOut } = useAuth()
const logoUrl = ref('')
const showDropdown = ref(false)
const mobileOpen = ref(false)

// Close dropdown/mobile when route changes
watch(() => route.path, () => {
  showDropdown.value = false
  mobileOpen.value = false
})

// Close dropdown when clicking outside
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (showDropdown.value && !e.target.closest('.relative')) {
      showDropdown.value = false
    }
  })
}

// --- Navigation Configuration ---
const defaultNavItems = [
  { label: 'Fitur', href: '/#features', matchPath: '/' },
  { label: 'Harga', href: '/#pricing', matchPath: '/' },
  { label: 'Artikel', href: '/articles', matchPath: '/articles' },
  { label: 'About Us', href: '/about', matchPath: '/about' },
  { label: 'FAQ', href: '/#faq', matchPath: '/' },
]

const portalNavItems = [
  { label: 'Beranda', href: '/', matchPath: '/' },
  { label: 'Portal', href: '/portal', matchPath: '/portal' },
  { label: 'Keamanan', href: '/security', matchPath: '/security' },
  { label: 'Artikel', href: '/articles', matchPath: '/articles' },
  { label: 'Bantuan', href: '/help', matchPath: '/help' },
]

const currentNavItems = computed(() => {
  // Props override (HomePage passes its own anchor links)
  if (props.navItems) return props.navItems

  // Authenticated user on portal/security pages
  if (user.value && (route.path.startsWith('/portal') || route.path.startsWith('/security'))) {
    return portalNavItems
  }

  // Default public nav
  return defaultNavItems
})

function isNavActive(item) {
  if (!item.matchPath) return false
  if (item.matchPath === '/') return route.path === '/'
  return route.path.startsWith(item.matchPath)
}

// --- User display ---
const displayName = computed(() => {
  if (!user.value) return ''
  return user.value.user_metadata?.full_name || user.value.email?.split('@')[0] || 'User'
})

const userInitial = computed(() => displayName.value.charAt(0).toUpperCase())

async function handleSignOut() {
  showDropdown.value = false
  mobileOpen.value = false
  await signOut()
  window.location.href = '/'
}

// --- Logo from CMS ---
onMounted(async () => {
  const { data } = await supabase
    .from('kinora_landing_config')
    .select('value')
    .eq('key', 'general')
    .eq('status', 'published')
    .maybeSingle()
  if (data?.value?.logo_url) logoUrl.value = data.value.logo_url
})
</script>
