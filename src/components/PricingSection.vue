<template>
  <section class="py-20 px-5 relative overflow-hidden" style="background: linear-gradient(180deg, #F7FAFC 0%, white 100%);">
    <div class="max-w-5xl mx-auto relative">
      <!-- Header -->
      <div class="text-center mb-14">
        <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5" style="background: #EBF8FF; color: #2B6CB0;">
          💎 Paket & Harga
        </span>
        <h2 style="font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 800; color: #1A202C; line-height: 1.2;">
          Satu aplikasi untuk<br>seluruh keluarga
        </h2>
        <p class="mt-3 text-base" style="color: #718096; max-width: 420px; margin: 0.75rem auto 0;">
          Mulai gratis, upgrade kapanpun tanpa ribet
        </p>

        <!-- Toggle Billing -->
        <div v-if="hasYearlyPricing" class="mt-8 inline-flex items-center gap-3 p-1 rounded-full" style="background: #EDF2F7;">
          <button
            @click="billing = 'monthly'"
            class="px-5 py-2 rounded-full text-sm font-semibold transition-all"
            :style="billing === 'monthly' ? 'background: white; color: #1A202C; box-shadow: 0 2px 8px rgba(0,0,0,0.08);' : 'background: transparent; color: #718096;'"
          >Bulanan</button>
          <button
            @click="billing = 'yearly'"
            class="px-5 py-2 rounded-full text-sm font-semibold transition-all relative"
            :style="billing === 'yearly' ? 'background: white; color: #1A202C; box-shadow: 0 2px 8px rgba(0,0,0,0.08);' : 'background: transparent; color: #718096;'"
          >
            Tahunan
            <span v-if="yearlySavings" class="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold" style="background: #C6F6D5; color: #22543D;">-{{ yearlySavings }}%</span>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
        <div v-for="n in 2" :key="n" class="rounded-3xl p-7 bg-white border border-gray-200 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div class="h-3 bg-gray-100 rounded w-2/3 mb-6"></div>
          <div class="h-10 bg-gray-200 rounded-xl mb-6"></div>
          <div class="space-y-2">
            <div v-for="i in 5" :key="i" class="h-3 bg-gray-100 rounded w-4/5"></div>
          </div>
        </div>
      </div>

      <!-- Error fallback -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-gray-500 text-sm">Paket sedang dimuat. Silakan refresh halaman.</p>
      </div>

      <!-- Plans -->
      <div v-else :class="['grid gap-5 items-stretch', plans.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : plans.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto' : 'grid-cols-1 md:grid-cols-3']">
        <div v-for="plan in computedPlans" :key="plan.key"
          class="rounded-3xl p-7 flex flex-col relative transition-all duration-300"
          :class="plan.featured ? 'md:-mt-3 md:mb-[-12px]' : ''"
          :style="plan.featured
            ? 'background: linear-gradient(160deg, #1A365D 0%, #2B6CB0 100%); color: white; box-shadow: 0 25px 60px rgba(43,108,176,0.25);'
            : 'background: white; border: 1.5px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0,0,0,0.04);'"
        >
          <!-- Badge -->
          <div v-if="plan.badge" class="absolute top-5 right-5">
            <span class="text-[11px] px-3 py-1 rounded-full font-bold"
              :style="plan.featured ? 'background: rgba(255,255,255,0.15); color: white;' : 'background: #FEF3C7; color: #92400E;'"
            >{{ plan.badge }}</span>
          </div>

          <!-- Plan Name & Price -->
          <div class="mb-6">
            <p class="text-sm font-semibold mb-3 uppercase tracking-wide"
              :style="plan.featured ? 'color: rgba(255,255,255,0.7);' : 'color: #A0AEC0;'"
            >{{ plan.name }}</p>

            <div class="flex items-baseline gap-1">
              <span v-if="plan.comparePrice" class="text-base line-through mr-1"
                :style="plan.featured ? 'color: rgba(255,255,255,0.4);' : 'color: #CBD5E0;'"
              >{{ plan.comparePrice }}</span>
              <span class="font-extrabold" style="font-size: 2.4rem; line-height: 1;"
                :style="plan.featured ? 'color: white;' : 'color: #1A202C;'"
              >{{ plan.price }}</span>
              <span class="text-sm"
                :style="plan.featured ? 'color: rgba(255,255,255,0.6);' : 'color: #A0AEC0;'"
              >{{ plan.period }}</span>
            </div>

            <p class="text-sm mt-2" :style="plan.featured ? 'color: rgba(255,255,255,0.8);' : 'color: #718096;'">
              {{ plan.desc }}
            </p>
          </div>

          <!-- CTA -->
          <a :href="plan.ctaTarget || '/register'"
            class="block w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 mb-6 text-center"
            :style="plan.featured
              ? 'background: white; color: #2B6CB0; box-shadow: 0 4px 12px rgba(255,255,255,0.2);'
              : 'background: #EBF8FF; color: #2B6CB0; border: 1.5px solid #BEE3F8;'"
            :class="plan.featured ? 'hover:opacity-90' : 'hover:bg-blue-100'"
          >
            {{ plan.cta }}
          </a>

          <!-- Features -->
          <div class="flex-1">
            <p class="text-xs font-semibold uppercase tracking-wider mb-3"
              :style="plan.featured ? 'color: rgba(255,255,255,0.5);' : 'color: #A0AEC0;'"
            >Termasuk:</p>
            <ul class="space-y-2.5">
              <li v-for="item in plan.features" :key="item" class="flex items-start gap-2.5 text-sm">
                <svg class="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="8" :fill="plan.featured ? 'rgba(255,255,255,0.15)' : '#F0FFF4'"/>
                  <path d="M5 8l2 2 4-4" :stroke="plan.featured ? 'white' : '#38A169'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span :style="plan.featured ? 'color: rgba(255,255,255,0.9);' : 'color: #4A5568;'">{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Footer note -->
      <p class="text-center text-sm mt-10" style="color: #A0AEC0;">
        Semua paket termasuk enkripsi end-to-end dan dukungan prioritas.
      </p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const billing = ref('monthly')
