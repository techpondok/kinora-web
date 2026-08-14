/**
 * Kinora Sumopod Webhook Handler
 * Route: POST /api/payments/sumopod/callback
 *
 * Handles: Webinar, Marketplace, Consultation ONLY.
 * Auth: X-Webhook-Token (primary), Svix signature (production hardening).
 */
const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

const ALLOWED_PRODUCT_TYPES = ['webinar', 'marketplace', 'consultation']

module.exports = async function handler(req, res) {
  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'method_not_allowed' })
  }

  const log = createLogger()

  try {
    log.info('webhook_received', { method: req.method, url: req.url })

    // ─── 1. SUPABASE CONNECTION ───
    const supabaseUrl = process.env.SUPABASE_URL || 'https://sasigbuckngggpwpxlhz.supabase.co'
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      log.error('missing_service_key')
      return res.status(500).json({ success: false, error: 'server_config' })
    }
    const supabase = createClient(supabaseUrl, serviceKey)

    // ─── 2. ENVIRONMENT DETECTION ───
    const callbackEnv = detectEnvironment(req)
    log.info('environment_detected', { env: callbackEnv })

    // ─── 3. LOAD WEBHOOK TOKEN ───
    // Priority: direct env var → DB config → env-prefixed var
    const directToken = process.env.SUMOPOD_WEBHOOK_TOKEN || ''
    const config = await loadConfig(callbackEnv, supabase)
    const expectedToken = (directToken || config.webhookToken || '').trim()

    log.info('config_loaded', {
      hasDirectEnvToken: !!directToken,
      hasDbToken: !!config.webhookToken,
      hasSecret: !!config.webhookSecret,
      tokenSource: directToken ? 'env' : config.webhookToken ? 'db' : 'none',
    })

    // ─── 4. TOKEN VERIFICATION ───
    const incomingToken = (req.headers['x-webhook-token'] || '').trim()

    if (!expectedToken) {
      log.error('webhook_token_not_configured', { env: callbackEnv })
      return res.status(500).json({ success: false, error: 'webhook_not_configured' })
    }

    if (!incomingToken) {
      log.warn('missing_webhook_token')
      return res.status(401).json({ success: false, error: 'missing_webhook_token' })
    }

    if (!timingSafeCompare(incomingToken, expectedToken)) {
      log.warn('invalid_webhook_token', {
        received_length: incomingToken.length,
        expected_length: expectedToken.length,
        received_prefix: incomingToken.substring(0, 10),
        expected_prefix: expectedToken.substring(0, 10),
        env: callbackEnv,
      })
      return res.status(401).json({ success: false, error: 'invalid_webhook_token' })
    }

    log.info('token_valid')

    // ─── 5. OPTIONAL: SVIX SIGNATURE VERIFICATION (production hardening) ───
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    if (config.webhookSecret) {
      const svixResult = verifySvixSignature(req, rawBody, config.webhookSecret)
      log.info('svix_verification', { result: svixResult.status })
      // In production with both configured, require Svix to pass too
      if (svixResult.status === 'failed') {
        await safeAudit(supabase, null, 'svix_failed', callbackEnv, {})
        return res.status(401).json({ success: false, error: 'invalid_signature' })
      }
      // 'skipped' = no svix headers present (e.g. test webhook) — OK, token already passed
    }

    // ─── 6. PARSE PAYLOAD ───
    let payload
    try {
      payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    } catch (e) {
      log.error('json_parse_error', { error: e.message })
      return res.status(400).json({ success: false, error: 'malformed_json' })
    }

    const eventType = payload.event_type || payload.type || payload.event || ''
    const svixId = req.headers['svix-id'] || ''
    log.info('event_parsed', { event_type: eventType, svix_id: svixId || null })

    // ─── 7. HANDLE TEST EVENT ───
    if (eventType === 'payment.test') {
      log.info('test_event_acknowledged')
      await safeAudit(supabase, null, 'test_webhook', callbackEnv, { event_type: eventType })
      return res.status(200).json({ success: true })
    }

    // ─── 8. EXTRACT PAYMENT DATA ───
    const data = payload.data || payload
    const providerTxId = data.payment_id || null
    const merchantRef = data.order_id || data.merchant_ref || null
    const providerStatus = data.status || null
    const callbackAmount = data.amount != null ? Number(data.amount) : null
    const callbackCurrency = data.currency || null
    const paidAt = data.paid_at || null
    const paymentMethod = data.payment_method || null
    const paymentChannel = data.payment_channel_used || null
    const providerFee = data.fee != null ? Number(data.fee) : null
    const providerNetAmount = data.net_amount != null ? Number(data.net_amount) : null

    log.info('payment_data', { order_id: merchantRef, payment_id: providerTxId, status: providerStatus })

    if (!merchantRef && !providerTxId) {
      log.warn('missing_identifiers')
      return res.status(400).json({ success: false, error: 'missing_order_id' })
    }

    if (!providerStatus) {
      log.warn('missing_status')
      return res.status(400).json({ success: false, error: 'missing_status' })
    }

    // ─── 9. FIND EXISTING KINORA TRANSACTION ───
    let payment = null
    if (merchantRef) {
      const { data: p, error: e } = await supabase
        .from('kinora_marketplace_payments')
        .select('*')
        .eq('xendit_external_id', merchantRef)
        .maybeSingle()
      if (e) log.error('db_lookup_error', { error: e.message })
      payment = p
    }
    if (!payment && providerTxId) {
      const { data: p, error: e } = await supabase
        .from('kinora_marketplace_payments')
        .select('*')
        .eq('sumopod_payment_id', providerTxId)
        .maybeSingle()
      if (e) log.error('db_lookup_error_2', { error: e.message })
      payment = p
    }

    if (!payment) {
      log.warn('transaction_not_found', { order_id: merchantRef, payment_id: providerTxId })
      await safeAudit(supabase, null, 'transaction_not_found', callbackEnv, { merchantRef, providerTxId })
      return res.status(404).json({ success: false, error: 'transaction_not_found' })
    }

    // ─── 10. ENVIRONMENT ISOLATION ───
    const paymentEnv = payment.metadata?.payment_environment || 'production'
    if (paymentEnv !== callbackEnv) {
      log.warn('environment_mismatch', { payment: paymentEnv, callback: callbackEnv })
      await safeAudit(supabase, payment.id, 'environment_mismatch', callbackEnv, { paymentEnv, callbackEnv })
      return res.status(400).json({ success: false, error: 'environment_mismatch' })
    }

    // ─── 11. PRODUCT TYPE GUARD ───
    if (!ALLOWED_PRODUCT_TYPES.includes(payment.product_type)) {
      log.warn('product_type_rejected', { type: payment.product_type })
      return res.status(400).json({ success: false, error: 'product_type_not_supported' })
    }

    // ─── 12. AMOUNT VERIFICATION ───
    if (callbackAmount != null && Math.abs(Number(payment.total_amount) - callbackAmount) > 1) {
      log.warn('amount_mismatch', { expected: payment.total_amount, received: callbackAmount })
      await safeAudit(supabase, payment.id, 'amount_mismatch', callbackEnv, { expected: payment.total_amount, received: callbackAmount })
      return res.status(400).json({ success: false, error: 'amount_mismatch' })
    }

    // ─── 13. STATUS MAPPING ───
    const newStatus = mapStatus(providerStatus)
    if (!newStatus) {
      log.warn('unknown_status', { providerStatus })
      await safeAudit(supabase, payment.id, 'unknown_status', callbackEnv, { providerStatus })
      return res.status(400).json({ success: false, error: 'unknown_status' })
    }

    // ─── 14. IDEMPOTENCY ───
    if (svixId && payment.metadata?.sumopod_svix_id === svixId) {
      log.info('duplicate_webhook_ignored', { svix_id: svixId })
      return res.status(200).json({ success: true })
    }

    const FINAL_STATES = ['paid', 'verified', 'refunded']
    if (FINAL_STATES.includes(payment.status) && newStatus === 'paid') {
      log.info('already_final_state', { current: payment.status })
      return res.status(200).json({ success: true })
    }

    const PRIORITY = { pending: 0, waiting_verification: 1, under_review: 2, paid: 3, verified: 4, expired: -1, failed: -1, refunded: 5 }
    if ((PRIORITY[payment.status] || 0) > (PRIORITY[newStatus] || 0) && newStatus !== 'refunded') {
      log.info('status_regression_blocked', { current: payment.status, attempted: newStatus })
      return res.status(200).json({ success: true })
    }

    // ─── 15. UPDATE TRANSACTION ───
    const updatePayload = {
      status: newStatus,
      payment_method: 'sumopod',
      paid_at: newStatus === 'paid' ? (paidAt || new Date().toISOString()) : payment.paid_at,
      sumopod_payment_id: providerTxId || payment.sumopod_payment_id,
      sumopod_payment_channel: paymentChannel || payment.sumopod_payment_channel,
      gateway_fee_amount: providerFee != null ? providerFee : (payment.gateway_fee_amount || 0),
      provider_net_amount: providerNetAmount != null ? providerNetAmount : (payment.provider_net_amount || 0),
      fulfillment_status: newStatus === 'paid' ? 'processing' : (newStatus === 'expired' || newStatus === 'failed' ? 'cancelled' : payment.fulfillment_status),
      metadata: {
        ...(payment.metadata || {}),
        sumopod_transaction_id: providerTxId,
        sumopod_svix_id: svixId || null,
        sumopod_event_type: eventType,
        sumopod_payment_method: paymentMethod,
        sumopod_payment_channel: paymentChannel,
        sumopod_fee: providerFee,
        sumopod_net_amount: providerNetAmount,
        sumopod_callback_at: new Date().toISOString(),
        payment_environment: callbackEnv,
      },
      updated_at: new Date().toISOString(),
    }

    const { error: updateErr } = await supabase
      .from('kinora_marketplace_payments')
      .update(updatePayload)
      .eq('id', payment.id)

    if (updateErr) {
      log.error('update_failed', { error: updateErr.message, payment_id: payment.id })
      await safeAudit(supabase, payment.id, 'update_failed', callbackEnv, { error: updateErr.message })
      return res.status(500).json({ success: false, error: 'update_failed' })
    }

    // ─── 16. FULFILLMENT ───
    if (newStatus === 'paid') {
      const fulfilled = await executeFulfillment(supabase, payment, log)
      await supabase.from('kinora_marketplace_payments').update({
        fulfillment_status: fulfilled ? 'completed' : 'failed',
        updated_at: new Date().toISOString()
      }).eq('id', payment.id)
    }

    // ─── 17. RELEASE ───
    if (newStatus === 'expired' || newStatus === 'failed') {
      await executeRelease(supabase, payment, log)
    }

    // ─── 18. AUDIT ───
    await safeAudit(supabase, payment.id, `callback_${newStatus}`, callbackEnv, {
      providerTxId, svixId, amount: callbackAmount, method: paymentMethod, channel: paymentChannel
    })

    log.info('webhook_processed', { payment_id: payment.id, new_status: newStatus })
    return res.status(200).json({ success: true })

  } catch (err) {
    // Top-level catch — log real error server-side, return minimal response
    log.error('unhandled_exception', { error: err.message, stack: err.stack })
    return res.status(500).json({ success: false, error: 'internal_error' })
  }
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function detectEnvironment(req) {
  const h = (req.headers['x-sumopod-environment'] || '').toLowerCase().trim()
  if (h === 'sandbox') return 'sandbox'
  if (h === 'production') return 'production'
  if ((req.url || '').includes('/sandbox')) return 'sandbox'
  return 'sandbox' // Default to sandbox for safety during development
}

