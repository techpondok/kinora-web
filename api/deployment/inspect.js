/**
 * Kinora Deployment Inspector API
 * Route: POST /api/deployment/inspect
 *
 * Server-side endpoint that:
 * 1. Connects to Development database (current Supabase)
 * 2. Connects to Production database (configured separately)
 * 3. Inspects schema differences
 * 4. Returns safe deployment preview (no secrets)
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY (dev), Production config from DB
 */
const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    // --- 1. Authenticate Admin ---
    const supabaseUrl = process.env.SUPABASE_URL || 'https://sasigbuckngggpwpxlhz.supabase.co'
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return res.status(500).json({ success: false, error: 'Server not configured' })

    const devDb = createClient(supabaseUrl, serviceKey)

    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' })

    const { data: { user } } = await devDb.auth.getUser(token)
    if (!user) return res.status(401).json({ success: false, error: 'Invalid session' })

    // Verify admin role
    const { data: session } = await devDb.rpc('validate_session')
    if (!session?.valid || (!session.is_founder && !session.is_admin)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' })
    }

    // --- 2. Load Production config ---
    const { data: prodConfig } = await devDb
      .from('kinora_landing_config')
      .select('value')
      .eq('key', 'production_environment')
      .maybeSingle()

    const prodUrl = prodConfig?.value?.supabase_project_url
    const prodAnonKey = prodConfig?.value?.supabase_anon_key

    // Production service key from env (never stored in DB)
    const prodServiceKey = process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY

    // --- 3. Validate source != target ---
    if (prodUrl && prodUrl === supabaseUrl) {
      return res.status(400).json({ success: false, error: 'Development dan Production tidak boleh menggunakan project database yang sama.' })
    }

    // --- 4. Inspect Development schema ---
    const devSchema = await inspectSchema(devDb)

    // --- 5. Inspect Production schema (if accessible) ---
    let prodSchema = { tables: [], policies: [], functions: [], triggers: [], indexes: [] }
    let prodStatus = 'not_configured'

    if (prodUrl && prodServiceKey) {
      try {
        const prodDb = createClient(prodUrl, prodServiceKey)
        prodSchema = await inspectSchema(prodDb)
        prodStatus = prodSchema.tables.length === 0 ? 'empty' : 'initialized'
      } catch (e) {
        prodStatus = 'connection_failed'
      }
    } else if (prodUrl && !prodServiceKey) {
      prodStatus = 'missing_credentials'
    }

    // --- 6. Calculate differences ---
    const diff = calculateDiff(devSchema, prodSchema)

    // --- 7. Return safe preview ---
    return res.status(200).json({
      success: true,
      data: {
        source: { project: extractRef(supabaseUrl), environment: 'development' },
        target: { project: extractRef(prodUrl || ''), environment: 'production', status: prodStatus },
        development: {
          tables: devSchema.tables.length,
          policies: devSchema.policies.length,
          functions: devSchema.functions.length,
          triggers: devSchema.triggers.length,
          indexes: devSchema.indexes.length,
        },
        production: {
          tables: prodSchema.tables.length,
          policies: prodSchema.policies.length,
          functions: prodSchema.functions.length,
          triggers: prodSchema.triggers.length,
          indexes: prodSchema.indexes.length,
        },
        pending: {
          tables: diff.newTables.length,
          policies: diff.newPolicies.length,
          functions: diff.newFunctions.length,
          triggers: diff.newTriggers.length,
          indexes: diff.newIndexes.length,
          mode: prodStatus === 'empty' ? 'initial_bootstrap' : 'incremental',
        },
        details: {
          newTables: diff.newTables,
          newFunctions: diff.newFunctions.map(f => f.name),
          newPolicies: diff.newPolicies.map(p => `${p.table}.${p.name}`),
        },
        edge_functions: (require('../../supabase/deploy.config.json')).edge_functions.map(fn => fn.name),
      }
    })
  } catch (e) {
    console.error('[Deployment Inspect] Error:', e.message)
    return res.status(500).json({ success: false, error: 'Inspection failed' })
  }
}

async function inspectSchema(db) {
  const tables = []
  const policies = []
  const functions = []
  const triggers = []
  const indexes = []

  try {
    // Tables
    const { data: t } = await db.rpc('to_jsonb', { val: 1 }) // Test RPC exists
    // Use raw SQL via RPC if available, otherwise use metadata queries
    const { data: tableData } = await db.from('information_schema.tables').select('table_name').eq('table_schema', 'public').neq('table_type', 'VIEW')
    if (tableData) tableData.forEach(r => tables.push(r.table_name))
  } catch {
    // Fallback: try querying known Kinora tables
    const knownTables = ['users', 'families', 'family_members', 'kinora_webinars', 'kinora_articles', 'kinora_marketplace_payments', 'kinora_payment_settings', 'kinora_landing_config', 'feature_toggles']
    for (const t of knownTables) {
      try {
        const { error } = await db.from(t).select('id').limit(0)
        if (!error) tables.push(t)
      } catch { /* skip */ }
    }
  }

  return { tables, policies, functions, triggers, indexes }
}

function calculateDiff(dev, prod) {
  const prodTableSet = new Set(prod.tables)
  return {
    newTables: dev.tables.filter(t => !prodTableSet.has(t)),
    newPolicies: dev.policies.filter(p => !prod.policies.find(pp => pp.name === p.name && pp.table === p.table)),
    newFunctions: dev.functions.filter(f => !prod.functions.find(pf => pf.name === f.name)),
    newTriggers: dev.triggers.filter(t => !prod.triggers.find(pt => pt.name === t.name)),
    newIndexes: dev.indexes.filter(i => !prod.indexes.find(pi => pi.name === i.name)),
  }
}

function extractRef(url) {
  try { return new URL(url).hostname.split('.')[0].slice(0, 8) + '...' }
  catch { return 'unknown' }
}
