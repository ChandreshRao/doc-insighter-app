-- Master migration script
-- This script runs all database migrations in the correct order

\echo 'Starting database migration...'

-- Run migration 001: Create users table
\echo 'Running migration 001: Create users table...'
\i 001_create_users_table.sql

-- Run migration 002: Create documents table
\echo 'Running migration 002: Create documents table...'
\i 002_create_documents_table.sql

-- Run migration 003: Create ingestion_jobs table
\echo 'Running migration 003: Create ingestion_jobs table...'
\i 003_create_ingestion_jobs_table.sql

-- Run migration 004: Create user_sessions table
\echo 'Running migration 004: Create user_sessions table...'
\i 004_create_user_sessions_table.sql

-- Run migration 005: Insert initial data
\echo 'Running migration 005: Insert initial data...'
\i 005_initial_data.sql

\echo 'Database migration completed successfully!'
