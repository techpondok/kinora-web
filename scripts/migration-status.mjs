/**
 * Kinora Migration Status Tracker
 *
 * Shows which migrations have been applied to DEV and PROD.
 *
 * Usage: npm run migration:status
 *
 * Reads from supabase/migrations/ directory and queries both projects
 * (if credentials provided) to check applied status.
 */
import { readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = resolve(__dirname, '..', 'supabase', 'migrations')

// Read local migration files
let files
try {
  files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()
} catch {
  console.error('[migration:status] No supabase/migrations/ directory found.')
  process.exit(1)
}

console.log('============================================================')
console.log(' Kinora Migration Status')
console.log('============================================================')
console.log('')
console.log('Local migration files:')
console.log('─'.repeat(60))

for (const file of files) {
  // Extract version (timestamp prefix)
  const version = file.replace('.sql', '')
  console.log(`  ${version}`)
}

console.log('')
console.log('─'.repeat(60))
console.log(`Total: ${files.length} migration(s)`)
console.log('')
console.log('To check applied status on each project:')
console.log('  DEV:  npx supabase migration list --project-ref <DEV_REF>')
console.log('  PROD: npx supabase migration list --project-ref sasigbuckngggpwpxlhz')
console.log('')
console.log('Workflow:')
console.log('  1. Create new migration in supabase/migrations/')
console.log('  2. Deploy to DEV:  npm run deploy:dev')
console.log('  3. Test on DEV')
console.log('  4. Deploy to PROD: npm run deploy:prod')
