const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  const supabaseUrl = 'https://sasigbuckngggpwpxlhz.supabase.co'
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhc2lnYnVja25nZ2dwd3B4bGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyODQ3ODYsImV4cCI6MjA5NTg2MDc4Nn0.4Zw4PrvyW0GJzNG54N5nUHi3Tr0sbZjOJ4tnemaMV4I'
  const supabase = createClient(supabaseUrl, supabaseKey)
  const domain = 'https://kinorafamilies.com'

  const urls = [
    { loc: `${domain}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${domain}/about`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${domain}/privacy`, changefreq: 'monthly', priority: '0.3' },
    { loc: `${domain}/terms`, changefreq: 'monthly', priority: '0.3' },
    { loc: `${domain}/help`, changefreq: 'weekly', priority: '0.6' },
    { loc: `${domain}/articles`, changefreq: 'daily', priority: '0.7' },
    { loc: `${domain}/news`, changefreq: 'daily', priority: '0.7' },
  ]

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
  } catch (e) { /* continue */ }

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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc.replace(/&/g, '&amp;')}</loc>${u.lastmod ? '\n    <lastmod>' + u.lastmod + '</lastmod>' : ''}${u.changefreq ? '\n    <changefreq>' + u.changefreq + '</changefreq>' : ''}${u.priority ? '\n    <priority>' + u.priority + '</priority>' : ''}
  </url>`).join('\n')}
</urlset>`

  res.setHeader('Content-Type', 'application/xml; charset=UTF-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}
