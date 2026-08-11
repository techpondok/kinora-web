// Kinora Tripay Webhook Edge Function
// Required secrets: SUPABASE_SERVICE_ROLE_KEY, TRIPAY_PRIVATE_KEY
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false }), { status: 405, headers: { 'Content-Type': 'application/json' } })
  }
  // TODO: Migrate from api/payments/tripay/callback.js
  return new Response(JSON.stringify({ success: true, message: 'Edge function placeholder' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