const loading = ref(true)
const error = ref(false)
const plans = ref([])

function formatIDR(amount) {
  if (!amount || amount === 0) return 'Gratis'
  if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}jt`
  if (amount >= 1000) return `Rp ${Math.round(amount / 1000)}rb`
  return `Rp ${amount}`
}

function formatStorageBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes >= 1099511627776) return Math.round(bytes / 1099511627776) + ' TB'
  if (bytes >= 1073741824) return Math.round(bytes / 1073741824) + ' GB'
  return Math.round(bytes / 1048576) + ' MB'
}

const hasYearlyPricing = computed(() => plans.value.some(p => p.price_yearly_idr > 0))

const yearlySavings = computed(() => {
  const paid = plans.value.find(p => p.price_monthly_idr > 0 && p.price_yearly_idr > 0)
  if (!paid) return 0
  const monthlyAnnual = paid.price_monthly_idr * 12
  const yearly = paid.price_yearly_idr
  if (monthlyAnnual <= 0) return 0
  return Math.round(((monthlyAnnual - yearly) / monthlyAnnual) * 100)
})

const computedPlans = computed(() => {
  return plans.value.map((p, idx) => {
    const isMonthly = billing.value === 'monthly'
    const price = isMonthly ? p.price_monthly_idr : p.price_yearly_idr
    const comparePrice = isMonthly ? p.compare_price_monthly_idr : p.compare_price_yearly_idr
    const isFree = price === 0

    return {
      key: p.key,
      name: p.label,
      price: isFree ? 'Gratis' : formatIDR(price),
      comparePrice: comparePrice > price ? formatIDR(comparePrice) : null,
      period: isFree ? '/ selamanya' : (isMonthly ? '/ bulan' : '/ tahun'),
      desc: p.description || '',
      badge: p.badge || null,
      featured: p.featured || false,
      cta: p.cta_label || (isFree ? 'Mulai Gratis' : 'Pilih Paket'),
      ctaTarget: p.cta_target || '/register',
      features: p.features || []
    }
  })
})

async function fetchPlans() {
  loading.value = true
  error.value = false
  try {
    const { data, error: err } = await supabase
      .from('kinora_subscription_settings')
      .select('key, label, value')
      .like('key', 'plans.%')

    if (err) throw err

    // Transform settings into plan objects
    const planList = (data || []).map(row => {
      const val = row.value || {}
      // Build features with storage info prepended
      let features = [...(val.features || [])]
      if (val.storage_label || val.storage_bytes) {
        const storageText = val.storage_unlimited ? 'Penyimpanan tidak terbatas' : (val.storage_label || formatStorageBytes(val.storage_bytes))
        if (!features.some(f => f.toLowerCase().includes('storage') || f.toLowerCase().includes('penyimpanan'))) {
          features = [storageText + ' penyimpanan', ...features]
        }
      }
      if (val.member_limit) {
        const memberText = val.member_limit === -1 ? 'Anggota tidak terbatas' : `${val.member_limit} anggota keluarga`
        if (!features.some(f => f.toLowerCase().includes('anggota'))) {
          features = [memberText, ...features]
        }
      }

      return {
        key: row.key,
        label: row.label || row.key.replace('plans.', ''),
        price_monthly_idr: val.price_monthly_idr || 0,
        price_yearly_idr: val.price_yearly_idr || 0,
        compare_price_monthly_idr: val.compare_price_monthly_idr || 0,
        compare_price_yearly_idr: val.compare_price_yearly_idr || 0,
        features,
        description: val.description || '',
        badge: val.badge || null,
        featured: val.featured || false,
        cta_label: val.cta_label || null,
        cta_target: val.cta_target || null,
        display_order: val.display_order ?? 99,
        member_limit: val.member_limit,
        storage_label: val.storage_label,
      }
    })

    // Sort: free first, then by display_order, then by price
    planList.sort((a, b) => {
      if (a.price_monthly_idr === 0 && b.price_monthly_idr > 0) return -1
      if (a.price_monthly_idr > 0 && b.price_monthly_idr === 0) return 1
      return (a.display_order || 99) - (b.display_order || 99)
    })

    // If only one paid plan, mark it featured
    const paidPlans = planList.filter(p => p.price_monthly_idr > 0)
    if (paidPlans.length === 1 && !paidPlans[0].featured) {
      paidPlans[0].featured = true
    }

    plans.value = planList
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchPlans)
</script>
