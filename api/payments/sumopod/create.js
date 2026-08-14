/**
 * Kinora Sumopod Payment Creation
 * Route: POST /api/payments/sumopod/create
 *
 * Server-side only. Creates a Sumopod payment for:
 * - Webinar registration
 * - Marketplace orders
 * - Consultation booking
 *
 * Sumopod API: POST {API_URL}/api/v1/payments
 * Auth: X-Api-Key header
 */
const { createClient } = require('@supabase/supabase-js')

const ALLOWED_PRODUCT_TYPES = ['webinar', 'marketplace', 'consultation']
const MAX_EXPIRY_HOURS = 24

// Sumopod gateway fee schedule
const GATEWAY_FEES = {
  qris: { percent: 0.7, fixed: 300 },
  QRIS_INSTANT: { percent: 1.5, fixed: 300 },
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  // ─── 1. SUPABASE CONNECTION ───
  const supabaseUrl = process.env.SUPABASE_URL || 'https://sasigbuckngggpwpxlhz.supabase.co'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return res.status(500).json({ success: false, message: 'Server configuration error' })
  }
  const supabase = createClient(supabaseUrl, serviceKey)

  // ─── 2. AUTHENTICATE USER ───
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) {
    return res.status(401).json({ success: false, message: 'Invalid session' })
  }

  // ─── 3. PARSE REQUEST ───
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const {
    product_type,
    product_id,
    reference_id,
    payment_method_type_code,
    success_return_url,
    cancel_return_url,
    idempotency_key,
  } = body

  if (!product_type || !product_id || !payment_method_type_code) {
    return res.status(400).json({ success: false, message: 'Missing required fields: product_type, product_id, payment_method_type_code' })
  }

  if (!ALLOWED_PRODUCT_TYPES.includes(product_type)) {
    return res.status(400).json({ success: false, message: `Sumopod not available for: ${product_type}` })
  }

  // ─── 4. LOAD PAYMENT SETTINGS ───
  const { data: settings } = await supabase
    .from('kinora_payment_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (!settings || !settings.sumopod_enabled) {
    return res.status(400).json({ success: false, message: 'Sumopod is not enabled' })
  }

  const env = settings.sumopod_sandbox ? 'sandbox' : 'production'
  const config = getConfig(env, settings)

  // Validate credentials
  if (!config.apiUrl || !config.apiKey) {
    return res.status(500).json({
      success: false,
      message: 'Konfigurasi SumoPod belum lengkap. Lengkapi API URL dan API Key di Payment Gateway Settings.',
      missing: [
        ...(!config.apiUrl ? ['API URL'] : []),
        ...(!config.apiKey ? ['API Key'] : []),
        ...(!config.merchantId ? ['Merchant ID'] : []),
      ],
    })
  }

  // ─── 5. IDEMPOTENCY CHECK ───
  if (idempotency_key) {
    const { data: existing } = await supabase
      .from('kinora_marketplace_payments')
      .select('id, status, sumopod_payment_link_url, sumopod_payment_code, expires_at')
      .eq('idempotency_key', idempotency_key)
      .eq('payment_method', 'sumopod')
      .maybeSingle()

    if (existing && existing.status === 'pending' && existing.expires_at && new Date(existing.expires_at) > new Date()) {
      // Return existing pending payment
      return res.status(200).json({
        success: true,
        data: {
          transaction_id: existing.id,
          payment_link_url: existing.sumopod_payment_link_url,
          payment_code: existing.sumopod_payment_code,
          status: existing.status,
          expires_at: existing.expires_at,
        }
      })
    }
  }

  // ─── 6. CALCULATE AUTHORITATIVE PRICE ───
  const priceResult = await calculatePrice(supabase, product_type, product_id, reference_id, settings, payment_method_type_code, user.id)
  if (priceResult.error) {
    return res.status(400).json({ success: false, message: priceResult.error })
  }

  const {
    base_amount,
    discount_amount,
    application_fee,
    gateway_fee,
    shipping_amount,
    customer_total,
    fee_bearer,
    fee_snapshot,
    family_id,
  } = priceResult

  // ─── 7. CREATE KINORA TRANSACTION ───
  const orderId = `KNR-${product_type.toUpperCase().slice(0, 3)}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const expiryHours = Math.min(settings.sumopod_expiry_hours || 24, MAX_EXPIRY_HOURS)
  const expiresAt = new Date(Date.now() + expiryHours * 3600000)

  const paymentRecord = {
    user_id: user.id,
    family_id: family_id || null,
    product_type,
    product_id,
    reference_id: reference_id || null,
    base_amount,
    discount_amount,
    app_fee_amount: application_fee,
    gateway_fee_amount: gateway_fee,
    shipping_amount,
    total_amount: customer_total,
    currency: 'IDR',
    payment_method: 'sumopod',
    status: 'pending',
    xendit_external_id: orderId, // Used as order_id across all gateways
    fee_bearer,
    fee_snapshot,
    expires_at: expiresAt.toISOString(),
    idempotency_key: idempotency_key || null,
    metadata: {
      payment_environment: env,
      payment_method_type_code,
      sumopod_order_id: orderId,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data: payment, error: insertErr } = await supabase
    .from('kinora_marketplace_payments')
    .insert(paymentRecord)
    .select('id')
    .single()

  if (insertErr) {
    return res.status(500).json({ success: false, message: 'Failed to create transaction' })
  }

  // ─── 8. CREATE SUMOPOD PAYMENT ───
  const sumopodPayload = {
    order_id: orderId,
    amount: Math.round(customer_total),
    currency: 'IDR',
    expires_in_hours: expiryHours,
    success_return_url: success_return_url || `https://kinorafamilies.com/payment/success?ref=${orderId}`,
    cancel_return_url: cancel_return_url || `https://kinorafamilies.com/payment/cancel?ref=${orderId}`,
    payment_method_type_code,
  }

  let sumopodResponse
  try {
    const apiResponse = await fetch(`${config.apiUrl}/api/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': config.apiKey,
        ...(config.merchantId ? { 'X-Merchant-Id': config.merchantId } : {}),
      },
      body: JSON.stringify(sumopodPayload),
    })

    if (!apiResponse.ok) {
      const errText = await apiResponse.text()
      // Rollback payment record
      await supabase.from('kinora_marketplace_payments').update({
        status: 'failed',
        admin_note: `Sumopod API error: ${apiResponse.status} - ${errText}`,
        updated_at: new Date().toISOString()
      }).eq('id', payment.id)

      return res.status(502).json({ success: false, message: 'Payment gateway error' })
    }

    sumopodResponse = await apiResponse.json()
  } catch (e) {
    await supabase.from('kinora_marketplace_payments').update({
      status: 'failed',
      admin_note: `Sumopod API call failed: ${e.message}`,
      updated_at: new Date().toISOString()
    }).eq('id', payment.id)
    return res.status(502).json({ success: false, message: 'Payment gateway unreachable' })
  }

  // ─── 9. STORE SUMOPOD RESPONSE ───
  const spData = sumopodResponse.data || sumopodResponse
  const updateData = {
    sumopod_payment_id: spData.payment_id || null,
    sumopod_payment_link_url: spData.payment_link_url || null,
    sumopod_payment_code: spData.payment_code || null,
    sumopod_payment_code_type: spData.payment_code_type || null,
    sumopod_payment_channel: spData.payment_channel_used || payment_method_type_code,
    provider_net_amount: spData.net_amount || null,
    gateway_fee_amount: spData.fee || gateway_fee,
    metadata: {
      ...paymentRecord.metadata,
      sumopod_response: {
        payment_id: spData.payment_id,
        order_id: spData.order_id,
        amount: spData.amount,
        fee: spData.fee,
        net_amount: spData.net_amount,
        status: spData.status,
        expires_at: spData.expires_at,
      },
    },
    updated_at: new Date().toISOString(),
  }

  if (spData.expires_at) {
    updateData.expires_at = spData.expires_at
  }

  await supabase.from('kinora_marketplace_payments').update(updateData).eq('id', payment.id)

  // ─── 10. AUDIT LOG ───
  await supabase.from('kinora_payment_audit_log').insert({
    payment_id: payment.id,
    action: 'sumopod_payment_created',
    status_before: null,
    status_after: 'pending',
    metadata: { env, payment_method_type_code, amount: customer_total, sumopod_payment_id: spData.payment_id }
  }).catch(() => {})

  // ─── 11. RETURN SAFE DATA TO CLIENT ───
  return res.status(201).json({
    success: true,
    data: {
      transaction_id: payment.id,
      transaction_type: product_type,
      order_id: orderId,
      base_amount,
      application_fee,
      gateway_fee: spData.fee || gateway_fee,
      customer_total: Math.round(customer_total),
      payment_method: payment_method_type_code,
      payment_link_url: spData.payment_link_url || null,
      payment_code: spData.payment_code || null,
      payment_code_type: spData.payment_code_type || null,
      payment_channel_used: spData.payment_channel_used || null,
      status: 'pending',
      expires_at: spData.expires_at || expiresAt.toISOString(),
    }
  })
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function getConfig(env, settings) {
  if (env === 'sandbox') {
    return {
      apiUrl: settings.sumopod_sandbox_api_url || process.env.SUMOPOD_SANDBOX_API_URL || '',
      apiKey: settings.sumopod_sandbox_api_key || process.env.SUMOPOD_SANDBOX_API_KEY || '',
      merchantId: settings.sumopod_sandbox_merchant_id || process.env.SUMOPOD_SANDBOX_MERCHANT_ID || '',
    }
  }
  return {
    apiUrl: settings.sumopod_production_api_url || process.env.SUMOPOD_PRODUCTION_API_URL || '',
    apiKey: settings.sumopod_production_api_key || process.env.SUMOPOD_PRODUCTION_API_KEY || '',
    merchantId: settings.sumopod_production_merchant_id || process.env.SUMOPOD_PRODUCTION_MERCHANT_ID || '',
  }
}

/**
 * Calculate authoritative price server-side.
 * Never trust amount from client.
 */
async function calculatePrice(supabase, productType, productId, referenceId, settings, paymentMethodCode, userId) {
  let base_amount = 0
  let discount_amount = 0
  let shipping_amount = 0
  let family_id = null

  // Get family for the user
  const { data: mem } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  family_id = mem?.family_id || null

  if (productType === 'webinar') {
    const { data: webinar } = await supabase
      .from('kinora_webinars')
      .select('id, ticket_price, status')
      .eq('id', productId)
      .single()

    if (!webinar) return { error: 'Webinar not found' }
    if (webinar.status !== 'published' && webinar.status !== 'upcoming') return { error: 'Webinar not available' }
    if (!webinar.ticket_price || webinar.ticket_price <= 0) return { error: 'Webinar is free, no payment needed' }
    base_amount = Number(webinar.ticket_price)

  } else if (productType === 'consultation') {
    const { data: session } = await supabase
      .from('kinora_consultation_sessions')
      .select('id, session_price_amount, status')
      .eq('id', productId)
      .single()

    if (!session) return { error: 'Consultation session not found' }
    if (!['draft', 'awaiting_payment'].includes(session.status)) return { error: 'Session not awaiting payment' }
    if (!session.session_price_amount || session.session_price_amount <= 0) return { error: 'Consultation is free' }
    base_amount = Number(session.session_price_amount)

  } else if (productType === 'marketplace') {
    // For marketplace, productId is the order ID
    const { data: order } = await supabase
      .from('kinora_print_orders')
      .select('id, total_price, shipping_cost, discount, status')
      .eq('id', productId)
      .single()

    if (!order) return { error: 'Order not found' }
    if (order.status !== 'pending_payment') return { error: 'Order not awaiting payment' }
    base_amount = Number(order.total_price) || 0
    shipping_amount = Number(order.shipping_cost) || 0
    discount_amount = Number(order.discount) || 0
  }

  // Calculate application fee
  const feeConfig = getFeeConfig(productType, settings)
  const application_fee = Math.round(feeConfig.fixed + (base_amount * feeConfig.percent / 100))
  const fee_bearer = feeConfig.bearer

  // Calculate gateway fee
  const gwFee = GATEWAY_FEES[paymentMethodCode] || GATEWAY_FEES['qris']
  const subtotalBeforeGw = base_amount - discount_amount + shipping_amount + (fee_bearer === 'customer' ? application_fee : 0)
  const gateway_fee = Math.round(gwFee.fixed + (subtotalBeforeGw * gwFee.percent / 100))

  // Customer total
  let customer_total = base_amount - discount_amount + shipping_amount + gateway_fee
  if (fee_bearer === 'customer') {
    customer_total += application_fee
  }

  const fee_snapshot = {
    base_amount,
    discount_amount,
    shipping_amount,
    application_fee,
    application_fee_fixed: feeConfig.fixed,
    application_fee_percent: feeConfig.percent,
    fee_bearer,
    gateway_fee,
    gateway_fee_percent: gwFee.percent,
    gateway_fee_fixed: gwFee.fixed,
    payment_method_code: paymentMethodCode,
    customer_total,
    calculated_at: new Date().toISOString(),
  }

  return {
    base_amount,
    discount_amount,
    application_fee,
    gateway_fee,
    shipping_amount,
    customer_total,
    fee_bearer,
    fee_snapshot,
    family_id,
  }
}

function getFeeConfig(productType, settings) {
  switch (productType) {
    case 'webinar':
      return {
        fixed: Number(settings.webinar_app_fee_fixed) || 0,
        percent: Number(settings.webinar_app_fee_percent) || 0,
        bearer: settings.webinar_fee_bearer || 'customer',
      }
    case 'consultation':
      return {
        fixed: Number(settings.consultation_app_fee_fixed) || 0,
        percent: Number(settings.consultation_app_fee_percent) || 0,
        bearer: settings.consultation_fee_bearer || 'partner',
      }
    case 'marketplace':
      return {
        fixed: Number(settings.marketplace_app_fee_fixed) || Number(settings.print_app_fee_fixed) || 0,
        percent: Number(settings.marketplace_app_fee_percent) || Number(settings.print_app_fee_percent) || 0,
        bearer: settings.marketplace_fee_bearer || 'customer',
      }
    default:
      return { fixed: 0, percent: 0, bearer: 'customer' }
  }
}
