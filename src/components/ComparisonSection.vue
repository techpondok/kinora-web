<template>
  <section class="py-20 px-4 sm:px-6 bg-white">
    <div class="max-w-6xl mx-auto">
      <!-- Header: Desktop -->
      <div class="hidden md:block text-center mb-14">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900" style="font-family: 'Bricolage Grotesque', sans-serif">
          Why Install Multiple Apps...
        </h2>
        <p class="text-xl sm:text-2xl font-bold text-amber-600 mt-1">...when Kinora already includes everything?</p>
        <p class="mt-4 text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
          Most families download different apps for safety, parental controls, finance, organization, memories, and communication. With Kinora, everything works together in one secure platform.
        </p>
      </div>

      <!-- Header: Mobile -->
      <div class="md:hidden text-center mb-10">
        <h2 class="text-2xl font-bold text-gray-900" style="font-family: 'Bricolage Grotesque', sans-serif">
          One App for Your Family
        </h2>
        <p class="mt-2 text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
          Safety, parenting, finance, memories, and family organization — all inside Kinora.
        </p>
      </div>

      <!-- Comparison Table Desktop -->
      <div class="hidden lg:block rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left px-5 py-4 font-semibold text-gray-700 w-48 bg-white sticky left-0 z-10">Family Needs</th>
                <th class="px-4 py-4 text-center bg-amber-50 border-x border-amber-100 min-w-[120px]">
                  <div class="flex flex-col items-center gap-1">
                    <span class="text-[10px] px-2 py-0.5 bg-amber-500 text-white rounded-full font-bold">BEST VALUE</span>
                    <span class="font-bold text-amber-800">Kinora</span>
                  </div>
                </th>
                <th v-for="col in columns" :key="col" class="px-3 py-4 text-center font-medium text-gray-500 min-w-[100px] text-xs">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in rows" :key="row.feature" class="border-t border-gray-50 hover:bg-gray-50/50 transition" :style="{ animationDelay: idx * 30 + 'ms' }">
                <td class="px-5 py-3 text-gray-800 font-medium bg-white sticky left-0 z-10">{{ row.feature }}</td>
                <td class="px-4 py-3 text-center bg-amber-50/40 border-x border-amber-50">
                  <span class="text-green-600 font-bold text-base">✓</span>
                </td>
                <td v-for="(val, i) in row.others" :key="i" class="px-3 py-3 text-center">
                  <span v-if="val === 'yes'" class="text-green-600">✓</span>
                  <span v-else-if="val === 'limited'" class="text-amber-500 text-xs">◐</span>
                  <span v-else class="text-gray-300">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tablet Cards (md to lg) -->
      <div class="hidden md:grid lg:hidden grid-cols-2 gap-4">
        <div v-for="row in rows" :key="row.feature" class="bg-white rounded-2xl border border-gray-100 p-5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-gray-900">{{ row.feature }}</span>
            <span class="text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded-full text-xs">✓ Kinora</span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">{{ row.description }}</p>
        </div>
      </div>

      <!-- Mobile Cards (below md) -->
      <div class="md:hidden space-y-3">
        <div v-for="row in visibleMobileRows" :key="row.feature" class="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-gray-900 leading-tight">{{ row.feature }}</h3>
              <p class="text-sm text-gray-500 mt-1 leading-relaxed">{{ row.description }}</p>
            </div>
            <span class="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-100 rounded-lg text-xs font-semibold text-green-700">
              ✓ Included
            </span>
          </div>
          <!-- Expandable comparison detail -->
          <div v-if="expandedFeature === row.feature" class="mt-3 pt-3 border-t border-gray-100">
            <p class="text-xs text-gray-400 mb-2 font-medium">Comparison with other apps:</p>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="(val, i) in row.others" :key="i" class="text-xs px-2 py-0.5 rounded-md"
                :class="val === 'yes' ? 'bg-green-50 text-green-700' : val === 'limited' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400'">
                {{ columns[i] }}: {{ val === 'yes' ? '✓' : val === 'limited' ? '◐' : '—' }}
              </span>
            </div>
          </div>
          <button
            v-if="row.others.some(v => v === 'yes' || v === 'limited')"
            @click="expandedFeature = expandedFeature === row.feature ? null : row.feature"
            class="mt-2 text-xs text-amber-600 font-medium hover:text-amber-700 transition"
          >
            {{ expandedFeature === row.feature ? 'Hide comparison' : 'See comparison' }}
          </button>
        </div>

        <!-- Show All / Show Less -->
        <div v-if="!showAllMobile && rows.length > mobileLimit" class="pt-2 text-center">
          <button @click="showAllMobile = true" class="px-5 py-2.5 text-sm font-medium text-amber-600 border border-amber-200 rounded-full hover:bg-amber-50 transition">
            See All {{ rows.length }} Features
          </button>
        </div>
        <div v-else-if="showAllMobile && rows.length > mobileLimit" class="pt-2 text-center">
          <button @click="showAllMobile = false" class="px-5 py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-full hover:bg-gray-50 transition">
            Show Less
          </button>
        </div>
      </div>

      <!-- Legend (desktop/tablet only) -->
      <div class="hidden md:flex justify-center gap-6 mt-6 text-xs text-gray-400">
        <span><span class="text-green-600">✓</span> Included</span>
        <span><span class="text-amber-500">◐</span> Limited</span>
        <span><span class="text-gray-300">—</span> Usually unavailable</span>
      </div>

      <!-- Value Highlight Card -->
      <div class="mt-14 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-100 p-8 sm:p-12">
        <h3 class="text-xl sm:text-2xl font-bold text-gray-900 text-center">One Subscription. One Family. Everything Included.</h3>
        <p class="text-center text-gray-600 text-sm mt-3 mb-8">Instead of paying for multiple apps every month:</p>
        <div class="flex flex-wrap justify-center gap-3 mb-8">
          <span v-for="app in replacedApps" :key="app" class="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 shadow-sm">{{ app }}</span>
        </div>
        <p class="text-center text-gray-900 font-semibold">You only need <span class="text-amber-600">one Kinora Family subscription</span>.</p>
        <div class="mt-4 flex justify-center">
          <span class="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full text-sm font-semibold shadow-md">🏆 One payment for your whole family</span>
        </div>
      </div>

      <!-- Pricing Comparison -->
      <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-2xl border border-gray-200 p-6">
          <h4 class="font-bold text-gray-900 mb-4">Typical Services</h4>
          <ul class="space-y-2 text-sm text-gray-600">
            <li class="flex items-start gap-2"><span class="text-red-400 mt-0.5">✗</span> Multiple subscriptions</li>
            <li class="flex items-start gap-2"><span class="text-red-400 mt-0.5">✗</span> Pay separately for each app</li>
            <li class="flex items-start gap-2"><span class="text-red-400 mt-0.5">✗</span> Different accounts & logins</li>
            <li class="flex items-start gap-2"><span class="text-red-400 mt-0.5">✗</span> Features don't work together</li>
            <li class="flex items-start gap-2"><span class="text-red-400 mt-0.5">✗</span> Higher total monthly cost</li>
          </ul>
        </div>
        <div class="bg-amber-50 rounded-2xl border-2 border-amber-300 p-6 relative">
          <span class="absolute -top-3 left-6 px-3 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">RECOMMENDED</span>
          <h4 class="font-bold text-gray-900 mb-4">Kinora</h4>
          <ul class="space-y-2 text-sm text-gray-700">
            <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">✓</span> One subscription</li>
            <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">✓</span> Covers your entire family</li>
            <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">✓</span> One secure account</li>
            <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">✓</span> Everything connected</li>
            <li class="flex items-start gap-2"><span class="text-green-600 mt-0.5">✓</span> Better overall value</li>
          </ul>
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-14 text-center">
        <p class="text-gray-600 text-sm mb-4">Stop paying for multiple apps. Everything your family needs is already included.</p>
        <div class="flex flex-wrap justify-center gap-3">
          <a href="/register" class="px-6 py-3 bg-amber-500 text-white rounded-full font-semibold text-sm hover:bg-amber-600 transition shadow-md">Start Free Trial</a>
          <a href="#pricing" class="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-medium text-sm hover:border-amber-300 transition">View Pricing</a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

