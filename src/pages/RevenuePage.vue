<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Revenue Dashboard</h1>
        <p class="text-xs text-gray-400">Terakhir: {{ lastRefresh }} · IDR</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <select v-model="period" @change="loadAll" class="px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none">
          <option value="today">Hari Ini</option>
          <option value="7d">7 Hari</option>
          <option value="30d">30 Hari</option>
          <option value="month">Bulan Ini</option>
          <option value="year">Tahun Ini</option>
        </select>
        <select v-model="filterSource" @change="loadTransactions" class="px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none">
          <option value="">Semua Sumber</option>
          <option value="subscription">Subscription</option>
          <option value="consultation">Konsultasi</option>
          <option value="webinar">Webinar</option>
          <option value="print">Print</option>
          <option value="storage_addon">Storage</option>
          <option value="ppob">PPOB</option>
        </select>
        <button @click="loadAll" :disabled="loading" class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
          ↻ Refresh
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-gray-500 text-sm">Memuat data pendapatan...</div>

    <template v-else>
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <div v-for="card in summaryCards" :key="card.label" class="bg-white border border-gray-200 rounded-xl p-4">
        <p class="text-[11px] text-gray-400 uppercase tracking-wide">{{ card.label }}</p>
        <p class="text-lg font-bold mt-1" :class="card.color || 'text-gray-900'">{{ card.value }}</p>
        <p v-if="card.sub" class="text-[10px] mt-0.5" :class="card.subColor || 'text-gray-400'">{{ card.sub }}</p>
      </div>
    </div>

    <!-- Revenue by Source -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white border border-gray-200 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Pendapatan per Sumber</h3>
        <div v-if="revenueSources.length === 0" class="text-xs text-gray-400 text-center py-4">Belum ada data.</div>
        <div v-else class="space-y-3">
          <div v-for="src in revenueSources" :key="src.source" class="flex items-center gap-3">
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-gray-600">{{ sourceLabel(src.source) }}</span>
                <span class="text-xs font-medium text-gray-900">{{ formatCurrency(src.gross_revenue) }}</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full" :style="`width: ${src.pct}%; background: ${sourceColor(src.source)};`"></div>
              </div>
            </div>
            <span class="text-[10px] text-gray-400 w-10 text-right">{{ src.transaction_count }}x</span>
          </div>
        </div>
      </div>

      <!-- Payment Status Distribution -->
      <div class="bg-white border border-gray-200 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Status Pembayaran</h3>
        <div class="grid grid-cols-2 gap-3">
          <div v-for="st in paymentStatusDist" :key="st.status" class="p-3 rounded-lg" :class="st.bg">
            <p class="text-lg font-bold" :class="st.textColor">{{ st.count }}</p>
            <p class="text-[10px] text-gray-500">{{ st.label }}</p>
            <p class="text-[10px] text-gray-400">{{ formatCurrency(st.amount) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Consultant Earnings -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-700">Consultant Earnings</h3>
        <span class="text-xs text-gray-400">{{ consultantEarnings.length }} konsultan</span>
      </div>
      <div v-if="consultantEarnings.length === 0" class="text-xs text-gray-400 text-center py-4">Belum ada data earning konsultan.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-xs text-gray-500 border-b">
            <tr>
              <th class="text-left py-2">Konsultan</th>
              <th class="text-left py-2">Sesi</th>
              <th class="text-left py-2">Gross</th>
              <th class="text-left py-2">Platform Fee</th>
              <th class="text-left py-2">Net Earning</th>
              <th class="text-left py-2">Payout Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="c in consultantEarnings" :key="c.consultant_id">
              <td class="py-2 font-medium text-gray-800">{{ c.name }}</td>
              <td class="py-2 text-gray-600">{{ c.session_count }}</td>
              <td class="py-2 text-gray-600">{{ formatCurrency(c.gross) }}</td>
              <td class="py-2 text-gray-600">{{ formatCurrency(c.platform_fee) }}</td>
              <td class="py-2 font-medium text-gray-900">{{ formatCurrency(c.net) }}</td>
              <td class="py-2">
                <span class="px-2 py-0.5 text-[10px] rounded-full" :class="c.paid > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                  {{ c.paid > 0 ? `Paid ${formatCurrency(c.paid)}` : 'Unpaid' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-700">Transaksi Terbaru</h3>
        <span class="text-xs text-gray-400">{{ transactions.length }} transaksi</span>
      </div>
      <div v-if="transactions.length === 0" class="text-xs text-gray-400 text-center py-4">Belum ada transaksi.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-xs text-gray-500 border-b">
            <tr>
              <th class="text-left py-2">User</th>
              <th class="text-left py-2">Sumber</th>
              <th class="text-left py-2">Gross</th>
              <th class="text-left py-2">Fee</th>
              <th class="text-left py-2">Net</th>
              <th class="text-left py-2">Metode</th>
              <th class="text-left py-2">Status</th>
              <th class="text-left py-2">Tanggal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="t in transactions" :key="t.id">
              <td class="py-2">
                <p class="text-xs font-medium text-gray-800">{{ t.user_name }}</p>
              </td>
              <td class="py-2"><span class="px-2 py-0.5 text-[10px] rounded-full" :class="sourceTagColor(t.product_type)">{{ sourceLabel(t.product_type) }}</span></td>
              <td class="py-2 text-gray-700">{{ formatCurrency(t.total_amount) }}</td>
              <td class="py-2 text-gray-400">{{ formatCurrency(t.app_fee_amount) }}</td>
              <td class="py-2 font-medium text-gray-900">{{ formatCurrency(t.total_amount - t.app_fee_amount) }}</td>
              <td class="py-2 text-xs text-gray-500">{{ t.payment_method }}</td>
              <td class="py-2"><span class="px-2 py-0.5 text-[10px] rounded-full" :class="statusColor(t.status)">{{ t.status }}</span></td>
              <td class="py-2 text-xs text-gray-400">{{ formatDate(t.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div class="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
        <p class="text-xs text-gray-400">{{ totalTx }} total</p>
        <div class="flex gap-2">
          <button @click="txPage--" :disabled="txPage <= 1" class="px-3 py-1 text-xs border rounded disabled:opacity-30">←</button>
          <span class="px-3 py-1 text-xs text-gray-600">{{ txPage }}/{{ totalTxPages }}</span>
          <button @click="txPage++" :disabled="txPage >= totalTxPages" class="px-3 py-1 text-xs border rounded disabled:opacity-30">→</button>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../lib/supabase.js'

const PAGE_SIZE = 20

const loading = ref(false)
const lastRefresh = ref('-')
const period = ref('30d')
const filterSource = ref('')

// Summary
const summaryCards = ref([])
const revenueSources = ref([])
const paymentStatusDist = ref([])
const consultantEarnings = ref([])
const transactions = ref([])
const txPage = ref(1)
const totalTx = ref(0)
const totalTxPages = computed(() => Math.max(1, Math.ceil(totalTx.value / PAGE_SIZE)))

function getDateRange() {
  const now = new Date()
  let start
  switch (period.value) {
    case 'today': start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break
    case '7d': start = new Date(now.getTime() - 7 * 86400000); break
    case 'month': start = new Date(now.getFullYear(), now.getMonth(), 1); break
    case 'year': start = new Date(now.getFullYear(), 0, 1); break
    default: start = new Date(now.getTime() - 30 * 86400000)
  }
  return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] }
}

async function loadAll() {
  loading.value = true
  lastRefresh.value = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  try {
    await Promise.all([
      loadSummary(),
      loadSources(),
      loadStatusDist(),
      loadConsultantEarnings(),
      loadTransactions(),
    ])
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadSummary() {
  const { start, end } = getDateRange()
  const { data, error } = await supabase.rpc('admin_get_revenue_summary', { p_start_date: start, p_end_date: end })
  if (error || !data) {
    summaryCards.value = []
    return
  }
  summaryCards.value = [
    { label: 'Gross Revenue', value: formatCurrency(data.gross_revenue), color: 'text-green-700' },
    { label: 'Net Revenue', value: formatCurrency(data.net_revenue), color: 'text-blue-700' },
    { label: 'Pending', value: formatCurrency(data.pending_revenue), color: 'text-orange-600' },
    { label: 'Failed', value: formatCurrency(data.failed_payments), color: 'text-red-600' },
    { label: 'Refund', value: formatCurrency(data.total_refund), color: 'text-red-500' },
    { label: 'Platform Fee', value: formatCurrency(data.platform_fee) },
    { label: 'Consultant Share', value: formatCurrency(data.consultant_share) },
    { label: 'Transaksi', value: String(data.transaction_count) },
    { label: 'Avg Transaction', value: formatCurrency(data.avg_transaction) },
  ]
}

async function loadSources() {
  const { start, end } = getDateRange()
  const { data, error } = await supabase.rpc('admin_get_revenue_by_source', { p_start_date: start, p_end_date: end })
  if (error || !data) { revenueSources.value = []; return }

  const maxGross = Math.max(...data.map(d => Number(d.gross_revenue)), 1)
  revenueSources.value = data.map(d => ({
    ...d,
    pct: Math.round((Number(d.gross_revenue) / maxGross) * 100),
  }))
}

async function loadStatusDist() {
  const { start } = getDateRange()
  const { data } = await supabase
    .from('kinora_marketplace_payments')
    .select('status, total_amount')
    .gte('created_at', start)

  if (!data) { paymentStatusDist.value = []; return }

  const groups = {}
  for (const p of data) {
    if (!groups[p.status]) groups[p.status] = { count: 0, amount: 0 }
    groups[p.status].count++
    groups[p.status].amount += Number(p.total_amount || 0)
  }

  const statusMeta = {
    paid: { label: 'Paid', bg: 'bg-green-50', textColor: 'text-green-700' },
    verified: { label: 'Verified', bg: 'bg-green-50', textColor: 'text-green-700' },
    pending: { label: 'Pending', bg: 'bg-gray-50', textColor: 'text-gray-600' },
    waiting_verification: { label: 'Waiting', bg: 'bg-yellow-50', textColor: 'text-yellow-700' },
    under_review: { label: 'Review', bg: 'bg-blue-50', textColor: 'text-blue-700' },
    failed: { label: 'Failed', bg: 'bg-red-50', textColor: 'text-red-600' },
    rejected: { label: 'Rejected', bg: 'bg-red-50', textColor: 'text-red-600' },
    expired: { label: 'Expired', bg: 'bg-gray-50', textColor: 'text-gray-500' },
    cancelled: { label: 'Cancelled', bg: 'bg-gray-50', textColor: 'text-gray-500' },
    refunded: { label: 'Refunded', bg: 'bg-purple-50', textColor: 'text-purple-700' },
  }

  paymentStatusDist.value = Object.entries(groups).map(([status, val]) => ({
    status,
    ...val,
    ...(statusMeta[status] || { label: status, bg: 'bg-gray-50', textColor: 'text-gray-600' }),
  })).sort((a, b) => b.amount - a.amount)
}

async function loadConsultantEarnings() {
  const { data: consultants } = await supabase
    .from('kinora_consultants')
    .select('id, name')
    .eq('is_active', true)

  if (!consultants || consultants.length === 0) {
    consultantEarnings.value = []
    return
  }

  const { data: earnings } = await supabase
    .from('kinora_consultant_earnings')
    .select('consultant_id, gross_amount, platform_fee, net_earning, status, payout_id')

  if (!earnings) { consultantEarnings.value = []; return }

  const map = {}
  for (const c of consultants) {
    map[c.id] = { consultant_id: c.id, name: c.name, session_count: 0, gross: 0, platform_fee: 0, net: 0, paid: 0 }
  }

  for (const e of earnings) {
    if (!map[e.consultant_id]) continue
    map[e.consultant_id].session_count++
    map[e.consultant_id].gross += Number(e.gross_amount || 0)
    map[e.consultant_id].platform_fee += Number(e.platform_fee || 0)
    map[e.consultant_id].net += Number(e.net_earning || 0)
    if (e.status === 'paid') map[e.consultant_id].paid += Number(e.net_earning || 0)
  }

  consultantEarnings.value = Object.values(map).sort((a, b) => b.gross - a.gross)
}

async function loadTransactions() {
  const { start } = getDateRange()
  let query = supabase
    .from('kinora_marketplace_payments')
    .select('id, user_id, product_type, total_amount, app_fee_amount, payment_method, status, created_at, users!kinora_marketplace_payments_user_id_fkey(display_name)', { count: 'exact' })
    .gte('created_at', start)
    .order('created_at', { ascending: false })

  if (filterSource.value) query = query.eq('product_type', filterSource.value)

  const from = (txPage.value - 1) * PAGE_SIZE
  query = query.range(from, from + PAGE_SIZE - 1)

  const { data, count, error } = await query
  if (error) { transactions.value = []; return }

  totalTx.value = count || 0
  transactions.value = (data || []).map(t => ({
    ...t,
    user_name: t.users?.display_name || '-',
  }))
}

watch(txPage, loadTransactions)

// Helpers
function formatCurrency(n) {
  if (n == null || isNaN(n)) return 'Rp 0'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function sourceLabel(s) {
  const map = { subscription: 'Subscription', consultation: 'Konsultasi', webinar: 'Webinar', print: 'Print', storage_addon: 'Storage', ppob: 'PPOB' }
  return map[s] || s || '-'
}

function sourceColor(s) {
  const map = { subscription: '#6B46C1', consultation: '#0D9488', webinar: '#2563EB', print: '#EA580C', storage_addon: '#4F46E5', ppob: '#6B7280' }
  return map[s] || '#6B7280'
}

function sourceTagColor(s) {
  const map = { subscription: 'bg-purple-100 text-purple-700', consultation: 'bg-teal-100 text-teal-700', webinar: 'bg-blue-100 text-blue-700', print: 'bg-orange-100 text-orange-700', storage_addon: 'bg-indigo-100 text-indigo-700', ppob: 'bg-gray-100 text-gray-700' }
  return map[s] || 'bg-gray-100 text-gray-600'
}

function statusColor(s) {
  const map = { paid: 'bg-green-100 text-green-700', verified: 'bg-green-100 text-green-700', pending: 'bg-gray-100 text-gray-600', waiting_verification: 'bg-yellow-100 text-yellow-700', under_review: 'bg-blue-100 text-blue-700', failed: 'bg-red-100 text-red-700', rejected: 'bg-red-100 text-red-700', expired: 'bg-gray-100 text-gray-500', cancelled: 'bg-gray-100 text-gray-500', refunded: 'bg-purple-100 text-purple-700' }
  return map[s] || 'bg-gray-100 text-gray-600'
}

onMounted(() => { loadAll() })
</script>
