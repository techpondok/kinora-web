module.exports = function handler(req, res) {
  const content = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /dashboard
Disallow: /admin/
Disallow: /consultant/
Disallow: /consultant
Disallow: /portal/
Disallow: /portal
Disallow: /security
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /open-app
Disallow: /help/my-tickets
Disallow: /*?utm_*
Disallow: /*?ref=*
Disallow: /*?source=*
Disallow: /*?share=*

Sitemap: https://kinorafamilies.com/sitemap.xml
`

  res.setHeader('Content-Type', 'text/plain; charset=UTF-8')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
  res.status(200).send(content)
}
