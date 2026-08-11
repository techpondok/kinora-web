// Kinora Sumopod Webhook Edge Function
// Deployed via: supabase functions deploy sumopod-webhook
// Required secrets: SUPABASE_SERVICE_ROLE_KEY, SUMOPOD_WEBHOOK_SECRET, SUMOPOD_WEBHOOK_TOKEN
//
// This is a placeholder entry point. The actual implementation lives in:
// api/payments/sumopod/callback.js (Vercel serverless)
//
// When migrating to Supabase Edge Functions, move the logic here.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // TODO: Migrate from api/payments/sumopod/callback.js
  return new Response(JSON.stringify({ success: true, message: 'Edge function placeholder - use Vercel endpoint' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
