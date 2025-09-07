# Database Migration Scripts

This directory contains scripts for managing database migrations for the Doc Insight API.

## Files

- `migrate.sh` - Bash script for Linux/Mac systems
- `migrate.bat` - Batch script for Windows systems
- `../sql/` - SQL migration files directory

## Usage

### Linux/Mac
```bash
# Using npm script
npm run db:migrate

# Or run directly
./bin/migrate.sh

# With custom database settings
./bin/migrate.sh -h localhost -p 5435 -d mydb -u postgres -w mypassword
```

### Windows
```cmd
# Using npm script
npm run db:migrate:win

# Or run directly
bin\migrate.bat

# With custom database settings (set environment variables)
set DB_HOST=localhost
set DB_PORT=5435
set DB_NAME=mydb
set DB_USER=postgres
set DB_PASSWORD=mypassword
bin\migrate.bat
```

## Environment Variables

You can set these environment variables instead of using command line arguments:

- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5435)
- `DB_NAME` - Database name (default: doc_insight)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password (default: password)

## Migration Files

The SQL migration files are located in the `../sql/` directory:

1. `001_create_users_table.sql` - Creates the users table
2. `002_create_documents_table.sql` - Creates the documents table
3. `003_create_ingestion_jobs_table.sql` - Creates the ingestion_jobs table
4. `004_create_user_sessions_table.sql` - Creates the user_sessions table
5. `005_initial_data.sql` - Inserts initial data (admin, editor, viewer users)

## Prerequisites

- PostgreSQL client tools (`psql`) must be installed and available in PATH
- Database must be running and accessible
- User must have CREATE TABLE and INSERT permissions

## Default Users

After running migrations, the following users will be created:

- **Admin**: admin@docinsight.com / Admin123!
- **Editor**: editor@docinsight.com / Editor123!
- **Viewer**: viewer@docinsight.com / Viewer123!

## Troubleshooting

### Connection Issues
- Verify PostgreSQL is running
- Check database credentials
- Ensure the database exists
- Verify network connectivity

### Permission Issues
- Ensure the database user has sufficient privileges
- Check if the database exists and is accessible

### Script Issues
- On Windows, ensure the batch file is in the correct directory
- On Linux/Mac, ensure the script has execute permissions: `chmod +x migrate.sh`
