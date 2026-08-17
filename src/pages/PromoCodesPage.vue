<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Promo Codes</h1>
      <button @click="openEditor(null)" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Create Promo Code</button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div class="bg-white rounded-xl border border-gray-200 p-3 text-center">
        <p class="text-lg font-bold text-gray-900">{{ promos.length }}</p>
        <p class="text-[10px] text-gray-500">Total Promo</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-3 text-center">
        <p class="text-lg font-bold text-green-700">{{ promos.filter(p => computeStatus(p) === 'active').length }}</p>
        <p class="text-[10px] text-gray-500">Active</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-3 text-center">
        <p class="text-lg font-bold text-blue-700">{{ promos.filter(p => computeStatus(p) === 'scheduled').length }}</p>
        <p class="text-[10px] text-gray-500">Scheduled</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-3 text-center">
        <p class="text-lg font-bold text-gray-400">{{ promos.filter(p => computeStatus(p) === 'expired').length }}</p>
        <p class="text-[10px] text-gray-500">Expired</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-3 text-center">
        <p class="text-lg font-bold text-amber-700">{{ totalRedemptions }}</p>
        <p class="text-[10px] text-gray-500">Total Redemptions</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <input v-model="search" type="text" placeholder="Search code..." class="px-3 py-2 border border-gray-200 rounded-lg text-sm w-48 outline-none" />
      <select v-model="filterType" class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
        <option value="">All Types</option>
        <option value="trial">Trial</option>
        <option value="access_pass">Access Pass</option>
        <option value="discount">Discount</option>
        <option value="family_invite">Family Invite</option>
      </select>
      <select v-model="filterStatus" class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="scheduled">Scheduled</option>
        <option value="expired">Expired</option>
        <option value="disabled">Disabled</option>
        <option value="draft">Draft</option>
      </select>
    </div>

    <!-- Table -->
    <div v-if="loading" class="text-center py-8 text-gray-400 text-sm">Memuat...</div>
    <div v-else-if="filteredPromos.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <p class="text-gray-500">Belum ada promo code.</p>
    </div>
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-gray-100 text-left">
            <th class="px-4 py-3 font-medium text-gray-500 text-xs">Code</th>
            <th class="px-4 py-3 font-medium text-gray-500 text-xs">Type</th>
            <th class="px-4 py-3 font-medium text-gray-500 text-xs">Benefit</th>
            <th class="px-4 py-3 font-medium text-gray-500 text-xs">Redemptions</th>
            <th class="px-4 py-3 font-medium text-gray-500 text-xs">Validity</th>
            <th class="px-4 py-3 font-medium text-gray-500 text-xs">Status</th>
            <th class="px-4 py-3 font-medium text-gray-500 text-xs">Actions</th>
          </tr></thead>
          <tbody>
            <tr v-for="p in filteredPromos" :key="p.id" class="border-b border-gray-50 hover:bg-gray-50/50">
              <td class="px-4 py-3 font-mono font-medium text-gray-900">{{ p.code }}</td>
              <td class="px-4 py-3"><span class="px-2 py-0.5 text-[10px] rounded-full font-medium" :class="typeClass(promoType(p))">{{ typeLabel(promoType(p)) }}</span></td>
              <td class="px-4 py-3 text-xs text-gray-600">{{ benefitSummary(p) }}</td>
              <td class="px-4 py-3 text-xs text-gray-600">{{ p.redemption_count ?? p.total_redemptions ?? 0 }} / {{ p.max_redemptions || 'Unlimited' }}</td>
              <td class="px-4 py-3 text-xs text-gray-500">{{ validityLabel(p) }}</td>
              <td class="px-4 py-3"><span class="px-2 py-0.5 text-[10px] rounded-full font-medium" :class="statusClass(computeStatus(p))">{{ computeStatus(p) }}</span></td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button @click="openEditor(p)" class="text-xs text-blue-600 hover:underline">Edit</button>
                  <button @click="duplicatePromo(p)" class="text-xs text-purple-600 hover:underline">Dup</button>
                  <button @click="toggleActive(p)" class="text-xs" :class="p.is_active ? 'text-orange-600' : 'text-green-600'">{{ p.is_active ? 'Off' : 'On' }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Editor Drawer -->
    <div v-if="showEditor" class="fixed inset-0 z-50 flex justify-end">
      <div @click="confirmClose" class="absolute inset-0 bg-black/40"></div>
      <div class="relative bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl">
        <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h3 class="font-bold text-gray-900">{{ editing.id ? 'Edit Promo' : 'Create Promo Code' }}</h3>
          <button @click="confirmClose" class="p-2 hover:bg-gray-100 rounded-lg text-gray-500">✕</button>
        </div>
        <div class="p-6 space-y-6">
          <div v-if="editorError" class="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{{ editorError }}</div>

          <!-- Basic Information -->
          <section class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-400 uppercase">Basic Information</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Code *</label>
                <div class="flex gap-2">
                  <input v-model="editing.code" type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase outline-none" placeholder="KINORA30" @input="editing.code = editing.code.toUpperCase().trim()" />
                  <button @click="generateCode" class="px-2 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50" title="Generate">🎲</button>
                </div>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Promo Type *</label>
                <select v-model="editing.type" @change="editing.promo_type = editing.type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                  <option value="trial">Trial</option>
                  <option value="access_pass">Access Pass</option>
                  <option value="discount">Discount</option>
                  <option value="family_invite">Family Invite</option>
                </select>
              </div>
            </div>
            <div><label class="block text-xs text-gray-500 mb-1">Internal Name</label><input v-model="editing.internal_name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="August Campaign" /></div>
            <div><label class="block text-xs text-gray-500 mb-1">Customer Description</label><input v-model="editing.customer_description" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Nikmati Family Plus gratis 14 hari" /></div>
            <div><label class="block text-xs text-gray-500 mb-1">Internal Notes</label><textarea v-model="editing.internal_notes" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Campaign Instagram Agustus 2026"></textarea></div>
          </section>

          <!-- TRIAL Benefit -->
          <section v-if="editing.type === 'trial'" class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-400 uppercase">Trial Benefit</h4>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-xs text-gray-500 mb-1">Trial Days *</label><input v-model.number="editing.trial_days" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="14" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Plan</label><input v-model="editing.trial_plan" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Family Plus" value="family_plus" /></div>
            </div>
            <div><label class="block text-xs text-gray-500 mb-1">Bonus Storage</label>
              <div class="flex gap-2"><input v-model.number="editing._bonus_storage_val" type="number" min="0" class="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="0" />
                <select v-model="editing._bonus_storage_unit" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"><option value="GB">GB</option><option value="MB">MB</option><option value="TB">TB</option></select>
              </div>
            </div>
          </section>

          <!-- ACCESS PASS Benefit -->
          <section v-if="editing.type === 'access_pass'" class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-400 uppercase">Access Pass Benefit</h4>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-xs text-gray-500 mb-1">Plan</label><input v-model="editing.access_plan" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Family Plus" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Duration Type</label>
                <select v-model="editing.access_duration_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"><option value="days">Days</option><option value="months">Months</option><option value="lifetime">Lifetime</option></select>
              </div>
            </div>
            <div v-if="editing.access_duration_type !== 'lifetime'"><label class="block text-xs text-gray-500 mb-1">Duration Value *</label><input v-model.number="editing.access_duration_value" type="number" min="1" class="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="30" /></div>
            <div><label class="block text-xs text-gray-500 mb-1">Bonus Storage</label>
              <div class="flex gap-2"><input v-model.number="editing._bonus_storage_val" type="number" min="0" class="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="0" />
                <select v-model="editing._bonus_storage_unit" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"><option value="GB">GB</option><option value="MB">MB</option><option value="TB">TB</option></select>
              </div>
            </div>
          </section>

          <!-- DISCOUNT Benefit -->
          <section v-if="editing.type === 'discount'" class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-400 uppercase">Discount Configuration</h4>
            <div><label class="block text-xs text-gray-500 mb-1">Discount Type</label>
              <select v-model="editing.discount_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option></select>
            </div>
            <div v-if="editing.discount_type === 'percentage'" class="grid grid-cols-2 gap-4">
              <div><label class="block text-xs text-gray-500 mb-1">Discount % *</label><input v-model.number="editing.discount_percentage" type="number" min="1" max="100" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="30" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Max Discount (IDR)</label><input v-model.number="editing.discount_max_amount" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="50000" /></div>
            </div>
            <div v-if="editing.discount_type === 'fixed'"><label class="block text-xs text-gray-500 mb-1">Discount Amount (IDR) *</label><input v-model.number="editing.discount_fixed_amount" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="20000" /></div>
            <div><label class="block text-xs text-gray-500 mb-1">Minimum Purchase (IDR)</label><input v-model.number="editing.discount_min_purchase" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="0" /></div>
            <div><label class="block text-xs text-gray-500 mb-1">Discount Duration</label>
              <select v-model="editing.discount_duration" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"><option value="first_payment">First Payment Only</option><option value="x_cycles">X Billing Cycles</option><option value="forever">Forever</option></select>
            </div>
            <div v-if="editing.discount_duration === 'x_cycles'"><label class="block text-xs text-gray-500 mb-1">Number of Cycles</label><input v-model.number="editing.discount_cycles" type="number" min="1" class="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="3" /></div>
          </section>

          <!-- FAMILY INVITE -->
          <section v-if="editing.type === 'family_invite'" class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-400 uppercase">Family Invite</h4>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-xs text-gray-500 mb-1">Invitee Benefit</label>
                <select v-model="editing.invitee_benefit_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"><option value="plus_days">Family Plus Days</option><option value="trial_days">Trial Days</option><option value="discount">Discount</option><option value="storage">Bonus Storage</option></select>
              </div>
              <div><label class="block text-xs text-gray-500 mb-1">Value</label><input v-model.number="editing.invitee_benefit_value" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="7" /></div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-xs text-gray-500 mb-1">Inviter Benefit</label>
                <select v-model="editing.inviter_benefit_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"><option value="none">No Reward</option><option value="plus_days">Family Plus Days</option><option value="discount">Discount</option><option value="storage">Bonus Storage</option></select>
              </div>
              <div v-if="editing.inviter_benefit_type !== 'none'"><label class="block text-xs text-gray-500 mb-1">Value</label><input v-model.number="editing.inviter_benefit_value" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="7" /></div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="editing.invite_require_new_user" class="rounded" /> Require New User</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="editing.invite_require_paid" class="rounded" /> Require Paid Sub</label>
            </div>
            <div><label class="block text-xs text-gray-500 mb-1">Max Successful Invites</label><input v-model.number="editing.invite_max_successful" type="number" min="0" class="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="10" /></div>
          </section>

          <!-- Redemption -->
          <section class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-400 uppercase">Redemption</h4>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-xs text-gray-500 mb-1">Limit</label>
                <select v-model="editing.redemption_limit_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"><option value="unlimited">Unlimited</option><option value="limited">Limited</option></select>
              </div>
              <div v-if="editing.redemption_limit_type === 'limited'"><label class="block text-xs text-gray-500 mb-1">Max Redemptions</label><input v-model.number="editing.max_redemptions" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="500" /></div>
            </div>
            <div><label class="block text-xs text-gray-500 mb-1">Per User/Family Rule</label>
              <select v-model="editing.redemption_rule" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"><option value="once_per_family">Once per Family</option><option value="once_per_user">Once per User</option><option value="unlimited_per_user">Unlimited per User</option><option value="custom_per_user">Custom Limit per User</option></select>
            </div>
            <div v-if="editing.redemption_rule === 'custom_per_user'"><label class="block text-xs text-gray-500 mb-1">Max per User</label><input v-model.number="editing.max_per_user" type="number" min="1" class="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          </section>

          <!-- Validity -->
          <section class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-400 uppercase">Validity</h4>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-xs text-gray-500 mb-1">Starts At</label><input v-model="editing.starts_at" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Expires At</label><input v-model="editing.expires_at" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            </div>
          </section>

          <!-- Eligibility -->
          <section class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-400 uppercase">Eligibility</h4>
            <div><label class="block text-xs text-gray-500 mb-1">User Eligibility</label>
              <select v-model="editing.user_eligibility" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"><option value="all">All Users</option><option value="new_users">New Users Only</option><option value="existing_users">Existing Users</option><option value="free_users">Free Users Only</option><option value="plus_users">Family Plus Users Only</option></select>
            </div>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="editing.allow_stacking" class="rounded" /> Allow promo stacking</label>
          </section>

          <!-- Status -->
          <section class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-400 uppercase">Status</h4>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="editing.is_active" class="rounded" /> Active</label>
          </section>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button @click="confirmClose" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button v-if="!editing.id" @click="savePromo('draft')" :disabled="saving" class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Save Draft</button>
            <button @click="savePromo(editing.is_active ? 'active' : 'draft')" :disabled="saving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{{ saving ? 'Saving...' : (editing.id ? 'Save Changes' : 'Create Promo') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase, envInfo } from '../lib/supabase.js'

const promos = ref([])
const loading = ref(true)
const showEditor = ref(false)
const editing = ref({})
const saving = ref(false)
const editorError = ref('')
const search = ref('')
const filterType = ref('')
const filterStatus = ref('')
const dirty = ref(false)

const totalRedemptions = computed(() => promos.value.reduce((sum, p) => sum + (p.redemption_count ?? p.total_redemptions ?? 0), 0))

const filteredPromos = computed(() => {
  let list = promos.value
  if (search.value) list = list.filter(p => p.code.toLowerCase().includes(search.value.toLowerCase()))
  if (filterType.value) list = list.filter(p => promoType(p) === filterType.value)
  if (filterStatus.value) list = list.filter(p => computeStatus(p) === filterStatus.value)
  return list
})

function computeStatus(p) {
  if (!p.is_active) return 'disabled'
  if (p.status === 'draft') return 'draft'
  if (p.status === 'archived') return 'archived'
  const now = new Date()
  if (p.starts_at && new Date(p.starts_at) > now) return 'scheduled'
  if (p.expires_at && new Date(p.expires_at) < now) return 'expired'
  if (p.max_redemptions && (p.redemption_count ?? p.total_redemptions ?? 0) >= p.max_redemptions) return 'limit_reached'
  return 'active'
}

function promoType(p) { return p.type || p.promo_type }
function typeLabel(t) { return { trial: 'Trial', access_pass: 'Access Pass', discount: 'Discount', family_invite: 'Family Invite' }[t] || t }
function typeClass(t) { return { trial: 'bg-green-100 text-green-700', access_pass: 'bg-blue-100 text-blue-700', discount: 'bg-amber-100 text-amber-700', family_invite: 'bg-purple-100 text-purple-700' }[t] || 'bg-gray-100 text-gray-500' }
function statusClass(s) { return { active: 'bg-green-100 text-green-700', scheduled: 'bg-blue-100 text-blue-700', expired: 'bg-gray-100 text-gray-500', disabled: 'bg-gray-100 text-gray-500', draft: 'bg-amber-100 text-amber-700', limit_reached: 'bg-red-100 text-red-600', archived: 'bg-gray-100 text-gray-400' }[s] || 'bg-gray-100 text-gray-500' }

function benefitSummary(p) {
  if (p.promo_type === 'trial') return `${p.trial_days || 0} Days ${p.trial_plan || 'Family Plus'}`
  if (p.promo_type === 'access_pass') return `${p.access_duration_value || '∞'} ${p.access_duration_type || 'days'} ${p.access_plan || 'Family Plus'}`
  if (p.promo_type === 'discount') return p.discount_type === 'percentage' ? `${p.discount_percentage}%` : `Rp${Number(p.discount_fixed_amount || 0).toLocaleString('id-ID')}`
  if (p.promo_type === 'family_invite') return `+${p.invitee_benefit_value || 0} days`
  return '—'
}

function validityLabel(p) {
  if (!p.starts_at && !p.expires_at) return 'No expiry'
  const parts = []
  if (p.starts_at) parts.push(new Date(p.starts_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }))
  if (p.expires_at) parts.push(new Date(p.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }))
  return parts.join(' – ')
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'KNR'
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]
  editing.value.code = code
}

