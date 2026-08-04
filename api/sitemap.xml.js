import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseKey)

  const domain = 'https://kinorafamilies.com'

  const urls = []

  // Static pages
  urls.push({ loc: `${domain}/`, changefreq: 'weekly', priority: '1.0' })
  urls.push({ loc: `${domain}/about`, changefreq: 'monthly', priority: '0.6' })
  urls.push({ loc: `${domain}/privacy`, changefreq: 'monthly', priority: '0.3' })
  urls.push({ loc: `${domain}/terms`, changefreq: 'monthly', priority: '0.3' })
  urls.push({ loc: `${domain}/help`, changefreq: 'weekly', priority: '0.6' })
  urls.push({ loc: `${domain}/articles`, changefreq: 'daily', priority: '0.7' })
  urls.push({ loc: `${domain}/news`, changefreq: 'daily', priority: '0.7' })

  // Published articles
  try {
    const { data: articles } = await supabase
      .from('kinora_articles')
      .select('slug, content_type, updated_at')
      .eq('status', 'published')
      .not('slug', 'is', null)

    for (const art of (articles || [])) {
      if (!art.slug) continue
      const prefix = art.content_type === 'news' ? 'news' : 'articles'
      urls.push({
        loc: `${domain}/${prefix}/${art.slug}`,
        lastmod: art.updated_at ? art.updated_at.split('T')[0] : undefined,
        changefreq: 'weekly',
        priority: '0.6'
      })
    }
  } catch (e) { /* continue with static pages */ }

  // Help categories
  try {
    const { data: cats } = await supabase
      .from('kinora_help_categories')
      .select('slug, updated_at')
      .eq('status', 'published')
      .eq('is_active', true)

    for (const cat of (cats || [])) {
      if (!cat.slug) continue
      urls.push({
        loc: `${domain}/help/category/${cat.slug}`,
        lastmod: cat.updated_at ? cat.updated_at.split('T')[0] : undefined,
        changefreq: 'weekly',
        priority: '0.5'
      })
    }
  } catch (e) { /* continue */ }

  // Build XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ''}${u.priority ? `\n    <priority>${u.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`

  res.setHeader('Content-Type', 'application/xml; charset=UTF-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
