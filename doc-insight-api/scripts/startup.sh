#!/bin/bash

# Startup script for Doc Insight API
# This script runs migrations and starts the application

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
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

# Function to wait for database to be ready
wait_for_database() {
    print_info "Waiting for database to be ready..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if node -e "
            const { Pool } = require('pg');
            const pool = new Pool({
                host: process.env.DB_HOST || 'postgres',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'doc_insight',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'password_1234',
                ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
            });
            pool.query('SELECT 1').then(() => {
                console.log('Database is ready');
                process.exit(0);
            }).catch((err) => {
                console.error('Database connection failed:', err.message);
                process.exit(1);
            });
        " 2>/dev/null; then
            print_success "Database is ready!"
            return 0
        fi
        
        print_info "Attempt $attempt/$max_attempts - Database not ready yet, waiting 2 seconds..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Database failed to become ready after $max_attempts attempts"
    return 1
}

# Function to run migrations
run_migrations() {
    print_info "Running database migrations..."
    
    # Run migrations directly using psql
    local sql_dir="/app/sql"
    
    if [ -d "$sql_dir" ]; then
        print_info "Found SQL migration directory: $sql_dir"
        
        # Change to SQL directory and run the master migration script
        cd "$sql_dir"
        
        print_info "Executing master migration script..."
        PGPASSWORD="${DB_PASSWORD:-password_1234}" psql \
            -h "${DB_HOST:-postgres}" \
            -p "${DB_PORT:-5432}" \
            -U "${DB_USER:-postgres}" \
            -d "${DB_NAME:-doc_insight}" \
            -f "00_migrate_all.sql" \
            -v ON_ERROR_STOP=1
        
        if [ $? -eq 0 ]; then
            print_success "All migrations completed successfully"
        else
            print_error "Migration failed"
            return 1
        fi
        
        # Change back to app directory
        cd /app
    else
        print_warning "SQL migration directory not found: $sql_dir"
    fi
}

# Function to start the application
start_application() {
    print_info "Starting Doc Insight API..."
    
    if [ "$NODE_ENV" = "development" ]; then
        print_info "Starting in development mode with nodemon..."
        exec npm run dev
    else
        print_info "Starting in production mode..."
        exec npm start
    fi
}

# Main execution
main() {
    print_info "Doc Insight API Startup Script"
    print_info "Environment: ${NODE_ENV:-development}"
    print_info "Database: ${DB_HOST:-postgres}:${DB_PORT:-5432}/${DB_NAME:-doc_insight}"
    
    # Wait for database to be ready (with shorter timeout since Docker handles dependency)
    wait_for_database
    
    # Run migrations
    run_migrations
    
    # Start the application
    start_application
}

# Run main function
main "$@"
