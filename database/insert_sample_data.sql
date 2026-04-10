-- =============================================
-- Insert Sample Data for OLD SCHOOL E-Commerce
-- =============================================

USE OldSchoolDB;
GO

PRINT 'Starting data insertion...';

-- =============================================
-- 1. Insert Users (Admin & Sample Users)
-- =============================================
IF NOT EXISTS (SELECT 1 FROM Users WHERE email = 'admin@oldschool.vn')
BEGIN
    INSERT INTO Users (email, password_hash, full_name, phone, role) VALUES
    ('admin@oldschool.vn', 'admin123', N'Quản trị viên', '0971860620', 'admin'),
    ('user1@gmail.com', '123456', N'Nguyễn Văn A', '0901234567', 'user'),
    ('user2@gmail.com', '123456', N'Trần Thị B', '0902345678', 'user'),
    ('user3@gmail.com', '123456', N'Lê Văn C', '0903456789', 'user');
    PRINT 'Users inserted';
END
ELSE
    PRINT 'Users already exist, skipping...';
GO

-- =============================================
-- 2. Insert Categories
-- =============================================
IF NOT EXISTS (SELECT 1 FROM Categories WHERE slug = 'ao')
BEGIN
    INSERT INTO Categories (name, slug, description) VALUES
    (N'Áo', 'ao', N'Các loại áo thời trang'),
    (N'Quần', 'quan', N'Các loại quần thời trang'),
    (N'Váy', 'vay', N'Các loại váy đầm'),
    (N'Blazer', 'blazer', N'Áo khoác Blazer cao cấp'),
    (N'Phụ kiện', 'phu-kien', N'Phụ kiện thời trang');
    PRINT 'Categories inserted';
END
ELSE
    PRINT 'Categories already exist, skipping...';
GO

