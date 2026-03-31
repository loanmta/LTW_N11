# Hướng dẫn chạy giao diện Giỏ hàng

## Cài đặt và chạy

1. Kích hoạt môi trường ảo (nếu có):
```bash
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
```

2. Chạy migrations:
```bash
python manage.py makemigrations cart
python manage.py migrate
```

3. **QUAN TRỌNG** - Tạo dữ liệu mẫu:
```bash
python manage.py load_sample_data
```
Lệnh này sẽ tự động:
- Tạo user test (testuser/testpass123)
- Tạo 4 sản phẩm với ảnh thật từ Unsplash
- Thêm 3 sản phẩm vào giỏ hàng

4. Chạy server:
```bash
python manage.py runserver
```

5. Truy cập trực tiếp (không cần đăng nhập):
   - Sản phẩm: http://127.0.0.1:8000/cart/products/
   - Chi tiết SP: http://127.0.0.1:8000/cart/products/1/
   - Giỏ hàng: http://127.0.0.1:8000/cart/
   - Đặt hàng: http://127.0.0.1:8000/cart/checkout/
   - Demo Popup: http://127.0.0.1:8000/cart/popup-demo/

**Lưu ý**: Trang sẽ hiển thị dữ liệu mẫu ngay cả khi chưa đăng nhập!

## Hình ảnh sản phẩm

### Hiện tại
Code đang sử dụng **ảnh thật từ Unsplash** (thời trang):
- ✅ Ảnh chất lượng cao
- ✅ Không cần tải về
- ✅ Hoạt động ngay lập tức
- ⚠️ Cần internet

### Thêm ảnh local của bạn
1. Đặt ảnh vào: `cart/static/cart/images/`
2. Cập nhật trong admin hoặc database
3. Xem hướng dẫn chi tiết: `IMAGES_GUIDE.md`

## Màu sắc sử dụng

- Màu chủ đạo (Đỏ thương hiệu): #D32F2F
- Màu phụ (Hồng nhạt): #FEF2F2
- Màu văn bản chính (Xám đậm): #333333
- Màu văn bản phụ (Xám trung tính): #8A8A8A
- Màu nền: #FFFFFF (Trắng)

## Tính năng

### Hệ thống Giỏ hàng
- Thêm sản phẩm vào giỏ qua API (AJAX)
- Lưu giỏ hàng trong session (không cần đăng nhập)
- Lưu giỏ hàng trong database (khi đã đăng nhập)
- Cập nhật số lượng sản phẩm realtime
- Badge giỏ hàng tự động cập nhật
- Toast popup "Thành công" khi thêm vào giỏ

### Trang Sản phẩm (/cart/products/)
- Grid layout 4 cột responsive
- Badge "NEW ARRIVAL" cho sản phẩm mới
- Bộ lọc: Danh mục, Kích thước, Màu sắc, Giá
- Tìm kiếm sản phẩm (realtime search sau 0.5s)
- Tìm kiếm từ header hoặc filter bar
- Empty state khi không tìm thấy kết quả với:
  - Illustration kính lúp và hộp buồn
  - Thông báo "Rất tiếc, không tìm thấy sản phẩm!"
  - Hiển thị từ khóa đã tìm
  - Nút "Quay về trang trước"
- Nút thêm nhanh vào giỏ hàng → Hiển thị toast popup "Thành công"
- Toast popup tự động ẩn sau 3 giây
- Hover effect với animation
- Nút "Xem thêm" để load thêm sản phẩm
- Click vào sản phẩm để xem chi tiết

### Trang Chi tiết sản phẩm (/cart/products/<id>/)
- Gallery ảnh với 3 ảnh thumbnail
- Thông tin sản phẩm: Tên, giá, giảm giá
- Chọn màu sắc (2 màu với preview)
- Chọn size (S, M, L, XL)
- Link hướng dẫn chọn size
- Nút "Mua ngay" → Chuyển đến trang checkout với chỉ 1 sản phẩm đã chọn
- Nút "Thêm vào giỏ" → Gọi API thêm vào giỏ → Hiển thị toast popup
- Badge giỏ hàng tự động tăng khi thêm sản phẩm
- Mô tả chi tiết sản phẩm
- Đánh giá của khách hàng với avatar, tên, nội dung
- Rating 4.9/5 sao với 125 đánh giá

### Trang Giỏ hàng (/cart/)
- Hiển thị danh sách sản phẩm trong giỏ hàng
- Checkbox chọn sản phẩm
- Điều chỉnh số lượng (+/-)
- Xóa sản phẩm
- Tóm tắt đơn hàng với tính toán tự động
- Nhập mã giảm giá/voucher
- Responsive design

### Trang Đặt hàng (/cart/checkout/)
- Thông tin người nhận được lưu tự động:
  - Hiển thị thông tin cứng (tên, SĐT, địa chỉ)
  - Nút "Chỉnh sửa" với icon bút để sửa thông tin
  - Chế độ edit với form nhập liệu
  - Nút "Lưu thông tin" và "Hủy"
  - Thông tin lưu vào database (đã đăng nhập) hoặc session (chưa đăng nhập)
  - Không cần nhập lại mỗi lần đặt hàng
- Hiển thị sản phẩm đã chọn với tùy chọn màu/size
- Điều chỉnh số lượng và xóa sản phẩm
- Nhập mã giảm giá
- Chọn phương thức thanh toán (COD hoặc mã QR)
- Tóm tắt chi tiết đơn hàng
- Nút Đặt hàng và Hủy bỏ

### Popup Thanh Toán
- Popup 1 (QR Code): Hiển thị khi chọn thanh toán qua mã QR
  - Mã QR để quét
  - Thông tin chuyển khoản (số tiền, nội dung, ngân hàng)
  - Nút "Đã hoàn tất thanh toán" và "Quay lại trang chủ"
  
- Popup 2 (Thành công): Hiển thị sau khi đặt hàng
  - Icon thành công
  - Mã đơn hàng và tổng tiền
  - Nút "Xem đơn hàng" và "Quay về trang chủ"

### Logic Thanh Toán
- Nếu chọn "Thanh toán khi nhận hàng" → Hiển thị popup thành công ngay
- Nếu chọn "Thanh toán qua mã QR" → Hiển thị popup QR → Nhấn "Đã hoàn tất thanh toán" → Hiển thị popup thành công
