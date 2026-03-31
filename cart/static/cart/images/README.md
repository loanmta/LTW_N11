# Thư mục hình ảnh sản phẩm

## Cách thêm hình ảnh

1. Đặt file ảnh vào thư mục này (ví dụ: ao-so-mi.jpg, quan-tay.jpg)

2. Cập nhật trong admin hoặc code:
   - Trong admin: Chỉnh sửa Product → Image field → Nhập: `/static/cart/images/ao-so-mi.jpg`
   - Trong code: `image='/static/cart/images/ao-so-mi.jpg'`

## Định dạng khuyến nghị

- Kích thước: 400x500px (tỷ lệ 4:5)
- Format: JPG hoặc PNG
- Dung lượng: < 500KB

## Ảnh mẫu hiện tại

Code đang sử dụng ảnh từ Unsplash (online), bạn có thể thay thế bằng ảnh local bằng cách:

```python
# Trong models.py hoặc admin
product.image = '/static/cart/images/ten-anh.jpg'
```

Hoặc sử dụng Django ImageField để upload tự động (cần cài Pillow):
```bash
pip install Pillow
```

Sau đó sửa models.py:
```python
image = models.ImageField(upload_to='products/', blank=True)
```
