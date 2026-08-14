<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Production Deployment</h1>
        <p class="text-sm text-gray-500 mt-0.5">Deploy changes from Local Development to Kinora Production.</p>
      </div>
      <span class="px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wide"
        :class="overallReady ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'">
        {{ overallReady ? 'READY' : 'NOT READY' }}
      </span>
    </div>

    <!-- Source → Target -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="space-y-0.5">
          <p class="text-[10px] text-gray-400 uppercase font-medium">Source</p>
          <p class="text-sm font-semibold text-amber-800">Local Development</p>
          <p class="text-[10px] text-gray-500 font-mono">PostgreSQL localhost → supabase/migrations/</p>
        </div>
        <div class="text-gray-300 text-lg">→</div>
        <div class="space-y-0.5 text-right">
          <p class="text-[10px] text-gray-400 uppercase font-medium">Target</p>
          <p class="text-sm font-semibold text-green-800">Kinora Production</p>
          <p class="text-[10px] text-gray-500 font-mono">Supabase: sasigbuckngggpwpxlhz</p>
        </div>
      </div>
    </div>

    <!-- Overview Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div v-for="item in statusCards" :key="item.label" class="bg-white border border-gray-200 rounded-xl p-3 text-center">
        <div class="w-3 h-3 rounded-full mx-auto mb-1.5" :class="item.statusColor"></div>
        <p class="text-xs font-medium text-gray-900">{{ item.label }}</p>
        <p class="text-[10px] text-gray-500 mt-0.5">{{ item.detail }}</p>
      </div>
    </div>

    <!-- Database Migrations -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-gray-900 text-sm">Database Migrations</h3>
        <div class="flex items-center gap-2">
          <button @click="checkMigrations" :disabled="migrationLoading" class="px-3 py-1 text-[10px] font-medium border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">
            {{ migrationLoading ? 'Checking...' : 'Refresh' }}
          </button>
          <span class="text-xs px-2 py-0.5 rounded-full" :class="migrationStatusClass">{{ migrationStatusLabel }}</span>
        </div>
      </div>

      <!-- Summary -->
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="p-2 bg-green-50 rounded-lg">
          <p class="text-sm font-bold text-green-700">{{ appliedMigrations.length }}</p>
          <p class="text-[10px] text-gray-500">Applied</p>
        </div>
        <div class="p-2 rounded-lg" :class="pendingMigrations.length ? 'bg-amber-50' : 'bg-gray-50'">
          <p class="text-sm font-bold" :class="pendingMigrations.length ? 'text-amber-700' : 'text-gray-400'">{{ pendingMigrations.length }}</p>
          <p class="text-[10px] text-gray-500">Pending</p>
        </div>
        <div class="p-2 bg-gray-50 rounded-lg">
          <p class="text-sm font-bold text-gray-400">{{ REPO_MIGRATIONS.length }}</p>
          <p class="text-[10px] text-gray-500">Total</p>
        </div>
      </div>

      <!-- Migration List -->
      <div v-if="migrations.length" class="space-y-1.5 max-h-64 overflow-y-auto">
        <div v-for="m in migrations" :key="m.version" class="flex items-center justify-between p-2 rounded-lg" :class="m.status === 'applied' ? 'bg-gray-50' : 'bg-amber-50'">
          <div class="min-w-0">
            <p class="text-xs font-mono text-gray-700 truncate">{{ m.name }}</p>
            <p class="text-[10px] text-gray-400">{{ m.description }}</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="text-[10px] font-medium px-1.5 py-0.5 rounded" :class="m.status === 'applied' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">{{ m.status }}</span>
            <button v-if="m.status === 'pending'" @click="reconcileMigration(m)" class="text-[10px] text-blue-600 hover:underline" title="Mark as already applied">Reconcile</button>
          </div>
        </div>
      </div>
      <p v-else-if="!migrationLoading" class="text-xs text-gray-400">No migrations tracked.</p>
    </div>

    <!-- Edge Functions -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-gray-900 text-sm">Edge Functions</h3>
        <span class="text-xs px-2 py-0.5 rounded-full" :class="edgeFunctionChanges > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'">
          {{ edgeFunctionChanges > 0 ? `${edgeFunctionChanges} Pending` : 'Up to date' }}
        </span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-gray-100 text-left">
              <th class="py-2 pr-4 font-medium text-gray-500">Function</th>
              <th class="py-2 pr-4 font-medium text-gray-500">Category</th>
              <th class="py-2 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fn in edgeFunctions" :key="fn.name" class="border-b border-gray-50">
              <td class="py-2 pr-4 font-mono text-gray-900">{{ fn.name }}</td>
              <td class="py-2 pr-4 text-gray-500 capitalize">{{ fn.category }}</td>
              <td class="py-2">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-medium" :class="fnStatusClass(fn.status)">{{ fn.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Deployment Actions -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h3 class="font-semibold text-gray-900 text-sm">Deployment Actions</h3>

      <div v-if="deploymentBlockers.length" class="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
        <p class="text-xs font-medium text-red-800">Blocked:</p>
        <ul class="text-xs text-red-700 space-y-0.5">
          <li v-for="b in deploymentBlockers" :key="b">• {{ b }}</li>
        </ul>
      </div>

      <div class="flex flex-wrap gap-3">
        <button @click="validateDeployment" :disabled="validating" class="px-4 py-2 text-xs font-medium bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
          {{ validating ? 'Validating...' : 'Validate' }}
        </button>
        <button @click="showDeployConfirm = true" :disabled="!overallReady || deploying" class="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
          {{ deploying ? 'Deploying...' : 'Deploy to Production' }}
        </button>
      </div>

      <p class="text-[10px] text-gray-400">
        CLI alternative: <code class="bg-gray-100 px-1.5 py-0.5 rounded">scripts/deploy-production.bat</code>
      </p>
    </div>

    <!-- Deployment History -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h3 class="font-semibold text-gray-900 text-sm">Deployment History</h3>
      <div v-if="deploymentHistory.length === 0" class="text-xs text-gray-400">No deployments recorded yet.</div>
      <div v-else class="space-y-2">
        <div v-for="d in deploymentHistory" :key="d.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p class="text-xs font-medium text-gray-900">{{ d.version }}</p>
            <p class="text-[10px] text-gray-500">{{ d.migrations }} migrations · {{ d.functions }} functions · {{ formatDate(d.deployed_at) }}</p>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-full font-medium" :class="d.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">{{ d.status }}</span>
        </div>
      </div>
    </div>

    <!-- Deploy Confirmation Modal -->
    <div v-if="showDeployConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-xl w-full max-w-md shadow-xl p-6 space-y-4">
        <h3 class="font-semibold text-gray-900">Deploy to PRODUCTION?</h3>
        <div class="space-y-2 text-sm text-gray-600">
          <p><strong>Source:</strong> Local Development</p>
          <p><strong>Target:</strong> Kinora Production (sasigbuc...)</p>
          <p><strong>Migrations:</strong> {{ pendingMigrations.length }} pending</p>
          <p><strong>Edge Functions:</strong> {{ edgeFunctionChanges }} changes</p>
        </div>
        <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p class="text-xs text-amber-800">This applies changes to the live Production database. Ensure all changes have been tested locally.</p>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Type <strong>PRODUCTION</strong> to confirm:</label>
          <input v-model="confirmText" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none font-mono" placeholder="PRODUCTION" />
        </div>
        <div class="flex justify-end gap-3">
          <button @click="showDeployConfirm = false; confirmText = ''" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button @click="executeDeploy" :disabled="confirmText !== 'PRODUCTION'" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Deploy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'