/**
 * Load config from env vars first, DB fallback.
 */
async function loadConfig(env, supabase) {
  // Load from DB first (Web Admin is source of truth)
  try {
    const { data } = await supabase
      .from('kinora_payment_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    if (data) {
      if (env === 'sandbox') {
        const dbConfig = {
          apiUrl: data.sumopod_sandbox_api_url || '',
          apiKey: data.sumopod_sandbox_api_key || '',
          webhookSecret: data.sumopod_sandbox_webhook_secret || '',
          webhookToken: data.sumopod_sandbox_webhook_token || '',
        }
        // Use DB values if present, env var fallback
        return {
          apiUrl: dbConfig.apiUrl || process.env.SUMOPOD_SANDBOX_API_URL || '',
          apiKey: dbConfig.apiKey || process.env.SUMOPOD_SANDBOX_API_KEY || '',
          webhookSecret: dbConfig.webhookSecret || process.env.SUMOPOD_SANDBOX_WEBHOOK_SECRET || '',
          webhookToken: dbConfig.webhookToken || process.env.SUMOPOD_SANDBOX_WEBHOOK_TOKEN || '',
        }
      }
      const dbConfig = {
        apiUrl: data.sumopod_production_api_url || '',
        apiKey: data.sumopod_production_api_key || '',
        webhookSecret: data.sumopod_production_webhook_secret || '',
        webhookToken: data.sumopod_production_webhook_token || '',
      }
      return {
        apiUrl: dbConfig.apiUrl || process.env.SUMOPOD_PRODUCTION_API_URL || '',
        apiKey: dbConfig.apiKey || process.env.SUMOPOD_PRODUCTION_API_KEY || '',
        webhookSecret: dbConfig.webhookSecret || process.env.SUMOPOD_PRODUCTION_WEBHOOK_SECRET || '',
        webhookToken: dbConfig.webhookToken || process.env.SUMOPOD_PRODUCTION_WEBHOOK_TOKEN || '',
      }
    }
  } catch (e) {
    // DB unreachable — fall through to env vars
  }

  // Env var fallback
  return getConfigFromEnv(env)
}

