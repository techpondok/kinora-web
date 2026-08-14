/**
 * Kinora Local Development Auth Seeder
 *
 * Creates predefined test accounts for local development.
 * NEVER run in production.
 *
 * Usage: npm run seed:local (from server/ directory)
 */
const path = require('path')

// Load server/.env (works whether run from server/ or project root)
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })

const fs = require('fs')
const bcrypt = require('bcryptjs')
const { pool } = require('../db')

// ─── Run migration if tables don't exist ───
async function ensureSchema() {
  const { rows } = await pool.query(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auth_users') AS exists`
  )
  if (!rows[0].exists) {
    console.log('[seed:local] Table auth_users not found — running migration...')
    const migrationPath = path.resolve(__dirname, '..', 'migrations', '001_init_local.sql')
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`)
    }
    const sql = fs.readFileSync(migrationPath, 'utf8')
    // Run each statement separately to avoid Supabase migration tracking conflicts
    const statements = sql.split(/;\s*$/m).filter(s => s.trim())
    for (const stmt of statements) {
      if (stmt.trim()) {
        try {
          await pool.query(stmt)
        } catch (err) {
          // Skip "already exists" errors (idempotent)
          if (!err.message.includes('already exists') && !err.message.includes('duplicate key')) {
            throw err
          }
        }
      }
    }
    console.log('[seed:local] Migration applied successfully')
  } else {
    console.log('[seed:local] Schema OK — auth_users exists')
  }
}

// ─── Safety Guard ───
function assertNotProduction() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ABORT: Local seed cannot run in production (NODE_ENV=production)')
  }

  const dbName = process.env.DB_NAME || ''
  const dbUrl = process.env.DATABASE_URL || ''
  const prodIndicators = ['supabase', 'neon', 'render', 'railway', 'amazonaws', 'digitalocean']

  for (const indicator of prodIndicators) {
    if (dbUrl.includes(indicator)) {
      throw new Error(`ABORT: DATABASE_URL contains "${indicator}" — looks like production`)
    }
  }

  if (dbName && !['kinorafamilies', 'kinora_development', 'kinora_dev', 'kinora_local'].includes(dbName)) {
    console.warn(`[WARN] DB_NAME="${dbName}" — not a recognized dev database name. Proceeding anyway.`)
  }
}

// ─── Seed Data ───
const SEED_PASSWORD = 'Kinora123!'
const BCRYPT_ROUNDS = 10

const SEED_USERS = [
  { email: 'founder@kinora.local', role: 'founder' },
  { email: 'parent@kinora.local', role: 'user' },
  { email: 'child@kinora.local', role: 'user' },
]

const FAMILY_NAME = 'Kinora Local Family'

// ─── Main Seeder ───
async function seed() {
  assertNotProduction()

  console.log('[seed:local] Starting local auth seed...')
  console.log(`[seed:local] DB: ${process.env.DB_NAME || 'from DATABASE_URL'}`)

  // Ensure tables exist
  await ensureSchema()

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS)
  const userIds = {}

  // Upsert users
  for (const { email, role } of SEED_USERS) {
    const { rows } = await pool.query(
      `INSERT INTO auth_users (email, password_hash, role, email_confirmed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         email_confirmed_at = COALESCE(auth_users.email_confirmed_at, NOW()),
         updated_at = NOW()
       RETURNING id, email`,
      [email, passwordHash, role]
    )
    userIds[email] = rows[0].id
    console.log(`[seed:local] Upserted: ${email} (role=${role})`)
  }

  // Upsert family — find or create by owner
  const founderUserId = userIds['founder@kinora.local']

  let familyId
  const { rows: existingFamily } = await pool.query(
    `SELECT id FROM kinora_families WHERE owner_id = $1 LIMIT 1`,
    [founderUserId]
  )

  if (existingFamily.length > 0) {
    familyId = existingFamily[0].id
    await pool.query(
      `UPDATE kinora_families SET name = $1, member_count = 3, updated_at = NOW() WHERE id = $2`,
      [FAMILY_NAME, familyId]
    )
    console.log(`[seed:local] Updated family: ${FAMILY_NAME}`)
  } else {
    const { rows: newFamily } = await pool.query(
      `INSERT INTO kinora_families (name, plan, owner_id, member_count, max_members)
       VALUES ($1, 'free', $2, 3, 5)
       RETURNING id`,
      [FAMILY_NAME, founderUserId]
    )
    familyId = newFamily[0].id
    console.log(`[seed:local] Created family: ${FAMILY_NAME}`)
  }

  // Upsert family members
  const members = [
    { email: 'founder@kinora.local', role: 'owner', nickname: 'Founder' },
    { email: 'parent@kinora.local', role: 'parent', nickname: 'Parent' },
    { email: 'child@kinora.local', role: 'child', nickname: 'Child' },
  ]

  for (const member of members) {
    const userId = userIds[member.email]
    // Check if membership already exists
    const { rows: existingMember } = await pool.query(
      `SELECT id FROM kinora_family_members WHERE family_id = $1 AND user_id = $2`,
      [familyId, userId]
    )
    if (existingMember.length === 0) {
      await pool.query(
        `INSERT INTO kinora_family_members (family_id, user_id, role, nickname, is_active)
         VALUES ($1, $2, $3, $4, true)`,
        [familyId, userId, member.role, member.nickname]
      )
      console.log(`[seed:local] Created family member: ${member.email} → ${member.role}`)
    } else {
      await pool.query(
        `UPDATE kinora_family_members SET role = $1, nickname = $2, is_active = true WHERE family_id = $3 AND user_id = $4`,
        [member.role, member.nickname, familyId, userId]
      )
      console.log(`[seed:local] Updated family member: ${member.email} → ${member.role}`)
    }
  }

  console.log('\n[seed:local] Done! Accounts ready:')
  console.log('  founder@kinora.local / Kinora123! (founder)')
  console.log('  parent@kinora.local  / Kinora123! (parent)')
  console.log('  child@kinora.local   / Kinora123! (child)')
  console.log('\n[seed:local] Login at: http://localhost:5173/login')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed:local] FAILED:', err.message)
    process.exit(1)
  })
