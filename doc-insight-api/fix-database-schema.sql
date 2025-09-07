-- Fix database schema to add missing username column
-- This script can be run manually to fix the existing database

-- Add username column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(100);
        CREATE UNIQUE INDEX idx_users_username ON users(username);
        RAISE NOTICE 'Added username column to users table';
    ELSE
        RAISE NOTICE 'Username column already exists in users table';
    END IF;
END $$;

-- Add email_verified column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Added email_verified column to users table';
    ELSE
        RAISE NOTICE 'Email_verified column already exists in users table';
    END IF;
END $$;

-- Make first_name and last_name NOT NULL if they are nullable
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'first_name' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
        RAISE NOTICE 'Made first_name column NOT NULL';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_name' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;
        RAISE NOTICE 'Made last_name column NOT NULL';
    END IF;
END $$;

-- Add role constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE table_name = 'users' AND constraint_name LIKE '%role%'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('admin', 'editor', 'viewer'));
        RAISE NOTICE 'Added role constraint to users table';
    ELSE
        RAISE NOTICE 'Role constraint already exists in users table';
    END IF;
END $$;

-- Add missing indexes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_users_username'
    ) THEN
        CREATE INDEX idx_users_username ON users(username);
        RAISE NOTICE 'Added username index';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_users_role_active'
    ) THEN
        CREATE INDEX idx_users_role_active ON users(role, is_active);
        RAISE NOTICE 'Added role_active composite index';
    END IF;
END $$;

-- Update existing admin user to have a username if it doesn't have one
UPDATE users 
SET username = 'admin' 
WHERE email = 'admin@doc-insight.com' AND username IS NULL;

-- Show the current schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