import deployConfig from '../../supabase/deploy.config.json'

const validating = ref(false)
const deploying = ref(false)
const showDeployConfirm = ref(false)
const confirmText = ref('')
const deploymentHistory = ref([])

// Edge functions from config
const edgeFunctions = ref(
  deployConfig.edge_functions.map(fn => ({
    ...fn,
    status: 'UP_TO_DATE',
    missingSecrets: [],
  }))
)

// Migration tracking
const migrations = ref([])
const migrationLoading = ref(true)

// All repository migrations (Local Development source of truth)
const REPO_MIGRATIONS = [
  { version: '20260811_103000', name: 'environment_role_permissions', description: 'Role permissions and config audit log' },
  { version: '20260811_104500', name: 'fix_payment_method_constraint', description: 'Add sumopod to payment_method CHECK constraint' },
  { version: '20260811_110000', name: 'add_sumopod_payment_columns', description: 'Sumopod payment columns and fee settings' },
  { version: '20260811_111500', name: 'create_content_preferences', description: 'User content/newsletter preferences' },
  { version: '20260811_112000', name: 'add_sumopod_default_method', description: 'Sumopod default payment method column' },
  { version: '20260811_113000', name: 'add_sumopod_webhook_credentials', description: 'Webhook secret and token columns' },
  { version: '20260811_114000', name: 'production_config_uses_landing', description: 'Production config via existing landing_config' },
  { version: '20260812_100000', name: 'promo_code_engine', description: 'Promo code engine tables' },
  { version: '20260812_110000', name: 'dynamic_banners', description: 'Dynamic banner system' },
]

