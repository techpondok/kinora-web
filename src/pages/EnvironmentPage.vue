<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Environment & Infrastructure</h1>
        <p class="text-sm text-gray-500 mt-0.5">Kinora dual-environment configuration and status.</p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="userRole" class="px-2 py-1 text-[10px] font-medium rounded-md uppercase tracking-wide bg-gray-100 text-gray-600">{{ userRole }}</span>
        <span class="px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wide"
          :class="envInfo.isDevelopment ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-green-100 text-green-800 border border-green-200'">
          {{ envLabel }}
        </span>
      </div>
    </div>

    <!-- Architecture Overview -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h3 class="font-semibold text-gray-900 text-sm">Architecture</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Development -->
        <div class="p-4 rounded-lg border" :class="envInfo.isDevelopment ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50'">
          <div class="flex items-center gap-2 mb-2">
            <span class="w-2.5 h-2.5 rounded-full" :class="envInfo.isDevelopment ? 'bg-amber-500' : 'bg-gray-300'"></span>
            <span class="text-xs font-bold uppercase" :class="envInfo.isDevelopment ? 'text-amber-800' : 'text-gray-500'">SUPABASE DEVELOPMENT</span>
            <span v-if="envInfo.isDevelopment" class="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">ACTIVE</span>
          </div>
          <p class="text-xs text-gray-600">Supabase Dev Project — test data, sandbox payments</p>
          <p class="text-[10px] text-gray-400 mt-1 font-mono">{{ envInfo.isDevelopment ? envInfo.supabaseUrl : '(not connected)' }}</p>
        </div>
        <!-- Production -->
        <div class="p-4 rounded-lg border" :class="envInfo.isProduction ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'">
          <div class="flex items-center gap-2 mb-2">
            <span class="w-2.5 h-2.5 rounded-full" :class="envInfo.isProduction ? 'bg-green-500' : 'bg-gray-300'"></span>
            <span class="text-xs font-bold uppercase" :class="envInfo.isProduction ? 'text-green-800' : 'text-gray-500'">SUPABASE PRODUCTION</span>
            <span v-if="envInfo.isProduction" class="text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-medium">ACTIVE</span>
          </div>
          <p class="text-xs text-gray-600">Supabase: <code class="text-[10px] bg-gray-200 px-1 rounded">sasigbuc...</code></p>
          <p class="text-[10px] text-gray-400 mt-1 font-mono">https://sasigbuckngggpwpxlhz.supabase.co</p>
        </div>
      </div>
      <!-- Flow diagram -->
      <div class="text-[10px] text-gray-400 bg-gray-50 rounded-lg p-3 font-mono">
        <span v-if="envInfo.isDevelopment">Admin Web Dev → Supabase DEV ({{ envInfo.projectRef }})</span>
        <span v-else>Admin Web Prod → Supabase PROD (sasigbuckngggpwpxlhz)</span>
      </div>
    </div>

    <!-- Current Connection -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-gray-900 text-sm">Supabase Connection</h3>
        <button @click="testConnectionHandler" :disabled="testing" class="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50">
          {{ testing ? 'Testing...' : 'Test Connection' }}
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="space-y-1">
          <p class="text-[11px] text-gray-400 uppercase">Backend Type</p>
          <p class="text-sm font-medium text-gray-900">{{ envInfo.backendType }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-[11px] text-gray-400 uppercase">Project Ref</p>
          <p class="text-sm font-medium text-gray-900 font-mono">{{ envInfo.projectRef }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-[11px] text-gray-400 uppercase">Environment</p>
          <p class="text-sm font-medium" :class="envInfo.isDevelopment ? 'text-amber-700' : 'text-green-700'">{{ envInfo.isDevelopment ? 'Development' : 'Production' }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-[11px] text-gray-400 uppercase">Status</p>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full" :class="connected ? 'bg-green-500' : 'bg-red-500'"></span>
            <p class="text-sm font-medium" :class="connected ? 'text-green-700' : 'text-red-700'">{{ connected ? 'Connected' : 'Disconnected' }}</p>
          </div>
        </div>
      </div>
      <div v-if="latency" class="text-xs text-gray-400">Latency: {{ latency }}ms</div>
      <p v-if="connectionError" class="text-xs text-red-600">{{ connectionError }}</p>

      <!-- Safety indicators -->
      <div v-if="envInfo.isProduction" class="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
        <span class="text-red-600 text-sm">⚠</span>
        <span class="text-xs text-red-700">Connected to <strong>PRODUCTION</strong>. All changes affect live users.</span>
      </div>
    </div>

    <!-- Production Baseline -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-gray-900 text-sm">Production Baseline</h3>
        <span class="text-xs px-2.5 py-1 rounded-full font-bold bg-green-100 text-green-700">ESTABLISHED</span>
      </div>
      <p class="text-xs text-gray-500">
        Project <code class="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono">sasigbuckngggpwpxlhz</code> is the Kinora Production baseline.
        Schema, data, RLS, RPC, Storage, and Edge Functions are preserved.
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div class="text-center p-2 bg-green-50 rounded-lg"><p class="text-[10px] text-gray-500">Database</p><p class="text-xs font-medium text-green-700">✓ Active</p></div>
        <div class="text-center p-2 bg-green-50 rounded-lg"><p class="text-[10px] text-gray-500">Auth</p><p class="text-xs font-medium text-green-700">✓ Active</p></div>
        <div class="text-center p-2 bg-green-50 rounded-lg"><p class="text-[10px] text-gray-500">Storage</p><p class="text-xs font-medium text-green-700">✓ Active</p></div>
        <div class="text-center p-2 bg-green-50 rounded-lg"><p class="text-[10px] text-gray-500">RLS / RPC</p><p class="text-xs font-medium text-green-700">✓ Active</p></div>
      </div>
    </div>

    <!-- Payment -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-gray-900 text-sm">Payment Gateway</h3>
        <button @click="$emit('navigate', 'settings')" class="text-xs text-blue-600 hover:underline">Edit in Settings →</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="space-y-1">
          <p class="text-[11px] text-gray-400 uppercase">Primary Gateway</p>
          <p class="text-sm font-medium text-gray-900 capitalize">{{ paymentGateway }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-[11px] text-gray-400 uppercase">Mode</p>
          <span class="inline-block px-2 py-0.5 text-xs rounded-full font-medium" :class="envInfo.isDevelopment ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'">
            {{ envInfo.isDevelopment ? 'Sandbox' : 'Production' }}
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-[11px] text-gray-400 uppercase">Safety</p>
          <span class="inline-block px-2 py-0.5 text-xs rounded-full font-medium bg-green-100 text-green-700">Environment isolated</span>
        </div>
      </div>
    </div>

    <!-- Migration Workflow -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h3 class="font-semibold text-gray-900 text-sm">Migration Workflow</h3>
      <div class="text-[10px] text-gray-500 space-y-1 bg-gray-50 rounded-lg p-3">
        <p>1. Create migration in <code>supabase/migrations/</code></p>
        <p>2. Deploy to DEV: <code>npm run deploy:dev</code></p>
        <p>3. Test on Admin Web Dev + Flutter Dev</p>
        <p>4. Deploy to PROD: <code>npm run deploy:prod</code></p>
        <p>5. Verify in Supabase Dashboard</p>
      </div>
      <p class="text-[10px] text-gray-400">Same migration files, deployed sequentially: DEV → test → PROD</p>
    </div>

    <!-- Development Seed -->
    <div v-if="envInfo.isDevelopment" class="bg-white border border-amber-200 rounded-xl p-5 space-y-4">
      <h3 class="font-semibold text-gray-900 text-sm">Development Seed</h3>
      <p class="text-xs text-amber-700">Seed test accounts into Supabase DEV.</p>
      <div class="text-[10px] text-gray-500 bg-amber-50 rounded-lg p-3 font-mono">
        npm run seed:dev
      </div>
      <div class="text-xs text-gray-600 space-y-0.5">
        <p>founder@kinora.local / Kinora123!</p>
        <p>parent@kinora.local / Kinora123!</p>
        <p>child@kinora.local / Kinora123!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase, testConnection as testConn, envInfo } from '../lib/supabase.js'

const emit = defineEmits(['navigate'])

const userRole = ref('')
const connected = ref(false)
const latency = ref(null)
const testing = ref(false)
const connectionError = ref('')
const paymentGateway = ref('not configured')

const envLabel = computed(() => envInfo.isDevelopment ? 'SUPABASE DEV' : 'PRODUCTION')

async function testConnectionHandler() {
  testing.value = true
  connectionError.value = ''
  const start = Date.now()
  const result = await testConn()
  latency.value = Date.now() - start
  connected.value = result.ok
  if (!result.ok) connectionError.value = result.message
  testing.value = false
}

async function loadData() {
  try {
    const { data } = await supabase.rpc('validate_session')
    if (data) userRole.value = data.is_founder ? 'founder' : 'admin'
  } catch {}

  // Test connection
  const start = Date.now()
  const result = await testConn()
  latency.value = Date.now() - start
  connected.value = result.ok
  if (!result.ok) connectionError.value = result.message

  // Load payment settings
  try {
    const { data: ps } = await supabase.from('kinora_payment_settings').select('primary_payment_gateway').eq('id', 1).maybeSingle()
    if (ps) paymentGateway.value = ps.primary_payment_gateway || 'not configured'
  } catch {}
}

onMounted(loadData)
</script>
