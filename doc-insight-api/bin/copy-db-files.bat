@echo off
REM Copy database migration and seed files to dist folder (Windows)
REM This ensures that the compiled files are available for the application

setlocal enabledelayedexpansion

REM Script directory
set SCRIPT_DIR=%~dp0
set API_DIR=%SCRIPT_DIR%..
set SOURCE_DIR=%API_DIR%\src\database
set DIST_DIR=%API_DIR%\dist\database

echo [INFO] Starting database files copy process...

REM Create dist/database directory if it doesn't exist
if not exist "%DIST_DIR%" (
    mkdir "%DIST_DIR%"
    echo [INFO] Created dist/database directory
)

REM Copy migrations
if exist "%SOURCE_DIR%\migrations" (
    if not exist "%DIST_DIR%\migrations" mkdir "%DIST_DIR%\migrations"
    for %%f in ("%SOURCE_DIR%\migrations\*") do (
        copy "%%f" "%DIST_DIR%\migrations\" >nul
        echo [INFO] Copied migration: %%~nxf
    )
) else (
    echo [INFO] Source directory not found: %SOURCE_DIR%\migrations (skipping migrations)
)

REM Copy seeds
if exist "%SOURCE_DIR%\seeds" (
    if not exist "%DIST_DIR%\seeds" mkdir "%DIST_DIR%\seeds"
    for %%f in ("%SOURCE_DIR%\seeds\*") do (
        copy "%%f" "%DIST_DIR%\seeds\" >nul
        echo [INFO] Copied seed: %%~nxf
    )
) else (
    echo [INFO] Source directory not found: %SOURCE_DIR%\seeds (skipping seeds)
)


echo [SUCCESS] Database files copied to dist folder successfully!

endlocal