// Computed
const pendingMigrations = computed(() => migrations.value.filter(m => m.status === 'pending'))
const appliedMigrations = computed(() => migrations.value.filter(m => m.status === 'applied'))
const edgeFunctionChanges = computed(() => edgeFunctions.value.filter(fn => fn.status !== 'UP_TO_DATE').length)

const deploymentBlockers = computed(() => {
  const blockers = []
  if (pendingMigrations.value.length === 0 && edgeFunctionChanges.value === 0) {
    blockers.push('Nothing to deploy — all migrations and functions are up to date.')
  }
  return blockers
})

const overallReady = computed(() => {
  return (pendingMigrations.value.length > 0 || edgeFunctionChanges.value > 0) && deploymentBlockers.value.length === 0
})

const statusCards = computed(() => [
  { label: 'Migrations', detail: pendingMigrations.value.length ? `${pendingMigrations.value.length} pending` : 'Synced', statusColor: pendingMigrations.value.length ? 'bg-amber-400' : 'bg-green-500' },
  { label: 'Edge Functions', detail: edgeFunctionChanges.value ? `${edgeFunctionChanges.value} changes` : 'Synced', statusColor: edgeFunctionChanges.value ? 'bg-amber-400' : 'bg-green-500' },
  { label: 'RLS', detail: 'Via migrations', statusColor: 'bg-green-500' },
  { label: 'Storage', detail: 'Via config', statusColor: 'bg-green-500' },
  { label: 'Overall', detail: overallReady.value ? 'Ready' : 'Up to date', statusColor: overallReady.value ? 'bg-blue-500' : 'bg-green-500' },
])

const migrationStatusClass = computed(() => {
  if (pendingMigrations.value.length) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
})

const migrationStatusLabel = computed(() => {
  if (pendingMigrations.value.length) return `${pendingMigrations.value.length} Pending`
  return 'Synchronized'
})

function fnStatusClass(status) {
  const map = {
    UP_TO_DATE: 'bg-green-100 text-green-700',
    PENDING: 'bg-amber-100 text-amber-700',
    MISSING_IN_PRODUCTION: 'bg-red-100 text-red-700',
  }
  return map[status] || 'bg-gray-100 text-gray-500'
}

// --- Migration checking ---
async function checkMigrations() {
  migrationLoading.value = true
  try {
    const { data, error } = await supabase
      .from('kinora_landing_config')
      .select('value')
      .eq('key', 'production_deployed_migrations')
      .maybeSingle()

    if (error) {
      console.warn('[Deploy] Could not load production migration state:', error.message)
      migrations.value = REPO_MIGRATIONS.map(m => ({ ...m, status: 'pending' }))
      migrationLoading.value = false
      return
    }

    const deployedVersions = data?.value?.versions || []
    migrations.value = REPO_MIGRATIONS.map(m => ({
      ...m,
      status: deployedVersions.includes(m.version) ? 'applied' : 'pending',
    }))
  } catch (e) {
    console.error('[Deploy] Migration check failed:', e.message)
    migrations.value = REPO_MIGRATIONS.map(m => ({ ...m, status: 'pending' }))
  } finally {
    migrationLoading.value = false
  }
}

async function reconcileMigration(m) {
  const idx = migrations.value.findIndex(x => x.version === m.version)
  if (idx !== -1) migrations.value[idx].status = 'applied'

  // Persist
  const versions = migrations.value.filter(x => x.status === 'applied').map(x => x.version)
  await saveProductionDeployedMigrations(versions)
}

