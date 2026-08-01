<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="s in summaryCards" :key="s.label" class="bg-white p-4 rounded-xl border border-gray-200">
        <p class="text-xs text-gray-500">{{ s.label }}</p>
        <p class="text-xl font-bold text-gray-900 mt-1">{{ s.value }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap gap-3">
        <input v-model="search" type="text" placeholder="Cari nama, email, referensi..."
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64 outline-none focus:ring-2 focus:ring-blue-500" />
        <select v-model="filterStatus" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">Semua Status</option>
          <option v-for="st in statuses" :key="st.value" :value="st.value">{{ st.label }}</option>
        </select>
        <select v-model="filterType" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">Semua Layanan</option>
          <option value="subscription">Subscription</option>
          <option value="webinar">Webinar</option>
          <option value="consultation">Konsultasi</option>
          <option value="print">Print Order</option>
          <option value="storage_addon">Storage</option>
        </select>
        <select v-model="sortBy" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="highest">Nominal Terbesar</option>
          <option value="lowest">Nominal Terkecil</option>
        </select>
        <button @click="loadPayments" class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <p class="text-gray-500">Memuat data pembayaran...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p class="text-red-700 font-medium">{{ error }}</p>
      <button @click="loadPayments" class="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg">Coba Lagi</button>
    </div>

    <!-- Empty -->
    <div v-else-if="payments.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <p class="text-gray-500">Belum ada pembayaran manual.</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Layanan</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nominal</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Transfer</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aktivasi</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="p in payments" :key="p.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900 text-sm">{{ p.user_name || '-' }}</p>
                <p class="text-xs text-gray-400">{{ p.user_email || '-' }}</p>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 text-xs rounded-full" :class="typeColor(p.product_type)">{{ typeLabel(p.product_type) }}</span>
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ formatCurrency(p.total_amount) }}</p>
                <p v-if="p.transfer_amount" class="text-xs text-gray-400">Transfer: {{ formatCurrency(p.transfer_amount) }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="text-xs text-gray-600">{{ p.sender_bank || '-' }}</p>
                <p class="text-xs text-gray-400">{{ p.sender_account_name || '-' }}</p>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 text-xs rounded-full font-medium" :class="statusColor(p.status)">{{ statusLabel(p.status) }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 text-xs rounded-full" :class="activationColor(p.activation_status)">{{ activationLabel(p.activation_status) }}</span>
              </td>
              <td class="px-4 py-3 text-xs text-gray-400">{{ formatDate(p.created_at) }}</td>
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <button @click="openDetail(p)" class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Detail</button>
                  <button v-if="canVerify(p)" @click="openVerify(p)" class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Verifikasi</button>
                  <button v-if="canReject(p)" @click="openReject(p)" class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Tolak</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <p class="text-xs text-gray-500">{{ totalCount }} pembayaran</p>
        <div class="flex gap-2">
          <button @click="page--" :disabled="page <= 1" class="px-3 py-1 text-sm border rounded disabled:opacity-30">←</button>
          <span class="px-3 py-1 text-sm text-gray-600">{{ page }} / {{ totalPages }}</span>
          <button @click="page++" :disabled="page >= totalPages" class="px-3 py-1 text-sm border rounded disabled:opacity-30">→</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="detailPayment" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div class="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 class="font-bold text-gray-900 text-lg">Detail Pembayaran</h3>
          <button @click="detailPayment = null" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div class="p-6 space-y-5">
          <!-- User Info -->
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase mb-2">Informasi User</p>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><span class="text-gray-500">Nama:</span> <span class="font-medium">{{ detailPayment.user_name }}</span></div>
              <div><span class="text-gray-500">Email:</span> <span class="font-medium">{{ detailPayment.user_email }}</span></div>
              <div><span class="text-gray-500">Family:</span> <span class="font-medium">{{ detailPayment.family_name || '-' }}</span></div>
              <div><span class="text-gray-500">User ID:</span> <span class="font-mono text-xs">{{ detailPayment.user_id?.slice(0,8) }}...</span></div>
            </div>
          </div>
          <!-- Transaction Info -->
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase mb-2">Informasi Transaksi</p>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><span class="text-gray-500">ID:</span> <span class="font-mono text-xs">{{ detailPayment.id?.slice(0,8) }}...</span></div>
              <div><span class="text-gray-500">Layanan:</span> <span class="font-medium">{{ typeLabel(detailPayment.product_type) }}</span></div>
              <div><span class="text-gray-500">Total Tagihan:</span> <span class="font-bold">{{ formatCurrency(detailPayment.total_amount) }}</span></div>
              <div><span class="text-gray-500">Kode Unik:</span> <span>{{ detailPayment.unique_code || '-' }}</span></div>
              <div><span class="text-gray-500">Status:</span> <span :class="statusColor(detailPayment.status)" class="px-2 py-0.5 rounded-full text-xs">{{ statusLabel(detailPayment.status) }}</span></div>
              <div><span class="text-gray-500">Batas Bayar:</span> <span>{{ detailPayment.expires_at ? formatDate(detailPayment.expires_at) : '-' }}</span></div>
            </div>
          </div>
          <!-- Transfer Info -->
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase mb-2">Informasi Transfer</p>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><span class="text-gray-500">Bank Pengirim:</span> <span class="font-medium">{{ detailPayment.sender_bank || '-' }}</span></div>
              <div><span class="text-gray-500">Nama Pengirim:</span> <span class="font-medium">{{ detailPayment.sender_account_name || '-' }}</span></div>
              <div><span class="text-gray-500">Nominal Transfer:</span> <span class="font-bold">{{ detailPayment.transfer_amount ? formatCurrency(detailPayment.transfer_amount) : '-' }}</span></div>
              <div><span class="text-gray-500">Tanggal Transfer:</span> <span>{{ detailPayment.transfer_date || '-' }}</span></div>
              <div><span class="text-gray-500">Referensi:</span> <span>{{ detailPayment.transfer_reference || '-' }}</span></div>
              <div><span class="text-gray-500">Catatan User:</span> <span>{{ detailPayment.payment_proof_note || '-' }}</span></div>
            </div>
          </div>
          <!-- Selisih Nominal -->
          <div v-if="detailPayment.transfer_amount && detailPayment.total_amount">
            <div class="p-3 rounded-lg text-sm" :class="getAmountDiffClass(detailPayment)">
              <span class="font-medium">Selisih: </span>
              <span class="font-bold">{{ formatCurrency(detailPayment.transfer_amount - detailPayment.total_amount) }}</span>
              <span v-if="detailPayment.transfer_amount < detailPayment.total_amount" class="ml-2 text-red-600">(Kurang bayar)</span>
              <span v-else-if="detailPayment.transfer_amount > detailPayment.total_amount" class="ml-2 text-yellow-600">(Lebih bayar)</span>
              <span v-else class="ml-2 text-green-600">(Sesuai)</span>
            </div>
          </div>
          <!-- Proof -->
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase mb-2">Bukti Pembayaran</p>
            <div v-if="detailPayment.payment_proof_url" class="border border-gray-200 rounded-lg overflow-hidden">
              <img :src="detailPayment.payment_proof_url" class="max-h-64 w-full object-contain bg-gray-50 cursor-pointer" @click="openProofFull(detailPayment.payment_proof_url)" />
              <div class="p-2 text-xs text-gray-500 flex justify-between">
                <span>{{ detailPayment.proof_file_name || 'bukti.jpg' }}</span>
                <span>{{ detailPayment.proof_submitted_at ? formatDate(detailPayment.proof_submitted_at) : '' }}</span>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">Belum ada bukti pembayaran.</p>
          </div>
          <!-- Admin Info -->
          <div v-if="detailPayment.reviewed_by">
            <p class="text-xs font-semibold text-gray-400 uppercase mb-2">Review Admin</p>
            <div class="text-sm space-y-1">
              <p><span class="text-gray-500">Diperiksa oleh:</span> {{ detailPayment.reviewer_name || detailPayment.reviewed_by?.slice(0,8) }}</p>
              <p><span class="text-gray-500">Tanggal review:</span> {{ formatDate(detailPayment.reviewed_at) }}</p>
              <p v-if="detailPayment.admin_note"><span class="text-gray-500">Catatan:</span> {{ detailPayment.admin_note }}</p>
              <p v-if="detailPayment.rejection_reason"><span class="text-gray-500">Alasan:</span> {{ detailPayment.rejection_reason }}</p>
            </div>
          </div>
          <!-- Actions -->
          <div class="flex gap-3 pt-4 border-t border-gray-200">
            <button v-if="canVerify(detailPayment)" @click="openVerify(detailPayment)" class="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium">Verifikasi</button>
            <button v-if="canReject(detailPayment)" @click="openReject(detailPayment)" class="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium">Tolak</button>
            <button v-if="canResubmit(detailPayment)" @click="openResubmit(detailPayment)" class="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 font-medium">Minta Upload Ulang</button>
            <button v-if="detailPayment.status === 'verified' && detailPayment.activation_status !== 'activated'" @click="activateService(detailPayment)" class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">Aktifkan Layanan</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Verify Modal -->
    <div v-if="verifyPayment" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
        <h3 class="font-bold text-gray-900 text-lg mb-4">Konfirmasi Verifikasi</h3>
        <div class="space-y-3 text-sm mb-4">
          <div class="p-3 bg-green-50 rounded-lg">
            <p><span class="text-gray-600">Tagihan:</span> <span class="font-bold">{{ formatCurrency(verifyPayment.total_amount) }}</span></p>
            <p><span class="text-gray-600">Transfer:</span> <span class="font-bold">{{ formatCurrency(verifyPayment.transfer_amount || 0) }}</span></p>
            <p><span class="text-gray-600">Layanan:</span> {{ typeLabel(verifyPayment.product_type) }}</p>
            <p><span class="text-gray-600">User:</span> {{ verifyPayment.user_name }}</p>
          </div>
        </div>
        <div class="space-y-3">
          <textarea v-model="verifyNote" placeholder="Catatan admin (opsional)" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"></textarea>
        </div>
        <div v-if="actionError" class="mt-3 p-2 bg-red-50 text-red-700 text-xs rounded">{{ actionError }}</div>
        <div class="flex justify-end gap-3 mt-5">
          <button @click="verifyPayment = null" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
          <button @click="executeVerify" :disabled="actionLoading" class="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
            {{ actionLoading ? 'Memproses...' : 'Verifikasi & Aktifkan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="rejectPayment" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
        <h3 class="font-bold text-gray-900 text-lg mb-4">Tolak Pembayaran</h3>
        <div class="space-y-3">
          <select v-model="rejectReason" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            <option value="">Pilih alasan penolakan</option>
            <option value="Bukti tidak jelas">Bukti tidak jelas</option>
            <option value="Nominal tidak sesuai">Nominal tidak sesuai</option>
            <option value="Rekening tujuan salah">Rekening tujuan salah</option>
            <option value="Bukti tidak valid">Bukti tidak valid</option>
            <option value="Transaksi duplikat">Transaksi duplikat</option>
            <option value="Pembayaran tidak ditemukan">Pembayaran tidak ditemukan</option>
            <option value="Transaksi kedaluwarsa">Transaksi kedaluwarsa</option>
            <option value="Data transfer tidak sesuai">Data transfer tidak sesuai</option>
          </select>
          <textarea v-model="rejectNote" placeholder="Catatan untuk user (wajib)" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"></textarea>
        </div>
        <div v-if="actionError" class="mt-3 p-2 bg-red-50 text-red-700 text-xs rounded">{{ actionError }}</div>
        <div class="flex justify-end gap-3 mt-5">
          <button @click="rejectPayment = null" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
          <button @click="executeReject" :disabled="actionLoading || !rejectReason" class="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium">
            {{ actionLoading ? 'Memproses...' : 'Tolak Pembayaran' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Resubmit Modal -->
    <div v-if="resubmitPayment" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
        <h3 class="font-bold text-gray-900 text-lg mb-4">Minta Upload Ulang</h3>
        <textarea v-model="resubmitReason" placeholder="Alasan minta upload ulang..." rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500"></textarea>
        <div v-if="actionError" class="mt-3 p-2 bg-red-50 text-red-700 text-xs rounded">{{ actionError }}</div>
        <div class="flex justify-end gap-3 mt-5">
          <button @click="resubmitPayment = null" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
          <button @click="executeResubmit" :disabled="actionLoading || !resubmitReason" class="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 disabled:opacity-50 font-medium">
            {{ actionLoading ? 'Memproses...' : 'Kirim Permintaan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Full Image Modal -->
    <div v-if="fullProofUrl" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" @click="fullProofUrl = null">
      <img :src="fullProofUrl" class="max-w-full max-h-full object-contain rounded-lg" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase.js'

const PAGE_SIZE = 15

// State
const payments = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const filterStatus = ref('')
const filterType = ref('')
const sortBy = ref('newest')
const page = ref(1)
const totalCount = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))

// Modals
const detailPayment = ref(null)
const verifyPayment = ref(null)
const rejectPayment = ref(null)
const resubmitPayment = ref(null)
const fullProofUrl = ref(null)

// Action state
const actionLoading = ref(false)
const actionError = ref('')
const verifyNote = ref('')
const rejectReason = ref('')
const rejectNote = ref('')
const resubmitReason = ref('')

// Summary
const summaryCards = ref([
  { label: 'Menunggu Verifikasi', value: '0' },
  { label: 'Terverifikasi Hari Ini', value: '0' },
  { label: 'Ditolak', value: '0' },
  { label: 'Total Nominal Verified', value: 'Rp 0' },
])

const statuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'waiting_verification', label: 'Menunggu Verifikasi' },
  { value: 'under_review', label: 'Sedang Diperiksa' },
  { value: 'verified', label: 'Terverifikasi' },
  { value: 'paid', label: 'Paid (Aktif)' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'resubmission_required', label: 'Upload Ulang' },
  { value: 'expired', label: 'Kedaluwarsa' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

// Load payments
async function loadPayments() {
  loading.value = true
  error.value = ''
  try {
    let query = supabase
      .from('kinora_marketplace_payments')
      .select('*, users!kinora_marketplace_payments_user_id_fkey(display_name, email), families!kinora_marketplace_payments_family_id_fkey(name)', { count: 'exact' })
      .eq('payment_method', 'manual')

    if (filterStatus.value) query = query.eq('status', filterStatus.value)
    if (filterType.value) query = query.eq('product_type', filterType.value)
    if (search.value) {
      query = query.or(`xendit_external_id.ilike.%${search.value}%,users.display_name.ilike.%${search.value}%,users.email.ilike.%${search.value}%,sender_account_name.ilike.%${search.value}%`)
    }

    // Sorting
    switch (sortBy.value) {
      case 'oldest': query = query.order('created_at', { ascending: true }); break
      case 'highest': query = query.order('total_amount', { ascending: false }); break
      case 'lowest': query = query.order('total_amount', { ascending: true }); break
      default: query = query.order('created_at', { ascending: false })
    }

    const from = (page.value - 1) * PAGE_SIZE
    query = query.range(from, from + PAGE_SIZE - 1)

    const { data, error: err, count } = await query
    if (err) throw new Error(err.message)

    totalCount.value = count || 0
    payments.value = (data || []).map(p => ({
      ...p,
      user_name: p.users?.display_name || '-',
      user_email: p.users?.email || '-',
      family_name: p.families?.name || '-',
    }))
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// Load summary
async function loadSummary() {
  const today = new Date().toISOString().split('T')[0]

  const [waiting, verifiedToday, rejected, totalVerified] = await Promise.all([
    supabase.from('kinora_marketplace_payments').select('id', { count: 'exact', head: true }).eq('payment_method', 'manual').in('status', ['waiting_verification', 'under_review']),
    supabase.from('kinora_marketplace_payments').select('id', { count: 'exact', head: true }).eq('payment_method', 'manual').in('status', ['verified', 'paid']).gte('verified_at', today),
    supabase.from('kinora_marketplace_payments').select('id', { count: 'exact', head: true }).eq('payment_method', 'manual').eq('status', 'rejected'),
    supabase.from('kinora_marketplace_payments').select('total_amount').eq('payment_method', 'manual').in('status', ['verified', 'paid']),
  ])

  summaryCards.value[0].value = String(waiting.count || 0)
  summaryCards.value[1].value = String(verifiedToday.count || 0)
  summaryCards.value[2].value = String(rejected.count || 0)

  const total = (totalVerified.data || []).reduce((sum, r) => sum + Number(r.total_amount || 0), 0)
  summaryCards.value[3].value = formatCurrency(total)
}

// Actions
function openDetail(p) { detailPayment.value = p }
function openVerify(p) { verifyPayment.value = p; verifyNote.value = ''; actionError.value = '' }
function openReject(p) { rejectPayment.value = p; rejectReason.value = ''; rejectNote.value = ''; actionError.value = '' }
function openResubmit(p) { resubmitPayment.value = p; resubmitReason.value = ''; actionError.value = '' }
function openProofFull(url) { fullProofUrl.value = url }

function canVerify(p) { return ['waiting_verification', 'under_review'].includes(p.status) }
function canReject(p) { return ['waiting_verification', 'under_review', 'resubmission_required'].includes(p.status) }
function canResubmit(p) { return ['waiting_verification', 'under_review'].includes(p.status) }

async function executeVerify() {
  actionLoading.value = true
  actionError.value = ''
  try {
    const { data, error: err } = await supabase.rpc('admin_verify_manual_payment', {
      p_payment_id: verifyPayment.value.id,
      p_admin_note: verifyNote.value || null,
      p_verified_amount: verifyPayment.value.transfer_amount || verifyPayment.value.total_amount,
      p_bank_reference: null,
    })
    if (err) throw new Error(err.message)
    if (data && !data.success) throw new Error(data.error)

    // Activate service
    const { data: actData, error: actErr } = await supabase.rpc('admin_activate_payment_service', {
      p_payment_id: verifyPayment.value.id,
    })
    if (actErr) throw new Error(actErr.message)
    if (actData && !actData.success) throw new Error(actData.error)

    verifyPayment.value = null
    detailPayment.value = null
    await loadPayments()
    await loadSummary()
  } catch (e) {
    actionError.value = e.message
  } finally {
    actionLoading.value = false
  }
}

async function executeReject() {
  actionLoading.value = true
  actionError.value = ''
  try {
    if (!rejectReason.value) throw new Error('Pilih alasan penolakan')
    const { data, error: err } = await supabase.rpc('admin_reject_manual_payment', {
      p_payment_id: rejectPayment.value.id,
      p_reason: rejectReason.value,
      p_admin_note: rejectNote.value || null,
    })
    if (err) throw new Error(err.message)
    if (data && !data.success) throw new Error(data.error)

    rejectPayment.value = null
    detailPayment.value = null
    await loadPayments()
    await loadSummary()
  } catch (e) {
    actionError.value = e.message
  } finally {
    actionLoading.value = false
  }
}

async function executeResubmit() {
  actionLoading.value = true
  actionError.value = ''
  try {
    if (!resubmitReason.value) throw new Error('Tulis alasan')
    const { data, error: err } = await supabase.rpc('admin_request_resubmit_payment', {
      p_payment_id: resubmitPayment.value.id,
      p_reason: resubmitReason.value,
    })
    if (err) throw new Error(err.message)
    if (data && !data.success) throw new Error(data.error)

    resubmitPayment.value = null
    detailPayment.value = null
    await loadPayments()
    await loadSummary()
  } catch (e) {
    actionError.value = e.message
  } finally {
    actionLoading.value = false
  }
}

async function activateService(p) {
  if (!confirm('Aktifkan layanan untuk pembayaran ini?')) return
  actionLoading.value = true
  actionError.value = ''
  try {
    const { data, error: err } = await supabase.rpc('admin_activate_payment_service', {
      p_payment_id: p.id,
    })
    if (err) throw new Error(err.message)
    if (data && !data.success) throw new Error(data.error)
    detailPayment.value = null
    await loadPayments()
    await loadSummary()
  } catch (e) {
    actionError.value = e.message
    alert('Gagal aktivasi: ' + e.message)
  } finally {
    actionLoading.value = false
  }
}

// Helpers
function formatCurrency(n) {
  if (n == null) return 'Rp 0'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}
function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function typeLabel(t) {
  const map = { subscription: 'Subscription', webinar: 'Webinar', consultation: 'Konsultasi', print: 'Print Order', storage_addon: 'Storage', ppob: 'PPOB' }
  return map[t] || t || '-'
}
function typeColor(t) {
  const map = { subscription: 'bg-purple-100 text-purple-700', webinar: 'bg-blue-100 text-blue-700', consultation: 'bg-teal-100 text-teal-700', print: 'bg-orange-100 text-orange-700', storage_addon: 'bg-indigo-100 text-indigo-700', ppob: 'bg-gray-100 text-gray-700' }
  return map[t] || 'bg-gray-100 text-gray-600'
}
function statusLabel(s) {
  const map = { pending: 'Pending', waiting_verification: 'Menunggu', under_review: 'Diperiksa', verified: 'Verified', paid: 'Paid', rejected: 'Ditolak', resubmission_required: 'Upload Ulang', expired: 'Expired', cancelled: 'Batal', refunded: 'Refund' }
  return map[s] || s || '-'
}
function statusColor(s) {
  const map = { pending: 'bg-gray-100 text-gray-600', waiting_verification: 'bg-yellow-100 text-yellow-700', under_review: 'bg-blue-100 text-blue-700', verified: 'bg-green-100 text-green-700', paid: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', resubmission_required: 'bg-orange-100 text-orange-700', expired: 'bg-gray-100 text-gray-500', cancelled: 'bg-gray-100 text-gray-500', refunded: 'bg-purple-100 text-purple-700' }
  return map[s] || 'bg-gray-100 text-gray-600'
}
function activationLabel(s) {
  const map = { pending: 'Belum', activated: 'Aktif', failed: 'Gagal', skipped: 'Skip' }
  return map[s] || s || '-'
}
function activationColor(s) {
  const map = { pending: 'bg-gray-100 text-gray-500', activated: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700', skipped: 'bg-gray-100 text-gray-500' }
  return map[s] || 'bg-gray-100 text-gray-600'
}
function getAmountDiffClass(p) {
  const diff = Number(p.transfer_amount) - Number(p.total_amount)
  if (diff < 0) return 'bg-red-50 text-red-700'
  if (diff > 0) return 'bg-yellow-50 text-yellow-700'
  return 'bg-green-50 text-green-700'
}

// Watch filters
watch([search, filterStatus, filterType, sortBy], () => { page.value = 1; loadPayments() })
watch(page, loadPayments)

onMounted(() => {
  loadPayments()
  loadSummary()
})
</script>
