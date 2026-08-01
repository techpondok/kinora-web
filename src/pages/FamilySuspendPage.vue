<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Suspensi Keluarga</h1>
      <div class="flex gap-2">
        <select v-model="filterLevel" @change="loadData" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Semua Level</option>
          <option value="restricted">Restricted</option>
          <option value="full_suspension">Full Suspension</option>
          <option value="emergency_only">Emergency Only</option>
        </select>
        <select v-model="filterStatus" @change="loadData" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Semua Status</option>
          <option value="active">Active</option>
          <option value="restricted">Restricted</option>
          <option value="suspended">Suspended</option>
          <option value="archived">Archived</option>
        </select>
      </div>
    </div>

    <input v-model="search" @input="loadData" type="text" placeholder="Cari nama keluarga..." class="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />

    <div v-if="loading" class="text-center py-8 text-gray-500">Memuat...</div>
    <div v-else-if="families.length === 0" class="bg-white rounded-xl border p-12 text-center text-gray-500">Tidak ada keluarga yang cocok.</div>

    <div v-else class="space-y-3">
      <div v-for="f in families" :key="f.id" class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">🏠</div>
            <div>
              <p class="font-medium text-gray-900 text-sm">{{ f.name }}</p>
              <p class="text-xs text-gray-500">{{ f.member_count }} anggota · {{ f.subscription_plan }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span :class="statusBadge(f.suspension_status)" class="px-2 py-0.5 text-xs rounded-full font-medium">{{ f.suspension_status }}</span>
            <div class="relative">
              <button @click="openMenu = openMenu === f.id ? null : f.id" class="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded">⋮</button>
              <div v-if="openMenu === f.id" class="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48 z-10">
                <button @click="openMenu=null; suspendTarget=f" v-if="f.suspension_status==='active'" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Suspend Family</button>
                <button @click="openMenu=null; reactivateTarget=f" v-if="f.suspension_status!=='active'" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Reactivate</button>
                <button @click="openMenu=null; changeLevelTarget=f" v-if="f.suspension_status!=='active'" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Change Level</button>
                <button @click="openMenu=null; extendTarget=f" v-if="f.suspension_status!=='active'" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Extend Duration</button>
                <button @click="openMenu=null; historyTarget=f" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">View History</button>
              </div>
            </div>
          </div>
        </div>
        <!-- Active suspension info -->
        <div v-if="f.active_suspension" class="mt-3 p-3 bg-red-50 rounded-lg text-xs text-red-700 space-y-1">
          <p><strong>Level:</strong> {{ f.active_suspension.level }}</p>
          <p><strong>Alasan:</strong> {{ f.active_suspension.reason }}</p>
          <p v-if="f.active_suspension.end_date"><strong>Berakhir:</strong> {{ formatDate(f.active_suspension.end_date) }}</p>
        </div>
      </div>
    </div>

    <!-- Suspend Modal -->
    <div v-if="suspendTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-4">
        <h3 class="font-semibold text-gray-900">Suspend: {{ suspendTarget.name }}</h3>
        <div v-if="modalError" class="p-2 bg-red-50 text-red-700 text-xs rounded">{{ modalError }}</div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Level *</label>
          <select v-model="suspendForm.level" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="restricted">Restricted</option>
            <option value="full_suspension">Full Suspension</option>
            <option value="emergency_only">Emergency Only</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Alasan *</label>
          <textarea v-model="suspendForm.reason" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Pesan untuk User</label>
          <textarea v-model="suspendForm.user_message" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Catatan Admin</label>
          <input v-model="suspendForm.admin_notes" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs text-gray-500 mb-1">Berakhir (opsional)</label><input v-model="suspendForm.end_date" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <label class="flex items-center gap-2 text-sm pt-5"><input type="checkbox" v-model="suspendForm.auto_reactivate" class="rounded" /> Auto Reactivate</label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="suspendForm.allow_appeal" class="rounded" /> Izinkan Banding</label>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="suspendForm.block_payments" class="rounded" /> Blokir Pembayaran</label>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="suspendForm.block_invitations" class="rounded" /> Blokir Undangan</label>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="suspendForm.block_device_commands" class="rounded" /> Blokir Device</label>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="suspendForm.keep_emergency_access" class="rounded" /> Pertahankan Emergency</label>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button @click="suspendTarget=null; modalError=''" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
          <button @click="doSuspend" :disabled="modalLoading" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{{ modalLoading ? 'Processing...' : 'Suspend' }}</button>
        </div>
      </div>
    </div>

    <!-- Reactivate Modal -->
    <div v-if="reactivateTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-xl w-full max-w-md shadow-xl p-6 space-y-4">
        <h3 class="font-semibold text-gray-900">Reactivate: {{ reactivateTarget.name }}</h3>
        <div v-if="modalError" class="p-2 bg-red-50 text-red-700 text-xs rounded">{{ modalError }}</div>
        <div><label class="block text-xs text-gray-500 mb-1">Alasan *</label><textarea v-model="reactivateForm.reason" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="reactivateForm.restore_subscription" class="rounded" /> Pulihkan Subscription</label>
        <div><label class="block text-xs text-gray-500 mb-1">Catatan</label><input v-model="reactivateForm.notes" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <div class="flex justify-end gap-3">
          <button @click="reactivateTarget=null; modalError=''" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
          <button @click="doReactivate" :disabled="modalLoading" class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">Reactivate</button>
        </div>
      </div>
    </div>

    <!-- Change Level Modal -->
    <div v-if="changeLevelTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-xl w-full max-w-md shadow-xl p-6 space-y-4">
        <h3 class="font-semibold text-gray-900">Change Level: {{ changeLevelTarget.name }}</h3>
        <div v-if="modalError" class="p-2 bg-red-50 text-red-700 text-xs rounded">{{ modalError }}</div>
        <div><label class="block text-xs text-gray-500 mb-1">Level Baru</label>
          <select v-model="newLevel" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="restricted">Restricted</option><option value="full_suspension">Full Suspension</option><option value="emergency_only">Emergency Only</option></select>
        </div>
        <div><label class="block text-xs text-gray-500 mb-1">Alasan *</label><textarea v-model="levelReason" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
        <div class="flex justify-end gap-3">
          <button @click="changeLevelTarget=null" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
          <button @click="doChangeLevel" :disabled="modalLoading" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Ubah</button>
        </div>
      </div>
    </div>

    <!-- Extend Modal -->
    <div v-if="extendTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-xl w-full max-w-md shadow-xl p-6 space-y-4">
        <h3 class="font-semibold text-gray-900">Extend: {{ extendTarget.name }}</h3>
        <div v-if="modalError" class="p-2 bg-red-50 text-red-700 text-xs rounded">{{ modalError }}</div>
        <div><label class="block text-xs text-gray-500 mb-1">Tanggal Berakhir Baru</label><input v-model="extendDate" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <div><label class="block text-xs text-gray-500 mb-1">Alasan</label><input v-model="extendReason" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <div class="flex justify-end gap-3">
          <button @click="extendTarget=null" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
          <button @click="doExtend" :disabled="modalLoading" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Extend</button>
        </div>
      </div>
    </div>

    <!-- History Modal -->
    <div v-if="historyTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl p-6 space-y-4">
        <div class="flex items-center justify-between"><h3 class="font-semibold text-gray-900">History: {{ historyTarget.name }}</h3><button @click="historyTarget=null" class="text-gray-400 hover:text-gray-700">✕</button></div>
        <div v-if="historyLoading" class="text-center py-4 text-gray-500">Memuat...</div>
        <div v-else-if="historyData.length === 0" class="text-center py-4 text-gray-400">Tidak ada riwayat.</div>
        <div v-else class="space-y-2">
          <div v-for="h in historyData" :key="h.id" class="p-3 bg-gray-50 rounded-lg text-sm">
            <div class="flex items-center justify-between"><span class="font-medium text-gray-700">{{ h.action }}</span><span class="text-xs text-gray-400">{{ formatDate(h.created_at) }}</span></div>
            <p v-if="h.new_data?.reason" class="text-xs text-gray-500 mt-1">{{ h.new_data.reason }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const families = ref([])
const loading = ref(true)
const search = ref('')
const filterLevel = ref('')
const filterStatus = ref('')
const openMenu = ref(null)

// Modals
const suspendTarget = ref(null)
const reactivateTarget = ref(null)
const changeLevelTarget = ref(null)
const extendTarget = ref(null)
const historyTarget = ref(null)
const modalLoading = ref(false)
const modalError = ref('')

// Forms
const suspendForm = ref({ level: 'restricted', reason: '', user_message: '', admin_notes: '', end_date: '', auto_reactivate: false, allow_appeal: true, block_payments: false, block_invitations: true, block_device_commands: false, keep_emergency_access: true })
const reactivateForm = ref({ reason: '', restore_subscription: true, notes: '' })
const newLevel = ref('restricted')
const levelReason = ref('')
const extendDate = ref('')
const extendReason = ref('')
const historyData = ref([])
const historyLoading = ref(false)

function statusBadge(s) {
  const m = { active: 'bg-green-100 text-green-700', under_review: 'bg-yellow-100 text-yellow-700', restricted: 'bg-orange-100 text-orange-700', suspended: 'bg-red-100 text-red-700', archived: 'bg-gray-100 text-gray-500' }
  return m[s] || 'bg-gray-100 text-gray-600'
}
function formatDate(d) { return d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-' }

async function loadData() {
  loading.value = true
  let q = supabase.from('families').select('id, name, member_count, subscription_plan, suspension_status, is_active, created_at').order('updated_at', { ascending: false })
  if (filterStatus.value) q = q.eq('suspension_status', filterStatus.value)
  if (search.value) q = q.ilike('name', `%${search.value}%`)
  const { data } = await q.limit(50)

  // Load active suspensions
  const famIds = (data || []).map(f => f.id)
  let suspensions = []
  if (famIds.length) {
    const { data: sData } = await supabase.from('family_suspensions').select('family_id, level, reason, end_date').eq('status', 'active').in('family_id', famIds)
    suspensions = sData || []
  }
  const suspMap = {}
  for (const s of suspensions) suspMap[s.family_id] = s

  // Filter by level if needed
  let result = (data || []).map(f => ({ ...f, active_suspension: suspMap[f.id] || null }))
  if (filterLevel.value) result = result.filter(f => f.active_suspension?.level === filterLevel.value)

  families.value = result
  loading.value = false
}

async function doSuspend() {
  if (!suspendForm.value.reason) { modalError.value = 'Alasan wajib diisi'; return }
  modalLoading.value = true; modalError.value = ''
  const { data, error } = await supabase.rpc('founder_suspend_family', {
    p_family_id: suspendTarget.value.id,
    p_level: suspendForm.value.level,
    p_reason: suspendForm.value.reason,
    p_admin_notes: suspendForm.value.admin_notes || null,
    p_user_message: suspendForm.value.user_message || null,
    p_end_date: suspendForm.value.end_date || null,
    p_auto_reactivate: suspendForm.value.auto_reactivate,
    p_allow_appeal: suspendForm.value.allow_appeal,
    p_config: { block_payments: suspendForm.value.block_payments, block_invitations: suspendForm.value.block_invitations, block_device_commands: suspendForm.value.block_device_commands, keep_emergency_access: suspendForm.value.keep_emergency_access }
  })
  if (error) { modalError.value = error.message } else { suspendTarget.value = null; loadData() }
  modalLoading.value = false
}

async function doReactivate() {
  if (!reactivateForm.value.reason) { modalError.value = 'Alasan wajib diisi'; return }
  modalLoading.value = true; modalError.value = ''
  const { error } = await supabase.rpc('founder_reactivate_family', {
    p_family_id: reactivateTarget.value.id,
    p_reason: reactivateForm.value.reason,
    p_restore_subscription: reactivateForm.value.restore_subscription,
    p_notes: reactivateForm.value.notes || null
  })
  if (error) { modalError.value = error.message } else { reactivateTarget.value = null; loadData() }
  modalLoading.value = false
}

async function doChangeLevel() {
  if (!levelReason.value) { modalError.value = 'Alasan wajib diisi'; return }
  modalLoading.value = true; modalError.value = ''
  const { error } = await supabase.rpc('founder_change_suspension_level', { p_family_id: changeLevelTarget.value.id, p_new_level: newLevel.value, p_reason: levelReason.value })
  if (error) { modalError.value = error.message } else { changeLevelTarget.value = null; loadData() }
  modalLoading.value = false
}

async function doExtend() {
  if (!extendDate.value) { modalError.value = 'Tanggal wajib diisi'; return }
  modalLoading.value = true; modalError.value = ''
  const { error } = await supabase.rpc('founder_extend_suspension', { p_family_id: extendTarget.value.id, p_new_end_date: new Date(extendDate.value).toISOString(), p_reason: extendReason.value || 'Extended' })
  if (error) { modalError.value = error.message } else { extendTarget.value = null; loadData() }
  modalLoading.value = false
}

async function loadHistory() {
  historyLoading.value = true
  const { data } = await supabase.from('audit_logs').select('id, action, new_data, created_at').eq('family_id', historyTarget.value.id).in('action', ['family.suspend','family.reactivate','family.level_change','family.extend']).order('created_at', { ascending: false }).limit(50)
  historyData.value = data || []
  historyLoading.value = false
}

import { watch } from 'vue'
watch(historyTarget, (v) => { if (v) loadHistory() })

onMounted(loadData)
</script>
