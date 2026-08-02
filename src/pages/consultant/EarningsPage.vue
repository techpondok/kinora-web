<template>
  <ConsultantLayout>
    <div class="space-y-6">
      <!-- Loading -->
      <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat...</div>

      <template v-else>
      <div>
        <h1 class="text-xl font-bold text-gray-900">Pendapatan</h1>
        <p class="text-sm text-gray-500">Ringkasan pendapatan dan riwayat transaksi konsultasi.</p>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div v-for="card in summaryCards" :key="card.label" class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-[10px] text-gray-400 uppercase">{{ card.label }}</p>
          <p class="text-lg font-bold mt-1" :class="card.color">{{ card.value }}</p>
        </div>
      </div>

      <!-- Filter -->
      <div class="flex items-center gap-3">
        <select v-model="period" class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 outline-none">
          <option value="this_month">Bulan Ini</option>
          <option value="last_month">Bulan Lalu</option>
          <option value="custom">Kustom</option>
        </select>
      </div>

      <!-- Transactions Table -->
      <section class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Kode</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Tanggal</th>
                <th class="text-right px-4 py-3 text-xs font-medium text-gray-500">Harga</th>
                <th class="text-right px-4 py-3 text-xs font-medium text-gray-500">Fee</th>
                <th class="text-right px-4 py-3 text-xs font-medium text-gray-500">Net</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="tx in transactions" :key="tx.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-xs font-mono text-gray-600">{{ tx.code }}</td>
                <td class="px-4 py-3 text-xs text-gray-500">{{ tx.date }}</td>
                <td class="px-4 py-3 text-xs text-right text-gray-900">{{ tx.price }}</td>
                <td class="px-4 py-3 text-xs text-right text-red-500">-{{ tx.fee }}</td>
                <td class="px-4 py-3 text-xs text-right font-medium text-green-700">{{ tx.net }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="px-2 py-0.5 text-[10px] rounded-full font-medium" :class="tx.statusClass">{{ tx.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Payout History -->
      <section v-if="payouts.length > 0" class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="font-semibold text-gray-900 mb-4">Riwayat Pencairan</h2>
        <div class="space-y-3">
          <div v-for="p in payouts" :key="p.id" class="flex items-center justify-between p-3 rounded-lg border border-gray-100">
            <div>
              <p class="text-sm font-medium text-gray-900">{{ p.period }}</p>
              <p class="text-xs text-gray-500">{{ p.sessionCount }} sesi · {{ p.paidAt }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-green-700">{{ p.netPayout }}</p>
              <span class="px-2 py-0.5 text-[10px] rounded-full font-medium" :class="p.statusClass">{{ p.status }}</span>
            </div>
          </div>
        </div>
      </section>
      </template>
    </div>
  </ConsultantLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase.js'
import ConsultantLayout from '../../components/ConsultantLayout.vue'

const loading = ref(true)
const period = ref('this_month')
const summaryCards = ref([])
const transactions = ref([])
const payouts = ref([])

function formatCurrency(amount) {
  if (!amount) return 'Rp 0'
  const num = Number(amount)
  if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}jt`
  if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}k`
  return `Rp ${num.toLocaleString('id-ID')}`
}

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function getStatusDisplay(status) {
  const map = {
    pending: { label: 'Pending', class: 'bg-amber-100 text-amber-700' },
    settled: { label: 'Selesai', class: 'bg-green-100 text-green-700' },
    paid: { label: 'Dicairkan', class: 'bg-blue-100 text-blue-700' },
  }
  return map[status] || { label: status || '—', class: 'bg-gray-100 text-gray-600' }
}

function getPayoutStatus(status) {
  const map = {
    pending: { label: 'Pending', class: 'bg-amber-100 text-amber-700' },
    paid: { label: 'Dibayar', class: 'bg-green-100 text-green-700' },
    processing: { label: 'Proses', class: 'bg-blue-100 text-blue-700' },
  }
  return map[status] || { label: status || '—', class: 'bg-gray-100 text-gray-600' }
}

async function loadEarnings() {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }

  const { data: profile } = await supabase
    .from('kinora_consultants')
    .select('id')
    .eq('consultant_user_id', user.id)
    .maybeSingle()
  if (!profile) { loading.value = false; return }

  // Fetch earnings
  const { data: earnings } = await supabase
    .from('kinora_consultant_earnings')
    .select('id, gross_amount, platform_fee, net_earning, status, created_at')
    .eq('consultant_id', profile.id)
    .order('created_at', { ascending: false })

  transactions.value = (earnings || []).map((e, idx) => {
    const st = getStatusDisplay(e.status)
    return {
      id: e.id,
      code: `TRX-${String(idx + 1).padStart(3, '0')}`,
      date: formatDate(e.created_at),
      price: formatCurrency(e.gross_amount),
      fee: formatCurrency(e.platform_fee),
      net: formatCurrency(e.net_earning),
      status: st.label,
      statusClass: st.class,
    }
  })

  // Compute summary
  const totalGross = (earnings || []).reduce((s, e) => s + Number(e.gross_amount || 0), 0)
  const totalFee = (earnings || []).reduce((s, e) => s + Number(e.platform_fee || 0), 0)
  const totalNet = (earnings || []).reduce((s, e) => s + Number(e.net_earning || 0), 0)
  const totalPending = (earnings || []).filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.net_earning || 0), 0)
  const totalSettled = (earnings || []).filter(e => e.status === 'settled').reduce((s, e) => s + Number(e.net_earning || 0), 0)
  const totalPaid = (earnings || []).filter(e => e.status === 'paid').reduce((s, e) => s + Number(e.net_earning || 0), 0)

  summaryCards.value = [
    { label: 'Pendapatan Kotor', value: formatCurrency(totalGross), color: 'text-gray-900' },
    { label: 'Fee Platform', value: formatCurrency(totalFee), color: 'text-red-500' },
    { label: 'Pendapatan Bersih', value: formatCurrency(totalNet), color: 'text-green-600' },
    { label: 'Pending', value: formatCurrency(totalPending), color: 'text-amber-600' },
    { label: 'Tersedia', value: formatCurrency(totalSettled), color: 'text-green-600' },
    { label: 'Total Ditarik', value: formatCurrency(totalPaid), color: 'text-blue-600' },
  ]

  // Fetch payouts
  const { data: payoutData } = await supabase
    .from('kinora_consultant_payouts')
    .select('id, period_start, period_end, session_count, net_payout, status, paid_at')
    .eq('consultant_id', profile.id)
    .order('paid_at', { ascending: false })

  payouts.value = (payoutData || []).map(p => {
    const st = getPayoutStatus(p.status)
    return {
      id: p.id,
      period: `${formatDate(p.period_start)} - ${formatDate(p.period_end)}`,
      sessionCount: p.session_count || 0,
      netPayout: formatCurrency(p.net_payout),
      paidAt: formatDate(p.paid_at),
      status: st.label,
      statusClass: st.class,
    }
  })

  loading.value = false
}

onMounted(loadEarnings)
</script>
