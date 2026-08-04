<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-30 transition-all duration-300 flex flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'w-64 lg:translate-x-0'
      ]"
    >
      <!-- Logo -->
      <div class="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-2">
          <img v-if="appLogo" :src="appLogo" alt="Logo" class="h-6" />
          <div>
            <h1 class="text-lg font-bold text-gray-900" style="font-family: 'Bricolage Grotesque', sans-serif">Kinora</h1>
            <p class="text-xs text-gray-500">Admin Dashboard</p>
          </div>
        </div>
        <button @click="sidebarOpen = false" class="lg:hidden p-1 text-gray-400 hover:text-gray-700 rounded">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Navigation (scrollable) -->
      <nav class="flex-1 overflow-y-auto p-3 space-y-0.5">
        <button
          v-for="item in menuItems"
          :key="item.id"
          @click="activeMenu = item.id; contentEditId = null; sidebarOpen = false"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
            activeMenu === item.id
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          ]"
        >
          <component :is="item.icon" :size="18" class="flex-shrink-0" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <!-- Landing Page Button + User info -->
      <div class="flex-shrink-0 border-t border-gray-200">
        <div class="px-3 pt-3">
          <a href="https://kinorafamilies.com" target="_blank" rel="noopener noreferrer"
            class="flex items-center justify-between w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition">
            <span class="flex items-center gap-2">
              <Globe :size="16" />
              <span class="font-medium">Lihat Landing Page</span>
            </span>
            <ExternalLink :size="14" class="opacity-50" />
          </a>
        </div>
        <div class="p-3">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              <img v-if="profile?.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover" />
              <span v-else class="text-xs font-medium text-blue-700">
                {{ profile?.display_name?.charAt(0)?.toUpperCase() || '?' }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-700 truncate">{{ profile?.display_name || authUser?.email }}</p>
              <p class="text-[10px] text-gray-400">Admin</p>
            </div>
          </div>
          <button @click="handleSignOut" class="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition">
            Logout
          </button>
        </div>
      </div>
    </aside>

    <!-- Overlay mobile -->
    <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity" />

    <!-- Main Content -->
    <div class="lg:ml-64 min-h-screen">
      <header class="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        <button @click="sidebarOpen = !sidebarOpen" class="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <h2 class="text-base sm:text-lg font-semibold text-gray-900">{{ currentMenuLabel }}</h2>
      </header>

      <main class="p-4 sm:p-6">
        <!-- Overview -->
        <div v-if="activeMenu === 'overview'">
          <AdminOverview @navigate="(target) => { activeMenu = target }" />
        </div>

        <!-- Users -->
        <div v-if="activeMenu === 'users'">
          <!-- Create User Mode -->
          <CreateUserPage v-if="showCreateUser" @back="showCreateUser = false" @created="showCreateUser = false; loadAllData()" />

          <!-- Loading -->
          <div v-else-if="loading" class="flex items-center justify-center py-16">
            <p class="text-gray-500">Memuat data...</p>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p class="text-red-700 font-medium">Gagal memuat data</p>
            <p class="text-red-500 text-sm mt-1">{{ error }}</p>
            <button @click="loadAllData" class="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">Coba Lagi</button>
          </div>

          <div v-else class="space-y-6">
            <!-- Tabs: Families / All Users + Create User Button -->
            <div class="flex items-center justify-between border-b border-gray-200">
              <div class="flex gap-2">
                <button
                  @click="usersTab = 'families'"
                  :class="usersTab === 'families' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
                  class="px-4 py-2 text-sm font-medium border-b-2 transition"
                >
                  Keluarga ({{ allFamilies.length }})
                </button>
                <button
                  @click="usersTab = 'users'"
                  :class="usersTab === 'users' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
                  class="px-4 py-2 text-sm font-medium border-b-2 transition"
                >
                  Semua User ({{ allUsers.length }})
                </button>
              </div>
              <button @click="showCreateUser = true" class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-1">+ Create User</button>
            </div>

            <!-- Filters -->
            <div class="flex flex-wrap gap-3">
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="usersTab === 'families' ? 'Cari keluarga...' : 'Cari nama atau email...'"
                class="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select v-if="usersTab === 'users'" v-model="filterFamily" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="">Semua Keluarga</option>
                <option v-for="f in allFamilies" :key="f.id" :value="f.id">{{ f.name }}</option>
              </select>
              <select v-if="usersTab === 'users'" v-model="filterRole" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="">Semua Role</option>
                <option value="family_owner">Owner</option>
                <option value="father">Ayah</option>
                <option value="mother">Ibu</option>
                <option value="parent">Orang Tua</option>
                <option value="child">Anak</option>
                <option value="teen">Remaja</option>
              </select>
              <select v-if="usersTab === 'users'" v-model="filterStatus" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="pending">Pending</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>

            <!-- Families Tab -->
            <div v-if="usersTab === 'families'">
              <div v-if="paginatedFamilies.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                Tidak ada keluarga yang cocok.
              </div>
              <div v-else class="space-y-4">
                <div v-for="fam in paginatedFamilies" :key="fam.id" class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div class="p-4 flex items-center justify-between border-b border-gray-100">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center overflow-hidden">
                        <img v-if="fam.avatar_url" :src="fam.avatar_url" class="w-full h-full object-cover" />
                        <span v-else class="text-sm">🏠</span>
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 text-sm">{{ fam.name }}</p>
                        <p class="text-xs text-gray-500">{{ fam.member_count }} anggota · {{ fam.subscription_plan }}</p>
                      </div>
                    </div>
                    <button @click="toggleFamily(fam.id)" class="text-xs text-blue-600 hover:underline">
                      {{ expandedFamily === fam.id ? 'Tutup' : 'Lihat Anggota' }}
                    </button>
                    <button @click="confirmDeleteFamily(fam)" class="text-xs text-red-600 hover:underline ml-2">
                      Hapus
                    </button>
                  </div>
                  <!-- Expanded members -->
                  <div v-if="expandedFamily === fam.id" class="divide-y divide-gray-100">
                    <div v-for="m in getFamilyMembers(fam.id)" :key="m.id" class="px-4 py-3 flex items-center gap-3">
                      <div class="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        <img v-if="m.avatar_url" :src="m.avatar_url" class="w-full h-full object-cover" />
                        <span v-else class="text-xs text-gray-500">{{ m.display_name?.charAt(0)?.toUpperCase() || '?' }}</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-gray-900 truncate">{{ m.display_name || '-' }}</p>
                        <p class="text-xs text-gray-400 truncate">{{ m.email || '-' }}</p>
                      </div>
                      <span :class="roleColor(m.role)" class="px-2 py-0.5 text-xs rounded-full">{{ roleLabel(m.role) }}</span>
                      <span :class="m.status === 'active' ? 'text-green-600' : 'text-gray-400'" class="text-xs">{{ m.status }}</span>
                    </div>
                    <div v-if="getFamilyMembers(fam.id).length === 0" class="px-4 py-3 text-xs text-gray-400">
                      Tidak ada anggota.
                    </div>
                  </div>
                </div>

                <!-- Pagination families -->
                <div class="flex items-center justify-between pt-2">
                  <p class="text-xs text-gray-500">{{ filteredFamilies.length }} keluarga</p>
                  <div class="flex gap-2">
                    <button @click="familyPage--" :disabled="familyPage <= 1" class="px-3 py-1 text-sm border rounded disabled:opacity-30">←</button>
                    <span class="px-3 py-1 text-sm text-gray-600">{{ familyPage }} / {{ totalFamilyPages }}</span>
                    <button @click="familyPage++" :disabled="familyPage >= totalFamilyPages" class="px-3 py-1 text-sm border rounded disabled:opacity-30">→</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Users Tab -->
            <div v-if="usersTab === 'users'">
              <div v-if="paginatedUsers.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                Tidak ada user yang cocok.
              </div>
              <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                      <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Keluarga</th>
                      <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Bergabung</th>
                      <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="u in paginatedUsers" :key="u.id" class="hover:bg-gray-50">
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                          <div class="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                            <img v-if="u.avatar_url" :src="u.avatar_url" class="w-full h-full object-cover" />
                            <span v-else class="text-xs text-gray-500">{{ u.display_name?.charAt(0)?.toUpperCase() || '?' }}</span>
                          </div>
                          <span class="text-sm text-gray-900">{{ u.display_name || '-' }}</span>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600">{{ u.email }}</td>
                      <td class="px-4 py-3 text-sm text-gray-600">{{ u.family_name || '-' }}</td>
                      <td class="px-4 py-3">
                        <span :class="roleColor(u.role)" class="px-2 py-0.5 text-xs rounded-full">{{ roleLabel(u.role) }}</span>
                      </td>
                      <td class="px-4 py-3">
                        <span :class="u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="px-2 py-0.5 text-xs rounded-full">
                          {{ u.status }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-xs text-gray-400">{{ formatDate(u.joined_at) }}</td>
                      <td class="px-4 py-3">
                        <button @click="confirmDeleteUser(u)" class="text-xs text-red-600 hover:underline">Hapus</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination users -->
              <div class="flex items-center justify-between pt-4">
                <p class="text-xs text-gray-500">{{ filteredUsers.length }} user</p>
                <div class="flex gap-2">
                  <button @click="userPage--" :disabled="userPage <= 1" class="px-3 py-1 text-sm border rounded disabled:opacity-30">←</button>
                  <span class="px-3 py-1 text-sm text-gray-600">{{ userPage }} / {{ totalUserPages }}</span>
                  <button @click="userPage++" :disabled="userPage >= totalUserPages" class="px-3 py-1 text-sm border rounded disabled:opacity-30">→</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div v-if="activeMenu === 'content'">
          <ContentListPage v-if="!contentEditId" @navigate="handleContentNav" />
          <ContentEditorPage v-else :article-id="contentEditId === '__new__' ? null : contentEditId" @navigate="handleContentNav" />
        </div>

        <!-- Webinar -->
        <div v-if="activeMenu === 'webinar'">
          <WebinarPage />
        </div>

        <!-- Consultation -->
        <div v-if="activeMenu === 'consultation'">
          <ConsultantSessionsPage />
          <div class="mt-8 border-t border-gray-200 pt-6">
            <ConsultationPaymentsPage />
          </div>
        </div>

        <!-- Suspensions -->
        <div v-if="activeMenu === 'suspensions'">
          <FamilySuspendPage />
        </div>

        <!-- Support Tickets -->
        <div v-if="activeMenu === 'support'">
          <AdminTicketsPage />
        </div>

        <!-- Pembayaran -->
        <div v-if="activeMenu === 'payments'">
          <ManualPaymentsPage />
        </div>

        <!-- Revenue -->
        <div v-if="activeMenu === 'revenue'">
          <RevenuePage />
        </div>

        <!-- Settings -->
        <div v-if="activeMenu === 'settings'">
          <SettingsPage />
        </div>

        <!-- Feature Toggles -->
        <div v-if="activeMenu === 'features'">
          <FeatureTogglesPage />
        </div>

        <!-- Products -->
        <div v-if="activeMenu === 'products'">
          <ProductsPage />
        </div>

        <!-- Google Services -->
        <div v-if="activeMenu === 'google'">
          <GoogleServicesPage />
        </div>

        <!-- Storage Management -->
        <div v-if="activeMenu === 'storage'">
          <StorageManagementPage />
        </div>

        <!-- API Credentials -->
        <div v-if="activeMenu === 'api'">
          <ApiCredentialsPage />
        </div>

        <!-- Landing Page Settings -->
        <div v-if="activeMenu === 'landing'">
          <LandingSettingsPage />
        </div>

        <!-- About CMS -->
        <div v-if="activeMenu === 'about_cms'">
          <AboutCmsPage />
        </div>
      </main>
    </div>

    <!-- Delete Family Modal -->
    <div v-if="deletingFamily" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="font-semibold text-red-700 text-lg">⚠️ Hapus Keluarga Permanen</h3>
        <p class="text-sm text-gray-600 mt-2">
          Anda akan menghapus keluarga <strong>{{ deletingFamily.name }}</strong> secara permanen.
        </p>
        <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-1">
          <p class="font-semibold">Semua data berikut akan ikut terhapus:</p>
          <p>• Seluruh anggota ({{ getFamilyMembers(deletingFamily.id).length }} user) • Chat • Finance • Calendar • Tasks • Memories • Vault • Safe Zone • Location • Screen Time • SOS • Parenting • Health • Pet • Konsultasi • Notifikasi • File Storage • Seluruh Authentication User</p>
          <p class="font-bold mt-2">Tindakan ini TIDAK DAPAT dibatalkan.</p>
        </div>
        <div class="mt-4">
          <label class="block text-xs text-gray-500 mb-1">Ketik <strong>DELETE FAMILY</strong> untuk konfirmasi:</label>
          <input v-model="deleteConfirmText" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-red-300" placeholder="DELETE FAMILY" />
        </div>
        <div v-if="deleteError" class="mt-3 p-2 bg-red-50 text-red-700 text-xs rounded">{{ deleteError }}</div>
        <div v-if="deleteProgress" class="mt-3 text-xs text-gray-600">{{ deleteProgress }}</div>
        <div class="flex justify-end gap-3 mt-5">
          <button @click="deletingFamily = null; deleteError = ''; deleteConfirmText = ''" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Batal
          </button>
          <button @click="executeDeleteFamily" :disabled="deleteLoading || deleteConfirmText !== 'DELETE FAMILY'" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ deleteLoading ? 'Menghapus...' : 'Hapus Permanen' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete User Modal -->
    <div v-if="deletingUser" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h3 class="font-semibold text-gray-900 text-lg">Hapus User</h3>
        <p class="text-sm text-gray-600 mt-2">
          Yakin hapus user <strong>{{ deletingUser.display_name || deletingUser.email }}</strong>? Data membership dan profil user akan dihapus permanen.
        </p>
        <div v-if="deleteUserError" class="mt-3 p-2 bg-red-50 text-red-700 text-xs rounded">{{ deleteUserError }}</div>
        <div class="flex justify-end gap-3 mt-5">
          <button @click="deletingUser = null; deleteUserError = ''" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Batal
          </button>
          <button @click="executeDeleteUser" :disabled="deleteUserLoading" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {{ deleteUserLoading ? 'Menghapus...' : 'Hapus Permanen' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase.js'
import ContentListPage from './ContentListPage.vue'
import ContentEditorPage from './ContentEditorPage.vue'
import SettingsPage from './SettingsPage.vue'
import WebinarPage from './WebinarPage.vue'
import ConsultantSessionsPage from './ConsultantSessionsPage.vue'
import ConsultationPaymentsPage from './ConsultationPaymentsPage.vue'
import ManualPaymentsPage from './ManualPaymentsPage.vue'
import AdminOverview from './AdminOverview.vue'
import { LayoutDashboard, Users, FileText, Video, MessagesSquare, ShieldAlert, Headphones, CreditCard, TrendingUp, Code, Globe, Info, ToggleLeft, ShoppingBag, Search, Settings, ExternalLink } from '@lucide/vue'
import RevenuePage from './RevenuePage.vue'
import CreateUserPage from './CreateUserPage.vue'
import FamilySuspendPage from './FamilySuspendPage.vue'
import ApiCredentialsPage from './ApiCredentialsPage.vue'
import LandingSettingsPage from './LandingSettingsPage.vue'
import AboutCmsPage from './AboutCmsPage.vue'
import AdminTicketsPage from './AdminTicketsPage.vue'
import FeatureTogglesPage from './FeatureTogglesPage.vue'
import ProductsPage from './ProductsPage.vue'
import GoogleServicesPage from './GoogleServicesPage.vue'
import StorageManagementPage from './StorageManagementPage.vue'

const router = useRouter()
const PAGE_SIZE = 10

// Content module state
const contentEditId = ref(null)

function handleContentNav(target, id = null) {
  if (target === 'content-editor') {
    contentEditId.value = id || '__new__'
  } else {
    contentEditId.value = null
  }
}

// UI state
const sidebarOpen = ref(false)
const activeMenu = ref('overview')
const usersTab = ref('families')
const showCreateUser = ref(false)
const searchQuery = ref('')
const filterFamily = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const familyPage = ref(1)
const userPage = ref(1)
const expandedFamily = ref(null)
const deletingFamily = ref(null)
const deleteLoading = ref(false)
const deleteError = ref('')
const deleteConfirmText = ref('')
const deleteProgress = ref('')
const deletingUser = ref(null)
const deleteUserLoading = ref(false)
const deleteUserError = ref('')

// Data
const authUser = ref(null)
const profile = ref(null)
const appLogo = ref('')
const allFamilies = ref([])
const allUsers = ref([])
const allMembers = ref([])
const loading = ref(false)
const error = ref('')

const stats = ref([
  { label: 'Total Users', value: '-' },
  { label: 'Keluarga Aktif', value: '-' },
  { label: 'Anggota Aktif', value: '-' },
  { label: 'Notifikasi', value: '-' },
])

const menuItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'content', label: 'Konten', icon: FileText },
  { id: 'webinar', label: 'Webinar', icon: Video },
  { id: 'consultation', label: 'Konsultasi', icon: MessagesSquare },
  { id: 'suspensions', label: 'Suspensi', icon: ShieldAlert },
  { id: 'support', label: 'Support', icon: Headphones },
  { id: 'payments', label: 'Pembayaran', icon: CreditCard },
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'api', label: 'API & Integrasi', icon: Code },
  { id: 'landing', label: 'Landing Page', icon: Globe },
  { id: 'about_cms', label: 'About Kinora', icon: Info },
  { id: 'features', label: 'Feature Toggle', icon: ToggleLeft },
  { id: 'products', label: 'Produk', icon: ShoppingBag },
  { id: 'google', label: 'Google Services', icon: Search },
  { id: 'storage', label: 'Storage', icon: Code },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
]

const currentMenuLabel = computed(() => menuItems.find(m => m.id === activeMenu.value)?.label || '')

// Reset page on filter change
watch([searchQuery, filterFamily, filterRole, filterStatus, usersTab], () => {
  familyPage.value = 1
  userPage.value = 1
})

// --- Families ---
const filteredFamilies = computed(() => {
  if (!searchQuery.value) return allFamilies.value
  const q = searchQuery.value.toLowerCase()
  return allFamilies.value.filter(f => f.name.toLowerCase().includes(q))
})

const totalFamilyPages = computed(() => Math.max(1, Math.ceil(filteredFamilies.value.length / PAGE_SIZE)))
const paginatedFamilies = computed(() => {
  const start = (familyPage.value - 1) * PAGE_SIZE
  return filteredFamilies.value.slice(start, start + PAGE_SIZE)
})

function toggleFamily(id) {
  expandedFamily.value = expandedFamily.value === id ? null : id
}

function getFamilyMembers(familyId) {
  return allMembers.value.filter(m => m.family_id === familyId)
}

// --- Users ---
const filteredUsers = computed(() => {
  let list = allUsers.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(u =>
      (u.display_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    )
  }
  if (filterFamily.value) {
    const memberUserIds = allMembers.value
      .filter(m => m.family_id === filterFamily.value)
      .map(m => m.user_id)
    list = list.filter(u => memberUserIds.includes(u.id))
  }
  if (filterRole.value) {
    const memberUserIds = allMembers.value
      .filter(m => m.role === filterRole.value)
      .map(m => m.user_id)
    list = list.filter(u => memberUserIds.includes(u.id))
  }
  if (filterStatus.value) {
    const memberUserIds = allMembers.value
      .filter(m => m.status === filterStatus.value)
      .map(m => m.user_id)
    list = list.filter(u => memberUserIds.includes(u.id))
  }
  return list
})

const totalUserPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / PAGE_SIZE)))
const paginatedUsers = computed(() => {
  const start = (userPage.value - 1) * PAGE_SIZE
  return filteredUsers.value.slice(start, start + PAGE_SIZE)
})

