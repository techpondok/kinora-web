// Kinora Payment Create Edge Function
// Reads SUMOPOD_API_KEY from kinora_app_secrets (Admin → API Keys)
// Reads payment config (API URL, environment) from kinora_payment_settings
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS })
  }
  if (req.method !== "POST") {
    return json({ success: false, error: "method_not_allowed" }, 405)
  }

  // ─── 1. SUPABASE CLIENT (service role) ───
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ success: false, error: "Server configuration error" }, 500)
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // ─── 2. AUTHENTICATE USER ───
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace("Bearer ", "")
  if (!token) {
    return json({ success: false, error: "Unauthorized" }, 401)
  }
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) {
    return json({ success: false, error: "Invalid session" }, 401)
  }

  // ─── 3. PARSE REQUEST ───
  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ success: false, error: "Invalid JSON" }, 400)
  }

  const {
    product_type,
    product_id,
    payment_method_type_code,
    success_return_url,
    cancel_return_url,
  } = body

  if (!product_type || !product_id) {
    return json({ success: false, error: "Missing product_type or product_id" }, 400)
  }

  // ─── 4. LOAD PAYMENT SETTINGS (Payment Integration) ───
  const { data: settings } = await supabase
    .from("kinora_payment_settings")
    .select("*")
    .eq("id", 1)
    .single()

  if (!settings?.sumopod_enabled) {
    return json({ success: false, error: "SumoPod tidak aktif." }, 400)
  }

  const isSandbox = settings.sumopod_sandbox ?? true
  const apiUrl = isSandbox
    ? (settings.sumopod_sandbox_api_url || "https://api-pay-sandbox.sumopod.com/api/v1/payments")
    : (settings.sumopod_production_api_url || "https://api-pay.sumopod.com/api/v1/payments")

  // ─── 5. LOAD API KEY from kinora_app_secrets (Admin → API Keys) ───
  let apiKey = ""
  try {
    const { data: secretRow } = await supabase
      .from("kinora_app_secrets")
      .select("value_encrypted")
      .eq("secret_key", "SUMOPOD_API_KEY")
      .maybeSingle()
    apiKey = secretRow?.value_encrypted || ""
  } catch {}

  // Fallback to Edge Function secret
  if (!apiKey) {
    apiKey = Deno.env.get("SUMOPOD_API_KEY") || ""
  }

  if (!apiKey) {
    return json({
      success: false,
      error: "SUMOPOD_API_KEY belum dikonfigurasi. Atur di Admin > API Keys.",
      provider_status: null,
    }, 500)
  }

  // ─── 6. DETERMINE PRICE ───
  let amount = 0
  let orderDescription = ""

  if (product_type === "webinar") {
    const { data: webinar } = await supabase
      .from("kinora_webinars")
      .select("id, title, price_amount, ticket_price, is_free, is_published")
      .eq("id", product_id)
      .single()

    if (!webinar) return json({ success: false, error: "Webinar not found" }, 404)
    if (webinar.is_free) return json({ success: false, error: "Webinar is free" }, 400)

    const basePrice = Number(webinar.ticket_price || webinar.price_amount || 0)
    if (basePrice <= 0) return json({ success: false, error: "Invalid webinar price" }, 400)

    // Calculate app fee from global settings
    const feeFixed = Number(settings.webinar_app_fee_fixed) || 0
    const feePercent = Number(settings.webinar_app_fee_percent) || 0
    const feeBearer = settings.webinar_fee_bearer || "customer"
    const appFee = Math.round(feeFixed + (basePrice * feePercent / 100))

    amount = feeBearer === "customer" ? basePrice + appFee : basePrice
    orderDescription = `Webinar: ${webinar.title}`

  } else if (product_type === "consultation") {
    const { data: session } = await supabase
      .from("kinora_consultation_sessions")
      .select("id, session_price_amount, status, consultant_name")
      .eq("id", product_id)
      .single()

    if (!session) return json({ success: false, error: "Session not found" }, 404)

    const basePrice = Number(session.session_price_amount || 0)
    if (basePrice <= 0) return json({ success: false, error: "Invalid session price" }, 400)

    const feeFixed = Number(settings.consultation_app_fee_fixed) || 0
    const feePercent = Number(settings.consultation_app_fee_percent) || 0
    const feeBearer = settings.consultation_fee_bearer || "customer"
    const appFee = Math.round(feeFixed + (basePrice * feePercent / 100))

    amount = feeBearer === "customer" ? basePrice + appFee : basePrice
    orderDescription = `Konsultasi: ${session.consultant_name || "Konsultan"}`

  } else {
    return json({ success: false, error: `Unsupported product_type: ${product_type}` }, 400)
  }

  // ─── 7. CREATE ORDER ID ───
  const orderId = `${product_type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

  // ─── 8. CALL SUMOPOD API ───
  const sumopodPayload = {
    order_id: orderId,
    amount: Math.round(amount),
    currency: "IDR",
    expires_in_hours: 24,
    payment_method_type_code: payment_method_type_code || settings.sumopod_default_method || "qris",
    success_return_url: success_return_url || `https://kinorafamilies.com/payment/success?ref=${orderId}`,
    cancel_return_url: cancel_return_url || `https://kinorafamilies.com/payment/cancel?ref=${orderId}`,
  }

  console.log("[PAYMENT_CREATE]", { product_type, product_id, amount, orderId, apiUrl: apiUrl.substring(0, 40) })

  let sumopodResponse: any
  try {
    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(sumopodPayload),
    })

    if (!apiResponse.ok) {
      const errText = await apiResponse.text()
      console.error("[PAYMENT_CREATE] SumoPod error:", apiResponse.status, errText)
      return json({
        success: false,
        error: "Pembayaran sedang tidak tersedia. Silakan coba lagi nanti.",
        provider_status: apiResponse.status,
      }, 502)
    }

    sumopodResponse = await apiResponse.json()
  } catch (err: any) {
    console.error("[PAYMENT_CREATE] Network error:", err.message)
    return json({ success: false, error: "Payment provider unreachable" }, 502)
  }

  // ─── 9. SAVE PAYMENT RECORD ───
  const paymentRecord = {
    order_id: orderId,
    user_id: user.id,
    product_type,
    product_id,
    reference_id: product_id,
    amount: Math.round(amount),
    currency: "IDR",
    status: "pending",
    payment_gateway: "sumopod",
    payment_method: sumopodPayload.payment_method_type_code,
    sumopod_payment_id: sumopodResponse.payment_id || null,
    sumopod_payment_link_url: sumopodResponse.payment_link_url || null,
    sumopod_payment_code: sumopodResponse.payment_code || null,
    gateway_fee: sumopodResponse.fee || 0,
    net_amount: sumopodResponse.net_amount || 0,
    expires_at: sumopodResponse.expires_at || null,
    description: orderDescription,
  }

  const { data: savedPayment, error: saveErr } = await supabase
    .from("kinora_marketplace_payments")
    .insert(paymentRecord)
    .select("id, order_id, amount, status, sumopod_payment_link_url, expires_at")
    .single()

  if (saveErr) {
    console.error("[PAYMENT_CREATE] Save error:", saveErr.message)
    return json({ success: false, error: "Failed to save payment record" }, 500)
  }

  // ─── 10. RETURN RESPONSE ───
  return json({
    success: true,
    payment_id: savedPayment.id,
    order_id: savedPayment.order_id,
    amount: savedPayment.amount,
    status: savedPayment.status,
    payment_link_url: sumopodResponse.payment_link_url,
    payment_url: sumopodResponse.payment_link_url,
    expires_at: savedPayment.expires_at,
  }, 200)
})

function json(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  })
}
