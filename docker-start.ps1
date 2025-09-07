# Master Docker Compose Profiles Startup Script (PowerShell)
# This script provides easy commands to start different service combinations

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Header {
    param([string]$Message)
    Write-Host "================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "================================" -ForegroundColor Blue
}

# Function to check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check if docker-compose is available
function Test-DockerCompose {
    try {
        docker-compose --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check if .env file exists
function Test-EnvFile {
    if (-not (Test-Path ".env")) {
        Write-Warning ".env file not found. Creating from template..."
        if (Test-Path "env.example") {
            Copy-Item "env.example" ".env"
            Write-Status ".env file created from template. Please review and modify as needed."
        }
        else {
            Write-Error "env.example template not found. Please create a .env file manually."
            exit 1
        }
    }
}

# Function to start core services
function Start-CoreServices {
    Write-Header "Starting Core Services"
    Write-Status "Starting: Frontend, API Backend, PostgreSQL, Redis"
    
    docker-compose up -d
    
    Write-Status "Core services started successfully!"
    Write-Status "Frontend: http://localhost:4200"
    Write-Status "API: http://localhost:3000"
    Write-Status "Database: localhost:5435"
    Write-Status "Redis: localhost:6379"
}

# Function to start full stack with RAG
function Start-FullStack {
    Write-Header "Starting Full Stack with RAG Services"
    Write-Status "Starting: All services including RAG backend and Vector DB"
    
    docker-compose --profile rag up -d
    
    Write-Status "Full stack started successfully!"
    Write-Status "Frontend: http://localhost:4200"
    Write-Status "API: http://localhost:3000"
    Write-Status "RAG Service: http://localhost:8000"
    Write-Status "Vector DB: http://localhost:8001"
}

# Function to start production mode
function Start-Production {
    Write-Header "Starting Production Mode"
    Write-Status "Starting: All services with Nginx reverse proxy"
    
    docker-compose --profile rag --profile production up -d
    
    Write-Status "Production mode started successfully!"
    Write-Status "Nginx Proxy: http://localhost:80, https://localhost:443"
}

# Function to stop all services
function Stop-Services {
    Write-Header "Stopping All Services"
    docker-compose down
    Write-Status "All services stopped."
}

# Function to show service status
function Show-Status {
    Write-Header "Service Status"
    docker-compose ps
}

# Function to show logs
function Show-Logs {
    param([string]$Service = "")
    
    if ($Service -eq "") {
        Write-Header "All Service Logs"
        docker-compose logs -f
    }
    else {
        Write-Header "Logs for $Service"
        docker-compose logs -f $Service
    }
}

# Function to rebuild services
function Rebuild-Services {
    Write-Header "Rebuilding Services"
    docker-compose down
    docker-compose build --no-cache
    Write-Status "Services rebuilt. Use start command to start them."
}

# Function to show help
function Show-Help {
    Write-Header "Master Docker Compose Profiles Startup Script"
    Write-Host "Usage: .\docker-start.ps1 [COMMAND]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  core          Start core services (Frontend + API + Database)" -ForegroundColor White
    Write-Host "  full          Start full stack with RAG services" -ForegroundColor White
    Write-Host "  production    Start production mode with Nginx" -ForegroundColor White
    Write-Host "  stop          Stop all services" -ForegroundColor White
    Write-Host "  status        Show service status" -ForegroundColor White
    Write-Host "  logs [SERVICE] Show logs (all services or specific service)" -ForegroundColor White
    Write-Host "  rebuild       Rebuild all services" -ForegroundColor White
    Write-Host "  help          Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\docker-start.ps1 core              # Start core services" -ForegroundColor White
    Write-Host "  .\docker-start.ps1 full              # Start with RAG services" -ForegroundColor White
    Write-Host "  .\docker-start.ps1 logs api-backend  # Show API backend logs" -ForegroundColor White
    Write-Host ""
    Write-Host "Profiles:" -ForegroundColor White
    Write-Host "  default:     Core services (Frontend, API, PostgreSQL, Redis)" -ForegroundColor White
    Write-Host "  rag:         RAG services (Python backend, Vector DB)" -ForegroundColor White
    Write-Host "  production:  Production services (Nginx proxy)" -ForegroundColor White
    Write-Host ""
    Write-Host "Service Locations:" -ForegroundColor White
    Write-Host "  Frontend:    ./doc-insight-portal" -ForegroundColor White
    Write-Host "  API:         ./doc-insight-api" -ForegroundColor White
    Write-Host "  RAG:         ./doc-insight-sphere" -ForegroundColor White
}

# Main script logic
function Main {
    # Check prerequisites
    if (-not (Test-Docker)) {
        Write-Error "Docker is not running. Please start Docker and try again."
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not installed. Please install it and try again."
        exit 1
    }
    
    Test-EnvFile
    
    switch ($Command.ToLower()) {
        "core" {
            Start-CoreServices
        }
        "full" {
            Start-FullStack
        }
        "production" {
            Start-Production
        }
        "stop" {
            Stop-Services
        }
        "status" {
            Show-Status
        }
        "logs" {
            Show-Logs
        }
        "rebuild" {
            Rebuild-Services
        }
        "help" {
            Show-Help
        }
        default {
            Write-Error "Unknown command: $Command"
            Write-Host ""
            Show-Help
            exit 1
        }
    }
}

# Run main function
Main
