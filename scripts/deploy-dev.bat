@echo off
REM ============================================================
REM Kinora: Deploy Migrations + Edge Functions to Supabase DEV
REM ============================================================

if "%KINORA_DEV_PROJECT_REF%"=="" (
  echo ERROR: Set KINORA_DEV_PROJECT_REF environment variable
  echo   Example: set KINORA_DEV_PROJECT_REF=your-dev-project-ref
  exit /b 1
)

REM Safety: block production ref
if "%KINORA_DEV_PROJECT_REF%"=="sasigbuckngggpwpxlhz" (
  echo ABORT: KINORA_DEV_PROJECT_REF is set to PRODUCTION project!
  exit /b 1
)

echo ==================================================
echo   Kinora: Deploy to Supabase DEVELOPMENT
echo ==================================================
echo.
echo Target: %KINORA_DEV_PROJECT_REF%
echo.
pause

echo [1/3] Linking to DEV project...
npx supabase link --project-ref %KINORA_DEV_PROJECT_REF%
if errorlevel 1 exit /b 1

echo [2/3] Pushing migrations to DEV...
npx supabase db push --linked
if errorlevel 1 exit /b 1

echo [3/3] Deploying Edge Functions to DEV...
npx supabase functions deploy --project-ref %KINORA_DEV_PROJECT_REF%
if errorlevel 1 exit /b 1

echo.
echo ==================================================
echo   DEV deployment complete!
echo ==================================================
