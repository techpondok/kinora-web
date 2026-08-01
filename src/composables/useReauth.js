import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

const showReauthModal = ref(false)
const reauthCallback = ref(null)
const reauthError = ref('')
const reauthLoading = ref(false)

export function useReauth() {
  /**
   * Request reauthentication before a sensitive action.
   * Returns a promise that resolves when user confirms password.
   */
  function requireReauth() {
    return new Promise((resolve, reject) => {
      reauthError.value = ''
      reauthCallback.value = { resolve, reject }
      showReauthModal.value = true
    })
  }

  async function confirmReauth(password) {
    reauthLoading.value = true
    reauthError.value = ''

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      reauthError.value = 'Session tidak valid.'
      reauthLoading.value = false
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    })

    if (error) {
      reauthError.value = 'Password tidak sesuai.'
      reauthLoading.value = false
      return
    }

    reauthLoading.value = false
    showReauthModal.value = false
    if (reauthCallback.value) {
      reauthCallback.value.resolve(true)
      reauthCallback.value = null
    }
  }

  function cancelReauth() {
    showReauthModal.value = false
    reauthError.value = ''
    if (reauthCallback.value) {
      reauthCallback.value.reject(new Error('Reauthentication cancelled'))
      reauthCallback.value = null
    }
  }

  return {
    showReauthModal,
    reauthError,
    reauthLoading,
    requireReauth,
    confirmReauth,
    cancelReauth,
  }
}
