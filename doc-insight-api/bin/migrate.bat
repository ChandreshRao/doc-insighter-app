@echo off
REM Database migration script for Doc Insight API (Windows)
REM This script runs SQL migrations to set up the database schema

setlocal enabledelayedexpansion

REM Default values
if not defined DB_HOST set DB_HOST=localhost
if not defined DB_PORT set DB_PORT=5432
if not defined DB_NAME set DB_NAME=doc_insight
if not defined DB_USER set DB_USER=postgres
if not defined DB_PASSWORD set DB_PASSWORD=password

set SQL_DIR=%~dp0..\sql

REM Function to print colored output (Windows doesn't support colors in batch, so we'll use echo)
echo [INFO] Doc Insight API Database Migration
echo [INFO] ==================================

REM Check if psql is available
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] psql is not installed or not in PATH
    echo [ERROR] Please install PostgreSQL client tools
    exit /b 1
)

REM Check database connection
echo [INFO] Checking database connection...
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 1;" >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Cannot connect to database
    echo [ERROR] Please check your database configuration:
    echo [ERROR]   Host: %DB_HOST%
    echo [ERROR]   Port: %DB_PORT%
    echo [ERROR]   Database: %DB_NAME%
    echo [ERROR]   User: %DB_USER%
    exit /b 1
)
echo [SUCCESS] Database connection successful

REM Check if SQL directory exists
if not exist "%SQL_DIR%" (
    echo [ERROR] SQL directory not found: %SQL_DIR%
    exit /b 1
)

REM Change to SQL directory
cd /d "%SQL_DIR%"

REM Run migrations
echo [INFO] Starting database migration...

REM Check if master migration script exists
if exist "00_migrate_all.sql" (
    echo [INFO] Running master migration script...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "00_migrate_all.sql"
    if %errorlevel% neq 0 (
        echo [ERROR] Migration failed
        exit /b 1
    )
    echo [SUCCESS] Master migration completed
) else (
    echo [WARNING] Master migration script not found, running individual migrations...
    
    REM Run individual migration files in order
    for %%f in (001_create_users_table.sql 002_create_documents_table.sql 003_create_ingestion_jobs_table.sql 004_create_user_sessions_table.sql 005_initial_data.sql) do (
        if exist "%%f" (
            echo [INFO] Running %%f...
            psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%%f"
            if !errorlevel! neq 0 (
                echo [ERROR] Migration %%f failed
                exit /b 1
            )
            echo [SUCCESS] %%f completed
        ) else (
            echo [WARNING] %%f not found, skipping...
        )
    )
)

echo [SUCCESS] All migrations completed successfully!
echo [INFO] Database is ready for use.

endlocal
