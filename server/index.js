/**
 * Kinora Local Development Backend
 * Express server → PostgreSQL localhost
 *
 * Run: npm run dev (from server/ directory)
 * Provides API endpoints that mirror Supabase PostgREST for local development.
 */
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { pool } = require('./db')

const app = express()
const PORT = process.env.PORT || 3000

// ─── Middleware ───
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message)
})

// ─── Auth Middleware ───
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'kinora-dev-jwt-secret'

function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// ─── Health Check ───
app.get('/health', async (req, res) => {
  try {
    const start = Date.now()
    await pool.query('SELECT 1')
    const latency = Date.now() - start
    res.json({ status: 'ok', database: 'connected', latency_ms: latency, env: 'development' })
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: err.message })
  }
})

// ─── Auth Routes ───
const authRouter = require('./routes/auth')
app.use('/auth', authRouter)

// ─── Data Routes (CRUD) ───
const dataRouter = require('./routes/data')
app.use('/rest/v1', authMiddleware, dataRouter)

// ─── RPC Routes ───
const rpcRouter = require('./routes/rpc')
app.use('/rest/v1/rpc', authMiddleware, rpcRouter)

// ─── Storage Routes ───
const storageRouter = require('./routes/storage')
app.use('/storage/v1', authMiddleware, storageRouter)

// ─── Start Server ───
app.listen(PORT, () => {
  console.log(`[Kinora Server] Development backend running on http://localhost:${PORT}`)
  console.log(`[Kinora Server] Database: ${process.env.DATABASE_URL ? 'configured' : 'NOT CONFIGURED'}`)
  console.log(`[Kinora Server] Environment: development`)
})

module.exports = app
