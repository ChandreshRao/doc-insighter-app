-- Insert initial admin user
-- Password: Admin123! (hashed with bcrypt)
INSERT INTO users (email, username, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
    'admin@docinsight.com',
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzK4aG', -- Admin123!
    'Admin',
    'User',
    'admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample editor user
-- Password: Editor123! (hashed with bcrypt)
INSERT INTO users (email, username, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
    'editor@docinsight.com',
    'editor',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzK4aG', -- Editor123!
    'Editor',
    'User',
    'editor',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample viewer user
-- Password: Viewer123! (hashed with bcrypt)
INSERT INTO users (email, username, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
    'viewer@docinsight.com',
    'viewer',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzK4aG', -- Viewer123!
    'Viewer',
    'User',
    'viewer',
    true,
    true
) ON CONFLICT (email) DO NOTHING;
