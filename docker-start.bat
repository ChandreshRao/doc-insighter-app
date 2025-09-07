@echo off
REM Master Docker Compose Profiles Startup Script (Batch)
REM This script provides easy commands to start different service combinations

setlocal enabledelayedexpansion

if "%1"=="" goto help

if "%1"=="core" goto core
if "%1"=="full" goto full
if "%1"=="production" goto production
if "%1"=="stop" goto stop
if "%1"=="status" goto status
if "%1"=="logs" goto logs
if "%1"=="rebuild" goto rebuild
if "%1"=="help" goto help

echo Unknown command: %1
echo.
goto help

:core
echo ================================
echo Starting Core Services
echo ================================
echo Starting: Frontend, API Backend, PostgreSQL, Redis
docker-compose up -d
echo.
echo Core services started successfully!
echo Frontend: http://localhost:4200
echo API: http://localhost:3000
echo Database: localhost:5435
echo Redis: localhost:6379
goto end

:full
echo ================================
echo Starting Full Stack with RAG Services
echo ================================
echo Starting: All services including RAG backend and Vector DB
docker-compose --profile rag up -d
echo.
echo Full stack started successfully!
echo Frontend: http://localhost:4200
echo API: http://localhost:3000
echo RAG Service: http://localhost:8000
echo Vector DB: http://localhost:8001
goto end

:production
echo ================================
echo Starting Production Mode
echo ================================
echo Starting: All services with Nginx reverse proxy
docker-compose --profile rag --profile production up -d
echo.
echo Production mode started successfully!
echo Nginx Proxy: http://localhost:80, https://localhost:443
goto end

:stop
echo ================================
echo Stopping All Services
echo ================================
docker-compose down
echo All services stopped.
goto end

:status
echo ================================
echo Service Status
echo ================================
docker-compose ps
goto end

:logs
echo ================================
if "%2"=="" (
    echo All Service Logs
    docker-compose logs -f
) else (
    echo Logs for %2
    docker-compose logs -f %2
)
goto end

:rebuild
echo ================================
echo Rebuilding Services
echo ================================
docker-compose down
docker-compose build --no-cache
echo Services rebuilt. Use start command to start them.
goto end

:help
echo ================================
echo Master Docker Compose Profiles Startup Script
echo ================================
echo Usage: docker-start.bat [COMMAND]
echo.
echo Commands:
echo   core          Start core services (Frontend + API + Database)
echo   full          Start full stack with RAG services
echo   production    Start production mode with Nginx
echo   stop          Stop all services
echo   status        Show service status
echo   logs [SERVICE] Show logs (all services or specific service)
echo   rebuild       Rebuild all services
echo   help          Show this help message
echo.
echo Examples:
echo   docker-start.bat core              # Start core services
echo   docker-start.bat full              # Start with RAG services
echo   docker-start.bat logs api-backend  # Show API backend logs
echo.
echo Profiles:
echo   default:     Core services (Frontend, API, PostgreSQL, Redis)
echo   rag:         RAG services (Python backend, Vector DB)
echo   production:  Production services (Nginx proxy)
echo.
echo Service Locations:
echo   Frontend:    ./doc-insight-portal
echo   API:         ./doc-insight-api
echo   RAG:         ./doc-insight-sphere

:end
endlocal