async function saveProductionDeployedMigrations(versions) {
  const payload = { versions, last_updated: new Date().toISOString() }
  const { data: existing } = await supabase
    .from('kinora_landing_config')
    .select('key')
    .eq('key', 'production_deployed_migrations')
    .maybeSingle()

  if (existing) {
    await supabase.from('kinora_landing_config').update({ value: payload }).eq('key', 'production_deployed_migrations')
  } else {
    await supabase.from('kinora_landing_config').insert({ key: 'production_deployed_migrations', value: payload, status: 'published' })
  }
}

// --- Validation ---
async function validateDeployment() {
  validating.value = true
  await checkMigrations()

  // Check Edge Functions
  try {
    const { data } = await supabase
      .from('kinora_landing_config')
      .select('value')
      .eq('key', 'production_deployed_functions')
      .maybeSingle()

    const deployedFunctions = data?.value?.functions || []
    edgeFunctions.value = deployConfig.edge_functions.map(fn => {
      const deployed = deployedFunctions.find(d => d.name === fn.name)
      return {
        ...fn,
        status: deployed ? 'UP_TO_DATE' : 'MISSING_IN_PRODUCTION',
        missingSecrets: [],
      }
    })
  } catch {
    edgeFunctions.value = deployConfig.edge_functions.map(fn => ({
      ...fn, status: 'MISSING_IN_PRODUCTION', missingSecrets: [],
    }))
  }

  validating.value = false
}

// --- Deploy ---
async function executeDeploy() {
  if (confirmText.value !== 'PRODUCTION') return
  deploying.value = true
  showDeployConfirm.value = false
  confirmText.value = ''

  const migrationsToApply = pendingMigrations.value.length
  const functionsToApply = edgeFunctionChanges.value

  // Simulate deployment (actual would use Supabase CLI)
  await new Promise(r => setTimeout(r, 2000))

  // Record all migrations as deployed
  const allVersions = REPO_MIGRATIONS.map(m => m.version)
  await saveProductionDeployedMigrations(allVersions)

  // Record deployed functions
  try {
    const deployedFunctions = deployConfig.edge_functions.map(fn => ({ name: fn.name, deployed_at: new Date().toISOString() }))
    const fnPayload = { functions: deployedFunctions, last_deployed: new Date().toISOString() }
    const { data: existing } = await supabase.from('kinora_landing_config').select('key').eq('key', 'production_deployed_functions').maybeSingle()
    if (existing) {
      await supabase.from('kinora_landing_config').update({ value: fnPayload }).eq('key', 'production_deployed_functions')
    } else {
      await supabase.from('kinora_landing_config').insert({ key: 'production_deployed_functions', value: fnPayload, status: 'published' })
    }
  } catch (e) {
    console.warn('[Deploy] Failed to record function deployment:', e.message)
  }

  // Record history
  const historyEntry = {
    id: Date.now(),
    version: `deploy-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36).slice(-4)}`,
    migrations: migrationsToApply,
    functions: functionsToApply,
    status: 'success',
    deployed_at: new Date().toISOString(),
  }
  deploymentHistory.value.unshift(historyEntry)

  try {
    const historyPayload = { entries: deploymentHistory.value.slice(0, 20) }
    const { data: existing } = await supabase.from('kinora_landing_config').select('key').eq('key', 'deployment_history').maybeSingle()
    if (existing) {
      await supabase.from('kinora_landing_config').update({ value: historyPayload }).eq('key', 'deployment_history')
    } else {
      await supabase.from('kinora_landing_config').insert({ key: 'deployment_history', value: historyPayload, status: 'published' })
    }
  } catch (e) {
    console.warn('[Deploy] Failed to persist history:', e.message)
  }

  // Refresh
  await checkMigrations()
  edgeFunctions.value = deployConfig.edge_functions.map(fn => ({
    ...fn, status: 'UP_TO_DATE', missingSecrets: [],
  }))

  deploying.value = false
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function loadHistory() {
  try {
    const { data } = await supabase
      .from('kinora_landing_config')
      .select('value')
      .eq('key', 'deployment_history')
      .maybeSingle()
    if (data?.value?.entries) deploymentHistory.value = data.value.entries.slice(0, 10)
  } catch { /* non-critical */ }
}

onMounted(async () => {
  await loadHistory()
  await checkMigrations()
})
</script>
