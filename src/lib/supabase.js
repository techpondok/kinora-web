/**
 * Kinora Data Access Layer
 *
 * Both Development and Production use Supabase (separate projects).
 * Environment is determined by VITE_APP_ENV.
 *
 * DEV:  Supabase Development Project
 * PROD: Supabase Production Project
 *
 * All downstream code uses `supabase.from()`, `supabase.rpc()`,
 * `supabase.auth`, `supabase.storage` — same interface, different project.
 */
import { createClient } from '@supabase/supabase-js'

const APP_ENV = import.meta.env.VITE_APP_ENV || 'development'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isProduction = APP_ENV === 'production'
const isDevelopment = APP_ENV === 'development'

// ─── Safety Guard: Prevent environment mismatch ───
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    `[Kinora] Missing Supabase credentials for ${APP_ENV}. ` +
    `Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.${APP_ENV}`
  )
}

// Production safety: known prod project ref
const PROD_PROJECT_REF = 'sasigbuckngggpwpxlhz'

if (isProduction && !SUPABASE_URL.includes(PROD_PROJECT_REF)) {
  throw new Error(
    `[Kinora] APP_ENV=production but SUPABASE_URL does not match production project. ` +
    `Expected "${PROD_PROJECT_REF}" in URL. Aborting to prevent data corruption.`
  )
}

if (isDevelopment && SUPABASE_URL.includes(PROD_PROJECT_REF)) {
  throw new Error(
    `[Kinora] APP_ENV=development but SUPABASE_URL points to PRODUCTION project. ` +
    `Never use production Supabase for development. Check .env.development`
  )
}

// ─── Create Supabase Client ───
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Test connection to current Supabase project.
 */
export async function testConnection() {
  try {
    const { error } = await supabase.auth.getSession()
    return { ok: !error, message: error?.message || '' }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}

/**
 * Environment info (for admin UI / debugging).
 */
export const envInfo = {
  isProduction,
  isDevelopment,
  env: APP_ENV,
  supabaseUrl: SUPABASE_URL,
  projectRef: SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown',
  backendType: 'Supabase',
}
