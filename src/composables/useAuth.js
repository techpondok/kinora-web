import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

const user = ref(null)
const session = ref(null)
const loading = ref(true)

// Initialize auth state once at module level (singleton)
let initialized = false

function initAuth() {
  if (initialized) return
  initialized = true

  supabase.auth.getSession().then(({ data: { session: s } }) => {
    session.value = s
    user.value = s?.user ?? null
    loading.value = false
  })

  supabase.auth.onAuthStateChange((_event, s) => {
    session.value = s
    user.value = s?.user ?? null
    loading.value = false
  })
}

// Run immediately on first import
initAuth()

export function useAuth() {
  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signInWithOAuth(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider })
    return { data, error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
  }

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
  }
}
