#!/bin/bash

# Environment Setup Script for Doc Insight API
# This script helps users set up their environment variables

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$API_DIR/.env"
EXAMPLE_FILE="$API_DIR/env.example"

# Function to print colored output
print_header() {
    echo -e "${BLUE}🚀 Doc Insight API - Environment Setup${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}📝 $1${NC}"
}

# Function to read user input with default value
read_input() {
    local prompt="$1"
    local default="$2"
    local required="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        value="${value:-$default}"
    else
        read -p "$prompt: " value
    fi
    
    if [ "$required" = "true" ] && [ -z "$value" ]; then
        print_warning "This field is required. Using default value."
        value="$default"
    fi
    
    echo "$value"
}

# Function to show help
show_help() {
    echo "Doc Insight API - Environment Setup"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -f, --force    Force overwrite existing .env file"
    echo ""
    echo "This script will:"
    echo "  1. Copy env.example to .env"
    echo "  2. Prompt for required configuration values"
    echo "  3. Set up your environment for development"
    echo ""
}

# Function to setup environment interactively
setup_environment() {
    print_header
    
    # Check if .env already exists
    if [ -f "$ENV_FILE" ]; then
        read -p "⚠️  .env file already exists. Overwrite? (y/N): " overwrite
        if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
            print_error "Setup cancelled."
            exit 0
        fi
    fi
    
    # Copy from example
    if [ -f "$EXAMPLE_FILE" ]; then
        cp "$EXAMPLE_FILE" "$ENV_FILE"
        print_success "Copied env.example to .env"
    else
        print_error "env.example file not found!"
        exit 1
    fi
    
    echo
    print_info "Please provide the following required values:"
    echo
    
    # Required values
    declare -A required_vars=(
        ["JWT_SECRET"]="JWT Secret Key (for token signing)"
        ["JWT_REFRESH_SECRET"]="JWT Refresh Secret Key"
        ["DB_PASSWORD"]="Database Password"
    )
    
    # Optional values
    declare -A optional_vars=(
        ["NODE_ENV"]="Environment (development/production/test)"
        ["PORT"]="Server Port"
        ["DB_HOST"]="Database Host"
        ["DB_NAME"]="Database Name"
        ["USE_MOCK_INGESTION"]="Use Mock Ingestion Service (true/false)"
    )
    
    # Default values
    declare -A default_values=(
        ["JWT_SECRET"]="your_super_secret_jwt_key_here_make_it_long_and_random"
        ["JWT_REFRESH_SECRET"]="your_refresh_secret_key"
        ["DB_PASSWORD"]="your_password"
        ["NODE_ENV"]="development"
        ["PORT"]="3000"
        ["DB_HOST"]="localhost"
        ["DB_NAME"]="doc_insight"
        ["USE_MOCK_INGESTION"]="true"
    )
    
    # Process required variables
    for var in "${!required_vars[@]}"; do
        value=$(read_input "${required_vars[$var]}" "${default_values[$var]}" "true")
        sed -i.bak "s/^${var}=.*/${var}=${value}/" "$ENV_FILE"
        rm -f "$ENV_FILE.bak"
    done
    
    # Process optional variables
    echo
    print_info "Optional Configuration (press Enter to use defaults):"
    echo
    
    for var in "${!optional_vars[@]}"; do
        value=$(read_input "${optional_vars[$var]}" "${default_values[$var]}" "false")
        sed -i.bak "s/^${var}=.*/${var}=${value}/" "$ENV_FILE"
        rm -f "$ENV_FILE.bak"
    done
    
    print_success "Environment setup complete!"
    echo
    print_info "Next steps:"
    echo "1. Review your .env file"
    echo "2. Start the database (if using local PostgreSQL)"
    echo "3. Run: npm run dev"
    echo
    print_info "For more configuration options, see ENVIRONMENT-VARIABLES.md"
}

# Function to force setup
force_setup() {
    if [ -f "$EXAMPLE_FILE" ]; then
        cp "$EXAMPLE_FILE" "$ENV_FILE"
        print_success "Environment file created from example"
        print_info "Please edit .env file with your configuration"
    else
        print_error "env.example file not found!"
        exit 1
    fi
}

# Main execution
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--force)
            force_setup
            exit 0
            ;;
        "")
            setup_environment
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
