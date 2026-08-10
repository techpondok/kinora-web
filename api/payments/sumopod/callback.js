/**
 * Kinora Sumopod Webhook Handler
 * Route: POST /api/payments/sumopod/callback
 *
 * Handles payment callbacks for: Webinar, Marketplace, Consultation ONLY.
 * Does NOT handle: Family Plus, Storage Add-ons.
 *
 * Supports: Sandbox + Production environments with strict isolation.
 */
const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

const ALLOWED_PRODUCT_TYPES = ['webinar', 'marketplace', 'consultation']

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false })
  }

  // ─── 1. SUPABASE CONNECTION ───
  const supabaseUrl = process.env.SUPABASE_URL || 'https://sasigbuckngggpwpxlhz.supabase.co'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return res.status(500).json({ success: false })
  }
  const supabase = createClient(supabaseUrl, serviceKey)

  // ─── 2. ENVIRONMENT DETECTION ───
  const callbackEnv = detectEnvironment(req)

  // ─── 3. LOAD CREDENTIALS (env vars → DB fallback) ───
  let config = getConfigFromEnv(callbackEnv)
  if (!config.secret) {
    config = await getConfigFromDb(callbackEnv, supabase)
  }
  if (!config || !config.secret) {
    await logAudit(supabase, null, 'config_missing', callbackEnv, { error: `${callbackEnv} secret not configured` })
    return res.status(500).json({ success: false })
  }

  // ─── 4. SIGNATURE VERIFICATION ───
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  const signature = req.headers['x-sumopod-signature'] || req.headers['x-callback-signature'] || ''

  // TODO: Replace with actual Sumopod signature algorithm from their docs
  const expectedSignature = crypto.createHmac('sha256', config.secret).update(rawBody).digest('hex')

  if (!signature || !timingSafeEqual(signature, expectedSignature)) {
    await logAudit(supabase, null, 'invalid_signature', callbackEnv, {})
    return res.status(403).json({ success: false })
  }

  // ─── 5. PARSE PAYLOAD ───
  // TODO: Adapt field names to actual Sumopod webhook payload structure
  const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const {
    transaction_id: providerTxId,
    merchant_ref: merchantRef,
    status: providerStatus,
    amount: callbackAmount,
    currency: callbackCurrency,
    paid_at: paidAt,
    payment_method: paymentMethod,
    event_id: eventId,
  } = payload

  if (!merchantRef || !providerStatus) {
    return res.status(400).json({ success: false })
  }

  // ─── 6. FIND EXISTING KINORA TRANSACTION ───
  const { data: payment } = await supabase
    .from('kinora_marketplace_payments')
    .select('*')
    .eq('xendit_external_id', merchantRef)
    .maybeSingle()

  if (!payment) {
    await logAudit(supabase, null, 'transaction_not_found', callbackEnv, { merchantRef, providerTxId })
    return res.status(404).json({ success: false })
  }

  // ─── 7. ENVIRONMENT ISOLATION ───
  const paymentEnv = payment.metadata?.payment_environment || 'production'
  if (paymentEnv !== callbackEnv) {
    await logAudit(supabase, payment.id, 'environment_mismatch', callbackEnv, { paymentEnv, callbackEnv })
    return res.status(400).json({ success: false })
  }

  // ─── 8. PRODUCT TYPE GUARD ───
  if (!ALLOWED_PRODUCT_TYPES.includes(payment.product_type)) {
    await logAudit(supabase, payment.id, 'product_type_rejected', callbackEnv, { product_type: payment.product_type })
    return res.status(400).json({ success: false })
  }

  // ─── 9. AMOUNT + CURRENCY VERIFICATION ───
  if (callbackAmount != null && Math.abs(Number(payment.total_amount) - Number(callbackAmount)) > 1) {
    await logAudit(supabase, payment.id, 'amount_mismatch', callbackEnv, {
      expected: payment.total_amount, received: callbackAmount
    })
    await supabase.from('kinora_marketplace_payments').update({
      admin_note: `Sumopod amount mismatch: expected ${payment.total_amount}, got ${callbackAmount}`,
      updated_at: new Date().toISOString()
    }).eq('id', payment.id)
    return res.status(400).json({ success: false })
  }

  if (callbackCurrency && callbackCurrency.toUpperCase() !== (payment.currency || 'IDR').toUpperCase()) {
    await logAudit(supabase, payment.id, 'currency_mismatch', callbackEnv, {
      expected: payment.currency, received: callbackCurrency
    })
    return res.status(400).json({ success: false })
  }

  // ─── 10. STATUS MAPPING ───
  const newStatus = mapStatus(providerStatus)
  if (!newStatus) {
    await logAudit(supabase, payment.id, 'unknown_status', callbackEnv, { providerStatus })
    return res.status(400).json({ success: false })
  }

  // ─── 11. IDEMPOTENCY ───
  const FINAL_STATES = ['paid', 'verified', 'refunded']
  if (FINAL_STATES.includes(payment.status) && newStatus === 'paid') {
    // Already processed — acknowledge without re-processing
    return res.status(200).json({ success: true })
  }

  // Prevent status regression (except refund)
  const PRIORITY = { pending: 0, waiting_verification: 1, under_review: 2, paid: 3, verified: 4, expired: -1, failed: -1, refunded: 5 }
  if ((PRIORITY[payment.status] || 0) > (PRIORITY[newStatus] || 0) && newStatus !== 'refunded') {
    return res.status(200).json({ success: true })
  }

  // ─── 12. UPDATE TRANSACTION ───
  const updatePayload = {
    status: newStatus,
    payment_method: 'sumopod',
    paid_at: newStatus === 'paid' ? (paidAt || new Date().toISOString()) : payment.paid_at,
    metadata: {
      ...(payment.metadata || {}),
      sumopod_transaction_id: providerTxId,
      sumopod_event_id: eventId || null,
      sumopod_payment_method: paymentMethod,
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
    await logAudit(supabase, payment.id, 'update_failed', callbackEnv, { error: updateErr.message })
    // Return 500 so Sumopod retries
    return res.status(500).json({ success: false })
  }

  // ─── 13. FULFILLMENT (only for paid) ───
  if (newStatus === 'paid') {
    await executeFulfillment(supabase, payment)
  }

  // ─── 14. RELEASE (for failed/expired) ───
  if (newStatus === 'expired' || newStatus === 'failed') {
    await executeRelease(supabase, payment)
  }

  // ─── 15. AUDIT LOG ───
  await logAudit(supabase, payment.id, `callback_${newStatus}`, callbackEnv, {
    providerTxId, eventId, amount: callbackAmount, method: paymentMethod
  })

  return res.status(200).json({ success: true })
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function detectEnvironment(req) {
  const h = req.headers['x-sumopod-environment'] || ''
  if (h === 'sandbox') return 'sandbox'
  if (h === 'production') return 'production'
  if ((req.url || '').includes('/sandbox')) return 'sandbox'
  return 'production'
}

function getConfigFromEnv(env) {
  if (env === 'sandbox') {
    return { apiUrl: process.env.SUMOPOD_SANDBOX_API_URL || '', apiKey: process.env.SUMOPOD_SANDBOX_API_KEY || '', secret: process.env.SUMOPOD_SANDBOX_SECRET || '' }
  }
  return { apiUrl: process.env.SUMOPOD_PRODUCTION_API_URL || '', apiKey: process.env.SUMOPOD_PRODUCTION_API_KEY || '', secret: process.env.SUMOPOD_PRODUCTION_SECRET || '' }
}

async function getConfigFromDb(env, supabase) {
  const { data } = await supabase.from('kinora_payment_settings').select('*').eq('id', 1).single()
  if (!data) return null
  if (env === 'sandbox') {
    return { apiUrl: data.sumopod_sandbox_api_url || '', apiKey: data.sumopod_sandbox_api_key || '', secret: data.sumopod_sandbox_secret || '' }
  }
  return { apiUrl: data.sumopod_production_api_url || '', apiKey: data.sumopod_production_api_key || '', secret: data.sumopod_production_secret || '' }
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  try { return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)) }
  catch { return false }
}

