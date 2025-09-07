@echo off
REM Environment Setup Script for Doc Insight API (Windows)
REM This script helps users set up their environment variables

setlocal enabledelayedexpansion

REM Script directory
set SCRIPT_DIR=%~dp0
set API_DIR=%SCRIPT_DIR%..
set ENV_FILE=%API_DIR%\.env
set EXAMPLE_FILE=%API_DIR%\env.example

echo 🚀 Doc Insight API - Environment Setup
echo =====================================
echo.

REM Check if .env already exists
if exist "%ENV_FILE%" (
    set /p overwrite="⚠️  .env file already exists. Overwrite? (y/N): "
    if /i not "!overwrite!"=="y" (
        echo ❌ Setup cancelled.
        exit /b 0
    )
)

REM Copy from example
if exist "%EXAMPLE_FILE%" (
    copy "%EXAMPLE_FILE%" "%ENV_FILE%" >nul
    echo ✅ Copied env.example to .env
) else (
    echo ❌ env.example file not found!
    exit /b 1
)

echo.
echo 📝 Please provide the following required values:
echo.

REM Required values
set /p jwt_secret="JWT Secret Key (for token signing) [your_super_secret_jwt_key_here_make_it_long_and_random]: "
if "!jwt_secret!"=="" set jwt_secret=your_super_secret_jwt_key_here_make_it_long_and_random

set /p jwt_refresh_secret="JWT Refresh Secret Key [your_refresh_secret_key]: "
if "!jwt_refresh_secret!"=="" set jwt_refresh_secret=your_refresh_secret_key

set /p db_password="Database Password [your_password]: "
if "!db_password!"=="" set db_password=your_password

echo.
echo 📋 Optional Configuration (press Enter to use defaults):
echo.

set /p node_env="Environment (development/production/test) [development]: "
if "!node_env!"=="" set node_env=development

set /p port="Server Port [3000]: "
if "!port!"=="" set port=3000

set /p db_host="Database Host [localhost]: "
if "!db_host!"=="" set db_host=localhost

set /p db_name="Database Name [doc_insight]: "
if "!db_name!"=="" set db_name=doc_insight

set /p use_mock_ingestion="Use Mock Ingestion Service (true/false) [true]: "
if "!use_mock_ingestion!"=="" set use_mock_ingestion=true

REM Update .env file
powershell -Command "(Get-Content '%ENV_FILE%') -replace '^JWT_SECRET=.*', 'JWT_SECRET=!jwt_secret!' | Set-Content '%ENV_FILE%'"
powershell -Command "(Get-Content '%ENV_FILE%') -replace '^JWT_REFRESH_SECRET=.*', 'JWT_REFRESH_SECRET=!jwt_refresh_secret!' | Set-Content '%ENV_FILE%'"
powershell -Command "(Get-Content '%ENV_FILE%') -replace '^DB_PASSWORD=.*', 'DB_PASSWORD=!db_password!' | Set-Content '%ENV_FILE%'"
powershell -Command "(Get-Content '%ENV_FILE%') -replace '^NODE_ENV=.*', 'NODE_ENV=!node_env!' | Set-Content '%ENV_FILE%'"
powershell -Command "(Get-Content '%ENV_FILE%') -replace '^PORT=.*', 'PORT=!port!' | Set-Content '%ENV_FILE%'"
powershell -Command "(Get-Content '%ENV_FILE%') -replace '^DB_HOST=.*', 'DB_HOST=!db_host!' | Set-Content '%ENV_FILE%'"
powershell -Command "(Get-Content '%ENV_FILE%') -replace '^DB_NAME=.*', 'DB_NAME=!db_name!' | Set-Content '%ENV_FILE%'"
powershell -Command "(Get-Content '%ENV_FILE%') -replace '^USE_MOCK_INGESTION=.*', 'USE_MOCK_INGESTION=!use_mock_ingestion!' | Set-Content '%ENV_FILE%'"

echo.
echo ✅ Environment setup complete!
echo.
echo 📋 Next steps:
echo 1. Review your .env file
echo 2. Start the database (if using local PostgreSQL)
echo 3. Run: npm run dev
echo.
echo 📚 For more configuration options, see ENVIRONMENT-VARIABLES.md

endlocal