function openEditor(promo) {
  if (promo) {
    const type = promoType(promo)
    editing.value = { ...promo, promo_type: type, type, discount_percentage: promo.discount_percent ?? promo.discount_percentage ?? 0, _bonus_storage_val: bytesToUnit(promo.bonus_storage_bytes || promo.trial_bonus_storage_bytes || promo.access_bonus_storage_bytes || 0), _bonus_storage_unit: 'GB' }
  } else {
    editing.value = { promo_type: 'trial', type: 'trial', is_active: true, one_time_per_user: true, redemption_limit_type: 'unlimited', redemption_rule: 'once_per_user', user_eligibility: 'all', discount_type: 'percentage', discount_duration: 'first_payment', access_duration_type: 'days', invitee_benefit_type: 'plus_days', inviter_benefit_type: 'none', _bonus_storage_val: 0, _bonus_storage_unit: 'GB', trial_plan: 'family_plus', access_plan: 'family_plus' }
  }
  showEditor.value = true
  dirty.value = false
  editorError.value = ''
}

function confirmClose() {
  if (dirty.value && !confirm('You have unsaved changes. Leave?')) return
  showEditor.value = false
}

async function savePromo(targetStatus) {
  editorError.value = ''

  const normalizedType = (editing.value.type || editing.value.promo_type || 'trial')
  const code = String(editing.value.code || '').trim().toUpperCase()
  if (!code) { editorError.value = 'Code is required'; return }
  if (!normalizedType) { editorError.value = 'Promo Type is required'; return }
  if (normalizedType === 'trial' && (!editing.value.trial_days || Number(editing.value.trial_days) < 1)) { editorError.value = 'Trial Days must be > 0'; return }
  if (normalizedType === 'discount' && (Number(editing.value.discount_percent ?? editing.value.discount_percentage ?? 0) <= 0 || Number(editing.value.discount_percent ?? editing.value.discount_percentage ?? 0) > 100)) { editorError.value = 'Discount % must be 1–100'; return }

  saving.value = true
  const storageBytes = unitToBytes(editing.value._bonus_storage_val || 0, editing.value._bonus_storage_unit || 'GB')

  const payload = { ...editing.value }
  delete payload._bonus_storage_val
  delete payload._bonus_storage_unit

  payload.code = code
  payload.type = normalizedType
  payload.promo_type = normalizedType
  payload.discount_percent = Number(payload.discount_percent ?? payload.discount_percentage ?? 0)
  payload.bonus_storage_bytes = Number(storageBytes || 0)
  payload.notes = payload.notes ?? payload.internal_notes ?? null
  payload.one_time_per_user = payload.one_time_per_user ?? true
  payload.is_active = !!payload.is_active
  payload.max_redemptions = payload.max_redemptions === '' || payload.max_redemptions === undefined || payload.max_redemptions === null ? null : Number(payload.max_redemptions)
  payload.expires_at = payload.expires_at ? new Date(payload.expires_at).toISOString() : null

  if (payload.type === 'trial') payload.trial_days = Number(payload.trial_days || 0)
  if (payload.type === 'access_pass') payload.access_bonus_storage_bytes = payload.bonus_storage_bytes
  if (payload.type === 'discount' && !payload.discount_percent) payload.discount_percent = 0

  payload.status = targetStatus
  payload.updated_at = new Date().toISOString()
  if (!payload.starts_at) payload.starts_at = null

  console.info('[PROMO][ENV]', { environment: envInfo.env })
  console.info('[PROMO][SUPABASE]', { project: envInfo.projectRef })
  console.info('[PROMO][CREATE]', { table: 'kinora_promo_codes' })

  let result
  if (payload.id) {
    const { id, created_at, created_by, total_redemptions, redemption_count, ...rest } = payload
    result = await supabase.from('kinora_promo_codes').update(rest).eq('id', id)
  } else {
    const { data: { user } } = await supabase.auth.getUser()
    payload.created_by = user?.id
    delete payload.id
    result = await supabase.from('kinora_promo_codes').insert(payload)
  }

  if (result.error) {
    console.error('[PROMO][CREATE][ERROR]', result.error)
    const msg = result.error.message || ''
    editorError.value = msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')
      ? 'Promo code already exists'
      : 'Promo Code gagal dibuat. Konfigurasi database Promo Code belum tersedia.'
    saving.value = false
    return
  }

  showEditor.value = false
  saving.value = false
  loadPromos()
}

