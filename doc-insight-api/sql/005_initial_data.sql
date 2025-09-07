-- Insert initial admin user
-- Password: Admin123! (hashed with bcrypt)
INSERT INTO users (email, username, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
    'admin@docinsight.com',
    'admin',
    '$2a$12$lZuCDCHMmgZLDie7fLI3h..mFddwNRx8A8FJn1mMgwXkdIXn39i4u', -- Admin123!
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
    '$2a$12$3PXrjWFz7iKN8orJxMpUAOUwcRZmWwGjoWVOtAxFHphGMwxHm607e', -- Editor123!
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
    '$2a$12$j4ZsW7RWKIRpIcJm0eIIz.TctmP1P3Y.MBa272YbFl2ac7QVvAb1W', -- Viewer123!
    'Viewer',
    'User',
    'viewer',
    true,
    true
) ON CONFLICT (email) DO NOTHING;
