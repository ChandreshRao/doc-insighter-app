#!/bin/bash

# Copy database migration and seed files to dist folder
# This ensures that the compiled files are available for the application

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(dirname "$SCRIPT_DIR")"
SOURCE_DIR="$API_DIR/src/database"
DIST_DIR="$API_DIR/dist/database"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to copy directory contents
copy_directory() {
    local source="$1"
    local dest="$2"
    local name="$3"
    
    if [ -d "$source" ]; then
        if [ ! -d "$dest" ]; then
            mkdir -p "$dest"
        fi
        
        # Copy all files from source to dest
        for file in "$source"/*; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                cp "$file" "$dest/$filename"
                print_info "Copied $name: $filename"
            fi
        done
    else
        print_info "Source directory not found: $source (skipping $name)"
    fi
}

# Function to show help
show_help() {
    echo "Database Files Copy Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "This script copies database-related files to the dist folder:"
    echo "  - Migration files (src/database/migrations -> dist/database/migrations)"
    echo "  - Seed files (src/database/seeds -> dist/database/seeds)"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Verbose output"
    echo ""
}

# Main execution
main() {
    local verbose=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    print_info "Starting database files copy process..."
    
    # Create dist/database directory if it doesn't exist
    if [ ! -d "$DIST_DIR" ]; then
        mkdir -p "$DIST_DIR"
        print_info "Created dist/database directory"
    fi
    
    # Copy migrations
    copy_directory "$SOURCE_DIR/migrations" "$DIST_DIR/migrations" "migration"
    
    # Copy seeds
    copy_directory "$SOURCE_DIR/seeds" "$DIST_DIR/seeds" "seed"
    
    
    print_success "Database files copied to dist folder successfully!"
    
    if [ "$verbose" = true ]; then
        echo
        print_info "Copied files:"
        find "$DIST_DIR" -type f -exec basename {} \; | sort
    fi
}

# Run main function
main "$@"
