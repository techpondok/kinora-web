<template>
  <ConsultantLayout>
    <div class="space-y-6">
      <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat...</div>

      <template v-else>
      <div>
        <h1 class="text-xl font-bold text-gray-900">Penarikan Dana</h1>
        <p class="text-sm text-gray-500">Kelola penarikan saldo pendapatan Anda.</p>
      </div>

      <!-- Available Balance -->
      <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm opacity-80">Saldo Tersedia</p>
            <p class="text-3xl font-bold mt-1">{{ formatCurrency(availableBalance) }}</p>
            <p class="text-xs opacity-70 mt-2">Minimum penarikan: {{ formatCurrency(minWithdrawal) }}</p>
          </div>
          <div class="text-right space-y-1">
            <p class="text-xs opacity-70">Tertahan: {{ formatCurrency(pendingBalance) }}</p>
            <p class="text-xs opacity-70">Total Cair: {{ formatCurrency(lifetimeWithdrawn) }}</p>
          </div>
        </div>
        <button @click="openWithdrawModal" :disabled="!canWithdraw"
          class="mt-4 px-5 py-2.5 bg-white text-green-700 rounded-lg text-sm font-semibold hover:bg-green-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
          Tarik Dana
        </button>
        <p v-if="withdrawBlockReason" class="text-xs opacity-80 mt-2">{{ withdrawBlockReason }}</p>
      </div>

      <!-- Bank Accounts -->
      <section class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-900">Rekening Bank</h2>
          <button @click="openAddModal" class="text-xs text-blue-600 hover:underline font-medium">+ Tambah Rekening</button>
        </div>

        <div v-if="bankAccounts.length === 0" class="text-sm text-gray-400 text-center py-4">Belum ada rekening bank terdaftar.</div>
        <div v-else class="space-y-3">
          <div v-for="acct in bankAccounts" :key="acct.id" class="flex items-center gap-4 p-4 rounded-lg border border-gray-100 bg-gray-50">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">{{ acct.bank_name.slice(0, 3) }}</div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900">{{ acct.bank_name }}</p>
              <p class="text-xs text-gray-500">•••• {{ acct.account_number.slice(-4) }} · a.n. {{ acct.account_name }}</p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span v-if="acct.is_primary" class="px-2 py-0.5 text-[10px] rounded-full bg-green-100 text-green-700 font-medium">Utama</span>
              <span v-if="acct.status === 'pending_verification'" class="px-2 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-700">Verifikasi</span>
              <button v-if="!acct.is_primary" @click="setPrimary(acct)" class="text-[10px] text-blue-600 hover:underline">Jadikan Utama</button>
              <button @click="openEditModal(acct)" class="text-[10px] text-gray-500 hover:underline">Edit</button>
              <button @click="deleteAccount(acct)" class="text-[10px] text-red-500 hover:underline">Hapus</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Withdrawal History -->
      <section class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100">
          <h2 class="font-semibold text-gray-900">Riwayat Penarikan</h2>
        </div>
        <div v-if="withdrawals.length === 0" class="text-sm text-gray-400 text-center py-8">Belum ada riwayat penarikan.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Tanggal</th>
                <th class="text-right px-4 py-3 text-xs font-medium text-gray-500">Jumlah</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Referensi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="w in withdrawals" :key="w.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-900">{{ w.date }}</td>
                <td class="px-4 py-3 text-sm text-right font-medium text-gray-900">{{ w.amount }}</td>
                <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 text-[10px] rounded-full font-medium" :class="w.statusClass">{{ w.status }}</span></td>
                <td class="px-4 py-3 text-xs font-mono text-gray-500">{{ w.reference }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      </template>

      <!-- Add/Edit Bank Account Modal -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div @click="showModal = false" class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <h3 class="font-bold text-gray-900">{{ editingAccount ? 'Edit Rekening' : 'Tambah Rekening' }}</h3>
          <div v-if="modalError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{{ modalError }}</div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Nama Bank *</label>
              <input v-model="bankForm.bank_name" type="text" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200" placeholder="BCA, BNI, Mandiri, dll" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Nomor Rekening *</label>
              <input v-model="bankForm.account_number" type="text" inputmode="numeric" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200 font-mono" placeholder="1234567890" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Nama Pemilik Rekening *</label>
              <input v-model="bankForm.account_name" type="text" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200" placeholder="Sesuai buku tabungan" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Cabang (opsional)</label>
              <input v-model="bankForm.branch" type="text" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200" placeholder="Cabang utama" />
            </div>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" v-model="bankForm.is_primary" class="rounded" />
              Jadikan rekening utama
            </label>
          </div>
          <div class="flex gap-3 pt-2">
            <button @click="saveAccount" :disabled="saving" class="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition">
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
            <button @click="showModal = false" class="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Batal</button>
          </div>
        </div>
      </div>
      <!-- Withdraw Modal -->
      <div v-if="showWithdrawModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div @click="showWithdrawModal = false" class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <h3 class="font-bold text-gray-900">Tarik Dana</h3>
          <div v-if="withdrawError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{{ withdrawError }}</div>
          <div class="p-3 bg-green-50 rounded-lg text-sm">
            <p class="text-green-800 font-medium">Saldo tersedia: {{ formatCurrency(availableBalance) }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Nominal Penarikan *</label>
            <input v-model.number="withdrawAmount" type="number" :min="minWithdrawal" :max="availableBalance" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200 font-mono" :placeholder="`Min ${formatCurrency(minWithdrawal)}`" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Rekening Tujuan</label>
            <select v-model="withdrawBankId" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none">
              <option value="">Pilih rekening</option>
              <option v-for="acct in activeBankAccounts" :key="acct.id" :value="acct.id">{{ acct.bank_name }} · •••• {{ acct.account_number.slice(-4) }} · {{ acct.account_name }}</option>
            </select>
          </div>
          <div v-if="withdrawAmount > 0" class="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
            <div class="flex justify-between"><span>Nominal</span><span>{{ formatCurrency(withdrawAmount) }}</span></div>
            <div class="flex justify-between font-semibold text-gray-900 pt-1 border-t"><span>Diterima</span><span>{{ formatCurrency(withdrawAmount) }}</span></div>
          </div>
          <div class="flex gap-3 pt-2">
            <button @click="submitWithdrawal" :disabled="withdrawing" class="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition">
              {{ withdrawing ? 'Memproses...' : 'Konfirmasi Penarikan' }}
            </button>
            <button @click="showWithdrawModal = false" class="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Batal</button>
          </div>
        </div>
      </div>
    </div>
  </ConsultantLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase.js'
import ConsultantLayout from '../../components/ConsultantLayout.vue'

const loading = ref(true)
const withdrawals = ref([])
const bankAccounts = ref([])
const availableBalance = ref(0)
const pendingBalance = ref(0)
const lifetimeWithdrawn = ref(0)
const minWithdrawal = ref(100000)
const hasPendingPayout = ref(false)
const showModal = ref(false)
const showWithdrawModal = ref(false)
const saving = ref(false)
const withdrawing = ref(false)
const modalError = ref('')
const withdrawError = ref('')
const editingAccount = ref(null)
const withdrawAmount = ref(0)
const withdrawBankId = ref('')

let consultantId = null

const bankForm = ref({ bank_name: '', account_number: '', account_name: '', branch: '', is_primary: false })

function formatCurrency(amount) {
  if (!amount) return 'Rp 0'
  return 'Rp ' + Number(amount).toLocaleString('id-ID')
}

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getStatusDisplay(status) {
  const map = {
    pending_approval: { label: 'Menunggu', class: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Disetujui', class: 'bg-blue-100 text-blue-700' },
    processing: { label: 'Diproses', class: 'bg-blue-100 text-blue-700' },
    paid: { label: 'Berhasil', class: 'bg-green-100 text-green-700' },
    failed: { label: 'Gagal', class: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Dibatalkan', class: 'bg-gray-100 text-gray-600' },
  }
  return map[status] || { label: status || '—', class: 'bg-gray-100 text-gray-600' }
}

function openAddModal() {
  editingAccount.value = null
  bankForm.value = { bank_name: '', account_number: '', account_name: '', branch: '', is_primary: bankAccounts.value.length === 0 }
  modalError.value = ''
  showModal.value = true
}

function openEditModal(acct) {
  editingAccount.value = acct
  bankForm.value = { bank_name: acct.bank_name, account_number: acct.account_number, account_name: acct.account_name, branch: acct.branch || '', is_primary: acct.is_primary }
  modalError.value = ''
  showModal.value = true
}

async function saveAccount() {
  modalError.value = ''
  const { bank_name, account_number, account_name } = bankForm.value
  if (!bank_name.trim()) { modalError.value = 'Nama bank wajib diisi.'; return }
  if (!account_number.trim() || !/^\d{5,20}$/.test(account_number.trim())) { modalError.value = 'Nomor rekening harus berisi 5-20 digit angka.'; return }
  if (!account_name.trim()) { modalError.value = 'Nama pemilik rekening wajib diisi.'; return }

  saving.value = true

  // If setting as primary, unset others first
  if (bankForm.value.is_primary) {
    await supabase.from('kinora_consultant_bank_accounts')
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq('consultant_id', consultantId)
      .eq('is_primary', true)
  }

  const payload = {
    consultant_id: consultantId,
    bank_name: bank_name.trim(),
    account_number: account_number.trim(),
    account_name: account_name.trim(),
    branch: bankForm.value.branch?.trim() || null,
    is_primary: bankForm.value.is_primary || bankAccounts.value.length === 0,
    status: 'active',
    updated_at: new Date().toISOString(),
  }

  let error
  if (editingAccount.value) {
    const res = await supabase.from('kinora_consultant_bank_accounts').update(payload).eq('id', editingAccount.value.id)
    error = res.error
  } else {
    const res = await supabase.from('kinora_consultant_bank_accounts').insert(payload)
    error = res.error
  }

  saving.value = false
  if (error) {
    if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
      modalError.value = 'Nomor rekening sudah terdaftar.'
    } else {
      modalError.value = 'Gagal menyimpan rekening. Silakan coba lagi.'
    }
    return
  }

  showModal.value = false
  await loadBankAccounts()
}

async function setPrimary(acct) {
  await supabase.from('kinora_consultant_bank_accounts')
    .update({ is_primary: false, updated_at: new Date().toISOString() })
    .eq('consultant_id', consultantId).eq('is_primary', true)
  await supabase.from('kinora_consultant_bank_accounts')
    .update({ is_primary: true, updated_at: new Date().toISOString() })
    .eq('id', acct.id)
  await loadBankAccounts()
}

async function deleteAccount(acct) {
  if (acct.is_primary && bankAccounts.value.length > 1) {
    if (!confirm('Rekening utama akan dihapus. Pilih rekening lain sebagai utama terlebih dahulu.')) return
  }
  if (!confirm('Hapus rekening ini?')) return
  await supabase.from('kinora_consultant_bank_accounts').delete().eq('id', acct.id)
  await loadBankAccounts()
}

async function loadBankAccounts() {
  const { data } = await supabase
    .from('kinora_consultant_bank_accounts')
    .select('*')
    .eq('consultant_id', consultantId)
    .order('is_primary', { ascending: false })
    .order('created_at')
  bankAccounts.value = data || []
}

async function loadAll() {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }

  const { data: profile } = await supabase
    .from('kinora_consultants')
    .select('id')
    .eq('consultant_user_id', user.id)
    .maybeSingle()
  if (!profile) { loading.value = false; return }
  consultantId = profile.id

  // Load bank accounts
  await loadBankAccounts()

  // Get balance via RPC
  const { data: balance } = await supabase.rpc('get_consultant_balance', { p_consultant_id: consultantId })
  if (balance) {
    availableBalance.value = Number(balance.available_balance) || 0
    pendingBalance.value = Number(balance.pending_balance) || 0
    lifetimeWithdrawn.value = Number(balance.lifetime_withdrawn) || 0
    minWithdrawal.value = Number(balance.minimum_withdrawal) || 100000
    hasPendingPayout.value = balance.has_pending_payout || false
  }

  // Payouts
  const { data: payouts } = await supabase
    .from('kinora_consultant_payouts')
    .select('id, net_payout, status, paid_at, transfer_reference, created_at')
    .eq('consultant_id', consultantId)
    .order('created_at', { ascending: false })

  withdrawals.value = (payouts || []).map(p => {
    const st = getStatusDisplay(p.status)
    return { id: p.id, date: formatDate(p.paid_at || p.created_at), amount: formatCurrency(p.net_payout), status: st.label, statusClass: st.class, reference: p.transfer_reference || '—' }
  })

  loading.value = false
}

import { computed } from 'vue'

const activeBankAccounts = computed(() => bankAccounts.value.filter(a => ['active', 'verified'].includes(a.status)))
const primaryBank = computed(() => bankAccounts.value.find(a => a.is_primary))

const canWithdraw = computed(() => {
  return availableBalance.value >= minWithdrawal.value
    && activeBankAccounts.value.length > 0
    && !hasPendingPayout.value
})

const withdrawBlockReason = computed(() => {
  if (hasPendingPayout.value) return 'Masih ada penarikan yang sedang diproses.'
  if (activeBankAccounts.value.length === 0) return 'Tambahkan rekening bank terlebih dahulu.'
  if (availableBalance.value < minWithdrawal.value) return `Saldo belum mencapai minimum penarikan ${formatCurrency(minWithdrawal.value)}.`
  return ''
})

function openWithdrawModal() {
  if (!canWithdraw.value) return
  withdrawAmount.value = availableBalance.value
  withdrawBankId.value = primaryBank.value?.id || activeBankAccounts.value[0]?.id || ''
  withdrawError.value = ''
  showWithdrawModal.value = true
}

async function submitWithdrawal() {
  withdrawError.value = ''
  if (!withdrawAmount.value || withdrawAmount.value < minWithdrawal.value) {
    withdrawError.value = `Nominal minimum ${formatCurrency(minWithdrawal.value)}.`
    return
  }
  if (withdrawAmount.value > availableBalance.value) {
    withdrawError.value = 'Saldo tidak mencukupi.'
    return
  }
  if (!withdrawBankId.value) {
    withdrawError.value = 'Pilih rekening tujuan.'
    return
  }

  withdrawing.value = true
  const { data, error } = await supabase.rpc('request_consultant_withdrawal', {
    p_consultant_id: consultantId,
    p_amount: withdrawAmount.value,
    p_bank_account_id: withdrawBankId.value,
  })

  withdrawing.value = false
  if (error) {
    withdrawError.value = 'Gagal membuat permintaan penarikan.'
    return
  }
  if (data && !data.success) {
    withdrawError.value = data.error || 'Gagal membuat permintaan.'
    return
  }

  showWithdrawModal.value = false
  await loadAll()
}

onMounted(loadAll)
</script>
