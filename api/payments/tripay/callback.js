const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY
  if (!PRIVATE_KEY) {
    console.error('[TriPay Callback] TRIPAY_PRIVATE_KEY not configured')
    return res.status(500).json({ success: false, message: 'Server configuration error' })
  }

  // 1. Get raw body and signature
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  const signature = req.headers['x-callback-signature']
  const event = req.headers['x-callback-event']

  // 2. Validate signature
  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing callback signature' })
  }

  const expectedSignature = crypto.createHmac('sha256', PRIVATE_KEY).update(rawBody).digest('hex')

  if (signature !== expectedSignature) {
    console.error('[TriPay Callback] Invalid signature')
    return res.status(403).json({ success: false, message: 'Invalid callback signature' })
  }

  // 3. Validate event
  if (event !== 'payment_status') {
    return res.status(400).json({ success: false, message: 'Unsupported callback event' })
  }

  // 4. Parse payload
  let payload
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Malformed JSON payload' })
  }

  const { reference, merchant_ref, status, total_amount, fee_merchant, fee_customer, total_fee, amount_received, paid_at, payment_method, payment_method_code, note } = payload

  if (!merchant_ref || !status) {
    return res.status(400).json({ success: false, message: 'Missing required fields' })
  }

  // 5. Connect to Supabase with service role
  const supabaseUrl = 'https://sasigbuckngggpwpxlhz.supabase.co'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error('[TriPay Callback] SUPABASE_SERVICE_ROLE_KEY not configured')
    return res.status(500).json({ success: false, message: 'Server configuration error' })
  }
  const supabase = createClient(supabaseUrl, serviceKey)

  // 6. Find existing payment by merchant_ref (xendit_external_id field stores our reference)
  const { data: payment, error: findErr } = await supabase
    .from('kinora_marketplace_payments')
    .select('*')
    .eq('xendit_external_id', merchant_ref)
    .maybeSingle()

  if (findErr || !payment) {
    // Try tripay_reference field
    const { data: pay2 } = await supabase
      .from('kinora_marketplace_payments')
      .select('*')
      .eq('tripay_reference', reference)
      .maybeSingle()

    if (!pay2) {
      console.error(`[TriPay Callback] Payment not found: merchant_ref=${merchant_ref}, reference=${reference}`)
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }
    // Use pay2
    return await processPayment(supabase, pay2, payload, res)
  }

  return await processPayment(supabase, payment, payload, res)
}

async function processPayment(supabase, payment, payload, res) {
  const { reference, merchant_ref, status, total_amount, fee_merchant, fee_customer, total_fee, amount_received, paid_at, payment_method_code, note } = payload

  // 7. Amount validation
  if (Math.abs(Number(payment.total_amount) - Number(total_amount)) > 1) {
    console.error(`[TriPay Callback] Amount mismatch: expected=${payment.total_amount}, received=${total_amount}`)
    await supabase.from('kinora_marketplace_payments').update({
      admin_note: `Amount mismatch: expected ${payment.total_amount}, got ${total_amount}`,
      updated_at: new Date().toISOString()
    }).eq('id', payment.id)
    return res.status(400).json({ success: false, message: 'Amount mismatch' })
  }

  // 8. Idempotency: skip if already in final state for same status
  const finalStates = ['paid', 'verified', 'refunded']
  if (finalStates.includes(payment.status) && status === 'PAID') {
    return res.status(200).json({ success: true })
  }

  // 9. Map TriPay status
  let newStatus
  switch (status) {
    case 'PAID': newStatus = 'paid'; break
    case 'FAILED': newStatus = 'failed'; break
    case 'EXPIRED': newStatus = 'expired'; break
    case 'REFUND': newStatus = 'refunded'; break
    default:
      console.error(`[TriPay Callback] Unknown status: ${status}`)
      return res.status(400).json({ success: false, message: 'Unknown payment status' })
  }

  // 10. Prevent invalid regression
  const statusPriority = { pending: 0, waiting_verification: 1, under_review: 2, paid: 3, verified: 4, refunded: 5 }
  if ((statusPriority[payment.status] || 0) > (statusPriority[newStatus] || 0) && newStatus !== 'refunded') {
    return res.status(200).json({ success: true })
  }

  // 11. Update payment record
  const updatePayload = {
    status: newStatus,
    tripay_reference: reference,
    payment_method: 'tripay',
    paid_at: status === 'PAID' ? (paid_at || new Date().toISOString()) : payment.paid_at,
    metadata: {
      ...(payment.metadata || {}),
      tripay_fee_merchant: fee_merchant,
      tripay_fee_customer: fee_customer,
      tripay_total_fee: total_fee,
      tripay_amount_received: amount_received,
      tripay_payment_method_code: payment_method_code,
      tripay_note: note,
      tripay_callback_at: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  }

  const { error: updateErr } = await supabase
    .from('kinora_marketplace_payments')
    .update(updatePayload)
    .eq('id', payment.id)

  if (updateErr) {
    console.error('[TriPay Callback] Update failed:', updateErr.message)
    return res.status(500).json({ success: false, message: 'Processing error' })
  }

  // 12. Fulfilment for PAID status
  if (status === 'PAID') {
    await executeFulfilment(supabase, payment)
  }

  // 13. Audit log
  await supabase.from('kinora_payment_audit_log').insert({
    payment_id: payment.id,
    action: `tripay_callback_${status.toLowerCase()}`,
    status_before: payment.status,
    status_after: newStatus,
    reason: `TriPay callback: ${reference}`,
    metadata: { tripay_reference: reference, amount: total_amount, method: payment_method_code }
  }).catch(() => {})

  return res.status(200).json({ success: true })
}

async function executeFulfilment(supabase, payment) {
  const type = payment.product_type

  try {
    if (type === 'subscription') {
      // Activate Family Plus
      const { data: family } = await supabase
        .from('families')
        .select('id, subscription_plan, subscription_expires_at')
        .eq('id', payment.family_id)
        .single()

      if (family) {
        const now = new Date()
        const currentExpiry = family.subscription_expires_at ? new Date(family.subscription_expires_at) : now
        const baseDate = currentExpiry > now ? currentExpiry : now
        // Determine duration from metadata or default 30 days
        const days = payment.metadata?.duration_days || 30
        const newExpiry = new Date(baseDate.getTime() + days * 86400000)

        await supabase.from('families').update({
          subscription_plan: 'family_plus',
          subscription_expires_at: newExpiry.toISOString(),
          updated_at: now.toISOString()
        }).eq('id', family.id)
      }

    } else if (type === 'webinar') {
      await supabase.from('kinora_webinar_registrations')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('payment_id', payment.id)
        .eq('status', 'pending')

    } else if (type === 'consultation') {
      await supabase.from('kinora_consultation_sessions')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('payment_id', payment.id)
        .in('status', ['draft', 'awaiting_payment'])

    } else if (type === 'print') {
      await supabase.from('kinora_print_orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('payment_id', payment.id)
        .eq('status', 'pending_payment')
    }
  } catch (e) {
    console.error(`[TriPay Callback] Fulfilment error for ${type}:`, e.message)
  }
}
