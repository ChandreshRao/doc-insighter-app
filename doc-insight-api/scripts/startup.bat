@echo off
REM Startup script for Doc Insight API (Windows)
REM This script runs migrations and starts the application

setlocal enabledelayedexpansion

echo [INFO] Doc Insight API Startup Script
echo [INFO] Environment: %NODE_ENV%
echo [INFO] Database: %DB_HOST%:%DB_PORT%/%DB_NAME%

REM Wait for database to be ready
echo [INFO] Waiting for database to be ready...
set /a max_attempts=30
set /a attempt=1

:wait_loop
if %attempt% gtr %max_attempts% (
    echo [ERROR] Database failed to become ready after %max_attempts% attempts
    exit /b 1
)

node -e "const { Pool } = require('pg'); const pool = new Pool({host: process.env.DB_HOST || 'postgres', port: process.env.DB_PORT || 5432, database: process.env.DB_NAME || 'doc_insight', user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD || 'password_1234', ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false}); pool.query('SELECT 1').then(() => {console.log('Database is ready'); process.exit(0);}).catch(() => {process.exit(1);});" 2>nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Database is ready!
    goto :migrations
)

echo [INFO] Attempt %attempt%/%max_attempts% - Database not ready yet, waiting 2 seconds...
timeout /t 2 /nobreak >nul
set /a attempt+=1
goto :wait_loop

:migrations
echo [INFO] Running database migrations...

REM Copy database files to dist if they don't exist
if not exist "dist\postgres-init" (
    echo [INFO] Copying database files to dist...
    call bin\copy-db-files.bat
)

REM Run migrations
if exist "bin\migrate.bat" (
    echo [INFO] Executing migration script...
    call bin\migrate.bat
    echo [SUCCESS] Migrations completed successfully
) else (
    echo [WARNING] Migration script not found, skipping migrations
)

REM Start the application
echo [INFO] Starting Doc Insight API...

if "%NODE_ENV%"=="development" (
    echo [INFO] Starting in development mode with nodemon...
    npm run dev
) else (
    echo [INFO] Starting in production mode...
    npm start
)

endlocal
