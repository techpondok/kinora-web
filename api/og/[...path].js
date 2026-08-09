const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

module.exports = async function handler(req, res) {
  const ua = (req.headers['user-agent'] || '').toLowerCase()

  // Detect social crawlers and search engine bots
  const isCrawler = /googlebot|bingbot|whatsapp|facebookexternalhit|telegrambot|twitterbot|linkedinbot|slackbot|discordbot|applebot|yandex|baiduspider|bot|crawl|spider|preview/i.test(ua)

  if (!isCrawler) {
    // Normal browser: serve SPA index.html from dist
    const indexPath = path.join(process.cwd(), 'dist', 'index.html')
    try {
      const html = fs.readFileSync(indexPath, 'utf-8')
      res.setHeader('Content-Type', 'text/html; charset=UTF-8')
      return res.status(200).send(html)
    } catch {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8')
      return res.status(200).send(getSpaHtml())
    }
  }

  // Extract slug from the full request URL path
  const urlPath = req.url || ''
  const articleMatch = urlPath.match(/articles\/([^?#/]+)/) || urlPath.match(/news\/([^?#/]+)/)
  const contentType = urlPath.includes('/news/') ? 'news' : 'article'

  if (!articleMatch) {
    return res.status(200).send(getDefaultOgHtml())
  }

  const slug = decodeURIComponent(articleMatch[1])
  const domain = 'https://kinorafamilies.com'

  // Fetch article from Supabase
  const supabaseUrl = 'https://sasigbuckngggpwpxlhz.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhc2lnYnVja25nZ2dwd3B4bGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyODQ3ODYsImV4cCI6MjA5NTg2MDc4Nn0.4Zw4PrvyW0GJzNG54N5nUHi3Tr0sbZjOJ4tnemaMV4I'
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: article } = await supabase
    .from('kinora_articles')
    .select('title, summary, cover_url, og_title, og_description, og_image, seo_title, meta_description, twitter_title, twitter_description, twitter_image, author_name, published_at, content_type')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!article) {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
    return res.status(404).send(getNotFoundHtml(slug))
  }

  // Resolve metadata with fallbacks
  const ogTitle = article.og_title || article.seo_title || article.title
  const ogDesc = cleanDescription(article.og_description || article.meta_description || article.summary || '')
  const ogImage = toAbsolute(article.og_image || article.cover_url, domain)
  const ogUrl = `${domain}/${contentType === 'news' ? 'news' : 'articles'}/${slug}`
  const twitterTitle = article.twitter_title || ogTitle
  const twitterDesc = article.twitter_description || ogDesc
  const twitterImage = toAbsolute(article.twitter_image || article.og_image || article.cover_url, domain)

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(ogTitle)} — Kinora</title>
<meta name="description" content="${esc(ogDesc)}">
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${esc(ogDesc)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(ogUrl)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Kinora">
<meta property="article:published_time" content="${esc(article.published_at || '')}">
<meta property="article:author" content="${esc(article.author_name || 'Kinora')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(twitterTitle)}">
<meta name="twitter:description" content="${esc(twitterDesc)}">
<meta name="twitter:image" content="${esc(twitterImage)}">
<link rel="canonical" href="${esc(ogUrl)}">
</head>
<body>
<h1>${esc(article.title)}</h1>
<p>${esc(ogDesc)}</p>
<p><a href="${esc(ogUrl)}">Baca selengkapnya di Kinora</a></p>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(html)
}

function toAbsolute(url, domain) {
  if (!url) return domain + '/og-default.png'
  if (url.startsWith('http')) return url
  return domain + (url.startsWith('/') ? url : '/' + url)
}

function cleanDescription(str) {
  if (!str) return ''
  // Strip HTML tags and markdown syntax
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/[#*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

function esc(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function getDefaultOgHtml() {
  return `<!DOCTYPE html><html lang="id"><head>
<meta charset="UTF-8">
<title>Kinora — One app for the whole family</title>
<meta name="description" content="Kinora membantu keluarga tetap terhubung, lebih aman, dan lebih terorganisir.">
<meta property="og:title" content="Kinora — One app for the whole family">
<meta property="og:description" content="Kinora membantu keluarga tetap terhubung, lebih aman, dan lebih terorganisir.">
<meta property="og:image" content="https://kinorafamilies.com/og-default.png">
<meta property="og:url" content="https://kinorafamilies.com">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kinora">
<link rel="canonical" href="https://kinorafamilies.com">
</head><body></body></html>`
}

function getNotFoundHtml(slug) {
  return `<!DOCTYPE html><html lang="id"><head>
<meta charset="UTF-8">
<title>Artikel tidak ditemukan — Kinora</title>
<meta name="robots" content="noindex">
<meta property="og:title" content="Kinora — One app for the whole family">
<meta property="og:description" content="Kinora membantu keluarga tetap terhubung, lebih aman, dan lebih terorganisir.">
<meta property="og:image" content="https://kinorafamilies.com/og-default.png">
</head><body><h1>Artikel tidak ditemukan</h1></body></html>`
}

function getSpaHtml() {
  // Return a redirect to let browser load the SPA
  return `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/"></head><body></body></html>`
}