// TODO: Map actual Sumopod documented statuses
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

async function executeFulfillment(supabase, payment) {
  const type = payment.product_type
  try {
    if (type === 'webinar') {
      await supabase.from('kinora_webinar_registrations')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('payment_id', payment.id)
        .eq('status', 'pending')
    } else if (type === 'consultation') {
      await supabase.from('kinora_consultation_sessions')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('payment_id', payment.id)
        .in('status', ['draft', 'awaiting_payment'])
    } else if (type === 'marketplace') {
      await supabase.from('kinora_print_orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('payment_id', payment.id)
        .eq('status', 'pending_payment')
    }
  } catch (e) {
    await logAudit(supabase, payment.id, 'fulfillment_error', payment.metadata?.payment_environment || 'production', { type, error: e.message })
  }
}

async function executeRelease(supabase, payment) {
  const type = payment.product_type
  try {
    if (type === 'consultation') {
      // Release reserved slot
      await supabase.from('kinora_consultation_sessions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('payment_id', payment.id)
        .in('status', ['draft', 'awaiting_payment'])
    }
    // Marketplace/webinar: existing architecture handles expiry via separate cron or no reservation
  } catch (e) { /* non-critical */ }
}

async function logAudit(supabase, paymentId, action, env, metadata) {
  try {
    await supabase.from('kinora_payment_audit_log').insert({
      payment_id: paymentId,
      action: `sumopod_${action}`,
      status_before: null,
      status_after: null,
      metadata: { ...metadata, environment: env, timestamp: new Date().toISOString() },
    })
  } catch { /* non-critical */ }
}
