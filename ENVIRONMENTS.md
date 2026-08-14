# Kinora Environment Architecture

## Overview

```
KINORA CODEBASE
│
┌────────────────┴────────────────┐
│                                 │
DEVELOPMENT                       PRODUCTION
│                                 │
┌───────▼─────────┐              ┌────────▼────────┐
│ Flutter Dev     │              │ Flutter Prod    │
│ Admin Web Dev   │              │ Admin Web Prod  │
└───────┬─────────┘              └────────┬────────┘
        │                                 │
┌───────▼─────────────┐          ┌────────▼────────────┐
│ Supabase DEV        │          │ Supabase PROD       │
│ PostgreSQL, Auth    │          │ PostgreSQL, Auth    │
│ Storage, Realtime   │          │ Storage, Realtime   │
│ RPC, Edge Functions │          │ RPC, Edge Functions │
└─────────────────────┘          └─────────────────────┘
```

## Supabase Projects

| Environment | Project Ref | Usage |
|-------------|-------------|-------|
| Development | `YOUR_DEV_PROJECT_REF` | Test data, sandbox payments, dev testing |
| Production  | `sasigbuckngggpwpxlhz` | Real users, live payments |

## Admin Web

### Development (`npm run dev`)

Reads `.env.development`:
```env
VITE_APP_ENV=development
VITE_SUPABASE_URL=https://YOUR_DEV_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_dev_anon_key
```

### Production (`npm run build`)

Reads `.env.production`:
```env
VITE_APP_ENV=production
VITE_SUPABASE_URL=https://sasigbuckngggpwpxlhz.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

### Safety Guards

`src/lib/supabase.js` enforces:
- DEV env cannot connect to PROD Supabase URL
- PROD env must match known production project ref
- Missing credentials = hard error (no silent fallback)

## Flutter (Separate Workspace)

### Flavors

| Flavor | Package ID | App Label |
|--------|-----------|-----------|
| `dev` | `com.kinora.app.dev` | Kinora Dev |
| `prod` | `com.kinora.app` | Kinora |

### Run Commands

```bash
# Development
flutter run \
  --flavor dev \
  --dart-define=APP_ENV=development \
  --dart-define=SUPABASE_URL=https://YOUR_DEV_REF.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your_dev_anon_key

# Production build
flutter build appbundle \
  --release \
  --flavor prod \
  --dart-define=APP_ENV=production \
  --dart-define=SUPABASE_URL=https://sasigbuckngggpwpxlhz.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=...
```

### Flutter AppConfig (implement in Flutter project)

```dart
class AppConfig {
  static const environment = String.fromEnvironment(
    'APP_ENV', defaultValue: 'development',
  );

  static bool get isProduction => environment == 'production';
  static bool get isDevelopment => environment == 'development';

  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
}
```

### Firebase / FCM

| Flavor | Firebase Project | google-services.json |
|--------|-----------------|---------------------|
| `dev` | Kinora Dev Firebase | `android/app/src/dev/google-services.json` |
| `prod` | Kinora Production Firebase | `android/app/src/prod/google-services.json` |

## Migrations

### Single Source

All migrations live in `supabase/migrations/`. ONE set of files for both environments.

### Deployment Workflow

```
Create migration in supabase/migrations/
    ↓
Deploy to DEV: npm run deploy:dev
    ↓
Test with Admin Dev + Flutter Dev
    ↓
Verify
    ↓
Deploy to PROD: npm run deploy:prod
```

### Commands

```bash
# Deploy to development
set KINORA_DEV_PROJECT_REF=your-dev-ref
npm run deploy:dev

# Deploy to production
npm run deploy:prod

# Check migration status
npm run migration:status
npx supabase migration list --project-ref YOUR_DEV_REF
npx supabase migration list --project-ref sasigbuckngggpwpxlhz
```

## Edge Functions

One source in `supabase/functions/`. Deploy separately:

```bash
# Deploy all to DEV
npx supabase functions deploy --project-ref YOUR_DEV_REF

# Deploy all to PROD
npx supabase functions deploy --project-ref sasigbuckngggpwpxlhz

# Deploy specific function
npx supabase functions deploy send-notification --project-ref YOUR_DEV_REF
```

### Secrets Per Environment

| Secret | DEV | PROD |
|--------|-----|------|
| PAYMENT_ENV | sandbox | production |
| SUMOPOD_API_URL | sandbox.sumopod.com | api.sumopod.com |
| SUMOPOD_API_KEY | test key | live key |
| FCM_SERVER_KEY | dev firebase | prod firebase |
| RESEND_API_KEY | test key | live key |

Set via:
```bash
npx supabase secrets set PAYMENT_ENV=sandbox --project-ref YOUR_DEV_REF
npx supabase secrets set PAYMENT_ENV=production --project-ref sasigbuckngggpwpxlhz
```

## Seed Data (DEV Only)

```bash
npm run seed:dev
```

Requires `.env.seed`:
```env
SUPABASE_DEV_URL=https://YOUR_DEV_REF.supabase.co
SUPABASE_DEV_SERVICE_ROLE_KEY=your_service_role_key
```

Creates:
- founder@kinora.local / Kinora123!
- parent@kinora.local / Kinora123!
- child@kinora.local / Kinora123!
- Kinora Dev Family with relationships

## Safety Rules

1. **Never** use production Supabase for development
2. **Never** seed test data into production
3. **Never** share FCM tokens between environments
4. **Never** hardcode production credentials in source
5. **Always** test migrations in DEV before PROD
6. **Always** use sandbox payment credentials in DEV

## Setup Checklist (New Developer)

1. Create a Supabase Development project (free tier OK)
2. Copy project URL and anon key into `.env.development`
3. Copy service_role key into `.env.seed`
4. Run `npm run deploy:dev` to apply migrations
5. Run `npm run seed:dev` to create test accounts
6. Run `npm run dev` to start Admin Web
7. Login with `founder@kinora.local` / `Kinora123!`
