/**
 * RPC Routes — mirrors supabase.rpc() for local development.
 * POST /rest/v1/rpc/:function_name
 */
const express = require('express')
const { pool } = require('../db')

const router = express.Router()

// POST /rest/v1/rpc/validate_session
router.post('/validate_session', async (req, res) => {
  // In local dev, derive from JWT payload
  const user = req.user
  if (!user) return res.json(null)

  try {
    // Check if user is founder/admin from local DB
    const { rows } = await pool.query(
      `SELECT role FROM auth_users WHERE id = $1`,
      [user.sub]
    )
    const role = rows[0]?.role || 'user'
    res.json({
      valid: true,
      user_id: user.sub,
      is_founder: role === 'founder',
      is_admin: role === 'admin' || role === 'founder',
    })
  } catch (err) {
    res.json({ valid: true, user_id: user.sub, is_founder: false, is_admin: false })
  }
})

// POST /rest/v1/rpc/increment_article_read_count
router.post('/increment_article_read_count', async (req, res) => {
  const { article_id } = req.body
  try {
    await pool.query(
      'UPDATE kinora_articles SET read_count = COALESCE(read_count, 0) + 1 WHERE id = $1',
      [article_id]
    )
    res.json(null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /rest/v1/rpc/check_family_can_upload
router.post('/check_family_can_upload', async (req, res) => {
  const { p_family_id, p_bytes } = req.body
  // In dev, always allow uploads
  res.json({ allowed: true, message: null, used_bytes: 0, limit_bytes: 1073741824 })
})

// POST /rest/v1/rpc/get_family_storage_overview
router.post('/get_family_storage_overview', async (req, res) => {
  res.json({ used_bytes: 0, limit_bytes: 1073741824, file_count: 0 })
})

// POST /rest/v1/rpc/toggle_comment_like
router.post('/toggle_comment_like', async (req, res) => {
  const { p_comment_id, p_user_id } = req.body
  try {
    const { rows } = await pool.query(
      'SELECT id FROM kinora_comment_likes WHERE comment_id = $1 AND user_id = $2',
      [p_comment_id, p_user_id]
    )
    if (rows.length) {
      await pool.query('DELETE FROM kinora_comment_likes WHERE comment_id = $1 AND user_id = $2', [p_comment_id, p_user_id])
      res.json({ liked: false })
    } else {
      await pool.query('INSERT INTO kinora_comment_likes (comment_id, user_id) VALUES ($1, $2)', [p_comment_id, p_user_id])
      res.json({ liked: true })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /rest/v1/rpc/founder_save_setting
router.post('/founder_save_setting', async (req, res) => {
  const { p_key, p_value } = req.body
  try {
    const { rows } = await pool.query(
      `INSERT INTO kinora_landing_config (key, value, status) VALUES ($1, $2, 'published')
       ON CONFLICT (key) DO UPDATE SET value = $2 RETURNING *`,
      [p_key, p_value]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /rest/v1/rpc/redeem_kinora_promo
router.post('/redeem_kinora_promo', async (req, res) => {
  const userId = req.user?.sub
  const code = String(req.body?.p_code || req.body?.code || '').trim().toUpperCase()
  if (!userId) return res.json({ success: false, message: 'Promo tidak berlaku untuk akun ini' })
  if (!code) return res.json({ success: false, message: 'Promo tidak ditemukan' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      `SELECT * FROM kinora_promo_codes WHERE lower(code) = lower($1) FOR UPDATE`,
      [code]
    )
    const promo = rows[0]
    if (!promo) {
      await client.query('ROLLBACK')
      return res.json({ success: false, message: 'Promo tidak ditemukan' })
    }
    if (!promo.is_active) {
      await client.query('ROLLBACK')
      return res.json({ success: false, message: 'Promo sudah tidak aktif' })
    }
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      await client.query('ROLLBACK')
      return res.json({ success: false, message: 'Promo sudah kedaluwarsa' })
    }
    if (promo.max_redemptions && Number(promo.redemption_count || promo.total_redemptions || 0) >= Number(promo.max_redemptions)) {
      await client.query('ROLLBACK')
      return res.json({ success: false, message: 'Promo code has reached its redemption limit.' })
    }
    if (promo.one_time_per_user !== false) {
      const used = await client.query(
        'SELECT id FROM kinora_promo_redemptions WHERE promo_code_id = $1 AND user_id = $2 LIMIT 1',
        [promo.id, userId]
      )
      if (used.rows.length) {
        await client.query('ROLLBACK')
        return res.json({ success: false, message: 'Promo has already been used by this account' })
      }
    }

    await client.query(
      `INSERT INTO kinora_promo_redemptions
       (promo_code_id, promo_id, promo_code, user_id, benefit_type, benefit_value, trial_days, discount_percent, bonus_storage_bytes, metadata)
       VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        promo.id,
        promo.code,
        userId,
        promo.type || promo.promo_type,
        String(promo.trial_days || promo.discount_percent || promo.bonus_storage_bytes || ''),
        promo.trial_days || 0,
        promo.discount_percent || promo.discount_percentage || 0,
        promo.bonus_storage_bytes || 0,
        { type: promo.type || promo.promo_type, promo_code: promo.code },
      ]
    )
    await client.query(
      'UPDATE kinora_promo_codes SET redemption_count = COALESCE(redemption_count, 0) + 1, total_redemptions = COALESCE(total_redemptions, 0) + 1 WHERE id = $1',
      [promo.id]
    )
    await client.query('COMMIT')
    res.json({ success: true, promo_code: promo.code, type: promo.type || promo.promo_type, message: 'Promo berhasil digunakan' })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ success: false, message: err.message })
  } finally {
    client.release()
  }
})

// Generic fallback for unmapped RPCs
router.post('/:fn', async (req, res) => {
  const { fn } = req.params
  try {
    // Try calling as a PostgreSQL function
    const params = req.body || {}
    const keys = Object.keys(params)
    const placeholders = keys.map((_, i) => `$${i + 1}`)
    const args = keys.length ? `(${placeholders.join(', ')})` : '()'

    const sql = `SELECT * FROM ${fn}${args}`
    const { rows } = await pool.query(sql, keys.map(k => params[k]))
    res.json(rows.length === 1 ? rows[0] : rows)
  } catch (err) {
    // Function doesn't exist — return null gracefully
    console.warn(`[RPC] Function "${fn}" not found:`, err.message)
    res.json(null)
  }
})

module.exports = router
