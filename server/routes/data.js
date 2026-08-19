/**
 * Generic Data/CRUD Routes
 * Mirrors Supabase PostgREST API pattern for local PostgreSQL.
 *
 * GET  /rest/v1/:table       → SELECT
 * POST /rest/v1/:table       → INSERT
 * PATCH /rest/v1/:table      → UPDATE (requires query filters)
 * DELETE /rest/v1/:table     → DELETE (requires query filters)
 */
const express = require('express')
const { pool } = require('../db')

const router = express.Router()

// Allowed tables (whitelist to prevent SQL injection on table name)
const ALLOWED_TABLES = [
  'kinora_payment_settings',
  'kinora_landing_config',
  'kinora_articles',
  'kinora_families',
  'kinora_family_members',
  'kinora_webinars',
  'kinora_webinar_registrations',
  'kinora_comments',
  'kinora_consultants',
  'kinora_bookmarks',
  'kinora_promo_codes',
  'kinora_promo_redemptions',
  'kinora_banners',
  'kinora_content_preferences',
  'kinora_notifications',
  'kinora_broadcasts',
  'kinora_broadcast_deliveries',
  'kinora_marketplace_items',
  'kinora_marketplace_orders',
  'auth_users',
]

function isAllowed(table) {
  return ALLOWED_TABLES.includes(table)
}

// Parse PostgREST-style query params
function parseFilters(query) {
  const filters = []
  const values = []
  let idx = 1

  for (const [key, val] of Object.entries(query)) {
    if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset') continue

    // Support: column=eq.value, column=ilike.%value%
    const match = val.match(/^(eq|neq|gt|gte|lt|lte|like|ilike|is|in)\.(.*)$/)
    if (match) {
      const [, op, v] = match
      const pgOp = { eq: '=', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=', like: 'LIKE', ilike: 'ILIKE', is: 'IS' }[op]
      if (op === 'is') {
        filters.push(`"${key}" IS ${v === 'null' ? 'NULL' : 'NOT NULL'}`)
      } else if (op === 'in') {
        const items = v.replace(/^\(|\)$/g, '').split(',')
        const placeholders = items.map(() => `$${idx++}`)
        filters.push(`"${key}" IN (${placeholders.join(',')})`)
        values.push(...items)
      } else {
        filters.push(`"${key}" ${pgOp} $${idx++}`)
        values.push(v)
      }
    }
  }

  return { filters, values }
}

// GET /rest/v1/:table
router.get('/:table', async (req, res) => {
  const { table } = req.params
  if (!isAllowed(table)) return res.status(403).json({ error: `Table "${table}" not accessible` })

  const columns = req.query.select || '*'
  const { filters, values } = parseFilters(req.query)
  const order = req.query.order || ''
  const limit = parseInt(req.query.limit) || 100
  const offset = parseInt(req.query.offset) || 0

  let sql = `SELECT ${columns} FROM "${table}"`
  if (filters.length) sql += ` WHERE ${filters.join(' AND ')}`
  if (order) {
    const [col, dir] = order.split('.')
    sql += ` ORDER BY "${col}" ${dir === 'desc' ? 'DESC' : 'ASC'}`
  }
  sql += ` LIMIT ${limit} OFFSET ${offset}`

  try {
    const { rows } = await pool.query(sql, values)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /rest/v1/:table
router.post('/:table', async (req, res) => {
  const { table } = req.params
  if (!isAllowed(table)) return res.status(403).json({ error: `Table "${table}" not accessible` })

  const payload = Array.isArray(req.body) ? req.body : [req.body]
  if (!payload.length) return res.status(400).json({ error: 'Empty payload' })

  const columns = Object.keys(payload[0])
  const colStr = columns.map(c => `"${c}"`).join(', ')

  let idx = 1
  const valueSets = []
  const allValues = []

  for (const row of payload) {
    const placeholders = columns.map(() => `$${idx++}`)
    valueSets.push(`(${placeholders.join(', ')})`)
    columns.forEach(c => allValues.push(row[c]))
  }

  const sql = `INSERT INTO "${table}" (${colStr}) VALUES ${valueSets.join(', ')} RETURNING *`

  try {
    const { rows } = await pool.query(sql, allValues)
    res.status(201).json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /rest/v1/:table
router.patch('/:table', async (req, res) => {
  const { table } = req.params
  if (!isAllowed(table)) return res.status(403).json({ error: `Table "${table}" not accessible` })

  const { filters, values: filterValues } = parseFilters(req.query)
  if (!filters.length) return res.status(400).json({ error: 'Filters required for update' })

  const updates = req.body
  const setCols = Object.keys(updates)
  let idx = 1
  const setStr = setCols.map(c => `"${c}" = $${idx++}`).join(', ')
  const setValues = setCols.map(c => updates[c])

  // Adjust filter param indices
  const adjustedFilters = filters.map(f => {
    return f.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + setCols.length}`)
  })

  const sql = `UPDATE "${table}" SET ${setStr} WHERE ${adjustedFilters.join(' AND ')} RETURNING *`

  try {
    const { rows } = await pool.query(sql, [...setValues, ...filterValues])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /rest/v1/:table
router.delete('/:table', async (req, res) => {
  const { table } = req.params
  if (!isAllowed(table)) return res.status(403).json({ error: `Table "${table}" not accessible` })

  const { filters, values } = parseFilters(req.query)
  if (!filters.length) return res.status(400).json({ error: 'Filters required for delete' })

  const sql = `DELETE FROM "${table}" WHERE ${filters.join(' AND ')} RETURNING *`

  try {
    const { rows } = await pool.query(sql, values)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
