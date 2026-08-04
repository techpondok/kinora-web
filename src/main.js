import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index.js'
import { testConnection } from './lib/supabase.js'

const app = createApp(App)
app.use(router)
app.mount('#app')

// Test koneksi Supabase saat app start
// testConnection().then(({ ok, message }) => {
//   if (ok) {
//     console.log('[Supabase] Koneksi berhasil.')
//   } else {
//     console.error('[Supabase] Koneksi gagal:', message)
//   }
// })
