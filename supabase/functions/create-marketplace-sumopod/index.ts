// Kinora Create Payment (SumoPod) — with 3-Tier Webinar Pricing
// Called by Flutter: supabase.functions.invoke('create-marketplace-sumopod', ...)
// Uses atomic pricing resolver for webinar tier allocation
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS })
  if (req.method !== "POST") return json({ success: false, error: "method_not_allowed" }, 405)

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  if (!supabaseUrl || !serviceRoleKey) return json({ success: false, error: "Server config error" }, 500)
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Auth
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "")
  if (!token) return json({ success: false, error: "Unauthorized" }, 401)
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return json({ success: false, error: "Invalid session" }, 401)

  // Parse body
  let body: any
  try { body = await req.json() } catch { return json({ success: false, error: "Invalid JSON" }, 400) }

  const { product_type, product_id, payment_method_type_code, success_return_url, cancel_return_url } = body
  if (!product_type || !product_id) return json({ success: false, error: "Missing product_type or product_id" }, 400)

  // Load payment settings
  const { data: settings } = await supabase.from("kinora_payment_settings").select("*").eq("id", 1).single()
  if (!settings?.sumopod_enabled) return json({ success: false, error: "SumoPod tidak aktif." }, 400)

  const isSandbox = settings.sumopod_sandbox ?? true
  const apiUrl = isSandbox
    ? (settings.sumopod_sandbox_api_url || "https://api-pay-sandbox.sumopod.com/api/v1/payments")
    : (settings.sumopod_production_api_url || "https://api-pay.sumopod.com/api/v1/payments")

  // Load API Key from kinora_app_secrets
  let apiKey = ""
  try {
    const { data: s } = await supabase.from("kinora_app_secrets").select("value_encrypted").eq("secret_key", "SUMOPOD_API_KEY").maybeSingle()
    apiKey = s?.value_encrypted || ""
  } catch {}
  if (!apiKey) apiKey = Deno.env.get("SUMOPOD_API_KEY") || ""
  if (!apiKey) return json({ success: false, error: "SUMOPOD_API_KEY belum dikonfigurasi. Atur di Admin > API Keys.", provider_status: null }, 500)

  // ─── WEBINAR FLOW (with 3-tier pricing) ───
  if (product_type === "webinar") {
    // Use atomic allocator
    const { data: allocation, error: allocErr } = await supabase.rpc("allocate_webinar_registration", {
      p_webinar_id: product_id,
      p_user_id: user.id,
    })

    if (allocErr) {
      console.error("[PAYMENT] allocate_webinar_registration error:", allocErr.message)
      return json({ success: false, error: "Gagal mendaftarkan webinar." }, 500)
    }

    if (allocation?.error) {
      if (allocation.error === "already_registered") {
        return json({ success: false, error: "Anda sudah terdaftar di webinar ini.", registration_id: allocation.registration_id }, 409)
      }
      return json({ success: false, error: allocation.error }, 400)
    }

    const regId = allocation.registration_id
    const pricingType = allocation.pricing_type
    const finalPrice = Number(allocation.final_price || 0)
    const requiresPayment = allocation.requires_payment

    console.log("[PAYMENT] Webinar allocation:", { regId, pricingType, finalPrice, requiresPayment })

    // FREE EARLY BIRD — no payment needed
    if (!requiresPayment || finalPrice === 0) {
      return json({
        success: true,
        registration_id: regId,
        pricing_type: pricingType,
        original_price: Number(allocation.original_price || 0),
        final_price: 0,
        position: allocation.position,
        status: "approved",
        requires_payment: false,
        payment_link_url: null,
      }, 200)
    }

    // EARLY PRICE or NORMAL — create SumoPod payment
    const totalAmount = Math.round(finalPrice)
    const orderId = `KINORA-WEBINAR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

    const sumopodPayload = {
      order_id: orderId,
      amount: totalAmount,
      currency: "IDR",
      expires_in_hours: 24,
      payment_method_type_code: payment_method_type_code || settings.sumopod_default_method || "qris",
      success_return_url: success_return_url || `https://kinorafamilies.com/payment/success?ref=${orderId}`,
      cancel_return_url: cancel_return_url || `https://kinorafamilies.com/payment/cancel?ref=${orderId}`,
    }

    console.log("[SUMOPOD] Creating payment", { order_id: orderId, amount: totalAmount, pricing_type: pricingType })

    let sumopodResponse: any
    try {
      const apiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
        body: JSON.stringify(sumopodPayload),
      })
      if (!apiResponse.ok) {
        const errText = await apiResponse.text()
        console.error("[SUMOPOD] API error:", apiResponse.status, errText)
        // Rollback registration to expired
        await supabase.from("kinora_webinar_registrations").update({ status: "expired" }).eq("id", regId)
        return json({ success: false, error: "Pembayaran tidak tersedia. Coba lagi.", provider_status: apiResponse.status }, 502)
      }
      sumopodResponse = await apiResponse.json()
    } catch (err: any) {
      console.error("[SUMOPOD] Network error:", err.message)
      await supabase.from("kinora_webinar_registrations").update({ status: "expired" }).eq("id", regId)
      return json({ success: false, error: "Payment provider unreachable" }, 502)
    }

    // Validate amount
    const providerAmount = Number(sumopodResponse.amount || 0)
    if (providerAmount > 0 && providerAmount !== totalAmount) {
      console.error("[SUMOPOD] AMOUNT MISMATCH!", { expected: totalAmount, provider: providerAmount })
      await supabase.from("kinora_webinar_registrations").update({ status: "expired" }).eq("id", regId)
      return json({ success: false, error: "Nominal pembayaran tidak sesuai.", expected_amount: totalAmount, provider_amount: providerAmount }, 500)
    }

    // Save payment record
    const { data: savedPayment } = await supabase.from("kinora_marketplace_payments").insert({
      order_id: orderId,
      user_id: user.id,
      product_type: "webinar",
      product_id,
      reference_id: `${product_id}:${regId}`,
      amount: totalAmount,
      total_amount: totalAmount,
      currency: "IDR",
      status: "pending",
      payment_gateway: "sumopod",
      payment_method: sumopodPayload.payment_method_type_code,
      sumopod_payment_id: sumopodResponse.payment_id || null,
      sumopod_payment_link_url: sumopodResponse.payment_link_url || null,
      gateway_fee: sumopodResponse.fee || 0,
      net_amount: sumopodResponse.net_amount || 0,
      expires_at: sumopodResponse.expires_at || null,
      description: `Webinar ${pricingType}`,
    }).select("id").single()

    // Link payment to registration
    if (savedPayment) {
      await supabase.from("kinora_webinar_registrations").update({ payment_id: savedPayment.id }).eq("id", regId)
    }

    return json({
      success: true,
      registration_id: regId,
      payment_id: savedPayment?.id,
      order_id: orderId,
      pricing_type: pricingType,
      original_price: Number(allocation.original_price || 0),
      final_price: totalAmount,
      position: allocation.position,
      status: "pending",
      requires_payment: true,
      payment_link_url: sumopodResponse.payment_link_url,
      payment_url: sumopodResponse.payment_link_url,
      expires_at: sumopodResponse.expires_at,
    }, 200)
  }

  // ─── CONSULTATION / MARKETPLACE (existing logic) ───
  let basePrice = 0
  let totalAmount = 0
  let orderDescription = ""

  if (product_type === "consultation") {
    const { data: session } = await supabase.from("kinora_consultation_sessions").select("id, session_price_amount, status, consultant_name").eq("id", product_id).single()
    if (!session) return json({ success: false, error: "Session not found" }, 404)
    basePrice = Number(session.session_price_amount || 0)
    if (basePrice <= 0) return json({ success: false, error: "Invalid price" }, 400)
    const feeFixed = Number(settings.consultation_app_fee_fixed) || 0
    const feePercent = Number(settings.consultation_app_fee_percent) || 0
    const feeBearer = settings.consultation_fee_bearer || "customer"
    const appFee = Math.round(feeFixed + (basePrice * feePercent / 100))
    totalAmount = feeBearer === "customer" ? basePrice + appFee : basePrice
    orderDescription = `Konsultasi: ${session.consultant_name || "Konsultan"}`
  } else if (product_type === "marketplace") {
    const { data: order } = await supabase.from("kinora_print_orders").select("id, total_price, shipping_cost, discount, status").eq("id", product_id).single()
    if (!order) return json({ success: false, error: "Order not found" }, 404)
    basePrice = Number(order.total_price || 0)
    const shipping = Number(order.shipping_cost || 0)
    const discount = Number(order.discount || 0)
    const feeFixed = Number(settings.print_app_fee_fixed || settings.marketplace_app_fee_fixed) || 0
    const feePercent = Number(settings.print_app_fee_percent || settings.marketplace_app_fee_percent) || 0
    const appFee = Math.round(feeFixed + (basePrice * feePercent / 100))
    totalAmount = basePrice + shipping - discount + appFee
    orderDescription = "Marketplace Order"
  } else {
    return json({ success: false, error: `Unsupported: ${product_type}` }, 400)
  }

  totalAmount = Math.round(totalAmount)
  if (totalAmount <= 0) return json({ success: false, error: "Invalid amount" }, 400)

  const orderId = `KINORA-${product_type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

  console.log("[SUMOPOD] Creating payment", { product_type, order_id: orderId, amount: totalAmount })

  let sumopodResponse: any
  try {
    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
      body: JSON.stringify({
        order_id: orderId,
        amount: totalAmount,
        currency: "IDR",
        expires_in_hours: 24,
        payment_method_type_code: payment_method_type_code || settings.sumopod_default_method || "qris",
        success_return_url: success_return_url || `https://kinorafamilies.com/payment/success?ref=${orderId}`,
        cancel_return_url: cancel_return_url || `https://kinorafamilies.com/payment/cancel?ref=${orderId}`,
      }),
    })
    if (!apiResponse.ok) {
      const errText = await apiResponse.text()
      console.error("[SUMOPOD] API error:", apiResponse.status, errText)
      return json({ success: false, error: "Pembayaran tidak tersedia.", provider_status: apiResponse.status }, 502)
    }
    sumopodResponse = await apiResponse.json()
  } catch (err: any) {
    return json({ success: false, error: "Payment provider unreachable" }, 502)
  }

  const { data: savedPayment } = await supabase.from("kinora_marketplace_payments").insert({
    order_id: orderId, user_id: user.id, product_type, product_id, reference_id: product_id,
    amount: totalAmount, total_amount: totalAmount, currency: "IDR", status: "pending",
    payment_gateway: "sumopod", payment_method: payment_method_type_code || "qris",
    sumopod_payment_id: sumopodResponse.payment_id || null,
    sumopod_payment_link_url: sumopodResponse.payment_link_url || null,
    gateway_fee: sumopodResponse.fee || 0, net_amount: sumopodResponse.net_amount || 0,
    expires_at: sumopodResponse.expires_at || null, description: orderDescription,
  }).select("id, order_id, amount, status, sumopod_payment_link_url, expires_at").single()

  return json({
    success: true, payment_id: savedPayment?.id, order_id: orderId,
    amount: totalAmount, total_amount: totalAmount, status: "pending",
    payment_link_url: sumopodResponse.payment_link_url, payment_url: sumopodResponse.payment_link_url,
    expires_at: savedPayment?.expires_at,
  }, 200)
})

function json(data: any, status: number) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS })
}
