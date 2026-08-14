// Kinora SumoPod Webhook Handler (Edge Function)
// Deploy: supabase functions deploy sumopod-webhook --no-verify-jwt
// Webhook URL: https://<project-ref>.supabase.co/functions/v1/sumopod-webhook
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ success: false, error: "method_not_allowed" }, 405)
  }

  // ─── 1. TOKEN VERIFICATION ───
  const expectedToken = Deno.env.get("SUMOPOD_WEBHOOK_TOKEN") || ""
  const receivedToken = (req.headers.get("x-webhook-token") || "").trim()

  console.log("[SUMOPOD_WEBHOOK]", {
    tokenConfigured: !!expectedToken,
    tokenReceived: !!receivedToken,
    tokenMatched: !!expectedToken && !!receivedToken && expectedToken === receivedToken,
  })

  if (!expectedToken) {
    return json({ success: false, error: "webhook_not_configured" }, 500)
  }

  if (!receivedToken) {
    return json({ success: false, error: "missing_webhook_token" }, 401)
  }

  if (receivedToken !== expectedToken) {
    return json({ success: false, error: "invalid_webhook_token" }, 401)
  }

  // ─── 2. PARSE PAYLOAD ───
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return json({ success: false, error: "invalid_json" }, 400)
  }

  const eventType = payload.event_type || payload.type || ""
  console.log("[SUMOPOD_WEBHOOK] event:", eventType)

  // ─── 3. HANDLE payment.test ───
  if (eventType === "payment.test") {
    return json({ success: true, event_type: "payment.test" }, 200)
  }

  // ─── 4. SUPABASE CLIENT ───
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[SUMOPOD_WEBHOOK] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    return json({ success: false, error: "server_config" }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // ─── 5. HANDLE PAYMENT EVENTS ───
  const paymentData = payload.data || payload
  const paymentId = paymentData.payment_id || paymentData.id || ""
  const orderId = paymentData.order_id || ""
  const status = paymentData.status || ""

  if (!orderId && !paymentId) {
    return json({ success: false, error: "missing_payment_identifier" }, 400)
  }

  try {
    if (eventType === "payment.completed") {
      // Update payment record
      const updatePayload: any = {
        status: "paid",
        paid_at: paymentData.completed_at || new Date().toISOString(),
        gateway_fee: paymentData.fee || 0,
        net_amount: paymentData.net_amount || 0,
        sumopod_payment_id: paymentId,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("kinora_marketplace_payments")
        .update(updatePayload)
        .eq("order_id", orderId)

      if (error) {
        console.error("[SUMOPOD_WEBHOOK] DB update error:", error.message)
        return json({ success: false, error: "db_update_failed" }, 500)
      }

      // Auto-confirm webinar registration if applicable
      if (orderId.startsWith("WEBINAR-")) {
        const { data: payment } = await supabase
          .from("kinora_marketplace_payments")
          .select("reference_id, product_type")
          .eq("order_id", orderId)
          .maybeSingle()

        if (payment?.product_type === "webinar" && payment.reference_id) {
          const { data: webinar } = await supabase
            .from("kinora_webinars")
            .select("registration_mode")
            .eq("id", payment.reference_id.split(":")[0])
            .maybeSingle()

          const autoApprove = !webinar || webinar.registration_mode !== "approval"
          if (autoApprove) {
            await supabase
              .from("kinora_webinar_registrations")
              .update({ status: "approved", reviewed_at: new Date().toISOString() })
              .eq("id", payment.reference_id.split(":")[1] || payment.reference_id)
              .eq("status", "pending")
          }
        }
      }

      console.log("[SUMOPOD_WEBHOOK] payment.completed processed:", orderId)
      return json({ success: true, event_type: eventType }, 200)

    } else if (eventType === "payment.failed") {
      await supabase
        .from("kinora_marketplace_payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("order_id", orderId)

      console.log("[SUMOPOD_WEBHOOK] payment.failed processed:", orderId)
      return json({ success: true, event_type: eventType }, 200)

    } else if (eventType === "payment.expired") {
      await supabase
        .from("kinora_marketplace_payments")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("order_id", orderId)

      console.log("[SUMOPOD_WEBHOOK] payment.expired processed:", orderId)
      return json({ success: true, event_type: eventType }, 200)

    } else {
      // Unknown event — acknowledge without processing
      console.log("[SUMOPOD_WEBHOOK] unhandled event:", eventType)
      return json({ success: true, event_type: eventType, action: "ignored" }, 200)
    }
  } catch (err) {
    console.error("[SUMOPOD_WEBHOOK] Error:", err.message)
    return json({ success: false, error: "internal_error" }, 500)
  }
})

function json(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
