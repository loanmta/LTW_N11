-- =============================================
-- Quick Setup - Drop and Recreate Everything
-- =============================================

-- Drop database if exists
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'OldSchoolDB')
BEGIN
    ALTER DATABASE OldSchoolDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE OldSchoolDB;
    PRINT 'Old database dropped';
END
GO

-- Create new database
CREATE DATABASE OldSchoolDB;
PRINT 'New database created';
GO

USE OldSchoolDB;
GO

-- Now run the table creation and data insertion
-- You can copy the content from create_database.sql and insert_sample_data.sql here
-- Or run them separately after this script

PRINT 'Database ready! Now run:';
PRINT '1. create_database.sql';
PRINT '2. insert_sample_data.sql';
GO