-- =============================================
-- 3. Insert Products
-- =============================================
INSERT INTO Products (category_id, name, slug, description, price, old_price, stock_quantity, color, size, image_url, image_2_url, image_3_url, is_new, is_featured) VALUES
-- Áo
(1, N'Áo Sơ Mi Trắng Classic', 'ao-so-mi-trang-classic', N'Áo sơ mi trắng cổ điển, chất liệu cotton cao cấp, phù hợp cho môi trường công sở', 450000, 550000, 50, N'Trắng', 'M', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', 1, 1),
(1, N'Áo Len Cổ Lọ Đỏ', 'ao-len-co-lo-do', N'Áo len cổ lọ màu đỏ ruby, ấm áp và thời trang', 650000, 750000, 30, N'Đỏ', 'L', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500', 1, 1),
(1, N'Áo Thun Basic Đen', 'ao-thun-basic-den', N'Áo thun basic màu đen, form rộng thoải mái', 250000, NULL, 100, N'Đen', 'M', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 0, 0),

-- Quần
(2, N'Quần Tây Ống Đứng', 'quan-tay-ong-dung', N'Quần tây ống đứng thanh lịch, phù hợp đi làm', 550000, 650000, 40, N'Đen', 'M', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500', 0, 1),
(2, N'Quần Jean Xanh Nhạt', 'quan-jean-xanh-nhat', N'Quần jean xanh nhạt vintage, phong cách trẻ trung', 480000, NULL, 60, N'Xanh', 'L', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', 1, 0),

-- Váy
(3, N'Váy Midi Hoa Nhí', 'vay-midi-hoa-nhi', N'Váy midi họa tiết hoa nhí, nữ tính và duyên dáng', 580000, 680000, 35, N'Hồng', 'S', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', 1, 1),
(3, N'Váy Đầm Đen Dự Tiệc', 'vay-dam-den-du-tiec', N'Váy đầm đen sang trọng, phù hợp dự tiệc', 890000, 990000, 20, N'Đen', 'M', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500', 0, 1),

-- Blazer
(4, N'Blazer Xám Công Sở', 'blazer-xam-cong-so', N'Blazer xám thanh lịch, phù hợp môi trường công sở', 1250000, 1450000, 25, N'Xám', 'M', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500', 1, 1),
(4, N'Blazer Trắng Oversize', 'blazer-trang-oversize', N'Blazer trắng form oversize, phong cách hiện đại', 1350000, NULL, 15, N'Trắng', 'L', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500', 1, 1),

-- Phụ kiện
(5, N'Túi Xách Da Cao Cấp', 'tui-xach-da-cao-cap', N'Túi xách da thật, thiết kế sang trọng', 2500000, 2800000, 10, N'Nâu', 'OneSize', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500', 1, 1);
GO

-- =============================================
-- 4. Insert User Profiles
-- =============================================
INSERT INTO UserProfiles (user_id, address, city, district) VALUES
(2, N'123 Nguyễn Huệ', N'Đà Nẵng', N'Hải Châu'),
(3, N'456 Lê Lợi', N'Đà Nẵng', N'Thanh Khê'),
(4, N'789 Trần Phú', N'Đà Nẵng', N'Sơn Trà');
GO

-- =============================================
-- 5. Insert Sample Orders
-- =============================================
INSERT INTO Orders (user_id, order_number, full_name, phone, email, address, city, status, payment_method, subtotal, discount, shipping_fee, total, tracking_number, shipping_company) VALUES
(2, 'ORD001', N'Nguyễn Văn A', '0901234567', 'user1@gmail.com', N'123 Nguyễn Huệ, Hải Châu', N'Đà Nẵng', 'completed', 'cod', 1100000, 100000, 0, 1000000, 'GHN123456', 'Giao Hàng Nhanh'),
(2, 'ORD002', N'Nguyễn Văn A', '0901234567', 'user1@gmail.com', N'123 Nguyễn Huệ, Hải Châu', N'Đà Nẵng', 'shipping', 'qr_code', 1250000, 0, 30000, 1280000, 'GHN123457', 'Giao Hàng Nhanh'),
(3, 'ORD003', N'Trần Thị B', '0902345678', 'user2@gmail.com', N'456 Lê Lợi, Thanh Khê', N'Đà Nẵng', 'pending', 'cod', 580000, 0, 30000, 610000, NULL, NULL);
GO

-- =============================================
-- 6. Insert Order Items
-- =============================================
INSERT INTO OrderItems (order_id, product_id, product_name, product_image, quantity, price, color, size, subtotal) VALUES
-- Order 1
(1, 1, N'Áo Sơ Mi Trắng Classic', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', 1, 450000, N'Trắng', 'M', 450000),
(1, 2, N'Áo Len Cổ Lọ Đỏ', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500', 1, 650000, N'Đỏ', 'L', 650000),

-- Order 2
(2, 8, N'Blazer Xám Công Sở', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500', 1, 1250000, N'Xám', 'M', 1250000),

-- Order 3
(3, 6, N'Váy Midi Hoa Nhí', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', 1, 580000, N'Hồng', 'S', 580000);
GO

-- =============================================
-- 7. Insert Sample Reviews
-- =============================================
INSERT INTO Reviews (product_id, user_id, name, email, rating, comment, avatar_url) VALUES
(1, 2, N'Nguyễn Văn A', 'user1@gmail.com', 5, N'Sản phẩm rất đẹp và chất lượng tốt!', 'https://i.pravatar.cc/150?img=1'),
(2, 3, N'Trần Thị B', 'user2@gmail.com', 5, N'Áo len rất ấm và đẹp, giao hàng nhanh', 'https://i.pravatar.cc/150?img=2'),
(8, 2, N'Nguyễn Văn A', 'user1@gmail.com', 4, N'Blazer đẹp nhưng hơi chật', 'https://i.pravatar.cc/150?img=1');
GO

-- =============================================
-- 8. Insert Sample Vouchers
-- =============================================
INSERT INTO Vouchers (code, description, discount_type, discount_value, min_order_value, max_discount, usage_limit, start_date, end_date) VALUES
('TET2026', N'Giảm 10% cho đơn hàng Tết', 'percentage', 10, 500000, 100000, 100, '2026-01-01', '2026-02-28'),
('WELCOME50', N'Giảm 50k cho khách hàng mới', 'fixed', 50000, 300000, NULL, 50, '2026-01-01', '2026-12-31'),
('FREESHIP', N'Miễn phí vận chuyển', 'fixed', 30000, 200000, NULL, 200, '2026-01-01', '2026-12-31');
GO

-- =============================================
-- 9. Insert Order Status History
-- =============================================
INSERT INTO OrderStatusHistory (order_id, status, notes, created_by) VALUES
(1, 'pending', N'Đơn hàng mới được tạo', 2),
(1, 'confirmed', N'Đã xác nhận đơn hàng', 1),
(1, 'shipping', N'Đang giao hàng', 1),
(1, 'completed', N'Giao hàng thành công', 1),

(2, 'pending', N'Đơn hàng mới được tạo', 2),
(2, 'confirmed', N'Đã xác nhận đơn hàng', 1),
(2, 'shipping', N'Đang giao hàng', 1),

(3, 'pending', N'Đơn hàng mới được tạo', 3);
GO

PRINT 'Sample data inserted successfully!';

-- Display statistics
DECLARE @UserCount INT, @ProductCount INT, @OrderCount INT;
SELECT @UserCount = COUNT(*) FROM Users;
SELECT @ProductCount = COUNT(*) FROM Products;
SELECT @OrderCount = COUNT(*) FROM Orders;

PRINT 'Total Users: ' + CAST(@UserCount AS VARCHAR);
PRINT 'Total Products: ' + CAST(@ProductCount AS VARCHAR);
PRINT 'Total Orders: ' + CAST(@OrderCount AS VARCHAR);
GO
