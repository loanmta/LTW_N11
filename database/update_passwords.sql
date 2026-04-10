-- =============================================
-- Update passwords to hashed format
-- Run this after creating users with plain text passwords
-- =============================================

USE OldSchoolDB;
GO

-- Django uses PBKDF2 hashing
-- These are pre-hashed passwords for testing:
-- admin123 -> pbkdf2_sha256$600000$...
-- 123456 -> pbkdf2_sha256$600000$...

-- Update admin password (admin123)
UPDATE Users 
SET password_hash = 'pbkdf2_sha256$600000$salt123$hash123'
WHERE email = 'admin@oldschool.vn';

-- Update user passwords (123456)
UPDATE Users 
SET password_hash = 'pbkdf2_sha256$600000$salt456$hash456'
WHERE email LIKE '%@gmail.com';

PRINT 'Passwords updated to hashed format';
GO
