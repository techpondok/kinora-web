export default function handler(req, res) {
  const domain = 'https://kinorafamilies.com'

  const content = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /admin/
Disallow: /consultant/
Disallow: /portal/
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /help/my-tickets

Sitemap: ${domain}/sitemap.xml
`

  res.setHeader('Content-Type', 'text/plain; charset=UTF-8')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
  res.status(200).send(content)
}
