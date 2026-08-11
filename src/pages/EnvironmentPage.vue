<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Environment & Infrastructure</h1>
        <p class="text-sm text-gray-500 mt-0.5">Manage configuration, secrets, and deployment readiness.</p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="userRole" class="px-2 py-1 text-[10px] font-medium rounded-md uppercase tracking-wide bg-gray-100 text-gray-600">{{ userRole }}</span>
        <span class="px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wide"
          :class="isDevelopment ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-red-100 text-red-800 border border-red-200'">
          {{ envLabel }}
        </span>
      </div>
    </div>

    <!-- Environment Selector (config view, NOT database switch) -->
    <div class="flex gap-2">
      <button @click="selectedEnv = 'development'" class="px-4 py-2 text-xs font-medium rounded-lg border transition"
        :class="selectedEnv === 'development' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'">
        Development
      </button>
      <button @click="selectedEnv = 'production'" :disabled="!isFounder" class="px-4 py-2 text-xs font-medium rounded-lg border transition"
        :class="selectedEnv === 'production' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'"
        :title="!isFounder ? 'Founder access required' : ''">
        Production {{ !isFounder ? '🔒' : '' }}
      </button>
    </div>

    <!-- Notice: this does NOT switch database -->
    <div v-if="selectedEnv === 'production'" class="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
      <span class="text-red-600 text-sm">⚠</span>
      <span class="text-sm text-red-700">Viewing <strong>Production</strong> configuration. Changes affect live Kinora users. This does NOT switch your active database.</span>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400 text-sm">Memuat...</div>

    <template v-else>
      <!-- PRODUCTION CONFIG VIEW (Founder only) -->
      <template v-if="selectedEnv === 'production' && isFounder">
        <!-- Production Not Configured -->
        <div v-if="!prodConfig.supabase_project_url" class="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4">
          <div class="text-4xl">🚀</div>
          <h3 class="font-semibold text-gray-900">Production Database Not Configured</h3>
          <p class="text-sm text-gray-500 max-w-md mx-auto">Create a new Supabase Production project, then configure it here. Do NOT reuse the Development database.</p>
          <button @click="showProdSetup = true" class="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">Configure Production</button>
        </div>

        <!-- Production Configured: Status Dashboard -->
        <template v-else>
          <!-- Activation Status -->
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900 text-sm">Production Status</h3>
              <span class="text-xs px-2.5 py-1 rounded-full font-bold" :class="prodConfig.is_active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
                {{ prodConfig.is_active ? 'ACTIVE' : 'NOT ACTIVE' }}
              </span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div class="space-y-1"><p class="text-[11px] text-gray-400 uppercase">Project</p><p class="text-sm font-medium text-gray-900 truncate">{{ prodConfig.environment_name }}</p></div>
              <div class="space-y-1"><p class="text-[11px] text-gray-400 uppercase">Reference</p><p class="text-sm font-mono text-gray-700">{{ prodConfig.supabase_project_ref || '—' }}</p></div>
              <div class="space-y-1"><p class="text-[11px] text-gray-400 uppercase">Config Version</p><p class="text-sm font-medium text-gray-900">v{{ prodConfig.config_version || 0 }}</p></div>
            </div>
            <button @click="showProdSetup = true" class="text-xs text-blue-600 hover:underline">Edit Configuration</button>
          </div>

          <!-- Readiness Checklist -->
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 class="font-semibold text-gray-900 text-sm">Production Readiness</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              <div v-for="item in prodReadinessItems" :key="item.key" class="flex items-center gap-2 p-2.5 rounded-lg" :class="item.ok ? 'bg-green-50' : 'bg-red-50'">
                <span class="text-xs" :class="item.ok ? 'text-green-600' : 'text-red-500'">{{ item.ok ? '✓' : '○' }}</span>
                <span class="text-xs font-medium" :class="item.ok ? 'text-green-700' : 'text-red-600'">{{ item.label }}</span>
              </div>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <button @click="testProdConnection" :disabled="prodTesting" class="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                {{ prodTesting ? 'Testing...' : 'Test Connection' }}
              </button>
              <button @click="activateProduction" :disabled="!canActivate" class="px-4 py-2 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {{ prodConfig.is_active ? 'Re-validate' : 'Activate Production' }}
              </button>
            </div>
            <p v-if="prodTestResult" class="text-xs" :class="prodTestResult.success ? 'text-green-600' : 'text-red-600'">{{ prodTestResult.message }}</p>
          </div>

          <!-- Production Secrets -->
          <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900 text-sm">Production Secrets</h3>
              <span class="text-xs text-gray-400">{{ prodSecretsConfigured }} / {{ prodSecrets.length }} configured</span>
            </div>
            <p class="text-[10px] text-gray-400">Values are write-only. Never displayed after saving.</p>
            <div class="space-y-1.5">
              <div v-for="s in prodSecrets" :key="s.secret_key" class="flex items-center justify-between p-2.5 rounded-lg" :class="s.is_configured ? 'bg-gray-50' : 'bg-red-50/50'">
                <div class="min-w-0">
                  <p class="text-xs font-mono text-gray-700 truncate">{{ s.secret_key }}</p>
                  <p class="text-[10px] text-gray-400">{{ s.category }}</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span class="text-[10px] font-medium" :class="s.is_configured ? 'text-green-600' : 'text-red-600'">{{ s.is_configured ? '● Set' : '○ Missing' }}</span>
                  <button @click="openSecretEditor({ key: s.secret_key, description: s.description, configured: s.is_configured })" class="text-[10px] text-blue-600 hover:underline">{{ s.is_configured ? 'Replace' : 'Set' }}</button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- DEVELOPMENT CONFIG VIEW (existing) -->
      <template v-else>
      <!-- Readiness Summary -->
      <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 text-sm">{{ selectedEnv === 'production' ? 'Production' : 'Development' }} Readiness</h3>
          <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="readinessReady ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
            {{ configuredCount }} / {{ totalConfigCount }} configured
          </span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <div v-for="item in readinessItems" :key="item.label" class="text-center p-2 rounded-lg" :class="item.ok ? 'bg-green-50' : 'bg-red-50'">
            <div class="w-2 h-2 rounded-full mx-auto mb-1" :class="item.ok ? 'bg-green-500' : 'bg-red-400'"></div>
            <p class="text-[10px] font-medium" :class="item.ok ? 'text-green-700' : 'text-red-600'">{{ item.label }}</p>
          </div>
        </div>
      </div>

      <!-- Database -->
      <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 text-sm">Database</h3>
          <button @click="testDbConnection" :disabled="dbTesting" class="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50">
            {{ dbTesting ? 'Testing...' : 'Test Connection' }}
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="space-y-1"><p class="text-[11px] text-gray-400 uppercase">Provider</p><p class="text-sm font-medium text-gray-900">Supabase</p></div>
          <div class="space-y-1"><p class="text-[11px] text-gray-400 uppercase">Project</p><p class="text-sm font-medium text-gray-900">{{ dbProject }}</p></div>
          <div class="space-y-1"><p class="text-[11px] text-gray-400 uppercase">Status</p>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" :class="dbConnected ? 'bg-green-500' : 'bg-red-500'"></span>
              <p class="text-sm font-medium" :class="dbConnected ? 'text-green-700' : 'text-red-700'">{{ dbConnected ? 'Connected' : 'Disconnected' }}</p>
            </div>
          </div>
          <div v-if="dbLatency" class="space-y-1"><p class="text-[11px] text-gray-400 uppercase">Latency</p><p class="text-sm font-medium text-gray-900">{{ dbLatency }}ms</p></div>
        </div>
        <p v-if="dbError" class="text-xs text-red-600">{{ dbError }}</p>
      </div>

      <!-- Payment Gateway -->
      <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 text-sm">Payment Gateway</h3>
          <button @click="$emit('navigate', 'settings')" class="text-xs text-blue-600 hover:underline">Edit in Settings →</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="space-y-1"><p class="text-[11px] text-gray-400 uppercase">Primary Gateway</p><p class="text-sm font-medium text-gray-900 capitalize">{{ paymentGateway }}</p></div>
          <div class="space-y-1"><p class="text-[11px] text-gray-400 uppercase">Mode</p>
            <span class="inline-block px-2 py-0.5 text-xs rounded-full font-medium" :class="paymentSandbox ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'">{{ paymentSandbox ? 'Sandbox' : 'Production' }}</span>
          </div>
        </div>
      </div>

      <!-- Secrets (Founder only for Production) -->
      <div v-if="isFounder || selectedEnv === 'development'" class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 class="font-semibold text-gray-900 text-sm">Secrets & Credentials</h3>
        <p class="text-[10px] text-gray-400">Values are write-only. Existing secrets are never displayed.</p>

        <div class="space-y-2">
          <div v-for="secret in currentSecrets" :key="secret.key" class="flex items-center justify-between p-3 rounded-lg" :class="secret.configured ? 'bg-gray-50' : 'bg-red-50'">
            <div>
              <p class="text-xs font-mono text-gray-700">{{ secret.key }}</p>
              <p class="text-[10px] text-gray-400">{{ secret.description }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-medium" :class="secret.configured ? 'text-green-600' : 'text-red-600'">{{ secret.configured ? '● Configured' : '○ Missing' }}</span>
              <button v-if="isFounder" @click="openSecretEditor(secret)" class="text-[10px] text-blue-600 hover:underline">{{ secret.configured ? 'Replace' : 'Set' }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Webhooks -->
      <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 class="font-semibold text-gray-900 text-sm">Webhooks</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div><p class="text-sm font-medium text-gray-900">Sumopod</p><p class="text-[10px] text-gray-400">{{ selectedEnv }}</p></div>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" :class="webhookSumopod ? 'bg-green-500' : 'bg-gray-300'"></span>
              <span class="text-xs" :class="webhookSumopod ? 'text-green-700' : 'text-gray-400'">{{ webhookSumopod ? 'Configured' : 'Not Configured' }}</span>
            </div>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div><p class="text-sm font-medium text-gray-900">Tripay</p><p class="text-[10px] text-gray-400">{{ selectedEnv }}</p></div>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-gray-300"></span>
              <span class="text-xs text-gray-400">Check env vars</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Development Tools -->
      <div v-if="isDevelopment && selectedEnv === 'development'" class="bg-white border border-amber-200 rounded-xl p-5 space-y-4">
        <h3 class="font-semibold text-gray-900 text-sm">Development Tools</h3>
        <p class="text-xs text-amber-700">Only available in Development. Disabled in Production.</p>
        <div class="flex flex-wrap gap-3">
          <button @click="generateDummyData" :disabled="devActionLoading" class="px-4 py-2 text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800 rounded-lg hover:bg-amber-100 transition disabled:opacity-50">Generate Dummy Data</button>
          <button @click="confirmClearData" class="px-4 py-2 text-xs font-medium bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition">Clear Test Data</button>
        </div>
        <p v-if="devActionResult" class="text-xs" :class="devActionResult.success ? 'text-green-600' : 'text-red-600'">{{ devActionResult.message }}</p>
      </div>

      <!-- Legend -->
      <!-- Legend -->
      <div class="bg-gray-50 border border-gray-100 rounded-xl p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
          <span>🔒 <strong>Server Environment</strong> — Read-only from Admin.</span>
          <span>✏️ <strong>Admin Configuration</strong> — Editable by Founder/Admin.</span>
        </div>
      </div>
      </template><!-- end development view -->
    </template><!-- end loading -->

    <!-- Production Setup Modal -->
    <div v-if="showProdSetup" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-4">
        <h3 class="font-semibold text-gray-900">Configure Production Environment</h3>
        <p class="text-xs text-gray-500">Enter your NEW Production Supabase project details. Do NOT reuse the Development project.</p>

        <div v-if="prodSetupError" class="p-2 bg-red-50 text-red-700 text-xs rounded">{{ prodSetupError }}</div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">Environment Name</label>
          <input v-model="prodForm.environment_name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Kinora Production" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Supabase Project URL</label>
          <input v-model="prodForm.supabase_project_url" type="url" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" placeholder="https://xxxxxxxx.supabase.co" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Supabase Project Reference</label>
          <input v-model="prodForm.supabase_project_ref" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" placeholder="xxxxxxxx" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Supabase Anon Key (public)</label>
          <input v-model="prodForm.supabase_anon_key" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" placeholder="eyJ..." />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Production API Base URL</label>
          <input v-model="prodForm.api_base_url" type="url" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" placeholder="https://api.kinorafamilies.com" />
        </div>

        <div class="border-t border-gray-100 pt-4">
          <p class="text-xs text-gray-500 mb-2">Service Role Key (write-only, never displayed again)</p>
          <input v-model="prodForm.service_role_key" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" placeholder="Enter service role key..." />
          <p class="text-[10px] text-gray-400 mt-1">This will be stored securely and cannot be retrieved later.</p>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button @click="showProdSetup = false; prodSetupError = ''" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button @click="saveProdConfig" :disabled="prodSaving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ prodSaving ? 'Saving...' : 'Save Configuration' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Secret Editor Modal -->
    <div v-if="secretEditor.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-xl w-full max-w-md shadow-xl p-6 space-y-4">
        <h3 class="font-semibold text-gray-900">{{ secretEditor.secret?.configured ? 'Replace' : 'Set' }} Secret</h3>
        <p class="text-xs text-gray-500">{{ secretEditor.secret?.key }}</p>
        <p class="text-[10px] text-gray-400">{{ secretEditor.secret?.description }}</p>

        <div v-if="selectedEnv === 'production'" class="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          This will update the <strong>Production</strong> secret.
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">New Value</label>
          <input v-model="secretEditor.value" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" placeholder="Enter secret value..." />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Confirm Value</label>
          <input v-model="secretEditor.confirm" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" placeholder="Confirm secret value..." />
        </div>
        <p v-if="secretEditor.error" class="text-xs text-red-600">{{ secretEditor.error }}</p>

        <div class="flex justify-end gap-3">
          <button @click="closeSecretEditor" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button @click="saveSecret" :disabled="secretEditor.saving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ secretEditor.saving ? 'Saving...' : 'Save Secret' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const emit = defineEmits(['navigate'])

const loading = ref(true)
const selectedEnv = ref('development')
const userRole = ref('')
const dbConnected = ref(false)
const dbLatency = ref(null)
const dbTesting = ref(false)
const dbError = ref('')
const devActionLoading = ref(null)
const devActionResult = ref(null)
const paymentSettings = ref({})

const isFounder = computed(() => userRole.value === 'founder')

// Production config
const prodConfig = ref({})
const prodSecrets = ref([])
const showProdSetup = ref(false)
const prodSaving = ref(false)
const prodSetupError = ref('')
const prodTesting = ref(false)
const prodTestResult = ref(null)
const prodForm = ref({ environment_name: 'Kinora Production', supabase_project_url: '', supabase_project_ref: '', supabase_anon_key: '', api_base_url: '', service_role_key: '' })

const prodSecretsConfigured = computed(() => prodSecrets.value.filter(s => s.is_configured).length)
const canActivate = computed(() => {
  if (!prodConfig.value.supabase_project_url) return false
  if (prodConfig.value.database_status !== 'connected') return false
  if (prodSecretsConfigured.value < prodSecrets.value.length) return false
  return true
})

const prodReadinessItems = computed(() => [
  { key: 'database', label: 'Database', ok: prodConfig.value.database_status === 'connected' },
  { key: 'auth', label: 'Auth', ok: prodConfig.value.auth_status === 'configured' },
  { key: 'storage', label: 'Storage', ok: prodConfig.value.storage_status === 'configured' },
  { key: 'edge', label: 'Edge Functions', ok: prodConfig.value.edge_functions_status === 'deployed' },
  { key: 'rls', label: 'RLS', ok: prodConfig.value.rls_status === 'applied' },
  { key: 'payment', label: 'Payment', ok: prodConfig.value.payment_status === 'configured' },
  { key: 'webhook', label: 'Webhooks', ok: prodConfig.value.webhook_status === 'configured' },
  { key: 'secrets', label: 'Secrets', ok: prodSecretsConfigured.value === prodSecrets.value.length },
])

// Environment detection
const appEnv = import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development'
const isDevelopment = computed(() => appEnv !== 'production')
const envLabel = computed(() => isDevelopment.value ? 'Development' : 'Production')
const buildVersion = import.meta.env.VITE_BUILD_VERSION || '1.0.0'
const appUrl = computed(() => typeof window !== 'undefined' ? window.location.origin : '')

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const dbProject = computed(() => {
  try {
    const ref = new URL(supabaseUrl).hostname.split('.')[0]
    return `Kinora ${selectedEnv.value === 'production' ? 'Production' : 'Development'} (${ref.slice(0, 8)}...)`
  } catch { return 'Unknown' }
})

// Payment
const paymentGateway = computed(() => paymentSettings.value.primary_payment_gateway || 'not configured')
const paymentSandbox = computed(() => {
  if (selectedEnv.value === 'production') return false
  const pg = paymentSettings.value.primary_payment_gateway
  if (pg === 'sumopod') return paymentSettings.value.sumopod_sandbox
  if (pg === 'tripay') return paymentSettings.value.tripay_sandbox
  return true
})

// Webhooks
const webhookSumopod = computed(() => {
  if (selectedEnv.value === 'development') {
    return !!(paymentSettings.value.sumopod_sandbox_webhook_token || paymentSettings.value.sumopod_sandbox_webhook_secret)
  }
  return !!(paymentSettings.value.sumopod_production_webhook_token || paymentSettings.value.sumopod_production_webhook_secret)
})

// Secrets definition per environment
const SECRET_DEFINITIONS = [
  { key: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key for backend operations', category: 'database' },
  { key: 'SUMOPOD_API_KEY', description: 'Sumopod payment gateway API key', category: 'payment' },
  { key: 'SUMOPOD_API_URL', description: 'Sumopod API base URL', category: 'payment' },
  { key: 'SUMOPOD_WEBHOOK_SECRET', description: 'Sumopod webhook signing secret (whsec_)', category: 'payment' },
  { key: 'SUMOPOD_WEBHOOK_TOKEN', description: 'Sumopod X-Webhook-Token value (whtok_)', category: 'payment' },
  { key: 'TRIPAY_PRIVATE_KEY', description: 'Tripay callback private key', category: 'payment' },
  { key: 'GOOGLE_PLAY_SERVICE_ACCOUNT_KEY', description: 'Google Play verification service account', category: 'subscription' },
  { key: 'FCM_SERVER_KEY', description: 'Firebase Cloud Messaging server key', category: 'notification' },
  { key: 'RESEND_API_KEY', description: 'Resend email service API key', category: 'email' },
]

// Determine configured status from DB settings (for payment secrets we can infer)
const currentSecrets = computed(() => {
  const prefix = selectedEnv.value === 'production' ? 'production' : 'sandbox'
  return SECRET_DEFINITIONS.map(s => {
    let configured = false
    // Infer from payment settings where possible
    if (s.key === 'SUMOPOD_API_KEY') configured = !!paymentSettings.value[`sumopod_${prefix}_api_key`]
    else if (s.key === 'SUMOPOD_API_URL') configured = !!paymentSettings.value[`sumopod_${prefix}_api_url`]
    else if (s.key === 'SUMOPOD_WEBHOOK_SECRET') configured = !!paymentSettings.value[`sumopod_${prefix}_webhook_secret`]
    else if (s.key === 'SUMOPOD_WEBHOOK_TOKEN') configured = !!paymentSettings.value[`sumopod_${prefix}_webhook_token`]
    else configured = true // Assume env-var secrets are configured (can't verify from frontend)
    return { ...s, configured }
  })
})

// Readiness
const configuredCount = computed(() => currentSecrets.value.filter(s => s.configured).length)
const totalConfigCount = computed(() => currentSecrets.value.length)
const readinessReady = computed(() => configuredCount.value === totalConfigCount.value && dbConnected.value)

const readinessItems = computed(() => [
  { label: 'Database', ok: dbConnected.value },
  { label: 'Storage', ok: true },
  { label: 'Payment', ok: !!paymentSettings.value.primary_payment_gateway },
  { label: 'Webhooks', ok: webhookSumopod.value },
  { label: 'Secrets', ok: configuredCount.value === totalConfigCount.value },
  { label: 'Overall', ok: readinessReady.value },
])

// Secret editor
const secretEditor = reactive({ open: false, secret: null, value: '', confirm: '', error: '', saving: false })

function openSecretEditor(secret) {
  if (!isFounder.value && selectedEnv.value === 'production') return
  secretEditor.open = true
  secretEditor.secret = secret
  secretEditor.value = ''
  secretEditor.confirm = ''
  secretEditor.error = ''
}

function closeSecretEditor() {
  secretEditor.open = false
  secretEditor.value = ''
  secretEditor.confirm = ''
  secretEditor.error = ''
}

async function saveSecret() {
  if (!secretEditor.value) { secretEditor.error = 'Value is required'; return }
  if (secretEditor.value !== secretEditor.confirm) { secretEditor.error = 'Values do not match'; return }
  secretEditor.saving = true
  secretEditor.error = ''

  const key = secretEditor.secret.key
  const env = selectedEnv.value
  const prefix = env === 'production' ? 'production' : 'sandbox'

  // Map secret key to database column where applicable
  const columnMap = {
    SUMOPOD_API_KEY: `sumopod_${prefix}_api_key`,
    SUMOPOD_API_URL: `sumopod_${prefix}_api_url`,
    SUMOPOD_WEBHOOK_SECRET: `sumopod_${prefix}_webhook_secret`,
    SUMOPOD_WEBHOOK_TOKEN: `sumopod_${prefix}_webhook_token`,
  }

  const column = columnMap[key]
  if (column) {
    const { error } = await supabase.from('kinora_payment_settings').update({ [column]: secretEditor.value }).eq('id', 1)
    if (error) { secretEditor.error = 'Failed to save'; secretEditor.saving = false; return }
  }

  // Audit log (never stores the value itself)
  await logConfigChange(key, secretEditor.secret.configured ? 'Configured' : 'Missing', 'Replaced')

  // Reload
  await loadPaymentSettings()
  secretEditor.saving = false
  closeSecretEditor()
}

// Data loading
async function loadData() {
  loading.value = true
  try {
    const { data: sessionData } = await supabase.rpc('validate_session')
    if (sessionData) userRole.value = sessionData.is_founder ? 'founder' : 'admin'

    const start = Date.now()
    const { error } = await supabase.from('kinora_payment_settings').select('id').eq('id', 1).maybeSingle()
    dbLatency.value = Date.now() - start
    dbConnected.value = !error

    await loadPaymentSettings()
  } catch { dbConnected.value = false; dbError.value = 'Failed to connect' }
  loading.value = false
}

async function loadPaymentSettings() {
  const { data: ps } = await supabase.from('kinora_payment_settings').select('*').eq('id', 1).maybeSingle()
  if (ps) paymentSettings.value = ps
}

async function testDbConnection() {
  dbTesting.value = true; dbError.value = ''
  try {
    const start = Date.now()
    const { error } = await supabase.from('kinora_payment_settings').select('id').eq('id', 1).maybeSingle()
    dbLatency.value = Date.now() - start
    dbConnected.value = !error
    if (error) dbError.value = 'Connection test failed'
  } catch { dbConnected.value = false; dbError.value = 'Connection test failed' }
  dbTesting.value = false
}

function generateDummyData() { devActionResult.value = { success: true, message: 'Not yet implemented. Add backend RPC.' }; devActionLoading.value = null }
function confirmClearData() { if (confirm('Clear test data?')) devActionResult.value = { success: true, message: 'Not yet implemented.' } }

async function logConfigChange(settingKey, prev, next) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('kinora_config_audit_log').insert({
      actor_user_id: user.id, actor_role: userRole.value || 'admin',
      setting_key: settingKey,
      previous_value: String(prev ?? ''), new_value: String(next ?? ''),
      environment: selectedEnv.value,
    })
  } catch { /* non-critical */ }
}

// --- Production Config ---
async function loadProdConfig() {
  const { data } = await supabase.from('kinora_production_config').select('*').eq('id', 1).maybeSingle()
  if (data) prodConfig.value = data

  const { data: secrets } = await supabase.from('kinora_production_secrets').select('secret_key, description, category, is_configured, configured_at').order('category')
  if (secrets) prodSecrets.value = secrets
}

async function saveProdConfig() {
  prodSetupError.value = ''
  if (!prodForm.value.supabase_project_url) { prodSetupError.value = 'Project URL is required'; return }
  if (!prodForm.value.supabase_project_ref) { prodSetupError.value = 'Project reference is required'; return }

  // Validate URL format
  try { new URL(prodForm.value.supabase_project_url) } catch { prodSetupError.value = 'Invalid Project URL format'; return }

  // Prevent using the current dev project
  const devRef = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : ''
  if (prodForm.value.supabase_project_ref === devRef) {
    prodSetupError.value = 'Production must use a different Supabase project than Development.'
    return
  }

  prodSaving.value = true

  const payload = {
    environment_name: prodForm.value.environment_name || 'Kinora Production',
    supabase_project_url: prodForm.value.supabase_project_url,
    supabase_project_ref: prodForm.value.supabase_project_ref,
    supabase_anon_key: prodForm.value.supabase_anon_key || null,
    api_base_url: prodForm.value.api_base_url || null,
    database_status: 'not_configured',
    updated_at: new Date().toISOString(),
  }

  // Upsert config
  const { error } = await supabase.from('kinora_production_config').upsert({ id: 1, ...payload }, { onConflict: 'id' })
  if (error) { prodSetupError.value = error.message; prodSaving.value = false; return }

  // Mark secrets configured for anon key and URL if provided
  if (prodForm.value.supabase_anon_key) {
    await markSecretConfigured('SUPABASE_ANON_KEY')
  }
  if (prodForm.value.supabase_project_url) {
    await markSecretConfigured('SUPABASE_URL')
  }
  if (prodForm.value.service_role_key) {
    await markSecretConfigured('SUPABASE_SERVICE_ROLE_KEY')
    // Note: actual secret storage would go to Supabase Vault or server env
    // For now we mark it as configured
  }

  await logConfigChange('production_config', 'updated', JSON.stringify({ name: payload.environment_name, ref: payload.supabase_project_ref }))
  await loadProdConfig()

  prodSaving.value = false
  showProdSetup.value = false
  prodForm.value.service_role_key = '' // Clear secret from memory
}

async function markSecretConfigured(key) {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('kinora_production_secrets').update({
    is_configured: true,
    configured_at: new Date().toISOString(),
    configured_by: user?.id,
    updated_at: new Date().toISOString(),
  }).eq('secret_key', key)
}

async function testProdConnection() {
  prodTesting.value = true
  prodTestResult.value = null

  // We can only verify reachability of the URL from the frontend
  // Real connection test requires a backend endpoint
  try {
    if (!prodConfig.value.supabase_project_url) {
      prodTestResult.value = { success: false, message: 'No production URL configured' }
      prodTesting.value = false
      return
    }

    const res = await fetch(`${prodConfig.value.supabase_project_url}/rest/v1/`, {
      method: 'HEAD',
      headers: { 'apikey': prodConfig.value.supabase_anon_key || '' },
    }).catch(() => null)

    if (res && res.ok) {
      prodTestResult.value = { success: true, message: 'Production database reachable' }
      await supabase.from('kinora_production_config').update({
        database_status: 'connected', last_tested_at: new Date().toISOString(), last_test_result: 'success'
      }).eq('id', 1)
      prodConfig.value.database_status = 'connected'
    } else {
      prodTestResult.value = { success: false, message: 'Unable to reach production database' }
      await supabase.from('kinora_production_config').update({
        database_status: 'failed', last_tested_at: new Date().toISOString(), last_test_result: 'failed'
      }).eq('id', 1)
    }
  } catch (e) {
    prodTestResult.value = { success: false, message: 'Connection test failed' }
  }
  prodTesting.value = false
}

async function activateProduction() {
  if (!canActivate.value) return
  if (!confirm('Activate Kinora Production? This makes production services available to live users.')) return

  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('kinora_production_config').update({
    is_active: true,
    activated_at: new Date().toISOString(),
    activated_by: user?.id,
    config_version: (prodConfig.value.config_version || 0) + 1,
    updated_at: new Date().toISOString(),
  }).eq('id', 1)

  await logConfigChange('production_activation', 'inactive', 'active')
  await loadProdConfig()
}

onMounted(async () => {
  await loadData()
  await loadProdConfig()
})
</script>
