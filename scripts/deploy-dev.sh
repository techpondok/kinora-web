#!/bin/bash
# ============================================================
# Kinora: Deploy Migrations + Edge Functions to Supabase DEV
# ============================================================

set -e

if [ -z "$KINORA_DEV_PROJECT_REF" ]; then
  echo "ERROR: Set KINORA_DEV_PROJECT_REF environment variable"
  echo "  Example: export KINORA_DEV_PROJECT_REF=your-dev-project-ref"
  exit 1
fi

# Safety: block production ref
if [ "$KINORA_DEV_PROJECT_REF" = "sasigbuckngggpwpxlhz" ]; then
  echo "ABORT: KINORA_DEV_PROJECT_REF is set to PRODUCTION project!"
  exit 1
fi

echo "=================================================="
echo "  Kinora: Deploy to Supabase DEVELOPMENT"
echo "=================================================="
echo ""
echo "Target: ${KINORA_DEV_PROJECT_REF}"
echo ""

echo "[1/3] Linking to DEV project..."
npx supabase link --project-ref "${KINORA_DEV_PROJECT_REF}"

echo "[2/3] Pushing migrations to DEV..."
npx supabase db push --linked

echo "[3/3] Deploying Edge Functions to DEV..."
npx supabase functions deploy --project-ref "${KINORA_DEV_PROJECT_REF}"

echo ""
echo "=================================================="
echo "  DEV deployment complete!"
echo "=================================================="
