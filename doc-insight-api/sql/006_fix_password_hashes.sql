-- Fix password hashes for existing users
-- This script updates the password hashes with the correct bcrypt hashes

-- Update admin user password hash
UPDATE users 
SET password_hash = '$2a$12$lZuCDCHMmgZLDie7fLI3h..mFddwNRx8A8FJn1mMgwXkdIXn39i4u'
WHERE email = 'admin@docinsight.com';

-- Update editor user password hash
UPDATE users 
SET password_hash = '$2a$12$3PXrjWFz7iKN8orJxMpUAOUwcRZmWwGjoWVOtAxFHphGMwxHm607e'
WHERE email = 'editor@docinsight.com';

-- Update viewer user password hash
UPDATE users 
SET password_hash = '$2a$12$j4ZsW7RWKIRpIcJm0eIIz.TctmP1P3Y.MBa272YbFl2ac7QVvAb1W'
WHERE email = 'viewer@docinsight.com';

-- Verify the updates
SELECT email, username, role, 
       CASE 
           WHEN password_hash = '$2a$12$lZuCDCHMmgZLDie7fLI3h..mFddwNRx8A8FJn1mMgwXkdIXn39i4u' THEN 'Admin123!'
           WHEN password_hash = '$2a$12$3PXrjWFz7iKN8orJxMpUAOUwcRZmWwGjoWVOtAxFHphGMwxHm607e' THEN 'Editor123!'
           WHEN password_hash = '$2a$12$j4ZsW7RWKIRpIcJm0eIIz.TctmP1P3Y.MBa272YbFl2ac7QVvAb1W' THEN 'Viewer123!'
           ELSE 'Unknown'
       END as password_verified
FROM users 
WHERE email IN ('admin@docinsight.com', 'editor@docinsight.com', 'viewer@docinsight.com');