const columns = ['Location Apps', 'Parental Control', 'Family Organizer', 'Finance Apps', 'Parenting Apps', 'Memory Apps']

const rows = [
  { feature: 'Live Location', description: 'Know where your family is — no separate location-sharing app needed.', others: ['yes', 'limited', 'no', 'no', 'no', 'no'] },
  { feature: 'Safe Zones', description: 'Get alerts when family members arrive or leave key places.', others: ['yes', 'limited', 'no', 'no', 'no', 'no'] },
  { feature: 'SOS Emergency', description: 'One-tap emergency alert sent to your whole family instantly.', others: ['limited', 'no', 'no', 'no', 'no', 'no'] },
  { feature: 'Screen Time', description: 'Manage kids\' screen time without a separate parental control app.', others: ['no', 'yes', 'no', 'no', 'no', 'no'] },
  { feature: 'App Blocking', description: 'Block distracting apps during study or bedtime hours.', others: ['no', 'yes', 'no', 'no', 'no', 'no'] },
  { feature: 'Website Filtering', description: 'Keep kids safe online with built-in content filtering.', others: ['no', 'yes', 'no', 'no', 'no', 'no'] },
  { feature: 'Family Finance', description: 'Track family spending and budgets in one place.', others: ['no', 'no', 'limited', 'yes', 'no', 'no'] },
  { feature: 'Budget Planning', description: 'Plan monthly budgets without a separate finance app.', others: ['no', 'no', 'no', 'yes', 'no', 'no'] },
  { feature: 'OCR Receipt Scan', description: 'Scan receipts to automatically track expenses.', others: ['no', 'no', 'no', 'yes', 'no', 'no'] },
  { feature: 'Family Chat', description: 'Stay connected with your family in a private space.', others: ['no', 'no', 'limited', 'no', 'no', 'no'] },
  { feature: 'Shared Calendar', description: 'Coordinate family schedules in one shared calendar.', others: ['no', 'no', 'yes', 'no', 'no', 'no'] },
  { feature: 'Shopping List', description: 'Share grocery and shopping lists with the whole family.', others: ['no', 'no', 'yes', 'no', 'no', 'no'] },
  { feature: 'Parenting Timeline', description: 'Record your child\'s milestones and development.', others: ['no', 'no', 'no', 'no', 'yes', 'no'] },
  { feature: 'Growth Tracking', description: 'Monitor height, weight, and growth over time.', others: ['no', 'no', 'no', 'no', 'yes', 'no'] },
  { feature: 'Vaccine Reminder', description: 'Never miss a vaccination schedule again.', others: ['no', 'no', 'no', 'no', 'yes', 'no'] },
  { feature: 'Family Memories', description: 'Store and relive precious family moments together.', others: ['no', 'no', 'no', 'no', 'no', 'yes'] },
  { feature: 'Travel Journal', description: 'Document family trips and adventures.', others: ['no', 'no', 'no', 'no', 'no', 'limited'] },
  { feature: 'Family Consultant', description: 'Access professional family advice when you need it.', others: ['no', 'no', 'no', 'no', 'no', 'no'] },
  { feature: 'Family Vault', description: 'Securely store important family documents.', others: ['no', 'no', 'no', 'no', 'no', 'no'] },
  { feature: 'Pet Management', description: 'Track pet health, schedules, and care routines.', others: ['no', 'no', 'no', 'no', 'no', 'no'] },
]

const replacedApps = [
  '📍 Location App',
  '🛡️ Parental Control App',
  '💰 Finance App',
  '📅 Family Organizer App',
  '📸 Family Memories App',
  '👶 Parenting App',
  '❤️ Health App',
]

// Mobile: show first 6 by default, prioritized by value
const mobileLimit = 6
const showAllMobile = ref(false)
const expandedFeature = ref(null)

const visibleMobileRows = computed(() => {
  return showAllMobile.value ? rows : rows.slice(0, mobileLimit)
})
</script>
