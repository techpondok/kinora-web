/**
 * Local Development Auth Routes
 * Replaces Supabase Auth for development environment.
 */
const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { pool } = require('../db')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'kinora-dev-jwt-secret'
const TOKEN_EXPIRY = '7d'

function generateToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role || 'user' },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  )
}

// POST /auth/signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  try {
    const hashed = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
      'INSERT INTO auth_users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email.toLowerCase(), hashed]
    )
    const user = rows[0]
    const token = generateToken(user)
    res.json({ data: { user, session: { access_token: token, user } }, error: null })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' })
    res.status(500).json({ error: err.message })
  }
})

// POST /auth/signin
router.post('/signin', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  try {
    const { rows } = await pool.query('SELECT * FROM auth_users WHERE email = $1', [email.toLowerCase()])
    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = generateToken(user)
    const { password_hash, ...safeUser } = user
    res.json({ data: { user: safeUser, session: { access_token: token, user: safeUser } }, error: null })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /auth/signout
router.post('/signout', (req, res) => {
  res.json({ error: null })
})

// GET /auth/session
router.get('/session', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.json({ data: { session: null }, error: null })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    res.json({ data: { session: { access_token: token, user: decoded } }, error: null })
  } catch {
    res.json({ data: { session: null }, error: null })
  }
})

// GET /auth/user
router.get('/user', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.json({ data: { user: null }, error: null })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    res.json({ data: { user: decoded }, error: null })
  } catch {
    res.json({ data: { user: null }, error: null })
  }
})

// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
  // In dev, just acknowledge — no real email sent
  res.json({ data: {}, error: null })
})

module.exports = router
