const SITE_URL = 'https://kinorafamilies.com'

/**
 * Set or update the canonical link tag and og:url meta for the current page.
 * Strips query parameters and fragments to produce a clean canonical URL.
 */
export function setCanonical(path) {
  // Normalize: remove trailing slash (except root), strip query/hash
  let clean = (path || '/').split('?')[0].split('#')[0]
  if (clean !== '/' && clean.endsWith('/')) {
    clean = clean.slice(0, -1)
  }

  const canonicalUrl = SITE_URL + clean

  // <link rel="canonical">
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', canonicalUrl)

  // og:url
  let ogUrl = document.querySelector('meta[property="og:url"]')
  if (!ogUrl) {
    ogUrl = document.createElement('meta')
    ogUrl.setAttribute('property', 'og:url')
    document.head.appendChild(ogUrl)
  }
  ogUrl.setAttribute('content', canonicalUrl)
}

/**
 * For noindex pages (dashboard, portal, etc.), remove canonical and add noindex.
 */
export function setNoIndex() {
  // Remove canonical
  const link = document.querySelector('link[rel="canonical"]')
  if (link) link.remove()

  // Add noindex
  let robots = document.querySelector('meta[name="robots"]')
  if (!robots) {
    robots = document.createElement('meta')
    robots.setAttribute('name', 'robots')
    document.head.appendChild(robots)
  }
  robots.setAttribute('content', 'noindex, nofollow')
}

/**
 * Remove noindex (for public pages)
 */
export function clearNoIndex() {
  const robots = document.querySelector('meta[name="robots"]')
  if (robots && robots.content.includes('noindex')) {
    robots.remove()
  }
}

export { SITE_URL }
