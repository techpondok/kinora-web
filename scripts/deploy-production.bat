@echo off
REM ============================================================
REM Kinora: Deploy Migrations + Edge Functions to Supabase PRODUCTION
REM ============================================================

set PRODUCTION_PROJECT_REF=sasigbuckngggpwpxlhz

echo ==================================================
echo   Kinora: Deploy to Supabase PRODUCTION
echo ==================================================
echo.
echo Target: %PRODUCTION_PROJECT_REF% (PRODUCTION)
echo.
echo WARNING: This will modify the PRODUCTION database!
echo Make sure all migrations have been tested in DEV first.
echo.
pause

echo [1/3] Linking to Production project...
npx supabase link --project-ref %PRODUCTION_PROJECT_REF%
if errorlevel 1 exit /b 1

echo [2/3] Pushing migrations to Production...
npx supabase db push --linked
if errorlevel 1 exit /b 1

echo [3/3] Deploying Edge Functions to Production...
npx supabase functions deploy --project-ref %PRODUCTION_PROJECT_REF%
if errorlevel 1 exit /b 1

echo.
echo ==================================================
echo   PRODUCTION deployment complete!
echo ==================================================
echo.
echo Next: Verify in Supabase Dashboard.
