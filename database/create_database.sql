-- =============================================
-- OLD SCHOOL E-Commerce Database
-- SQL Server Database Schema
-- =============================================

-- Create Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'OldSchoolDB')
BEGIN
    CREATE DATABASE OldSchoolDB;
END
GO

USE OldSchoolDB;
GO

-- =============================================
-- 1. Users Table (Người dùng)
-- =============================================
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
GO

CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20),
    role NVARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin' or 'user'
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 2. Categories Table (Danh mục sản phẩm)
-- =============================================
IF OBJECT_ID('Categories', 'U') IS NOT NULL DROP TABLE Categories;
GO

CREATE TABLE Categories (
    category_id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NOT NULL,
    slug NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(500),
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 3. Products Table (Sản phẩm)
-- =============================================
IF OBJECT_ID('Products', 'U') IS NOT NULL DROP TABLE Products;
GO

CREATE TABLE Products (
    product_id INT PRIMARY KEY IDENTITY(1,1),
    category_id INT,
    name NVARCHAR(255) NOT NULL,
    slug NVARCHAR(255) NOT NULL UNIQUE,
    description NVARCHAR(MAX),
    price DECIMAL(18,2) NOT NULL,
    old_price DECIMAL(18,2),
    stock_quantity INT NOT NULL DEFAULT 0,
    color NVARCHAR(50),
    size NVARCHAR(20),
    image_url NVARCHAR(500),
    image_2_url NVARCHAR(500),
    image_3_url NVARCHAR(500),
    is_new BIT NOT NULL DEFAULT 0,
    is_featured BIT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);
GO

-- =============================================
-- 4. User Profiles Table (Hồ sơ người dùng)
-- =============================================
IF OBJECT_ID('UserProfiles', 'U') IS NOT NULL DROP TABLE UserProfiles;
GO

CREATE TABLE UserProfiles (
    profile_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    address NVARCHAR(500),
    city NVARCHAR(100),
    district NVARCHAR(100),
    postal_code NVARCHAR(20),
    avatar_url NVARCHAR(500),
    date_of_birth DATE,
    gender NVARCHAR(10),
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
GO

-- =============================================
-- 5. Orders Table (Đơn hàng)
-- =============================================
IF OBJECT_ID('Orders', 'U') IS NOT NULL DROP TABLE Orders;
GO

CREATE TABLE Orders (
    order_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT,
    order_number NVARCHAR(50) NOT NULL UNIQUE,
    session_key NVARCHAR(255),
    full_name NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    email NVARCHAR(255),
    address NVARCHAR(500) NOT NULL,
    city NVARCHAR(100),
    district NVARCHAR(100),
    status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, shipping, completed, cancelled
    payment_method NVARCHAR(50) NOT NULL, -- cod, bank_transfer, qr_code
    payment_status NVARCHAR(50) NOT NULL DEFAULT 'unpaid', -- unpaid, paid
    subtotal DECIMAL(18,2) NOT NULL,
    discount DECIMAL(18,2) NOT NULL DEFAULT 0,
    shipping_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
    total DECIMAL(18,2) NOT NULL,
    notes NVARCHAR(MAX),
    tracking_number NVARCHAR(100),
    shipping_company NVARCHAR(100),
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

-- =============================================
-- 6. Order Items Table (Chi tiết đơn hàng)
-- =============================================
IF OBJECT_ID('OrderItems', 'U') IS NOT NULL DROP TABLE OrderItems;
GO

CREATE TABLE OrderItems (
    order_item_id INT PRIMARY KEY IDENTITY(1,1),
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name NVARCHAR(255) NOT NULL,
    product_image NVARCHAR(500),
    quantity INT NOT NULL,
    price DECIMAL(18,2) NOT NULL,
    color NVARCHAR(50),
    size NVARCHAR(20),
    subtotal DECIMAL(18,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);
GO

-- =============================================
-- 7. Cart Items Table (Giỏ hàng)
-- =============================================
IF OBJECT_ID('CartItems', 'U') IS NOT NULL DROP TABLE CartItems;
GO

CREATE TABLE CartItems (
    cart_item_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT,
    session_key NVARCHAR(255),
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    selected BIT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);
GO

-- =============================================
-- 8. Reviews Table (Đánh giá sản phẩm)
-- =============================================
IF OBJECT_ID('Reviews', 'U') IS NOT NULL DROP TABLE Reviews;
GO

CREATE TABLE Reviews (
    review_id INT PRIMARY KEY IDENTITY(1,1),
    product_id INT NOT NULL,
    user_id INT,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment NVARCHAR(MAX),
    avatar_url NVARCHAR(500),
    is_verified BIT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

-- =============================================
-- 9. Vouchers Table (Mã giảm giá)
-- =============================================
IF OBJECT_ID('Vouchers', 'U') IS NOT NULL DROP TABLE Vouchers;
GO

CREATE TABLE Vouchers (
    voucher_id INT PRIMARY KEY IDENTITY(1,1),
    code NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(255),
    discount_type NVARCHAR(20) NOT NULL, -- percentage, fixed
    discount_value DECIMAL(18,2) NOT NULL,
    min_order_value DECIMAL(18,2),
    max_discount DECIMAL(18,2),
    usage_limit INT,
    used_count INT NOT NULL DEFAULT 0,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 10. Order Status History (Lịch sử trạng thái đơn hàng)
-- =============================================
IF OBJECT_ID('OrderStatusHistory', 'U') IS NOT NULL DROP TABLE OrderStatusHistory;
GO

CREATE TABLE OrderStatusHistory (
    history_id INT PRIMARY KEY IDENTITY(1,1),
    order_id INT NOT NULL,
    status NVARCHAR(50) NOT NULL,
    notes NVARCHAR(MAX),
    created_by INT,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES Users(user_id)
);
GO

-- =============================================
-- Create Indexes for Performance
-- =============================================

-- Users indexes
CREATE INDEX IX_Users_Email ON Users(email);
CREATE INDEX IX_Users_Role ON Users(role);

-- Products indexes
CREATE INDEX IX_Products_Category ON Products(category_id);
CREATE INDEX IX_Products_Slug ON Products(slug);
CREATE INDEX IX_Products_IsActive ON Products(is_active);
CREATE INDEX IX_Products_IsNew ON Products(is_new);

-- Orders indexes
CREATE INDEX IX_Orders_User ON Orders(user_id);
CREATE INDEX IX_Orders_OrderNumber ON Orders(order_number);
CREATE INDEX IX_Orders_Status ON Orders(status);
CREATE INDEX IX_Orders_CreatedAt ON Orders(created_at);

-- Cart indexes
CREATE INDEX IX_CartItems_User ON CartItems(user_id);
CREATE INDEX IX_CartItems_Session ON CartItems(session_key);
CREATE INDEX IX_CartItems_Product ON CartItems(product_id);

GO

PRINT 'Database schema created successfully!';
GO
