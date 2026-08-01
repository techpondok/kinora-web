<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Pembayaran Konsultasi</h1>
        <p class="text-sm text-gray-500">Verifikasi pembayaran, kelola earning, dan payout konsultan.</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200 overflow-x-auto">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="['px-4 py-2.5 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px',
          activeTab === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700']">
        {{ tab.label }}
        <span v-if="tab.count" class="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-8 text-center text-gray-500 text-sm">Memuat...</div>

    <div v-else>
      <!-- Verification Tab -->
      <div v-if="activeTab === 'verification'" class="space-y-3">
        <div v-if="pendingPayments.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">Tidak ada pembayaran menunggu verifikasi.</div>
        <div v-for="pay in pendingPayments" :key="pay.id" class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 text-sm">{{ pay.user_name || 'User' }} → {{ pay.consultant_name || 'Konsultan' }}</p>
              <p class="text-xs text-gray-500">{{ pay.product_type }} · {{ formatDate(pay.created_at) }}</p>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{{ pay.status }}</span>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span class="text-gray-500 text-xs">Amount:</span><p class="font-medium">{{ formatIDR(pay.total_amount) }}</p></div>
            <div><span class="text-gray-500 text-xs">Method:</span><p>{{ pay.payment_method }}</p></div>
            <div v-if="pay.sender_bank"><span class="text-gray-500 text-xs">Bank:</span><p>{{ pay.sender_bank }}</p></div>
            <div v-if="pay.transfer_amount"><span class="text-gray-500 text-xs">Ditransfer:</span><p>{{ formatIDR(pay.transfer_amount) }}</p></div>
          </div>
          <div v-if="pay.payment_proof_url" class="flex items-center gap-3">
            <a :href="pay.payment_proof_url" target="_blank" class="text-xs text-blue-600 hover:underline">Lihat Bukti</a>
            <span v-if="pay.proof_submitted_at" class="text-xs text-gray-400">{{ formatDate(pay.proof_submitted_at) }}</span>
          </div>
          <div class="flex gap-2 pt-2 border-t border-gray-100">
            <button @click="verifyPayment(pay, 'verified')" class="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">Verifikasi</button>
            <button @click="verifyPayment(pay, 'rejected')" class="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">Tolak</button>
            <input v-model="pay._admin_note" type="text" class="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none" placeholder="Catatan admin..." />
          </div>
        </div>
      </div>

      <!-- Earnings Tab -->
      <div v-if="activeTab === 'earnings'" class="space-y-3">
        <div v-if="earnings.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">Belum ada earning.</div>
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden" v-else>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Konsultan</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Sesi</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Gross</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Fee</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Net</th>
                <th class="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="e in earnings" :key="e.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-gray-900">{{ e.consultant_name || '—' }}</td>
                <td class="px-4 py-3 text-xs text-gray-500">{{ formatDate(e.created_at) }}</td>
                <td class="px-4 py-3 text-right">{{ formatIDR(e.gross_amount) }}</td>
                <td class="px-4 py-3 text-right text-gray-500">{{ formatIDR(e.platform_fee) }}</td>
                <td class="px-4 py-3 text-right font-medium">{{ formatIDR(e.net_earning) }}</td>
                <td class="px-4 py-3 text-center"><span :class="earningStatusClass(e.status)" class="text-xs px-2 py-0.5 rounded-full">{{ e.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payouts Tab -->
      <div v-if="activeTab === 'payouts'" class="space-y-3">
        <div class="flex justify-end">
          <button @click="createPayout" :disabled="payableCount === 0" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Buat Payout Batch</button>
        </div>
        <div v-if="payouts.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">Belum ada payout.</div>
        <div v-for="po in payouts" :key="po.id" class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 text-sm">{{ po.consultant_name || 'Konsultan' }}</p>
              <p class="text-xs text-gray-500">{{ po.period_start }} – {{ po.period_end }} · {{ po.session_count }} sesi</p>
            </div>
            <span :class="payoutStatusClass(po.status)" class="text-xs px-2 py-0.5 rounded-full">{{ po.status }}</span>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span class="text-gray-500 text-xs">Gross:</span><p>{{ formatIDR(po.gross_earning) }}</p></div>
            <div><span class="text-gray-500 text-xs">Deductions:</span><p>{{ formatIDR(po.deductions) }}</p></div>
            <div><span class="text-gray-500 text-xs">Net Payout:</span><p class="font-bold text-green-700">{{ formatIDR(po.net_payout) }}</p></div>
            <div><span class="text-gray-500 text-xs">Bank:</span><p>{{ po.bank_name }} ••{{ (po.bank_account_number || '').slice(-4) }}</p></div>
          </div>
          <div v-if="po.status === 'pending_approval' || po.status === 'approved'" class="flex gap-2 pt-2 border-t border-gray-100">
            <button v-if="po.status === 'pending_approval'" @click="approvePayout(po)" class="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg">Approve</button>
            <button v-if="po.status === 'approved'" @click="markPayoutPaid(po)" class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg">Mark Paid</button>
            <input v-model="po._reference" type="text" class="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none" placeholder="Transfer reference..." />
          </div>
          <div v-if="po.transfer_reference" class="text-xs text-gray-400">Ref: {{ po.transfer_reference }} · Paid: {{ formatDate(po.paid_at) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const tabs = computed(() => [
  { id: 'verification', label: 'Verifikasi', count: pendingPayments.value.length },
  { id: 'earnings', label: 'Earnings' },
  { id: 'payouts', label: 'Payouts' },
])

const activeTab = ref('verification')
const loading = ref(true)
const pendingPayments = ref([])
const earnings = ref([])
const payouts = ref([])
const payableCount = ref(0)

function formatIDR(val) {
  if (!val && val !== 0) return 'Rp 0'
  return 'Rp ' + Number(val).toLocaleString('id-ID')
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function earningStatusClass(status) {
  if (status === 'paid') return 'bg-green-100 text-green-700'
  if (status === 'pending') return 'bg-gray-100 text-gray-600'
  if (status === 'confirmed') return 'bg-blue-100 text-blue-700'
  if (status === 'disputed') return 'bg-red-100 text-red-600'
  return 'bg-gray-100 text-gray-500'
}

function payoutStatusClass(status) {
  if (status === 'paid') return 'bg-green-100 text-green-700'
  if (status === 'approved') return 'bg-blue-100 text-blue-700'
  if (status === 'pending_approval') return 'bg-amber-100 text-amber-700'
  if (status === 'processing') return 'bg-purple-100 text-purple-700'
  if (status === 'failed') return 'bg-red-100 text-red-600'
  return 'bg-gray-100 text-gray-500'
}

async function fetchAll() {
  loading.value = true

  // Pending payments (consultation type, waiting verification)
  const { data: payments } = await supabase
    .from('kinora_marketplace_payments')
    .select('*, user:users!kinora_marketplace_payments_user_id_fkey(display_name)')
    .eq('product_type', 'consultation')
    .in('status', ['waiting_verification', 'under_review', 'proof_uploaded'])
    .order('created_at', { ascending: false })
  pendingPayments.value = (payments || []).map(p => ({
    ...p,
    user_name: p.user?.display_name,
    _admin_note: ''
  }))

  // Earnings
  const { data: earningsData } = await supabase
    .from('kinora_consultant_earnings')
    .select('*, consultant:kinora_consultants!kinora_consultant_earnings_consultant_id_fkey(name)')
    .order('created_at', { ascending: false })
    .limit(50)
  earnings.value = (earningsData || []).map(e => ({
    ...e,
    consultant_name: e.consultant?.name
  }))

  // Payable count
  const { count } = await supabase
    .from('kinora_consultant_earnings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmed')
    .is('payout_id', null)
  payableCount.value = count || 0

  // Payouts
  const { data: payoutsData } = await supabase
    .from('kinora_consultant_payouts')
    .select('*, consultant:kinora_consultants!kinora_consultant_payouts_consultant_id_fkey(name)')
    .order('created_at', { ascending: false })
    .limit(50)
  payouts.value = (payoutsData || []).map(po => ({
    ...po,
    consultant_name: po.consultant?.name,
    _reference: po.transfer_reference || ''
  }))

  loading.value = false
}

async function verifyPayment(pay, newStatus) {
  const reason = pay._admin_note || (newStatus === 'rejected' ? 'Bukti tidak valid' : 'Verified')
  if (newStatus === 'rejected' && !pay._admin_note) {
    if (!confirm('Tolak pembayaran tanpa catatan?')) return
  }

  const { error } = await supabase
    .from('kinora_marketplace_payments')
    .update({
      status: newStatus,
      admin_note: reason,
      verified_at: newStatus === 'verified' ? new Date().toISOString() : null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', pay.id)

  if (!error) {
    // If verified, create earning for the consultant
    if (newStatus === 'verified') {
      await createEarningForPayment(pay)
    }
    // Log to payment audit
    await supabase.from('kinora_payment_audit_log').insert({
      payment_id: pay.id,
      action: newStatus === 'verified' ? 'verify' : 'reject',
      status_before: pay.status,
      status_after: newStatus,
      reason
    })
    await fetchAll()
  }
}

async function createEarningForPayment(pay) {
  // Get consultation session
  const { data: session } = await supabase
    .from('kinora_consultation_sessions')
    .select('id, consultant_id, session_price_amount')
    .eq('payment_id', pay.id)
    .maybeSingle()

  if (!session) return

  // Get platform fee config
  const { data: feeConfig } = await supabase
    .from('kinora_payment_settings')
    .select('consultation_app_fee_fixed, consultation_app_fee_percent')
    .eq('id', 1)
    .single()

  const gross = Number(session.session_price_amount) || Number(pay.total_amount) || 0
  const feeFixed = Number(feeConfig?.consultation_app_fee_fixed) || 0
  const feePct = Number(feeConfig?.consultation_app_fee_percent) || 0
  const platformFee = feeFixed + Math.round(gross * feePct / 100)
  const netEarning = Math.max(0, gross - platformFee)

  await supabase.from('kinora_consultant_earnings').insert({
    session_id: session.id,
    consultant_id: session.consultant_id,
    payment_id: pay.id,
    gross_amount: gross,
    platform_fee: platformFee,
    payment_fee: 0,
    discount_amount: Number(pay.app_fee_amount) || 0,
    refund_deduction: 0,
    adjustment: 0,
    net_earning: netEarning,
    currency: pay.currency || 'IDR',
    status: 'pending'
  })
}

async function createPayout() {
  if (!confirm(`Buat payout batch untuk ${payableCount.value} earning yang siap dibayar?`)) return

  // Get payable earnings grouped by consultant
  const { data: payableEarnings } = await supabase
    .from('kinora_consultant_earnings')
    .select('*, consultant:kinora_consultants!kinora_consultant_earnings_consultant_id_fkey(id, name)')
    .eq('status', 'confirmed')
    .is('payout_id', null)

  if (!payableEarnings?.length) return

  // Group by consultant
  const grouped = {}
  for (const e of payableEarnings) {
    const cid = e.consultant_id
    if (!grouped[cid]) grouped[cid] = { consultant_id: cid, earnings: [], name: e.consultant?.name }
    grouped[cid].earnings.push(e)
  }

  for (const [cid, group] of Object.entries(grouped)) {
    const gross = group.earnings.reduce((s, e) => s + Number(e.gross_amount), 0)
    const fees = group.earnings.reduce((s, e) => s + Number(e.platform_fee) + Number(e.payment_fee), 0)
    const net = group.earnings.reduce((s, e) => s + Number(e.net_earning), 0)

    const { data: payout, error } = await supabase.from('kinora_consultant_payouts').insert({
      consultant_id: cid,
      period_start: new Date(Math.min(...group.earnings.map(e => new Date(e.created_at)))).toISOString().slice(0, 10),
      period_end: new Date().toISOString().slice(0, 10),
      session_count: group.earnings.length,
      gross_earning: gross,
      deductions: fees,
      adjustments: 0,
      net_payout: net,
      currency: 'IDR',
      status: 'pending_approval'
    }).select('id').single()

    if (!error && payout) {
      // Link earnings to payout
      const earningIds = group.earnings.map(e => e.id)
      await supabase.from('kinora_consultant_earnings')
        .update({ payout_id: payout.id, status: 'paid', updated_at: new Date().toISOString() })
        .in('id', earningIds)
    }
  }

  await fetchAll()
}

async function approvePayout(po) {
  await supabase.from('kinora_consultant_payouts')
    .update({ status: 'approved', approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', po.id)
  await fetchAll()
}

async function markPayoutPaid(po) {
  if (!po._reference) { alert('Masukkan transfer reference.'); return }
  await supabase.from('kinora_consultant_payouts')
    .update({ status: 'paid', paid_at: new Date().toISOString(), transfer_reference: po._reference, updated_at: new Date().toISOString() })
    .eq('id', po.id)
  await fetchAll()
}

onMounted(fetchAll)
</script>
