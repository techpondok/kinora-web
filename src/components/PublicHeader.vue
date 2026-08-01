<template>
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 transition-shadow duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <img v-if="logoUrl" :src="logoUrl" alt="Kinora" class="h-7" />
        <span class="font-bold text-xl text-gray-900" style="font-family: 'Bricolage Grotesque', sans-serif">Kinora</span>
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm text-gray-600">
        <a href="/#features" class="hover:text-amber-700 transition">Fitur</a>
        <a href="/#pricing" class="hover:text-amber-700 transition">Harga</a>
        <a href="/articles" class="hover:text-amber-700 transition">Artikel</a>
        <a href="/#faq" class="hover:text-amber-700 transition">FAQ</a>
      </nav>
      <div class="flex items-center gap-2">
        <template v-if="user">
          <div class="relative">
            <button
              class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition text-sm font-medium text-gray-700"
              @click="showDropdown = !showDropdown"
            >
              <div class="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-xs font-semibold">
                {{ userInitial }}
              </div>
              <span>{{ displayName }}</span>
            </button>
            <div v-if="showDropdown" class="absolute top-11 right-0 min-w-[170px] bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
              <a href="/portal" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" @click="showDropdown=false">Portal Saya</a>
              <a href="/security" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" @click="showDropdown=false">Keamanan</a>
              <button @click="handleSignOut" class="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50">Keluar</button>
            </div>
          </div>
        </template>
        <template v-else>
          <a href="/login" class="hidden sm:inline-block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">Login</a>
          <a href="/register" class="px-4 py-2 text-sm bg-amber-500 text-white rounded-full hover:bg-amber-600 transition font-medium shadow-sm">Mulai Gratis</a>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../composables/useAuth.js'

const { user, signOut } = useAuth()
const logoUrl = ref('')
const showDropdown = ref(false)

const displayName = computed(() => {
  if (!user.value) return ''
  return user.value.user_metadata?.full_name || user.value.email?.split('@')[0] || 'User'
})

const userInitial = computed(() => displayName.value.charAt(0).toUpperCase())

async function handleSignOut() {
  showDropdown.value = false
  await signOut()
  window.location.href = '/'
}

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
