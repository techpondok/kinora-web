@echo off
REM ============================================================
REM Kinora - Setup Local Development Database
REM ============================================================
REM Prerequisites: PostgreSQL installed and running on localhost:5432
REM
REM This script:
REM 1. Creates kinora_development database
REM 2. Runs full schema migration
REM ============================================================

echo ==================================================
echo   Kinora: Setup Local Development Database
echo ==================================================
echo.

REM Create database (will error if already exists — that's OK)
echo [1/2] Creating database kinora_development...
psql -U postgres -c "CREATE DATABASE kinora_development;" 2>nul
if errorlevel 1 (
    echo   Database already exists, skipping.
) else (
    echo   Done.
)

echo [2/2] Running schema migration...
psql -U postgres -d kinora_development -f server\migrations\001_init_local.sql
if errorlevel 1 (
    echo   ERROR: Migration failed!
    exit /b 1
)

echo.
echo ==================================================
echo   Local database ready!
echo ==================================================
echo.
echo   Database: kinora_development
echo   Host:     localhost:5432
echo   User:     postgres
echo.
echo   Test accounts:
echo     founder@kinora.dev / founder123
echo     admin@kinora.dev   / admin123
echo     user@kinora.dev    / user123
echo.
echo   Next: cd server ^& npm install ^& npm run dev
