<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar Desktop -->
    <aside class="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed inset-y-0 z-20">
      <div class="px-5 py-4 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-amber-200">
            <img v-if="consultantAvatar" :src="consultantAvatar" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-amber-100 flex items-center justify-center">
              <span class="text-sm font-bold text-amber-700">{{ initial }}</span>
            </div>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900 truncate">{{ consultantName }}</p>
            <p class="text-[10px] text-gray-400">Konsultan Kinora</p>
          </div>
        </div>
      </div>
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <router-link v-for="item in navItems" :key="item.to" :to="item.to"
          :class="[isActive(item.to) ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900', 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition']">
          <component :is="item.icon" :size="18" class="flex-shrink-0" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="border-t border-gray-100 px-3 py-3 space-y-2">
        <div class="flex items-center gap-2 px-3 py-2">
          <span class="w-2 h-2 rounded-full" :class="statusDot"></span>
          <select v-model="consultantStatus" @change="updateStatus" class="text-xs text-gray-600 bg-transparent outline-none flex-1">
            <option value="available">Tersedia</option>
            <option value="in_consultation">Sedang Konsultasi</option>
            <option value="break">Istirahat</option>
            <option value="unavailable">Tidak Tersedia</option>
            <option value="leave">Cuti</option>
            <option value="offline">Offline</option>
          </select>
        </div>
        <button @click="handleLogout" class="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition">
          <LogOut :size="18" class="flex-shrink-0" /> Keluar
        </button>
      </div>
    </aside>

    <!-- Mobile Header -->
    <header class="lg:hidden fixed top-0 inset-x-0 bg-white border-b border-gray-200 z-20 px-4 py-3 flex items-center justify-between">
      <button @click="mobileOpen = true" class="p-1">
        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <span class="font-bold text-sm text-gray-900">Kinora Konsultan</span>
      <div class="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-xs font-medium text-amber-700">{{ initial }}</div>
    </header>

    <!-- Mobile Drawer -->
    <div v-if="mobileOpen" class="lg:hidden fixed inset-0 z-30">
      <div @click="mobileOpen = false" class="absolute inset-0 bg-black/40"></div>
      <aside class="absolute left-0 inset-y-0 w-72 bg-white shadow-xl flex flex-col">
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span class="font-bold text-gray-900">Kinora Konsultan</span>
          <button @click="mobileOpen = false" class="text-gray-400 text-lg">✕</button>
        </div>
        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <router-link v-for="item in navItems" :key="item.to" :to="item.to" @click="mobileOpen = false"
            :class="[isActive(item.to) ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-500 hover:bg-gray-50', 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition']">
            <component :is="item.icon" :size="18" class="flex-shrink-0" />
            <span>{{ item.label }}</span>
          </router-link>
        </nav>
        <div class="border-t border-gray-100 px-3 py-3">
          <button @click="handleLogout" class="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg">
            <LogOut :size="18" class="flex-shrink-0" /> Keluar
          </button>
        </div>
      </aside>
    </div>

    <!-- Main Content -->
    <main class="flex-1 lg:ml-64 pt-16 lg:pt-0">
      <div class="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../composables/useAuth.js'
import { LayoutDashboard, MessagesSquare, Users, CalendarDays, Tags, FileText, WalletCards, Landmark, Star, Bell, UserCircle, Settings, LogOut } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const mobileOpen = ref(false)
const consultantStatus = ref('available')

const initial = computed(() => user.value?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user.value?.email?.charAt(0)?.toUpperCase() || 'K')

const consultantName = ref('')
const consultantAvatar = ref('')

// Load consultant profile
async function loadConsultantProfile() {
  if (!user.value) return
  const { data } = await supabase
    .from('kinora_consultants')
    .select('name, avatar_url')
    .eq('consultant_user_id', user.value.id)
    .maybeSingle()
  if (data) {
    consultantName.value = data.name || user.value.user_metadata?.full_name || user.value.email
    consultantAvatar.value = data.avatar_url || ''
  } else {
    consultantName.value = user.value.user_metadata?.full_name || user.value.email || ''
  }
}


const navItems = [
  { to: '/consultant/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/consultant/consultations', icon: MessagesSquare, label: 'Konsultasi' },
  { to: '/consultant/clients', icon: Users, label: 'Klien' },
  { to: '/consultant/schedule', icon: CalendarDays, label: 'Jadwal' },
  { to: '/consultant/services', icon: Tags, label: 'Layanan' },
  { to: '/consultant/notes', icon: FileText, label: 'Catatan' },
  { to: '/consultant/earnings', icon: WalletCards, label: 'Pendapatan' },
  { to: '/consultant/withdrawals', icon: Landmark, label: 'Pencairan' },
  { to: '/consultant/reviews', icon: Star, label: 'Ulasan' },
  { to: '/consultant/notifications', icon: Bell, label: 'Notifikasi' },
  { to: '/consultant/profile', icon: UserCircle, label: 'Profil' },
  { to: '/consultant/settings', icon: Settings, label: 'Pengaturan' },
]

const statusDot = computed(() => {
  const map = { available: 'bg-green-500', in_consultation: 'bg-blue-500', break: 'bg-yellow-500', unavailable: 'bg-gray-400', leave: 'bg-purple-500', offline: 'bg-gray-300' }
  return map[consultantStatus.value] || 'bg-gray-300'
})

function isActive(path) {
  if (path === '/consultant/dashboard') return route.path === path
  return route.path.startsWith(path)
}

async function updateStatus() {
  if (!user.value) return
  const { data: consultant } = await supabase.from('kinora_consultants').select('id').eq('consultant_user_id', user.value.id).maybeSingle()
  if (consultant) {
    await supabase.from('kinora_consultants').update({ status_mode: consultantStatus.value, updated_at: new Date().toISOString() }).eq('id', consultant.id)
  }
}

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/consultant/login')
}

onMounted(loadConsultantProfile)
</script>
