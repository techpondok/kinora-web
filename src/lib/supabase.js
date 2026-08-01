import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY harus diisi di file .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Test koneksi ke Supabase.
 * Menggunakan auth endpoint yang selalu tersedia tanpa perlu table apapun.
 */
export async function testConnection() {
  try {
    const { error } = await supabase.auth.getSession()
    if (error) {
      return { ok: false, message: error.message }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}