function getConfigFromEnv(env) {
  if (env === 'sandbox') {
    return {
      apiUrl: process.env.SUMOPOD_SANDBOX_API_URL || '',
      apiKey: process.env.SUMOPOD_SANDBOX_API_KEY || '',
      webhookSecret: process.env.SUMOPOD_SANDBOX_WEBHOOK_SECRET || '',
      webhookToken: process.env.SUMOPOD_SANDBOX_WEBHOOK_TOKEN || '',
    }
  }
  return {
    apiUrl: process.env.SUMOPOD_PRODUCTION_API_URL || '',
    apiKey: process.env.SUMOPOD_PRODUCTION_API_KEY || '',
    webhookSecret: process.env.SUMOPOD_PRODUCTION_WEBHOOK_SECRET || '',
    webhookToken: process.env.SUMOPOD_PRODUCTION_WEBHOOK_TOKEN || '',
  }
}

/**
 * Svix signature verification.
 * Returns: { status: 'valid' | 'failed' | 'skipped' }
 */
function verifySvixSignature(req, rawBody, webhookSecret) {
  const svixId = req.headers['svix-id']
  const svixTimestamp = req.headers['svix-timestamp']
  const svixSignature = req.headers['svix-signature']

  // If no svix headers, skip (test webhooks may not include them)
  if (!svixId || !svixTimestamp || !svixSignature) {
    return { status: 'skipped' }
  }

  try {
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`

    // Remove whsec_ prefix, base64 decode
    const secretStr = webhookSecret.startsWith('whsec_') ? webhookSecret.slice(6) : webhookSecret
    let secretBytes
    try { secretBytes = Buffer.from(secretStr, 'base64') }
    catch { secretBytes = Buffer.from(secretStr) }

    const expectedSig = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64')

    // Multiple v1 signatures separated by space
    const signatures = svixSignature.split(' ')
    for (const sig of signatures) {
      const commaIdx = sig.indexOf(',')
      if (commaIdx === -1) continue
      const version = sig.slice(0, commaIdx)
      const value = sig.slice(commaIdx + 1)
      if (version === 'v1' && timingSafeCompare(value, expectedSig)) {
        // Timestamp tolerance check (5 min)
        const ts = parseInt(svixTimestamp, 10)
        const now = Math.floor(Date.now() / 1000)
        if (Math.abs(now - ts) > 300) return { status: 'failed' }
        return { status: 'valid' }
      }
    }
    return { status: 'failed' }
  } catch {
    return { status: 'failed' }
  }
}

function timingSafeCompare(a, b) {
  if (!a || !b) return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  try { return crypto.timingSafeEqual(bufA, bufB) }
  catch { return false }
}

function mapStatus(providerStatus) {
  const map = {
    'PAID': 'paid', 'SUCCESS': 'paid', 'COMPLETED': 'paid', 'SETTLED': 'paid',
    'PENDING': 'pending', 'WAITING': 'pending',
    'FAILED': 'failed', 'CANCELLED': 'failed',
    'EXPIRED': 'expired',
    'REFUNDED': 'refunded', 'REFUND': 'refunded',
  }
  return map[(providerStatus || '').toUpperCase()] || null
}

async function executeFulfillment(supabase, payment, log) {
  const type = payment.product_type
  try {
    if (type === 'webinar') {
      // Check webinar registration_mode to determine post-payment status
      const { data: reg } = await supabase
        .from('kinora_webinar_registrations')
        .select('id, webinar_id')
        .eq('payment_id', payment.id)
        .eq('status', 'pending')
        .maybeSingle()

      let newRegStatus = 'approved' // Default: auto approve after payment
      if (reg) {
        const { data: webinar } = await supabase
          .from('kinora_webinars')
          .select('registration_mode')
          .eq('id', reg.webinar_id)
          .maybeSingle()

        // Paid + Manual Approval → set to 'paid' (awaiting admin approval)
        if (webinar?.registration_mode === 'approval') {
          newRegStatus = 'paid'
        }
      }

      const { error } = await supabase.from('kinora_webinar_registrations')
        .update({ status: newRegStatus, reviewed_at: new Date().toISOString() })
        .eq('payment_id', payment.id)
        .eq('status', 'pending')
      if (error) throw error
    } else if (type === 'consultation') {
      const { error } = await supabase.from('kinora_consultation_sessions')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('payment_id', payment.id)
        .in('status', ['draft', 'awaiting_payment'])
      if (error) throw error
    } else if (type === 'marketplace') {
      const { error } = await supabase.from('kinora_print_orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('payment_id', payment.id)
        .eq('status', 'pending_payment')
      if (error) throw error
    }
    log.info('fulfillment_success', { type, payment_id: payment.id })
    return true
  } catch (e) {
    log.error('fulfillment_error', { type, payment_id: payment.id, error: e.message })
    await safeAudit(supabase, payment.id, 'fulfillment_error', payment.metadata?.payment_environment || 'production', { type, error: e.message })
    return false
  }
}

async function executeRelease(supabase, payment, log) {
  try {
    if (payment.product_type === 'consultation') {
      await supabase.from('kinora_consultation_sessions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('payment_id', payment.id)
        .in('status', ['draft', 'awaiting_payment'])
    }
  } catch (e) {
    log.error('release_error', { error: e.message })
  }
}

/**
 * Safe audit log — never throws.
 */
async function safeAudit(supabase, paymentId, action, env, metadata) {
  try {
    await supabase.from('kinora_payment_audit_log').insert({
      payment_id: paymentId,
      action: `sumopod_${action}`,
      status_before: null,
      status_after: null,
      metadata: { ...metadata, environment: env, timestamp: new Date().toISOString() },
    })
  } catch { /* never throw from audit */ }
}

/**
 * Structured logger (server-side only, never exposes secrets).
 */
function createLogger() {
  const entries = []
  const prefix = '[Sumopod Webhook]'
  return {
    info: (msg, data) => console.log(prefix, msg, data ? JSON.stringify(data) : ''),
    warn: (msg, data) => console.warn(prefix, msg, data ? JSON.stringify(data) : ''),
    error: (msg, data) => console.error(prefix, msg, data ? JSON.stringify(data) : ''),
  }
}
