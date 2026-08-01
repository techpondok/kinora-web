import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

const landingConfig = ref({})
const plans = ref([])
const consultants = ref([])
const webinars = ref([])
const articles = ref([])
const loaded = ref(false)
const loadError = ref('')

export function useLandingData() {
  async function loadAll() {
    if (loaded.value) return
    loadError.value = ''
    try {
      const [configRes, plansRes, consultRes, webinarRes, articleRes] = await Promise.all([
        supabase.from('kinora_landing_config').select('key, value').eq('status', 'published'),
        supabase.from('kinora_subscription_settings').select('key, value, label').like('key', 'plans.%'),
        supabase.from('kinora_consultants').select('id, name, specialty, bio, avatar_url, session_price_amount, price_currency, chat_enabled, meeting_enabled, meeting_platform').eq('is_active', true).order('priority', { ascending: false }).limit(6),
        supabase.from('kinora_webinars').select('id, title, description, cover_url, speaker_name, is_free, price_amount, scheduled_at, meeting_platform, is_published').eq('is_published', true).order('scheduled_at', { ascending: false }).limit(6),
        supabase.from('kinora_articles').select('id, title, slug, summary, cover_url, cover_alt, content_type, category, author_name, published_at, read_count, is_featured, seo_score').eq('status', 'published').lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).limit(6),
      ])

      // Config
      const cfg = {}
      for (const row of (configRes.data || [])) cfg[row.key] = row.value
      landingConfig.value = cfg

      // Plans
      plans.value = (plansRes.data || []).map(p => ({ key: p.key, label: p.label, ...p.value })).sort((a, b) => (a.price_monthly_idr || 0) - (b.price_monthly_idr || 0))

      consultants.value = consultRes.data || []
      webinars.value = webinarRes.data || []
      articles.value = articleRes.data || []
      loaded.value = true
    } catch (e) {
      loadError.value = e.message
    }
  }

  function cfg(key) { return landingConfig.value[key] || {} }

  function formatIDR(val) {
    if (!val && val !== 0) return 'Gratis'
    return 'Rp' + Number(val).toLocaleString('id-ID')
  }

  return { landingConfig, plans, consultants, webinars, articles, loaded, loadError, loadAll, cfg, formatIDR }
}
