/**
 * Kinora Sumopod Payment Status API
 * Route: GET /api/payments/sumopod/status?id={transaction_id}
 *
 * Returns safe payment data for Mobile/Web clients.
 * Never exposes API keys, webhook secrets, or service-role keys.
 */
const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://sasigbuckngggpwpxlhz.supabase.co'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return res.status(500).json({ success: false, message: 'Server configuration error' })
  }
  const supabase = createClient(supabaseUrl, serviceKey)

  // Authenticate user
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) {
    return res.status(401).json({ success: false, message: 'Invalid session' })
  }

  // Get transaction ID from query
  const url = new URL(req.url, `http://${req.headers.host}`)
  const transactionId = url.searchParams.get('id')
  if (!transactionId) {
    return res.status(400).json({ success: false, message: 'Missing transaction id' })
  }

  // Fetch payment (user must own it)
  const { data: payment, error: fetchErr } = await supabase
    .from('kinora_marketplace_payments')
    .select('id, product_type, base_amount, app_fee_amount, gateway_fee_amount, discount_amount, shipping_amount, total_amount, currency, payment_method, status, fulfillment_status, sumopod_payment_id, sumopod_payment_link_url, sumopod_payment_code, sumopod_payment_code_type, sumopod_payment_channel, expires_at, paid_at, created_at, xendit_external_id')
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' })
  }

  // Return safe data only
  return res.status(200).json({
    success: true,
    data: {
      transaction_id: payment.id,
      transaction_type: payment.product_type,
      order_id: payment.xendit_external_id,
      base_amount: Number(payment.base_amount),
      application_fee: Number(payment.app_fee_amount),
      gateway_fee: Number(payment.gateway_fee_amount || 0),
      discount_amount: Number(payment.discount_amount || 0),
      shipping_amount: Number(payment.shipping_amount || 0),
      customer_total: Number(payment.total_amount),
      currency: payment.currency,
      payment_method: payment.payment_method,
      payment_link_url: payment.sumopod_payment_link_url,
      payment_code: payment.sumopod_payment_code,
      payment_code_type: payment.sumopod_payment_code_type,
      payment_channel_used: payment.sumopod_payment_channel,
      status: payment.status,
      fulfillment_status: payment.fulfillment_status,
      expires_at: payment.expires_at,
      paid_at: payment.paid_at,
      created_at: payment.created_at,
    }
  })
}
