import { ref, watch } from 'vue'
import { supabase } from '../lib/supabase.js'

const googleConfig = ref(null)
const loaded = ref(false)

/**
 * Fetches Google Services config and injects meta tags + scripts on public pages.
 * Should be called once from App.vue or public layout.
 */
export function useGoogleServices() {
  async function loadConfig() {
    if (loaded.value) return googleConfig.value
    try {
      const { data } = await supabase
        .from('kinora_landing_config')
        .select('value')
        .eq('key', 'google_services')
        .eq('status', 'published')
        .maybeSingle()
      if (data?.value) {
        googleConfig.value = data.value
        loaded.value = true
      }
    } catch (e) {
      // Silently fail - Google services are non-critical
    }
    return googleConfig.value
  }

  function injectHeadTags(routePath) {
    if (!googleConfig.value) return

    const config = googleConfig.value
    const isPublicPage = !isPrivatePage(routePath)

    // Search Console meta verification
    if (isPublicPage && config.search_console?.verification_code) {
      injectMeta('google-site-verification', config.search_console.verification_code)
    }

    // AdSense account meta
    if (isPublicPage && config.adsense?.enabled && config.adsense?.publisher_id) {
      injectMeta('google-adsense-account', config.adsense.publisher_id)
    }

    // AdSense script
    if (isPublicPage && config.adsense?.enabled && config.adsense?.script_enabled && config.adsense?.publisher_id) {
      injectAdSenseScript(config.adsense.publisher_id)
    }

    // Google Analytics
    if (isPublicPage && config.analytics?.enabled && config.analytics?.measurement_id) {
      injectAnalyticsScript(config.analytics.measurement_id)
    }

    // Google Tag Manager
    if (isPublicPage && config.tag_manager?.enabled && config.tag_manager?.container_id) {
      injectGTMScript(config.tag_manager.container_id)
    }
  }

  function isPrivatePage(path) {
    const privatePrefixes = ['/dashboard', '/admin', '/consultant', '/portal', '/login', '/register', '/forgot-password']
    return privatePrefixes.some(prefix => path.startsWith(prefix))
  }

  function isAdAllowedPage(routePath) {
    if (!googleConfig.value?.adsense?.enabled) return false
    const blocked = googleConfig.value.adsense.blocked_pages || []
    const pageKey = getPageKey(routePath)
    if (blocked.includes(pageKey)) return false
    const allowed = googleConfig.value.adsense.allowed_pages || []
    return allowed.includes(pageKey)
  }

  function getPageKey(path) {
    if (path === '/') return 'home'
    if (path === '/articles') return 'articles'
    if (path.startsWith('/articles/')) return 'article_detail'
    if (path === '/help') return 'help'
    if (path.startsWith('/help/')) return 'help_article'
    if (path === '/terms') return 'terms'
    if (path === '/privacy') return 'privacy'
    if (path === '/login') return 'login'
    if (path === '/register') return 'register'
    if (path.startsWith('/dashboard')) return 'dashboard'
    if (path.startsWith('/consultant')) return 'consultant'
    if (path.startsWith('/portal')) return 'portal'
    if (path.startsWith('/admin')) return 'admin'
    return 'other'
  }

  return { googleConfig, loadConfig, injectHeadTags, isAdAllowedPage, loaded }
}

// --- DOM helpers (inject only once) ---

function injectMeta(name, content) {
  if (!content) return
  const existing = document.querySelector(`meta[name="${name}"]`)
  if (existing) {
    existing.setAttribute('content', content)
    return
  }
  const meta = document.createElement('meta')
  meta.setAttribute('name', name)
  meta.setAttribute('content', content)
  document.head.appendChild(meta)
}

function injectAdSenseScript(publisherId) {
  const scriptId = 'google-adsense-script'
  if (document.getElementById(scriptId)) return
  const script = document.createElement('script')
  script.id = scriptId
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`
  document.head.appendChild(script)
}

function injectAnalyticsScript(measurementId) {
  const scriptId = 'google-analytics-script'
  if (document.getElementById(scriptId)) return
  const script = document.createElement('script')
  script.id = scriptId
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  const inlineScript = document.createElement('script')
  inlineScript.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}');`
  document.head.appendChild(inlineScript)
}

function injectGTMScript(containerId) {
  const scriptId = 'google-gtm-script'
  if (document.getElementById(scriptId)) return
  const script = document.createElement('script')
  script.id = scriptId
  script.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${containerId}');`
  document.head.appendChild(script)
}
