-- =============================================
-- Reset Database - Clear all data
-- =============================================

USE OldSchoolDB;
GO

PRINT 'Clearing all data...';

-- Disable foreign key constraints temporarily
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
GO

-- Delete data from all tables (in correct order due to foreign keys)
DELETE FROM OrderStatusHistory;
DELETE FROM OrderItems;
DELETE FROM Orders;
DELETE FROM CartItems;
DELETE FROM Reviews;
DELETE FROM Vouchers;
DELETE FROM Products;
DELETE FROM Categories;
DELETE FROM UserProfiles;
DELETE FROM Users;
GO

-- Reset identity columns
DBCC CHECKIDENT ('OrderStatusHistory', RESEED, 0);
DBCC CHECKIDENT ('OrderItems', RESEED, 0);
DBCC CHECKIDENT ('Orders', RESEED, 0);
DBCC CHECKIDENT ('CartItems', RESEED, 0);
DBCC CHECKIDENT ('Reviews', RESEED, 0);
DBCC CHECKIDENT ('Vouchers', RESEED, 0);
DBCC CHECKIDENT ('Products', RESEED, 0);
DBCC CHECKIDENT ('Categories', RESEED, 0);
DBCC CHECKIDENT ('UserProfiles', RESEED, 0);
DBCC CHECKIDENT ('Users', RESEED, 0);
GO

-- Re-enable foreign key constraints
EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';
GO

PRINT 'All data cleared successfully!';
PRINT 'You can now run insert_sample_data.sql';
GO
