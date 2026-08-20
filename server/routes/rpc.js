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
    if (promo.starts_at && new Date(promo.starts_at) > new Date()) {
      await client.query('ROLLBACK')
      return res.json({ success: false, code: 'not_started', message: 'Promo belum dimulai' })
    }
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      await client.query('ROLLBACK')
      return res.json({ success: false, code: 'expired', message: 'Promo sudah kedaluwarsa' })
    }
    if (promo.max_redemptions && Number(promo.redemption_count || promo.total_redemptions || 0) >= Number(promo.max_redemptions)) {
      await client.query('ROLLBACK')
      return res.json({ success: false, code: 'limit_reached', message: 'Promo quota reached' })
    }
    if (promo.one_time_per_user !== false) {
      const used = await client.query(
        'SELECT id FROM kinora_promo_redemptions WHERE promo_code_id = $1 AND user_id = $2 LIMIT 1',
        [promo.id, userId]
      )
      if (used.rows.length) {
        await client.query('ROLLBACK')
        return res.json({ success: false, code: 'already_redeemed', message: 'Promo ini sudah pernah digunakan.' })
      }
    }

    let familyId = null
    let startedAt = new Date()
    let expiresAt = null
    const type = promo.type || promo.promo_type
    if (type === 'access_pass' && (promo.access_type === 'free' || promo.requires_payment === false)) {
      const family = await client.query(
        'SELECT id, subscription_expires_at FROM kinora_families WHERE owner_id = $1 ORDER BY created_at ASC LIMIT 1 FOR UPDATE',
        [userId]
      )
      familyId = family.rows[0]?.id || null
      const currentExpiry = family.rows[0]?.subscription_expires_at ? new Date(family.rows[0].subscription_expires_at) : null
      const baseDate = currentExpiry && currentExpiry > startedAt ? currentExpiry : startedAt
      expiresAt = addPromoDuration(baseDate, promo)
      if (familyId) {
        await client.query(
          `UPDATE kinora_families
           SET plan = $2, subscription_plan = $2, subscription_expires_at = $3, updated_at = now()
           WHERE id = $1`,
          [familyId, promo.access_plan || 'family_plus', expiresAt]
        )
      }
    }

    await client.query(
      `INSERT INTO kinora_promo_redemptions
       (promo_code_id, promo_id, promo_code, user_id, family_id, benefit_type, benefit_value, status, trial_days, discount_percent, bonus_storage_bytes, access_started_at, access_expires_at, metadata)
       VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        promo.id,
        promo.code,
        userId,
        familyId,
        type,
        String(promo.access_duration_months || promo.access_duration_days || promo.trial_days || promo.discount_percent || promo.bonus_storage_bytes || ''),
        type === 'access_pass' ? 'active' : 'redeemed',
        promo.trial_days || 0,
        promo.discount_percent || promo.discount_percentage || 0,
        promo.bonus_storage_bytes || 0,
        type === 'access_pass' ? startedAt : null,
        type === 'access_pass' ? expiresAt : null,
        { promo_type: type, access_type: promo.access_type || 'free', requires_payment: promo.requires_payment === true },
      ]
    )
    await client.query(
      'UPDATE kinora_promo_codes SET redemption_count = COALESCE(redemption_count, 0) + 1, total_redemptions = COALESCE(total_redemptions, 0) + 1 WHERE id = $1',
      [promo.id]
    )
    await client.query('COMMIT')
    res.json({ success: true, promo_type: type, access_type: promo.access_type || 'free', plan: promo.access_plan || promo.trial_plan, started_at: startedAt, expires_at: expiresAt })
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') return res.json({ success: false, code: 'already_redeemed', message: 'Promo ini sudah pernah digunakan.' })
    res.status(500).json({ success: false, message: err.message })
  } finally {
    client.release()
  }
})

function addPromoDuration(baseDate, promo) {
  if (promo.access_lifetime || promo.access_duration_type === 'lifetime') return null
  const date = new Date(baseDate)
  if (promo.access_duration_type === 'months' || promo.access_duration_months) {
    date.setMonth(date.getMonth() + Number(promo.access_duration_months || promo.access_duration_value || 0))
    return date
  }
  date.setDate(date.getDate() + Number(promo.access_duration_days || promo.access_duration_value || 0))
  return date
}

async function executeLocalBroadcast(broadcastId) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query('SELECT * FROM kinora_broadcasts WHERE id = $1 FOR UPDATE', [broadcastId])
    const b = rows[0]
    if (!b) {
      await client.query('ROLLBACK')
      return { success: false, message: 'Broadcast tidak ditemukan' }
    }

    await client.query('UPDATE kinora_broadcasts SET status = $2, processing_started_at = now(), updated_at = now() WHERE id = $1', [broadcastId, 'processing'])
    const users = await client.query('SELECT id FROM auth_users')
    let created = 0
    for (const user of users.rows) {
      for (const channel of b.channels || ['push', 'in_app']) {
        await client.query(
          `INSERT INTO kinora_broadcast_deliveries (broadcast_id, user_id, channel, status, sent_at, metadata)
           VALUES ($1, $2, $3, 'sent', now(), $4)`,
          [broadcastId, user.id, channel, { target_type: b.target_audience?.type || 'all_users' }]
        )
        created += 1
        if (channel === 'in_app') {
          await client.query(
            `INSERT INTO kinora_notifications (user_id, title, body, type, is_read, action_url, metadata)
             VALUES ($1, $2, $3, 'broadcast', false, $4, $5)`,
            [user.id, b.title, b.body || '', b.cta_url || null, { broadcast_id: broadcastId }]
          )
        }
      }
    }

    await client.query(
      `UPDATE kinora_broadcasts
       SET status = 'completed', target_count = $2, sent_count = $3, delivered_count = 0,
           failed_count = 0, sent_at = now(), completed_at = now(), updated_at = now()
       WHERE id = $1`,
      [broadcastId, users.rows.length, created]
    )
    await client.query('COMMIT')
    return { success: true, broadcast_id: broadcastId, status: 'completed', target_count: users.rows.length }
  } catch (err) {
    await client.query('ROLLBACK')
    await pool.query('UPDATE kinora_broadcasts SET status = $2, last_error = $3, updated_at = now() WHERE id = $1', [broadcastId, 'failed', err.message])
    return { success: false, broadcast_id: broadcastId, message: err.message }
  } finally {
    client.release()
  }
}

router.post('/admin_execute_kinora_broadcast', async (req, res) => {
  const result = await executeLocalBroadcast(req.body?.p_broadcast_id)
  res.json(result)
})

router.post('/process_due_kinora_broadcasts', async (req, res) => {
  const limit = Number(req.body?.p_limit || 10)
  const { rows } = await pool.query(
    `SELECT id FROM kinora_broadcasts
     WHERE status = 'scheduled' AND scheduled_at <= now()
     ORDER BY scheduled_at ASC
     LIMIT $1`,
    [limit]
  )
  const results = []
  for (const row of rows) results.push(await executeLocalBroadcast(row.id))
  res.json({ success: true, processed: results.length, results })
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
