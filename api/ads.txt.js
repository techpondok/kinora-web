module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=UTF-8')
  res.setHeader('Cache-Control', 'public, s-maxage=86400')
  res.status(200).send('# ads.txt - not yet configured\n')
}
