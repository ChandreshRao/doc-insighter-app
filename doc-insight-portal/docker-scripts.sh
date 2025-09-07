#!/bin/bash

# Docker Scripts for Doc Insight Portal
# This script provides common Docker commands and utilities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install it and try again."
        exit 1
    fi
}

# Function to build all services
build_all() {
    print_status "Building all services..."
    docker-compose build
    print_success "All services built successfully!"
}

# Function to start development environment
start_dev() {
    print_status "Starting development environment..."
    docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
    print_success "Development environment started!"
    print_status "Frontend: http://localhost:4200"
    print_status "Backend: http://localhost:3000"
    print_status "PostgreSQL: localhost:5435"
}

# Function to start production environment
start_prod() {
    print_status "Starting production environment..."
    docker-compose -f docker-compose.prod.yml up -d
    print_success "Production environment started!"
    print_status "Frontend: http://localhost:80"
    print_status "Backend: http://localhost:3000"
    print_status "PostgreSQL: localhost:5435"
}

# Function to start test environment
start_test() {
    print_status "Starting test environment..."
    docker-compose -f docker-compose.test.yml up --abort-on-container-exit
    print_success "Tests completed!"
}

# Function to stop all services
stop_all() {
    print_status "Stopping all services..."
    docker-compose down
    print_success "All services stopped!"
}

# Function to stop and remove all containers, networks, and volumes
clean_all() {
    print_warning "This will remove all containers, networks, and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning all Docker resources..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_success "All Docker resources cleaned!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to view logs
view_logs() {
    local service=${1:-""}
    if [ -z "$service" ]; then
        print_status "Showing logs for all services..."
        docker-compose logs -f
    else
        print_status "Showing logs for $service..."
        docker-compose logs -f "$service"
    fi
}

# Function to restart a specific service
restart_service() {
    local service=${1:-""}
    if [ -z "$service" ]; then
        print_error "Please specify a service to restart"
        echo "Usage: $0 restart <service_name>"
        exit 1
    fi
    print_status "Restarting $service..."
    docker-compose restart "$service"
    print_success "$service restarted successfully!"
}

# Function to show service status
show_status() {
    print_status "Service status:"
    docker-compose ps
}

# Function to show resource usage
show_resources() {
    print_status "Resource usage:"
    docker stats --no-stream
}

# Function to execute command in a service
exec_service() {
    local service=${1:-""}
    local command=${2:-"bash"}
    if [ -z "$service" ]; then
        print_error "Please specify a service"
        echo "Usage: $0 exec <service_name> [command]"
        exit 1
    fi
    print_status "Executing '$command' in $service..."
    docker-compose exec "$service" "$command"
}

# Function to show help
show_help() {
    echo "Doc Insight Portal Docker Management Script"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  build       Build all services"
    echo "  dev         Start development environment"
    echo "  prod        Start production environment"
    echo "  test        Run tests"
    echo "  stop        Stop all services"
    echo "  clean       Clean all Docker resources"
    echo "  logs        View logs (all services or specific service)"
    echo "  restart     Restart a specific service"
    echo "  status      Show service status"
    echo "  resources   Show resource usage"
    echo "  exec        Execute command in a service"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev                    # Start development environment"
    echo "  $0 logs backend           # View backend logs"
    echo "  $0 restart frontend       # Restart frontend service"
    echo "  $0 exec backend bash      # Open bash in backend container"
}

# Main script logic
main() {
    # Check prerequisites
    check_docker
    check_docker_compose

    case "${1:-help}" in
        "build")
            build_all
            ;;
        "dev")
            start_dev
            ;;
        "prod")
            start_prod
            ;;
        "test")
            start_test
            ;;
        "stop")
            stop_all
            ;;
        "clean")
            clean_all
            ;;
        "logs")
            view_logs "$2"
            ;;
        "restart")
            restart_service "$2"
            ;;
        "status")
            show_status
            ;;
        "resources")
            show_resources
            ;;
        "exec")
            exec_service "$2" "${3:-bash}"
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
