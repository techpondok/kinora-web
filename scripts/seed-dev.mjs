/**
 * Kinora Development Seed Script
 *
 * Seeds test accounts into Supabase DEVELOPMENT project.
 * Uses Supabase Admin API (service_role key) to create auth users
 * and seed family data.
 *
 * SAFETY: Refuses to run against production.
 *
 * Usage:
 *   npm run seed:dev
 *
 * Required env vars (from .env.seed or passed directly):
 *   SUPABASE_DEV_URL
 *   SUPABASE_DEV_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

// ─── Configuration ───
const SUPABASE_URL = process.env.SUPABASE_DEV_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_DEV_SERVICE_ROLE_KEY || ''
const PROD_PROJECT_REF = 'sasigbuckngggpwpxlhz'

// ─── Safety Guard ───
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[seed:dev] ERROR: Missing environment variables.')
  console.error('  Set SUPABASE_DEV_URL and SUPABASE_DEV_SERVICE_ROLE_KEY')
  console.error('')
  console.error('  Option 1: Create .env.seed file in project root')
  console.error('  Option 2: Pass as env vars:')
  console.error('    SUPABASE_DEV_URL=https://xxx.supabase.co SUPABASE_DEV_SERVICE_ROLE_KEY=xxx npm run seed:dev')
  process.exit(1)
}

if (SUPABASE_URL.includes(PROD_PROJECT_REF)) {
  console.error('[seed:dev] ABORT: SUPABASE_DEV_URL points to PRODUCTION project!')
  console.error('  Never seed test data into production.')
  process.exit(1)
}

if (process.env.NODE_ENV === 'production') {
  console.error('[seed:dev] ABORT: NODE_ENV=production. This seed is for development only.')
  process.exit(1)
}

// ─── Supabase Admin Client ───
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Seed Data ───
const SEED_PASSWORD = 'Kinora123!'

const SEED_USERS = [
  { email: 'founder@kinora.local', password: SEED_PASSWORD, role: 'founder', nickname: 'Founder Dev' },
  { email: 'parent@kinora.local', password: SEED_PASSWORD, role: 'user', nickname: 'Parent Dev' },
  { email: 'child@kinora.local', password: SEED_PASSWORD, role: 'user', nickname: 'Child Dev' },
]

const FAMILY_NAME = 'Kinora Dev Family'

// ─── Helper: Create or get auth user ───
async function upsertAuthUser({ email, password }) {
  // Try to find existing user
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) throw new Error(`Failed to list users: ${listErr.message}`)

  const existing = users.find(u => u.email === email)
  if (existing) {
    // Update password to ensure it matches
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    })
    if (error) throw new Error(`Failed to update user ${email}: ${error.message}`)
    console.log(`  Updated: ${email} (${data.user.id})`)
    return data.user
  }

  // Create new user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`Failed to create user ${email}: ${error.message}`)
  console.log(`  Created: ${email} (${data.user.id})`)
  return data.user
}

// ─── Main Seed ───
async function seed() {
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown'
  console.log(`[seed:dev] Seeding Supabase DEV (${projectRef})...`)
  console.log('')

  // 1. Create/update auth users
  console.log('[seed:dev] Auth users:')
  const userMap = {}
  for (const user of SEED_USERS) {
    const authUser = await upsertAuthUser(user)
    userMap[user.email] = { ...user, id: authUser.id }
  }

  // 2. Update user roles in auth_users or profiles table
  console.log('')
  console.log('[seed:dev] User roles/profiles:')
  for (const user of SEED_USERS) {
    const userId = userMap[user.email].id

    // Update role in auth_users table (if exists — schema dependent)
    const { error: roleErr } = await supabase
      .from('auth_users')
      .upsert({
        id: userId,
        email: user.email,
        role: user.role,
        email_confirmed_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (roleErr) {
      // Table might not exist if using Supabase native auth only
      console.log(`  [SKIP] auth_users table: ${roleErr.message}`)
      // Try profiles table instead
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: user.email,
          role: user.role,
          display_name: user.nickname,
        }, { onConflict: 'id' })

      if (profileErr) {
        console.log(`  [SKIP] profiles table: ${profileErr.message}`)
      } else {
        console.log(`  Set role: ${user.email} → ${user.role}`)
      }
    } else {
      console.log(`  Set role: ${user.email} → ${user.role}`)
    }
  }

  // 3. Create dev family
  console.log('')
  console.log('[seed:dev] Family:')
  const founderId = userMap['founder@kinora.local'].id

  const { data: existingFamily } = await supabase
    .from('kinora_families')
    .select('id')
    .eq('owner_id', founderId)
    .maybeSingle()

  let familyId
  if (existingFamily) {
    familyId = existingFamily.id
    await supabase
      .from('kinora_families')
      .update({ name: FAMILY_NAME, member_count: 3 })
      .eq('id', familyId)
    console.log(`  Updated family: ${FAMILY_NAME} (${familyId})`)
  } else {
    const { data: newFamily, error: famErr } = await supabase
      .from('kinora_families')
      .insert({
        name: FAMILY_NAME,
        plan: 'free',
        owner_id: founderId,
        member_count: 3,
        max_members: 5,
      })
      .select('id')
      .single()
    if (famErr) {
      console.log(`  [ERROR] Create family: ${famErr.message}`)
    } else {
      familyId = newFamily.id
      console.log(`  Created family: ${FAMILY_NAME} (${familyId})`)
    }
  }

  // 4. Create family members
  if (familyId) {
    console.log('')
    console.log('[seed:dev] Family members:')
    const members = [
      { userId: userMap['founder@kinora.local'].id, role: 'owner', nickname: 'Founder Dev' },
      { userId: userMap['parent@kinora.local'].id, role: 'parent', nickname: 'Parent Dev' },
      { userId: userMap['child@kinora.local'].id, role: 'child', nickname: 'Child Dev' },
    ]

    for (const member of members) {
      const { data: existing } = await supabase
        .from('kinora_family_members')
        .select('id')
        .eq('family_id', familyId)
        .eq('user_id', member.userId)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('kinora_family_members')
          .update({ role: member.role, nickname: member.nickname, is_active: true })
          .eq('id', existing.id)
        console.log(`  Updated: ${member.nickname} → ${member.role}`)
      } else {
        const { error } = await supabase
          .from('kinora_family_members')
          .insert({
            family_id: familyId,
            user_id: member.userId,
            role: member.role,
            nickname: member.nickname,
            is_active: true,
          })
        if (error) {
          console.log(`  [ERROR] ${member.nickname}: ${error.message}`)
        } else {
          console.log(`  Created: ${member.nickname} → ${member.role}`)
        }
      }
    }
  }

  console.log('')
  console.log('[seed:dev] ✓ Done! Development accounts ready:')
  console.log('  founder@kinora.local / Kinora123!')
  console.log('  parent@kinora.local  / Kinora123!')
  console.log('  child@kinora.local   / Kinora123!')
  console.log('')
  console.log('[seed:dev] Login at: http://localhost:5173/login')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`[seed:dev] FAILED: ${err.message}`)
    process.exit(1)
  })
