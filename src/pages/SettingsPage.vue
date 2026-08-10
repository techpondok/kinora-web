<template>
  <div class="min-h-[calc(100vh-8rem)] overflow-x-hidden">
    <!-- Mobile Header -->
    <div class="lg:hidden flex items-center justify-between mb-4">
      <div>
        <h1 class="text-lg font-bold text-gray-900">Pengaturan</h1>
        <p class="text-xs text-gray-500">{{ categories.find(c => c.id === activeCategory)?.label }}</p>
      </div>
      <div class="flex gap-2">
        <button v-if="isDirty" @click="resetChanges" class="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">Reset</button>
        <button @click="saveAll" :disabled="saving" class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- Mobile category selector -->
    <select v-model="activeCategory" class="lg:hidden w-full mb-4 px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
      <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.label }}</option>
    </select>

    <div class="flex gap-6">
      <!-- Sidebar Categories (desktop/tablet) -->
      <nav class="hidden lg:block w-56 xl:w-60 flex-shrink-0">
        <div class="sticky top-20 space-y-1 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <button
            v-for="cat in categories"
            :key="cat.id"
            @click="activeCategory = cat.id"
            :class="[
              'w-full text-left px-3 py-2 rounded-lg text-sm transition',
              activeCategory === cat.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
            ]"
          >{{ cat.label }}</button>
        </div>
      </nav>

      <!-- Content Area -->
      <div class="flex-1 min-w-0 space-y-6">
        <!-- Header (desktop only) -->
        <div class="hidden lg:flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold text-gray-900">Subscription & Pricing</h1>
            <p class="text-sm text-gray-500">Manage plans, pricing, trials, storage, ads, privacy, and protection.</p>
          </div>
          <div class="flex gap-2">
            <button v-if="isDirty" @click="resetChanges" class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Reset</button>
            <button @click="saveAll" :disabled="saving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>

        <!-- Unsaved warning -->
        <div v-if="isDirty" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          ⚠️ You have unsaved configuration changes.
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-12 text-gray-500">Memuat konfigurasi...</div>

      <!-- Error -->
      <div v-else-if="loadError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{{ loadError }}</div>

      <div v-else>
        <!-- OVERVIEW -->
        <div v-if="activeCategory === 'overview'" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white border border-gray-200 rounded-xl p-4">
              <p class="text-xs text-gray-500">Total Plans</p>
              <p class="text-lg font-bold text-gray-900">{{ planKeys.length }}</p>
            </div>
            <div class="bg-white border border-gray-200 rounded-xl p-4">
              <p class="text-xs text-gray-500">Family Plus / month</p>
              <p class="text-lg font-bold text-gray-900">{{ formatIDR(cfg('plans.family_plus')?.price_monthly_idr) }}</p>
            </div>
            <div class="bg-white border border-gray-200 rounded-xl p-4">
              <p class="text-xs text-gray-500">Trial Duration</p>
              <p class="text-lg font-bold text-gray-900">{{ cfg('standard_trial')?.duration_days }} hari</p>
            </div>
            <div class="bg-white border border-gray-200 rounded-xl p-4">
              <p class="text-xs text-gray-500">AdMob</p>
              <p class="text-lg font-bold" :class="cfg('admob_settings')?.enabled ? 'text-green-600' : 'text-gray-400'">
                {{ cfg('admob_settings')?.enabled ? 'Active' : 'Disabled' }}
              </p>
            </div>
          </div>
        </div>


        <!-- PLANS & PRICING -->
        <div v-if="activeCategory === 'plans'" class="space-y-4">
          <!-- Add Plan -->
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-gray-700">{{ planKeys.length }} Plan aktif</h2>
            <button @click="showAddPlan = true" class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Tambah Plan</button>
          </div>

          <!-- Plan Cards -->
          <div v-for="planKey in planKeys" :key="planKey" class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-gray-900">{{ settingsMap[planKey]?.label || planKey.replace('plans.', '') }}</h3>
                <span v-if="data[planKey]?.price_monthly_idr === 0" class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">Free</span>
                <span v-else-if="planKey === 'plans.family_plus'" class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Popular</span>
              </div>
              <div class="flex gap-2">
                <button v-if="planKey !== 'plans.free'" @click="confirmRemovePlan = planKey" class="text-xs text-red-500 hover:underline">Hapus</button>
              </div>
            </div>

            <!-- Pricing -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Deskripsi (website)</label>
                <input v-model="data[planKey].description" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Deskripsi singkat paket" @input="markDirty" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Badge</label>
                <input v-model="data[planKey].badge" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="⭐ Populer" @input="markDirty" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">CTA Label</label>
                <input v-model="data[planKey].cta_label" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Mulai Gratis" @input="markDirty" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Display Order</label>
                <input v-model.number="data[planKey].display_order" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" />
              </div>
              <div class="flex items-end">
                <label class="flex items-center gap-2 text-sm pb-2"><input type="checkbox" v-model="data[planKey].featured" class="rounded" @change="markDirty" /> Featured (highlight)</label>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">CTA Target</label>
                <input v-model="data[planKey].cta_target" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="/register" @input="markDirty" />
              </div>
            </div>

            <!-- Pricing -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Monthly (IDR)</label>
                <input v-model.number="data[planKey].price_monthly_idr" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" />
                <p class="text-xs text-gray-400 mt-0.5">{{ formatIDR(data[planKey].price_monthly_idr) }}/bulan</p>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Yearly (IDR)</label>
                <input v-model.number="data[planKey].price_yearly_idr" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" />
                <p class="text-xs text-gray-400 mt-0.5">{{ formatIDR(data[planKey].price_yearly_idr) }}/tahun</p>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Member Limit</label>
                <div class="flex items-center gap-2">
                  <select :value="data[planKey].member_limit === -1 ? 'unlimited' : 'limited'" @change="toggleMemberLimit(planKey, $event)" class="px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                    <option value="limited">Limited</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                  <input v-if="data[planKey].member_limit !== -1" v-model.number="data[planKey].member_limit" type="number" min="1" class="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" />
                </div>
              </div>
            </div>

            <!-- Compare prices (strikethrough) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Harga Coret Bulanan (IDR)</label>
                <input v-model.number="data[planKey].compare_price_monthly_idr" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" />
                <p v-if="data[planKey].compare_price_monthly_idr" class="text-xs text-gray-400 mt-0.5"><s>{{ formatIDR(data[planKey].compare_price_monthly_idr) }}</s> → {{ formatIDR(data[planKey].price_monthly_idr) }}</p>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Harga Coret Tahunan (IDR)</label>
                <input v-model.number="data[planKey].compare_price_yearly_idr" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" />
                <p v-if="data[planKey].compare_price_yearly_idr" class="text-xs text-gray-400 mt-0.5"><s>{{ formatIDR(data[planKey].compare_price_yearly_idr) }}</s> → {{ formatIDR(data[planKey].price_yearly_idr) }}</p>
              </div>
            </div>

            <!-- Limits -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="col-span-2 md:col-span-4 border border-gray-200 rounded-lg p-3 space-y-2">
                <label class="block text-xs font-medium text-gray-700">Storage Capacity</label>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Jumlah</label>
                    <input v-model.number="getStorageDisplay(planKey).amount" type="number" min="0"
                      :disabled="data[planKey].storage_unlimited"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none disabled:opacity-50"
                      @input="updateStorageBytes(planKey)" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Unit</label>
                    <select v-model="getStorageDisplay(planKey).unit"
                      :disabled="data[planKey].storage_unlimited"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none disabled:opacity-50"
                      @change="updateStorageBytes(planKey)">
                      <option value="MB">MB</option>
                      <option value="GB">GB</option>
                      <option value="TB">TB</option>
                    </select>
                  </div>
                  <div class="flex items-end">
                    <label class="flex items-center gap-2 text-sm pb-2">
                      <input type="checkbox" v-model="data[planKey].storage_unlimited" class="rounded" @change="onStorageUnlimitedChange(planKey)" />
                      Unlimited
                    </label>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Bytes (auto)</label>
                    <p class="px-3 py-2 text-xs text-gray-500 font-mono bg-gray-50 rounded-lg">{{ data[planKey].storage_unlimited ? '∞' : (data[planKey].storage_bytes || 0).toLocaleString() }}</p>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Warning Threshold (%)</label>
                    <input v-model.number="data[planKey].storage_warning_pct" type="number" min="50" max="99" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" placeholder="80" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Critical Threshold (%)</label>
                    <input v-model.number="data[planKey].storage_critical_pct" type="number" min="80" max="100" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" placeholder="95" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Label Tampilan</label>
                  <input v-model="data[planKey].storage_label" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" placeholder="5 GB" />
                  <p class="text-xs text-gray-400 mt-0.5">Otomatis jika kosong: {{ data[planKey].storage_unlimited ? 'Tidak terbatas' : formatStorageLabel(data[planKey].storage_bytes) }}</p>
                </div>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Safe Zones</label>
                <input v-model.number="data[planKey].safe_zones" type="number" min="-1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" />
                <p class="text-xs text-gray-400">-1 = Unlimited</p>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Wallets</label>
                <input v-model.number="data[planKey].wallet_limit" type="number" min="-1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" />
                <p class="text-xs text-gray-400">-1 = Unlimited</p>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Ads</label>
                <select v-model="data[planKey].ads_enabled" @change="markDirty" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                  <option :value="true">Enabled</option>
                  <option :value="false">Disabled</option>
                </select>
              </div>
            </div>

            <!-- Features -->
            <div>
              <label class="block text-xs text-gray-500 mb-2">Features</label>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <label v-for="feat in allFeaturesList" :key="feat" class="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" :checked="(data[planKey].features || []).includes(feat)" @change="togglePlanFeature(planKey, feat, $event)" class="rounded text-blue-600" />
                  <span class="text-gray-700">{{ feat }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Add Plan Modal -->
          <div v-if="showAddPlan" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div class="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">
              <h3 class="font-semibold text-gray-900">Tambah Plan Baru</h3>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Nama Plan (slug)</label>
                <input v-model="newPlanSlug" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="family_pro" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Label</label>
                <input v-model="newPlanLabel" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Family Pro" />
              </div>
              <div class="flex justify-end gap-3">
                <button @click="showAddPlan = false" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button @click="doAddPlan" :disabled="!newPlanSlug" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Tambah</button>
              </div>
            </div>
          </div>

          <!-- Remove Plan Confirm -->
          <div v-if="confirmRemovePlan" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div class="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h3 class="font-semibold text-gray-900">Hapus Plan</h3>
              <p class="text-sm text-gray-600 mt-2">Yakin hapus plan <strong>{{ confirmRemovePlan }}</strong>? Data konfigurasi akan dihapus dari database.</p>
              <div class="flex justify-end gap-3 mt-5">
                <button @click="confirmRemovePlan = null" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button @click="doRemovePlan" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Hapus</button>
              </div>
            </div>
          </div>
        </div>

        <!-- TRIAL & PROMOTIONS -->
        <div v-if="activeCategory === 'trial'" class="space-y-4">
          <!-- Standard Trial -->
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 class="font-semibold text-gray-900">Standard Trial</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.standard_trial.enabled" class="rounded" @change="markDirty" /> Enabled</label>
              <div><label class="block text-xs text-gray-500 mb-1">Duration (days)</label><input v-model.number="data.standard_trial.duration_days" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" @input="markDirty" /></div>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.standard_trial.requires_payment_method" class="rounded" @change="markDirty" /> Requires Payment</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.standard_trial.via_google_play" class="rounded" @change="markDirty" /> Google Play</label>
            </div>
          </div>

          <!-- Promo Codes List -->
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900">Promo Codes ({{ promoCodes.length }})</h3>
              <button @click="showPromoEditor = true; editingPromo = newPromoTemplate()" class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Buat Kode</button>
            </div>
            <div v-if="promoLoading" class="text-sm text-gray-500 text-center py-4">Memuat...</div>
            <div v-else-if="promoCodes.length === 0" class="text-sm text-gray-400 text-center py-4">Belum ada promo code.</div>
            <table v-else class="w-full text-sm">
              <thead class="text-xs text-gray-500 border-b"><tr><th class="text-left py-2">Code</th><th class="text-left py-2">Tipe</th><th class="text-left py-2">Hari</th><th class="text-left py-2">Redeemed</th><th class="text-left py-2">Status</th><th class="py-2">Aksi</th></tr></thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="p in promoCodes" :key="p.id">
                  <td class="py-2 font-mono font-medium text-gray-900">{{ p.code }}</td>
                  <td class="py-2 text-gray-600">{{ formatPromoType(p.code_type) }}</td>
                  <td class="py-2 text-gray-600">{{ p.trial_days }}d</td>
                  <td class="py-2 text-gray-600">{{ p.redemption_count }}/{{ p.max_redemptions || '∞' }}</td>
                  <td class="py-2"><span :class="p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="px-2 py-0.5 text-xs rounded-full">{{ p.is_active ? 'Active' : 'Inactive' }}</span></td>
                  <td class="py-2 text-center">
                    <button @click="editingPromo = {...p}; showPromoEditor = true" class="text-xs text-blue-600 hover:underline mr-2">Edit</button>
                    <button @click="togglePromoActive(p)" class="text-xs text-orange-600 hover:underline mr-2">{{ p.is_active ? 'Disable' : 'Enable' }}</button>
                    <button @click="confirmDeletePromo = p" class="text-xs text-red-600 hover:underline">Hapus</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Eligibility Rules -->
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 class="font-semibold text-gray-900">Eligibility Rules</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.promotion_rules.one_trial_per_family" class="rounded" @change="markDirty" /> One trial per family</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.promotion_rules.one_trial_per_account" class="rounded" @change="markDirty" /> One trial per account</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.promotion_rules.one_trial_per_apple_id" class="rounded" @change="markDirty" /> One trial per Apple ID</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.promotion_rules.one_trial_per_google_account" class="rounded" @change="markDirty" /> One trial per Google account</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.promotion_rules.allow_multiple_coupons" class="rounded" @change="markDirty" /> Allow multiple coupons</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.promotion_rules.referral_extends_subscription" class="rounded" @change="markDirty" /> Referral extends subscription</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.promotion_rules.standard_trial_via_store_only" class="rounded" @change="markDirty" /> Trial via store only</label>
            </div>
          </div>

          <!-- Promo Editor Modal -->
          <div v-if="showPromoEditor" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-4">
              <h3 class="font-semibold text-gray-900">{{ editingPromo.id ? 'Edit Promo Code' : 'Buat Promo Code' }}</h3>
              <div v-if="promoError" class="p-2 bg-red-50 text-red-700 text-xs rounded">{{ promoError }}</div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Code</label>
                  <input v-model="editingPromo.code" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase outline-none" placeholder="KINORA2026" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Tipe</label>
                  <select v-model="editingPromo.code_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                    <option value="trial">Trial</option>
                    <option value="access_pass">Access Pass</option>
                    <option value="discount">Discount</option>
                    <option value="founder">Founder</option>
                    <option value="family_invite">Family Invite</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-xs text-gray-500 mb-1">{{ editingPromo.code_type === 'access_pass' ? 'Duration (days)' : 'Trial Days' }}</label><input v-model.number="editingPromo.trial_days" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
                <div><label class="block text-xs text-gray-500 mb-1">Max Redemptions (kosong = unlimited)</label><input v-model.number="editingPromo.max_redemptions" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              </div>
              <!-- Access Pass specific fields -->
              <div v-if="editingPromo.code_type === 'access_pass'" class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Target Plan</label>
                  <select v-model="editingPromo.target_plan" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                    <option value="family_plus">Family Plus</option>
                    <option value="family_pro">Family Pro</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Duration Unit</label>
                  <select v-model="editingPromo.duration_unit" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                    <option value="day">Days</option>
                    <option value="week">Weeks</option>
                    <option value="month">Months</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-xs text-gray-500 mb-1">Discount %</label><input v-model.number="editingPromo.discount_percent" type="number" min="0" max="100" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
                <div><label class="block text-xs text-gray-500 mb-1">Bonus Storage (bytes)</label><input v-model.number="editingPromo.bonus_storage_bytes" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Expires At (opsional)</label>
                <input v-model="editingPromo.expires_at" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Catatan</label>
                <input v-model="editingPromo.note" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Internal note..." />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="editingPromo.is_active" class="rounded" /> Active</label>
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="editingPromo.grants_founder_badge" class="rounded" /> Founder Badge</label>
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="editingPromo.one_time_per_user" class="rounded" /> One-time per user</label>
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="editingPromo.one_time_per_family" class="rounded" /> One-time per family</label>
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button @click="showPromoEditor = false; promoError = ''" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button @click="savePromo" :disabled="promoSaving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {{ promoSaving ? 'Saving...' : 'Simpan' }}
                </button>
              </div>
            </div>
          </div>
          <!-- Promo Delete Confirm -->
          <div v-if="confirmDeletePromo" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div class="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h3 class="font-semibold text-gray-900">Hapus Promo Code</h3>
              <p class="text-sm text-gray-600 mt-2">Yakin hapus kode <strong class="font-mono">{{ confirmDeletePromo.code }}</strong>? Kode yang sudah di-redeem tetap tercatat di history.</p>
              <div class="flex justify-end gap-3 mt-5">
                <button @click="confirmDeletePromo = null" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button @click="doDeletePromo" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Hapus</button>
              </div>
            </div>
          </div>
        </div>

        <!-- STORAGE -->
        <div v-if="activeCategory === 'storage'" class="space-y-4">
          <!-- Included Storage per Plan (editable from plan data) -->
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 class="font-semibold text-gray-900">Included Storage per Plan</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="planKey in planKeys" :key="planKey" class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 mb-1">{{ settingsMap[planKey]?.label || planKey.replace('plans.', '') }}</p>
                <input v-model="data[planKey].storage_label" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500" @input="markDirty" placeholder="1 GB" />
              </div>
            </div>
          </div>

          <!-- Storage Add-ons (editable) -->
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900">Storage Add-ons</h3>
              <button @click="addStorageAddon" class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Tambah Add-on</button>
            </div>
            <div v-if="!data.storage_addons || data.storage_addons.length === 0" class="text-sm text-gray-400 text-center py-4">Belum ada storage add-on.</div>
            <div v-else class="space-y-3">
              <div v-for="(addon, i) in data.storage_addons" :key="i" class="p-3 bg-gray-50 rounded-lg space-y-2">
                <div class="grid grid-cols-12 gap-3 items-end">
                  <div class="col-span-3">
                    <label class="block text-xs text-gray-500 mb-1">Label</label>
                    <input v-model="addon.label" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" placeholder="10 GB" />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-xs text-gray-500 mb-1">Plan</label>
                    <input v-model="addon.plan_label" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" placeholder="Plus" />
                  </div>
                  <div class="col-span-3">
                    <label class="block text-xs text-gray-500 mb-1">Bulanan (IDR)</label>
                    <input v-model.number="addon.price_monthly_idr" type="number" min="0" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" />
                  </div>
                  <div class="col-span-3">
                    <label class="block text-xs text-gray-500 mb-1">Tahunan (IDR)</label>
                    <input v-model.number="addon.price_yearly_idr" type="number" min="0" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" />
                  </div>
                  <div class="col-span-1 flex justify-center">
                    <button @click="removeStorageAddon(i)" class="text-red-500 hover:text-red-700 text-sm">✕</button>
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-3 items-end">
                  <div class="col-span-2">
                    <label class="block text-xs text-gray-500 mb-1">Size (GB)</label>
                    <input v-model.number="addon.size_gb" type="number" min="1" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" placeholder="10" />
                  </div>
                  <div class="col-span-3">
                    <label class="block text-xs text-gray-500 mb-1">Harga Coret Bulanan</label>
                    <input v-model.number="addon.compare_price_monthly_idr" type="number" min="0" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" placeholder="0" />
                  </div>
                  <div class="col-span-3">
                    <label class="block text-xs text-gray-500 mb-1">Harga Coret Tahunan</label>
                    <input v-model.number="addon.compare_price_yearly_idr" type="number" min="0" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" placeholder="0" />
                  </div>
                  <div class="col-span-4">
                    <p v-if="addon.compare_price_monthly_idr > addon.price_monthly_idr" class="text-xs text-gray-400">
                      <s>{{ formatIDR(addon.compare_price_monthly_idr) }}</s> → {{ formatIDR(addon.price_monthly_idr) }}/bln
                    </p>
                    <p v-if="addon.compare_price_yearly_idr > addon.price_yearly_idr" class="text-xs text-gray-400">
                      <s>{{ formatIDR(addon.compare_price_yearly_idr) }}</s> → {{ formatIDR(addon.price_yearly_idr) }}/thn
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Storage Sources (editable) -->
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900">Storage Sources</h3>
              <button @click="addStorageSource" class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Tambah</button>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-for="(s, i) in data.storage_rules?.sources" :key="i" class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                {{ s.replace(/_/g, ' ') }}
                <button @click="removeStorageSource(i)" class="text-gray-400 hover:text-red-500">×</button>
              </span>
            </div>
          </div>

          <!-- Warning Thresholds (editable) -->
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900">Rules & Thresholds</h3>
            </div>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.storage_rules.never_auto_delete" class="rounded" @change="markDirty" /> Never auto-delete</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.storage_rules.expired_plus_keep_files" class="rounded" @change="markDirty" /> Keep files after Plus expires</label>
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs text-gray-500">Warning Thresholds (%)</label>
                <button @click="addWarningThreshold" class="text-xs text-blue-600 hover:underline">+ Tambah</button>
              </div>
              <div class="flex flex-wrap gap-2">
                <div v-for="(t, i) in data.storage_rules?.warning_thresholds" :key="i" class="inline-flex items-center gap-1">
                  <input v-model.number="data.storage_rules.warning_thresholds[i]" type="number" min="1" max="100" class="w-14 px-2 py-1 border border-gray-200 rounded text-xs text-center outline-none" @input="markDirty" />
                  <button @click="removeWarningThreshold(i)" class="text-gray-400 hover:text-red-500 text-xs">×</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ADMOB -->
        <div v-if="activeCategory === 'ads'" class="space-y-4">
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900">AdMob Settings</h3>
              <span :class="data.admob_settings?.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="px-2 py-0.5 text-xs rounded-full">
                {{ data.admob_settings?.enabled ? (data.admob_settings?.test_mode ? 'Test Mode' : 'Production') : 'Disabled' }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.admob_settings.enabled" class="rounded" @change="markDirty" /> Enabled</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.admob_settings.test_mode" class="rounded" @change="markDirty" /> Test Mode</label>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label class="block text-xs text-gray-500 mb-1">Android App ID</label><input v-model="data.admob_settings.android_app_id" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none" @input="markDirty" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">iOS App ID</label><input v-model="data.admob_settings.ios_app_id" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none" @input="markDirty" /></div>
            </div>
          </div>

          <!-- Placement Units - Editable -->
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900">Placement Units</h3>
              <button @click="showAddPlacement = true" class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Tambah Placement</button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="text-xs text-gray-500 border-b">
                  <tr>
                    <th class="text-left py-2 pr-3">Placement</th>
                    <th class="text-left py-2 pr-3">Android Ad Unit ID</th>
                    <th class="text-left py-2 pr-3">iOS Ad Unit ID</th>
                    <th class="py-2 w-16">Status</th>
                    <th class="py-2 w-12">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="(val, key) in data.admob_settings?.placement_units" :key="key" class="group">
                    <td class="py-2.5 pr-3">
                      <span class="text-gray-700 font-medium text-xs">{{ formatPlacementName(key) }}</span>
                      <p class="text-[10px] text-gray-400 font-mono">{{ key }}</p>
                    </td>
                    <td class="py-2.5 pr-3">
                      <input v-model="data.admob_settings.placement_units[key].android" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-mono outline-none focus:ring-1 focus:ring-blue-500" placeholder="ca-app-pub-xxx/xxx" @input="markDirty" />
                    </td>
                    <td class="py-2.5 pr-3">
                      <input v-model="data.admob_settings.placement_units[key].ios" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-mono outline-none focus:ring-1 focus:ring-blue-500" placeholder="ca-app-pub-xxx/xxx" @input="markDirty" />
                    </td>
                    <td class="py-2.5 text-center">
                      <button @click="togglePlacement(key)" class="px-2 py-0.5 rounded text-xs font-medium transition" :class="isPlacementOn(key) ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'">
                        {{ isPlacementOn(key) ? 'On' : 'Off' }}
                      </button>
                    </td>
                    <td class="py-2.5 text-center">
                      <button @click="removePlacement(key)" class="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition">✕</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="!data.admob_settings?.placement_units || Object.keys(data.admob_settings.placement_units).length === 0" class="text-sm text-gray-400 text-center py-4">Belum ada placement. Klik "+ Tambah Placement" untuk menambahkan.</p>
          </div>

          <!-- Add Placement Modal -->
          <Teleport to="body">
          <div v-if="showAddPlacement" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" @click.self="showAddPlacement = false">
            <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
              <h3 class="font-semibold text-gray-900">Tambah Placement Baru</h3>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Nama Placement</label>
                <select v-model="newPlacementKey" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                  <option value="">Pilih placement...</option>
                  <option v-for="p in availablePlacements" :key="p.value" :value="p.value">{{ p.label }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Android Ad Unit ID (opsional)</label>
                <input v-model="newPlacementAndroid" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none" placeholder="ca-app-pub-xxx/xxx" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">iOS Ad Unit ID (opsional)</label>
                <input v-model="newPlacementIos" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none" placeholder="ca-app-pub-xxx/xxx" />
              </div>
              <div class="flex justify-end gap-3">
                <button @click="showAddPlacement = false" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button @click="doAddPlacement" :disabled="!newPlacementKey" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Tambah</button>
              </div>
            </div>
          </div>
          </Teleport>

          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 class="font-semibold text-gray-900">Ads Rules</h3>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.ads_rules.enabled_on_free" class="rounded" @change="markDirty" /> Enabled on Free plan</label>
            <div><label class="block text-xs text-gray-500 mb-1">Blocked Placements</label><div class="flex flex-wrap gap-1.5"><span v-for="p in data.ads_rules?.blocked_placements" :key="p" class="px-2 py-0.5 text-xs bg-red-50 text-red-700 rounded-full">{{ p }}</span></div></div>
            <p class="text-xs text-gray-400 italic">Ads are never shown in safety-critical areas.</p>
          </div>
        </div>

        <!-- IN-APP REVIEW -->
        <div v-if="activeCategory === 'review'" class="space-y-4">
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 class="font-semibold text-gray-900">In-App Review</h3>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.app_review.enabled" class="rounded" @change="markDirty" /> Enabled</label>
            <div class="grid grid-cols-3 gap-4">
              <div><label class="block text-xs text-gray-500 mb-1">Min Days</label><input v-model.number="data.app_review.min_days" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" @input="markDirty" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Min App Opens</label><input v-model.number="data.app_review.min_app_opens" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" @input="markDirty" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Later Delay (days)</label><input v-model.number="data.app_review.later_delay_days" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" @input="markDirty" /></div>
            </div>
            <p class="text-xs text-gray-400 bg-gray-50 p-2 rounded">Review request may appear after {{ data.app_review?.min_days }} days and at least {{ data.app_review?.min_app_opens }} app opens. If postponed, it may appear again after {{ data.app_review?.later_delay_days }} days.</p>
          </div>
        </div>

        <!-- E2EE & PRIVACY -->
        <div v-if="activeCategory === 'privacy'" class="space-y-4">
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 class="font-semibold text-gray-900">Chat E2EE</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.e2ee_settings.enabled" class="rounded" @change="markDirty" /> E2EE Enabled</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.e2ee_settings.media_encryption_required" class="rounded" @change="markDirty" /> Media Encryption</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.e2ee_settings.replay_protection" class="rounded" @change="markDirty" /> Replay Protection</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.e2ee_settings.forward_secrecy_enabled" class="rounded" @change="markDirty" /> Forward Secrecy</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.e2ee_settings.device_verification_required" class="rounded" @change="markDirty" /> Device Verification</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.e2ee_settings.allow_plaintext_legacy" class="rounded" @change="markDirty" /> Allow Plaintext Legacy</label>
            </div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 class="font-semibold text-gray-900">Required Room Types</h3>
            <div class="flex flex-wrap gap-2"><span v-for="r in data.e2ee_settings?.required_room_types" :key="r" class="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">{{ r }}</span></div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 class="font-semibold text-gray-900">Parent Restrictions</h3>
            <div class="space-y-1"><p v-for="b in data.e2ee_privacy_rules?.parent_blocked_from" :key="b" class="text-sm text-gray-600">🚫 {{ b.replace(/_/g, ' ') }}</p></div>
            <h4 class="text-xs font-medium text-gray-500 mt-3">Parent Allowed Monitoring</h4>
            <div class="flex flex-wrap gap-2"><span v-for="a in data.e2ee_privacy_rules?.parent_allowed_monitoring" :key="a" class="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full">{{ a.replace(/_/g, ' ') }}</span></div>
          </div>
        </div>

        <!-- PROTECTION -->
        <div v-if="activeCategory === 'protection'" class="space-y-4">
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 class="font-semibold text-gray-900">Smart Alerts</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
              <label v-for="(val, key) in data.protection_defaults?.smart_alerts" :key="key" class="flex items-center gap-2 text-sm">
                <input type="checkbox" v-model="data.protection_defaults.smart_alerts[key]" class="rounded" @change="markDirty" />
                {{ key.replace(/_/g, ' ') }}
              </label>
            </div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 class="font-semibold text-gray-900">Thresholds</h3>
            <div class="grid grid-cols-3 gap-4">
              <div><label class="block text-xs text-gray-500 mb-1">Speed Alert (km/h)</label><input v-model.number="data.protection_defaults.speed_alert_kmh" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" @input="markDirty" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Battery Warning (%)</label><input v-model.number="data.protection_defaults.battery_alert_threshold" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" @input="markDirty" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Offline Detection (min)</label><input v-model.number="data.protection_defaults.offline_detection_minutes" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" @input="markDirty" /></div>
            </div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 class="font-semibold text-gray-900">Protection Switches</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.protection_defaults.anti_tamper_enabled" class="rounded" @change="markDirty" /> Anti-tamper</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.protection_defaults.gps_integrity_enabled" class="rounded" @change="markDirty" /> GPS Integrity</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.protection_defaults.reboot_protection_enabled" class="rounded" @change="markDirty" /> Reboot Protection</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.protection_defaults.emergency_override_enabled" class="rounded" @change="markDirty" /> Emergency Override</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.protection_defaults.safety_score_enabled" class="rounded" @change="markDirty" /> Safety Score</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.protection_defaults.driving_detection_enabled" class="rounded" @change="markDirty" /> Driving Detection</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.protection_defaults.reward_store_enabled" class="rounded" @change="markDirty" /> Reward Store</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.protection_defaults.permission_recovery_enabled" class="rounded" @change="markDirty" /> Permission Recovery</label>
            </div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 class="font-semibold text-gray-900">Security & Transparency</h3>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.protection_security_rules.transparent_monitoring" class="rounded" @change="markDirty" /> Transparent Monitoring</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.protection_security_rules.parent_consent_required" class="rounded" @change="markDirty" /> Parent Consent Required</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.protection_security_rules.child_notification_on_monitoring" class="rounded" @change="markDirty" /> Child Notification on Monitoring</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.protection_security_rules.audit_all_actions" class="rounded" @change="markDirty" /> Audit All Actions</label>
            <div class="mt-3">
              <label class="block text-xs text-gray-500 mb-1">Prohibited Features (locked)</label>
              <div class="flex flex-wrap gap-1.5"><span v-for="p in data.protection_security_rules?.prohibited_features" :key="p" class="px-2 py-0.5 text-xs bg-red-50 text-red-700 rounded-full">🚫 {{ p.replace(/_/g, ' ') }}</span></div>
            </div>
          </div>
        </div>

        <!-- PAYMENT -->
        <div v-if="activeCategory === 'payment'" class="space-y-4">
          <!-- Payment Gateway -->
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 class="font-semibold text-gray-900">Payment Gateway</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label class="block text-xs text-gray-500 mb-1">Primary Gateway</label>
                <select v-model="paymentSettings.primary_payment_gateway" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @change="markDirty">
                  <option value="xendit">Xendit</option><option value="tripay">Tripay</option><option value="sumopod">Sumopod</option><option value="stripe">Stripe</option><option value="manual">Manual</option>
                </select>
              </div>
              <div><label class="block text-xs text-gray-500 mb-1">Tripay Default Method</label>
                <input v-model="paymentSettings.tripay_default_method" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" />
              </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="paymentSettings.xendit_enabled" class="rounded" @change="markDirty" /> Xendit</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="paymentSettings.tripay_enabled" class="rounded" @change="markDirty" /> Tripay</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="paymentSettings.sumopod_enabled" class="rounded" @change="markDirty" /> Sumopod</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="paymentSettings.stripe_enabled" class="rounded" @change="markDirty" /> Stripe</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="paymentSettings.manual_transfer_enabled" class="rounded" @change="markDirty" /> Manual Transfer</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="paymentSettings.tripay_sandbox" class="rounded" @change="markDirty" /> Tripay Sandbox</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="paymentSettings.sumopod_sandbox" class="rounded" @change="markDirty" /> Sumopod Sandbox</label>
            </div>

            <!-- Sumopod Configuration -->
            <div v-if="paymentSettings.sumopod_enabled" class="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-lg space-y-3">
              <h4 class="text-sm font-semibold text-purple-900">Sumopod Configuration</h4>
              <p class="text-xs text-purple-700">Sumopod digunakan untuk: Webinar, Marketplace, Consultation.</p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Mode</label>
                  <select v-model="paymentSettings.sumopod_sandbox" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @change="markDirty">
                    <option :value="true">Sandbox (Testing)</option>
                    <option :value="false">Production</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Digunakan Untuk</label>
                  <p class="text-xs text-gray-600 mt-1">Webinar · Marketplace · Consultation</p>
                </div>
              </div>

              <!-- Sandbox Credentials -->
              <div class="border-t border-purple-200 pt-3 mt-3">
                <p class="text-xs font-medium text-purple-800 mb-2">Sandbox Credentials</p>
                <div class="grid grid-cols-1 gap-2">
                  <div><label class="block text-xs text-gray-500 mb-1">API URL</label><input v-model="paymentSettings.sumopod_sandbox_api_url" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none font-mono" placeholder="https://sandbox.sumopod.com/api" @input="markDirty" /></div>
                  <div><label class="block text-xs text-gray-500 mb-1">API Key</label><input v-model="paymentSettings.sumopod_sandbox_api_key" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none font-mono" placeholder="sk_sandbox_..." @input="markDirty" /></div>
                  <div><label class="block text-xs text-gray-500 mb-1">Secret Key</label><input v-model="paymentSettings.sumopod_sandbox_secret" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none font-mono" placeholder="whsec_sandbox_..." @input="markDirty" /></div>
                </div>
              </div>

              <!-- Production Credentials -->
              <div class="border-t border-purple-200 pt-3 mt-3">
                <p class="text-xs font-medium text-purple-800 mb-2">Production Credentials</p>
                <div class="grid grid-cols-1 gap-2">
                  <div><label class="block text-xs text-gray-500 mb-1">API URL</label><input v-model="paymentSettings.sumopod_production_api_url" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none font-mono" placeholder="https://api.sumopod.com/v1" @input="markDirty" /></div>
                  <div><label class="block text-xs text-gray-500 mb-1">API Key</label><input v-model="paymentSettings.sumopod_production_api_key" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none font-mono" placeholder="sk_live_..." @input="markDirty" /></div>
                  <div><label class="block text-xs text-gray-500 mb-1">Secret Key</label><input v-model="paymentSettings.sumopod_production_secret" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none font-mono" placeholder="whsec_live_..." @input="markDirty" /></div>
                </div>
              </div>

              <div v-if="paymentSettings.sumopod_sandbox" class="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span class="text-yellow-600 text-xs font-medium">⚠ SANDBOX MODE</span>
                <span class="text-xs text-yellow-700">Transaksi tidak akan memproses pembayaran nyata.</span>
              </div>
            </div>
          </div>

          <!-- App Fees -->
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 class="font-semibold text-gray-900">Biaya Aplikasi (App Fee)</h3>
            <p class="text-xs text-gray-500">Biaya yang ditambahkan ke harga produk. Fixed = nominal tetap. Percent = persentase dari harga.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="p-3 bg-gray-50 rounded-lg space-y-2">
                <p class="text-xs font-medium text-gray-700">Webinar</p>
                <div><label class="block text-xs text-gray-400">Fixed (IDR)</label><input v-model.number="paymentSettings.webinar_app_fee_fixed" type="number" min="0" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" /></div>
                <div><label class="block text-xs text-gray-400">Percent (%)</label><input v-model.number="paymentSettings.webinar_app_fee_percent" type="number" min="0" max="100" step="0.1" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" /></div>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg space-y-2">
                <p class="text-xs font-medium text-gray-700">Konsultasi</p>
                <div><label class="block text-xs text-gray-400">Fixed (IDR)</label><input v-model.number="paymentSettings.consultation_app_fee_fixed" type="number" min="0" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" /></div>
                <div><label class="block text-xs text-gray-400">Percent (%)</label><input v-model.number="paymentSettings.consultation_app_fee_percent" type="number" min="0" max="100" step="0.1" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" /></div>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg space-y-2">
                <p class="text-xs font-medium text-gray-700">Print / Merchandise</p>
                <div><label class="block text-xs text-gray-400">Fixed (IDR)</label><input v-model.number="paymentSettings.print_app_fee_fixed" type="number" min="0" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" /></div>
                <div><label class="block text-xs text-gray-400">Percent (%)</label><input v-model.number="paymentSettings.print_app_fee_percent" type="number" min="0" max="100" step="0.1" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" /></div>
                <div><label class="block text-xs text-gray-400">Shipping Flat (IDR)</label><input v-model.number="paymentSettings.print_shipping_flat" type="number" min="0" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" /></div>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg space-y-2">
                <p class="text-xs font-medium text-gray-700">PPOB</p>
                <div><label class="block text-xs text-gray-400">Fixed (IDR)</label><input v-model.number="paymentSettings.ppob_app_fee_fixed" type="number" min="0" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" /></div>
                <div><label class="block text-xs text-gray-400">Percent (%)</label><input v-model.number="paymentSettings.ppob_app_fee_percent" type="number" min="0" max="100" step="0.1" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" @input="markDirty" /></div>
              </div>
            </div>
          </div>

          <!-- Manual Transfer Settings -->
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 class="font-semibold text-gray-900">Transfer Manual</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label class="block text-xs text-gray-500 mb-1">Nama Bank</label><input v-model="paymentSettings.manual_bank_name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Nomor Rekening</label><input v-model="paymentSettings.manual_bank_account_number" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Atas Nama</label><input v-model="paymentSettings.manual_bank_account_name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Batas Waktu Bayar (jam)</label><input v-model.number="paymentSettings.manual_payment_expiry_hours" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Min. Pembayaran (IDR)</label><input v-model.number="paymentSettings.manual_min_amount" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Max Ukuran Bukti (MB)</label><input v-model.number="paymentSettings.manual_max_proof_size_mb" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" /></div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="paymentSettings.manual_use_unique_code" class="rounded" @change="markDirty" /> Kode Unik</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="paymentSettings.manual_allow_resubmit" class="rounded" @change="markDirty" /> Boleh Resubmit</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="paymentSettings.manual_allow_expired_review" class="rounded" @change="markDirty" /> Review Expired</label>
            </div>
            <div v-if="paymentSettings.manual_use_unique_code" class="grid grid-cols-2 gap-4">
              <div><label class="block text-xs text-gray-500 mb-1">Kode Unik Min</label><input v-model.number="paymentSettings.manual_unique_code_min" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Kode Unik Max</label><input v-model.number="paymentSettings.manual_unique_code_max" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" /></div>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Instruksi Transfer (untuk user)</label>
              <textarea v-model="paymentSettings.manual_transfer_instructions" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" @input="markDirty" placeholder="Instruksi pembayaran yang akan ditampilkan ke user..."></textarea>
            </div>
          </div>
        </div>

        <!-- ADVANCED JSON -->
        <div v-if="activeCategory === 'json'" class="space-y-4">
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 class="font-semibold text-gray-900">Advanced JSON Editor</h3>
            <p class="text-xs text-gray-500">⚠️ Hanya untuk kebutuhan teknis. Perubahan langsung di JSON dapat merusak konfigurasi.</p>
            <select v-model="jsonEditKey" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option v-for="s in rawSettings" :key="s.key" :value="s.key">{{ s.label || s.key }}</option>
            </select>
            <textarea v-model="jsonEditValue" rows="12" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none"></textarea>
            <button @click="saveJsonEdit" class="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Save JSON</button>
          </div>
        </div>
      </div>

      <!-- Save success -->
      <div v-if="saveSuccess" class="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">✓ Konfigurasi tersimpan.</div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../lib/supabase.js'

const categories = [
  { id: 'overview', label: 'Overview' },
  { id: 'plans', label: 'Plans & Pricing' },
  { id: 'trial', label: 'Trial & Promotions' },
  { id: 'storage', label: 'Storage' },
  { id: 'ads', label: 'Ads' },
  { id: 'review', label: 'In-App Review' },
  { id: 'privacy', label: 'Privacy & E2EE' },
  { id: 'protection', label: 'Protection' },
  { id: 'payment', label: 'Payment' },
  { id: 'json', label: 'Advanced JSON' },
]

const activeCategory = ref('overview')
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const saveSuccess = ref(false)
const isDirty = ref(false)

const rawSettings = ref([])
const settingsMap = ref({})
const data = ref({})
const originalData = ref({})
const paymentSettings = ref({})

// Landing page config
const landingConfig = ref({})
const landingSaving = ref(false)

// JSON editor
const jsonEditKey = ref('')
const jsonEditValue = ref('')

watch(jsonEditKey, (key) => {
  if (key && data.value[key]) {
    jsonEditValue.value = JSON.stringify(data.value[key], null, 2)
  }
})

function cfg(key) { return data.value[key] }

// Dynamic plan keys - discover from loaded data
const planKeys = computed(() => {
  return Object.keys(data.value).filter(k => k.startsWith('plans.')).sort((a, b) => {
    // Free first, then alphabetical
    if (a === 'plans.free') return -1
    if (b === 'plans.free') return 1
    return a.localeCompare(b)
  })
})

// Plan management state
const showAddPlan = ref(false)
const newPlanSlug = ref('')
const newPlanLabel = ref('')
const confirmRemovePlan = ref(null)

function toggleMemberLimit(planKey, event) {
  if (event.target.value === 'unlimited') {
    data.value[planKey].member_limit = -1
  } else {
    data.value[planKey].member_limit = 4
  }
  markDirty()
}

function removeFeature(planKey, index) {
  data.value[planKey].features.splice(index, 1)
  markDirty()
}

const allFeaturesList = [
  'Family Chat', 'Photos', 'Calendar', 'Finance Basic', 'Tasks', 'Shopping',
  'Meal Planner', 'Journey Basic', 'Parenting Basic', 'Health Basic', 'SOS',
  'Polling', 'Announcements', 'Memories', 'Vault', 'Time Capsule',
  'Parenting+', 'Safety+', 'Goals', 'Couple', 'Gifts', 'Pets', 'AI Assistant',
  'Priority Support', 'Admin Controls', 'Advanced Analytics', 'Unlimited Storage',
  'Screen Time', 'App Blocking', 'Website Filtering', 'Live Location', 'Safe Zone',
  'Webinar', 'Consultation',
]

function togglePlanFeature(planKey, feat, event) {
  if (!data.value[planKey].features) data.value[planKey].features = []
  if (event.target.checked) {
    if (!data.value[planKey].features.includes(feat)) {
      data.value[planKey].features.push(feat)
    }
  } else {
    data.value[planKey].features = data.value[planKey].features.filter(f => f !== feat)
  }
  markDirty()
}

// Storage helpers
const storageDisplayCache = {}

function getStorageDisplay(planKey) {
  if (!storageDisplayCache[planKey]) {
    const bytes = data.value[planKey]?.storage_bytes || 0
    let amount, unit
    if (bytes >= 1099511627776) { amount = Math.round(bytes / 1099511627776); unit = 'TB' }
    else if (bytes >= 1073741824) { amount = Math.round(bytes / 1073741824); unit = 'GB' }
    else { amount = Math.round(bytes / 1048576); unit = 'MB' }
    storageDisplayCache[planKey] = { amount, unit }
  }
  return storageDisplayCache[planKey]
}

function updateStorageBytes(planKey) {
  const display = getStorageDisplay(planKey)
  const multiplier = display.unit === 'TB' ? 1099511627776 : display.unit === 'GB' ? 1073741824 : 1048576
  data.value[planKey].storage_bytes = display.amount * multiplier
  data.value[planKey].storage_label = formatStorageLabel(data.value[planKey].storage_bytes)
  markDirty()
}

function onStorageUnlimitedChange(planKey) {
  if (data.value[planKey].storage_unlimited) {
    data.value[planKey].storage_bytes = -1
    data.value[planKey].storage_label = 'Tidak terbatas'
  } else {
    const display = getStorageDisplay(planKey)
    updateStorageBytes(planKey)
  }
  markDirty()
}

function formatStorageLabel(bytes) {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes >= 1099511627776) return Math.round(bytes / 1099511627776) + ' TB'
  if (bytes >= 1073741824) return Math.round(bytes / 1073741824) + ' GB'
  return Math.round(bytes / 1048576) + ' MB'
}

function addPriorityItem() {
  const name = window.prompt('Nama priority (contoh: referral):')
  if (name && name.trim()) {
    if (!data.value.promotion_rules.priority_order) data.value.promotion_rules.priority_order = []
    data.value.promotion_rules.priority_order.push(name.trim().toLowerCase().replace(/\s+/g, '_'))
    markDirty()
  }
}

function removePriorityItem(index) {
  data.value.promotion_rules.priority_order.splice(index, 1)
  markDirty()
}

function movePriority(index, direction) {
  const arr = data.value.promotion_rules.priority_order
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= arr.length) return
  const temp = arr[index]
  arr[index] = arr[newIndex]
  arr[newIndex] = temp
  markDirty()
}

// Ads placement management
const showAddPlacement = ref(false)
const newPlacementKey = ref('')
const newPlacementAndroid = ref('')
const newPlacementIos = ref('')

const allPlacements = [
  { value: 'chat_list', label: 'Chat List' },
  { value: 'more_menu', label: 'More Menu' },
  { value: 'tasks_hub', label: 'Tasks Hub' },
  { value: 'family_tab', label: 'Family Tab' },
  { value: 'finance_hub', label: 'Finance Hub' },
  { value: 'activity_feed', label: 'Activity Feed' },
  { value: 'memories_list', label: 'Memories List' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'quick_access', label: 'Quick Access' },
  { value: 'recent_activity', label: 'Recent Activity' },
  { value: 'home_banner', label: 'Home Banner' },
  { value: 'journey_list', label: 'Journey List' },
  { value: 'health_hub', label: 'Health Hub' },
  { value: 'shopping_list', label: 'Shopping List' },
  { value: 'meal_planner', label: 'Meal Planner' },
  { value: 'event_list', label: 'Event List' },
  { value: 'document_vault', label: 'Document Vault' },
  { value: 'pet_hub', label: 'Pet Hub' },
  { value: 'interstitial_after_action', label: 'Interstitial After Action' },
  { value: 'rewarded_bonus', label: 'Rewarded Bonus' },
]

const availablePlacements = computed(() => {
  const existing = Object.keys(data.value.admob_settings?.placement_units || {})
  return allPlacements.filter(p => !existing.includes(p.value))
})

function formatPlacementName(key) {
  return key.replace(/^in_|^after_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function isPlacementOn(key) {
  const val = data.value.admob_settings?.placement_units?.[key]
  return !!(val?.android || val?.ios)
}

function togglePlacement(key) {
  const val = data.value.admob_settings.placement_units[key]
  if (val.android || val.ios) {
    // Turn off - store in _backup and clear
    val._backup_android = val.android
    val._backup_ios = val.ios
    val.android = ''
    val.ios = ''
  } else {
    // Turn on - restore from backup if available
    val.android = val._backup_android || ''
    val.ios = val._backup_ios || ''
    delete val._backup_android
    delete val._backup_ios
  }
  markDirty()
}

function removePlacement(key) {
  if (!confirm(`Hapus placement "${formatPlacementName(key)}"?`)) return
  delete data.value.admob_settings.placement_units[key]
  markDirty()
}

function doAddPlacement() {
  const key = newPlacementKey.value.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  if (!key) return
  if (!data.value.admob_settings.placement_units) {
    data.value.admob_settings.placement_units = {}
  }
  if (data.value.admob_settings.placement_units[key]) {
    alert('Placement sudah ada')
    return
  }
  data.value.admob_settings.placement_units[key] = {
    android: newPlacementAndroid.value.trim(),
    ios: newPlacementIos.value.trim(),
  }
  markDirty()
  showAddPlacement.value = false
  newPlacementKey.value = ''
  newPlacementAndroid.value = ''
  newPlacementIos.value = ''
}

// Storage management
function addStorageAddon() {
  if (!data.value.storage_addons) data.value.storage_addons = []
  data.value.storage_addons.push({ plan_label: '', label: '', size_gb: 0, price_monthly_idr: 0, price_yearly_idr: 0, compare_price_monthly_idr: 0, compare_price_yearly_idr: 0 })
  markDirty()
}

function removeStorageAddon(index) {
  data.value.storage_addons.splice(index, 1)
  markDirty()
}

function addStorageSource() {
  const name = window.prompt('Nama source (snake_case):')
  if (name && name.trim()) {
    if (!data.value.storage_rules.sources) data.value.storage_rules.sources = []
    data.value.storage_rules.sources.push(name.trim().toLowerCase().replace(/\s+/g, '_'))
    markDirty()
  }
}

function removeStorageSource(index) {
  data.value.storage_rules.sources.splice(index, 1)
  markDirty()
}

function addWarningThreshold() {
  if (!data.value.storage_rules.warning_thresholds) data.value.storage_rules.warning_thresholds = []
  data.value.storage_rules.warning_thresholds.push(90)
  markDirty()
}

function removeWarningThreshold(index) {
  data.value.storage_rules.warning_thresholds.splice(index, 1)
  markDirty()
}

async function doAddPlan() {
  const slug = newPlanSlug.value.trim().toLowerCase().replace(/\s+/g, '_')
  if (!slug) return
  const key = `plans.${slug}`
  if (data.value[key]) { alert('Plan sudah ada'); return }

  const newPlan = {
    features: [],
    safe_zones: 1,
    ads_enabled: false,
    travel_pins: -1,
    member_limit: 4,
    wallet_limit: -1,
    storage_bytes: 1073741824,
    storage_label: '1 GB',
    price_yearly_idr: 0,
    price_monthly_idr: 0,
  }

  // Save to database
  const { error } = await supabase.from('kinora_subscription_settings').insert({
    key,
    value: newPlan,
    label: newPlanLabel.value || slug,
  })

  if (error) { alert(error.message); return }

  data.value[key] = newPlan
  originalData.value[key] = JSON.parse(JSON.stringify(newPlan))
  settingsMap.value[key] = { key, label: newPlanLabel.value || slug, value: newPlan }
  rawSettings.value.push({ key, label: newPlanLabel.value || slug, value: newPlan })

  showAddPlan.value = false
  newPlanSlug.value = ''
  newPlanLabel.value = ''
}

async function doRemovePlan() {
  const key = confirmRemovePlan.value
  if (!key || key === 'plans.free') return

  const { error } = await supabase.from('kinora_subscription_settings').delete().eq('key', key)
  if (error) { alert(error.message); confirmRemovePlan.value = null; return }

  delete data.value[key]
  delete originalData.value[key]
  delete settingsMap.value[key]
  rawSettings.value = rawSettings.value.filter(s => s.key !== key)
  confirmRemovePlan.value = null
}

function formatIDR(val) {
  if (!val && val !== 0) return '-'
  return 'Rp' + Number(val).toLocaleString('id-ID')
}

function markDirty() { isDirty.value = true }

// Auto-detect changes via deep watch
watch(data, () => {
  if (JSON.stringify(data.value) !== JSON.stringify(originalData.value)) {
    isDirty.value = true
  }
}, { deep: true })

function resetChanges() {
  data.value = JSON.parse(JSON.stringify(originalData.value))
  isDirty.value = false
}

async function loadSettings() {
  loading.value = true
  loadError.value = ''
  try {
    const [subRes, payRes, landRes] = await Promise.all([
      supabase.from('kinora_subscription_settings').select('key, value, label').order('key'),
      supabase.from('kinora_payment_settings').select('*').eq('id', 1).single(),
      supabase.from('kinora_landing_config').select('key, value, status').order('key'),
    ])
    if (subRes.error) throw new Error(subRes.error.message)
    rawSettings.value = subRes.data || []

    const map = {}
    const d = {}
    for (const s of rawSettings.value) {
      map[s.key] = s
      d[s.key] = JSON.parse(JSON.stringify(s.value))
    }
    settingsMap.value = map
    data.value = d
    originalData.value = JSON.parse(JSON.stringify(d))
    if (payRes.data) paymentSettings.value = payRes.data
    if (rawSettings.value.length > 0) jsonEditKey.value = rawSettings.value[0].key

    // Landing config
    const lc = {}
    for (const row of (landRes.data || [])) lc[row.key] = row.value
    landingConfig.value = lc
  } catch (e) {
    loadError.value = e.message
  }
  loading.value = false
}

// Promo Codes
const promoCodes = ref([])
const promoLoading = ref(false)
const showPromoEditor = ref(false)
const editingPromo = ref({})
const promoSaving = ref(false)
const promoError = ref('')
const confirmDeletePromo = ref(null)

function newPromoTemplate() {
  return {
    code: '',
    code_type: 'trial',
    trial_days: 7,
    max_redemptions: null,
    discount_percent: 0,
    bonus_storage_bytes: 0,
    expires_at: null,
    note: '',
    is_active: true,
    grants_founder_badge: false,
    one_time_per_user: true,
    one_time_per_family: true,
    target_plan: 'family_plus',
    duration_unit: 'day',
  }
}

async function loadPromoCodes() {
  promoLoading.value = true
  const { data: codes } = await supabase
    .from('kinora_trial_promo_codes')
    .select('*')
    .order('created_at', { ascending: false })
  promoCodes.value = codes || []
  promoLoading.value = false
}

async function savePromo() {
  promoError.value = ''
  if (!editingPromo.value.code?.trim()) { promoError.value = 'Code wajib diisi'; return }

  promoSaving.value = true
  const payload = { ...editingPromo.value }
  payload.code = payload.code.toUpperCase().trim()
  if (!payload.max_redemptions) payload.max_redemptions = null
  if (!payload.expires_at) payload.expires_at = null

  let result
  if (payload.id) {
    const { id, created_at, redemption_count, updated_at, ...rest } = payload
    result = await supabase.from('kinora_trial_promo_codes').update(rest).eq('id', id)
  } else {
    result = await supabase.from('kinora_trial_promo_codes').insert(payload)
  }

  if (result.error) {
    promoError.value = result.error.message.includes('unique') ? 'Code sudah digunakan.' : result.error.message
  } else {
    showPromoEditor.value = false
    loadPromoCodes()
  }
  promoSaving.value = false
}

async function togglePromoActive(p) {
  await supabase.from('kinora_trial_promo_codes').update({ is_active: !p.is_active }).eq('id', p.id)
  loadPromoCodes()
}

function formatPromoType(type) {
  const map = { trial: 'Trial', discount: 'Discount', founder: 'Founder', family_invite: 'Family Invite', access_pass: 'Access Pass' }
  return map[type] || type
}

async function doDeletePromo() {
  if (!confirmDeletePromo.value) return
  await supabase.from('kinora_trial_promo_codes').delete().eq('id', confirmDeletePromo.value.id)
  confirmDeletePromo.value = null
  loadPromoCodes()
}

async function saveAll() {
  saving.value = true
  saveSuccess.value = false
  let errors = []
  try {
    for (const key of Object.keys(data.value)) {
      const original = JSON.stringify(originalData.value[key])
      const current = JSON.stringify(data.value[key])
      if (original !== current) {
        const res = await supabase.rpc('founder_save_setting', {
          p_key: key,
          p_value: data.value[key],
        })
        if (res.error) {
          errors.push(`${key}: ${res.error.message}`)
        }
      }
    }
    // Save payment settings
    const { id, ...rest } = paymentSettings.value
    const { error: payErr } = await supabase.from('kinora_payment_settings').update(rest).eq('id', 1)
    if (payErr) errors.push(`payment: ${payErr.message}`)

    if (errors.length === 0) {
      originalData.value = JSON.parse(JSON.stringify(data.value))
      isDirty.value = false
      saveSuccess.value = true
      setTimeout(() => saveSuccess.value = false, 3000)
    } else {
      loadError.value = errors.join(' | ')
      setTimeout(() => loadError.value = '', 8000)
    }
  } catch (e) {
    loadError.value = 'Save error: ' + e.message
  }
  saving.value = false
}

async function saveLandingKey(key) {
  landingSaving.value = true
  const { error } = await supabase.from('kinora_landing_config').update({ value: landingConfig.value[key], updated_at: new Date().toISOString() }).eq('key', key)
  if (error) alert('Error: ' + error.message)
  else { saveSuccess.value = true; setTimeout(() => saveSuccess.value = false, 3000) }
  landingSaving.value = false
}

async function saveJsonEdit() {
  try {
    const parsed = JSON.parse(jsonEditValue.value)
    data.value[jsonEditKey.value] = parsed
    await supabase.from('kinora_subscription_settings')
      .update({ value: parsed, updated_at: new Date().toISOString() })
      .eq('key', jsonEditKey.value)
    originalData.value[jsonEditKey.value] = JSON.parse(JSON.stringify(parsed))
    saveSuccess.value = true
    setTimeout(() => saveSuccess.value = false, 3000)
  } catch (e) {
    alert('Invalid JSON: ' + e.message)
  }
}

onMounted(() => {
  loadSettings()
  loadPromoCodes()
})
</script>