// --- Helpers ---
function roleLabel(role) {
  const map = { family_owner: 'Owner', father: 'Ayah', mother: 'Ibu', parent: 'Orang Tua', child: 'Anak', teen: 'Remaja' }
  return map[role] || role || '-'
}
function roleColor(role) {
  const map = { family_owner: 'bg-purple-100 text-purple-700', father: 'bg-blue-100 text-blue-700', mother: 'bg-pink-100 text-pink-700', parent: 'bg-blue-100 text-blue-700', child: 'bg-green-100 text-green-700', teen: 'bg-yellow-100 text-yellow-700' }
  return map[role] || 'bg-gray-100 text-gray-600'
}
function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// --- Delete family ---
function confirmDeleteFamily(fam) {
  deletingFamily.value = fam
  deleteError.value = ''
}

async function executeDeleteFamily() {
  if (!deletingFamily.value) return
  if (deleteConfirmText.value !== 'DELETE FAMILY') return

  deleteLoading.value = true
  deleteError.value = ''
  deleteProgress.value = 'Menghapus data keluarga...'

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { deleteError.value = 'Session expired.'; deleteLoading.value = false; return }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hard-delete-family`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          family_id: deletingFamily.value.id,
          confirm: 'DELETE FAMILY'
        })
      }
    )

    const result = await res.json()

    if (!res.ok || !result.success) {
      deleteError.value = result.error || 'Penghapusan gagal.'
      deleteLoading.value = false
      deleteProgress.value = ''
      return
    }

    deleteProgress.value = `Selesai. ${result.users_deleted} user dihapus.`

    // Remove from local state
    const fid = deletingFamily.value.id
    allFamilies.value = allFamilies.value.filter(f => f.id !== fid)
    allMembers.value = allMembers.value.filter(m => m.family_id !== fid)
    allUsers.value = allUsers.value.map(u => u.family_id === fid ? { ...u, family_name: '-', role: null } : u)

    setTimeout(() => {
      deletingFamily.value = null
      deleteLoading.value = false
      deleteConfirmText.value = ''
      deleteProgress.value = ''
    }, 2000)

  } catch (e) {
    deleteError.value = 'Terjadi kesalahan saat menghapus.'
    deleteLoading.value = false
    deleteProgress.value = ''
  }
}

// --- Delete user ---
function confirmDeleteUser(user) {
  deletingUser.value = user
  deleteUserError.value = ''
}

async function executeDeleteUser() {
  if (!deletingUser.value) return
  deleteUserLoading.value = true
  deleteUserError.value = ''

  const userId = deletingUser.value.id

  const { error: err } = await supabase.rpc('admin_delete_user', {
    p_user_id: userId
  })

  if (err) {
    deleteUserError.value = err.message
    deleteUserLoading.value = false
    return
  }

  // Update local state
  allUsers.value = allUsers.value.filter(u => u.id !== userId)
  allMembers.value = allMembers.value.filter(m => m.user_id !== userId)
  allFamilies.value = allFamilies.value.map(f => ({
    ...f,
    member_count: allMembers.value.filter(m => m.family_id === f.id).length
  }))
  stats.value[0].value = String(allUsers.value.length)
  stats.value[2].value = String(allMembers.value.filter(m => m.status === 'active').length)

  deletingUser.value = null
  deleteUserLoading.value = false
}

// --- Data loading ---
async function loadAllData() {
  loading.value = true
  error.value = ''

  try {
    const [familiesRes, usersRes, membersRes] = await Promise.all([
      supabase.from('families').select('id, name, avatar_url, member_count, subscription_plan, is_active').order('created_at', { ascending: false }),
      supabase.from('users').select('id, email, display_name, avatar_url, is_active, created_at').order('created_at', { ascending: false }),
      supabase.from('family_members').select('id, family_id, user_id, role, status, nickname, joined_at').order('joined_at', { ascending: true }),
    ])

    if (familiesRes.error) throw new Error(familiesRes.error.message)
    if (usersRes.error) throw new Error(usersRes.error.message)
    if (membersRes.error) throw new Error(membersRes.error.message)

    allFamilies.value = familiesRes.data || []

    // Build family name map
    const familyMap = {}
    for (const f of allFamilies.value) familyMap[f.id] = f.name

    // Process members with user info
    const membersByUser = {}
    for (const m of (membersRes.data || [])) {
      m.display_name = null
      m.email = null
      m.avatar_url = null
      if (!membersByUser[m.user_id]) membersByUser[m.user_id] = m
    }
    allMembers.value = membersRes.data || []

    // Enrich members with user data from usersRes
    const userMap = {}
    for (const u of (usersRes.data || [])) userMap[u.id] = u
    for (const m of allMembers.value) {
      const u = userMap[m.user_id]
      if (u) {
        m.display_name = u.display_name
        m.email = u.email
        m.avatar_url = u.avatar_url
      }
    }

    // Build allUsers with family info
    allUsers.value = (usersRes.data || []).map(u => {
      const membership = membersByUser[u.id]
      return {
        ...u,
        role: membership?.role || null,
        status: membership?.status || (u.is_active ? 'active' : 'inactive'),
        family_name: membership ? (familyMap[membership.family_id] || '-') : '-',
        joined_at: membership?.joined_at || u.created_at,
      }
    })

    // Stats
    stats.value[0].value = String(usersRes.data?.length || 0)
    stats.value[1].value = String(allFamilies.value.filter(f => f.is_active).length)
    stats.value[2].value = String(allMembers.value.filter(m => m.status === 'active').length)

    const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true })
    stats.value[3].value = String(count ?? 0)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function loadProfile() {
  if (!authUser.value) return
  const { data } = await supabase.from('users').select('display_name, avatar_url').eq('id', authUser.value.id).single()
  if (data) profile.value = data
  // Load app logo
  const { data: logoConfig } = await supabase.from('kinora_landing_config').select('value').eq('key', 'general').eq('status', 'published').maybeSingle()
  if (logoConfig?.value?.logo_url) appLogo.value = logoConfig.value.logo_url
}

function clearData() {
  profile.value = null
  allFamilies.value = []
  allUsers.value = []
  allMembers.value = []
  error.value = ''
}

async function handleSignOut() {
  clearData()
  await supabase.auth.signOut()
  // Clear any residual state
  localStorage.removeItem('kinora_redirect')
  localStorage.removeItem('kinora_invite_code')
  router.push('/login')
}

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    authUser.value = session.user
    loadProfile()
    loadAllData()
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      clearData()
      authUser.value = null
    } else if (session?.user && session.user.id !== authUser.value?.id) {
      clearData()
      authUser.value = session.user
      loadProfile()
      loadAllData()
    }
  })
})
</script>