async function toggleActive(p) {
  await supabase.from('kinora_promo_codes').update({ is_active: !p.is_active, updated_at: new Date().toISOString() }).eq('id', p.id)
  loadPromos()
}

function duplicatePromo(p) {
  const dup = { ...p }
  delete dup.id
  delete dup.created_at
  delete dup.created_by
  dup.code = ''
  dup.total_redemptions = 0
  dup.status = 'draft'
  dup.is_active = false
  dup._bonus_storage_val = bytesToUnit(p.trial_bonus_storage_bytes || p.access_bonus_storage_bytes || 0)
  dup._bonus_storage_unit = 'GB'
  editing.value = dup
  showEditor.value = true
}

function unitToBytes(val, unit) {
  if (!val) return 0
  const map = { MB: 1024 * 1024, GB: 1024 * 1024 * 1024, TB: 1024 * 1024 * 1024 * 1024 }
  return Math.round(val * (map[unit] || map.GB))
}

function bytesToUnit(bytes) {
  if (!bytes) return 0
  return Math.round(bytes / (1024 * 1024 * 1024) * 10) / 10
}

async function loadPromos() {
  loading.value = true
  console.info('[PROMO][ENV]', { environment: envInfo.env })
  console.info('[PROMO][SUPABASE]', { project: envInfo.projectRef })
  const { data, error } = await supabase.from('kinora_promo_codes').select('*').order('created_at', { ascending: false })
  if (error) console.error('[PROMO][LOAD][ERROR]', error)
  promos.value = data || []
  loading.value = false
}

onMounted(loadPromos)
</script>
