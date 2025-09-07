#!/bin/bash

# Database migration script for Doc Insight API
# This script runs SQL migrations to set up the database schema

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5435"}
DB_NAME=${DB_NAME:-"doc_insight"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"password"}
SQL_DIR="$(dirname "$0")/../sql"

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

# Function to check if psql is available
check_psql() {
    if ! command -v psql &> /dev/null; then
        print_error "psql is not installed or not in PATH"
        print_error "Please install PostgreSQL client tools"
        exit 1
    fi
}

# Function to check database connection
check_connection() {
    print_status "Checking database connection..."
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Database connection successful"
    else
        print_error "Cannot connect to database"
        print_error "Please check your database configuration:"
        print_error "  Host: $DB_HOST"
        print_error "  Port: $DB_PORT"
        print_error "  Database: $DB_NAME"
        print_error "  User: $DB_USER"
        exit 1
    fi
}

# Function to run migrations
run_migrations() {
    print_status "Starting database migration..."
    
    if [ ! -d "$SQL_DIR" ]; then
        print_error "SQL directory not found: $SQL_DIR"
        exit 1
    fi
    
    # Change to SQL directory
    cd "$SQL_DIR"
    
    # Run the master migration script
    if [ -f "00_migrate_all.sql" ]; then
        print_status "Running master migration script..."
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "00_migrate_all.sql"
        print_success "Master migration completed"
    else
        print_warning "Master migration script not found, running individual migrations..."
        
        # Run individual migration files in order
        for migration in 001_create_users_table.sql 002_create_documents_table.sql 003_create_ingestion_jobs_table.sql 004_create_user_sessions_table.sql 005_initial_data.sql; do
            if [ -f "$migration" ]; then
                print_status "Running $migration..."
                PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration"
                print_success "$migration completed"
            else
                print_warning "$migration not found, skipping..."
            fi
        done
    fi
}

# Function to show help
show_help() {
    echo "Doc Insight API Database Migration Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --host HOST        Database host (default: localhost)"
    echo "  -p, --port PORT        Database port (default: 5435)"
    echo "  -d, --database NAME    Database name (default: doc_insight)"
    echo "  -u, --user USER        Database user (default: postgres)"
    echo "  -w, --password PASS    Database password (default: password)"
    echo "  --help                 Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Use default settings"
    echo "  $0 -h localhost -p 5435 -d mydb      # Custom database settings"
    echo "  DB_PASSWORD=mypass $0                 # Use environment variable"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            DB_HOST="$2"
            shift 2
            ;;
        -p|--port)
            DB_PORT="$2"
            shift 2
            ;;
        -d|--database)
            DB_NAME="$2"
            shift 2
            ;;
        -u|--user)
            DB_USER="$2"
            shift 2
            ;;
        -w|--password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_status "Doc Insight API Database Migration"
    print_status "=================================="
    
    check_psql
    check_connection
    run_migrations
    
    print_success "All migrations completed successfully!"
    print_status "Database is ready for use."
}

# Run main function
main "$@"
