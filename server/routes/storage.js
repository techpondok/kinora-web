/**
 * Local Storage Routes — file upload/download for development.
 * Files are stored in server/uploads/ directory.
 * Mirrors Supabase Storage API patterns.
 */
const express = require('express')
const path = require('path')
const fs = require('fs')

const router = express.Router()
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// POST /storage/v1/object/:bucket/:path*
router.post('/object/:bucket/*', express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
  const bucket = req.params.bucket
  const filePath = req.params[0]
  const fullDir = path.join(UPLOAD_DIR, bucket, path.dirname(filePath))

  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true })
  }

  const fullPath = path.join(UPLOAD_DIR, bucket, filePath)
  fs.writeFileSync(fullPath, req.body)

  res.json({ data: { path: filePath }, error: null })
})

// GET /storage/v1/object/public/:bucket/:path*
router.get('/object/public/:bucket/*', (req, res) => {
  const bucket = req.params.bucket
  const filePath = req.params[0]
  const fullPath = path.join(UPLOAD_DIR, bucket, filePath)

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File not found' })
  }

  res.sendFile(fullPath)
})

// DELETE /storage/v1/object/:bucket
router.delete('/object/:bucket', (req, res) => {
  const bucket = req.params.bucket
  const prefixes = req.body?.prefixes || []

  for (const p of prefixes) {
    const fullPath = path.join(UPLOAD_DIR, bucket, p)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  }

  res.json({ data: prefixes.map(p => ({ name: p })), error: null })
})

// GET /storage/v1/object/list/:bucket
router.get('/object/list/:bucket', (req, res) => {
  const bucket = req.params.bucket
  const prefix = req.query.prefix || ''
  const dir = path.join(UPLOAD_DIR, bucket, prefix)

  if (!fs.existsSync(dir)) {
    return res.json([])
  }

  const items = fs.readdirSync(dir).map(name => {
    const stat = fs.statSync(path.join(dir, name))
    return { name, id: name, created_at: stat.birthtime, metadata: { size: stat.size } }
  })

  res.json(items)
})

// GET /storage/v1/object/sign/:bucket/:path* — signed URL (dev: just return public URL)
router.post('/object/sign/:bucket/*', (req, res) => {
  const bucket = req.params.bucket
  const filePath = req.params[0]
  res.json({
    data: { signedUrl: `http://localhost:${process.env.PORT || 3000}/storage/v1/object/public/${bucket}/${filePath}` },
    error: null,
  })
})

module.exports = router
