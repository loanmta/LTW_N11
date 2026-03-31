# Hướng dẫn quản lý hình ảnh sản phẩm

## Hiện tại

Code đang sử dụng **ảnh từ Unsplash** (miễn phí, online):
- ✅ Không cần tải về
- ✅ Chất lượng cao
- ✅ Hoạt động ngay
- ⚠️ Cần internet để hiển thị

## Cách 1: Thêm ảnh local (đơn giản)

### Bước 1: Chuẩn bị ảnh
- Đặt file ảnh vào: `cart/static/cart/images/`
- Ví dụ: `ao-so-mi.jpg`, `quan-tay.jpg`

### Bước 2: Cập nhật trong code

**Trong views.py (dữ liệu mẫu):**
```python
SampleProduct('Áo Sơ Mi', 'Trắng', 'M', 650000, 
             '/static/cart/images/ao-so-mi.jpg')
```

**Trong load_sample_data.py:**
```python
'image': '/static/cart/images/ao-so-mi.jpg'
```

### Bước 3: Chạy lại
```bash
python manage.py collectstatic --noinput
python manage.py runserver
```

## Cách 2: Upload ảnh qua Admin (nâng cao)

### Bước 1: Cài đặt Pillow
```bash
pip install Pillow
```

### Bước 2: Cập nhật models.py
```python
from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    color = models.CharField(max_length=100)
    size = models.CharField(max_length=10)
    price = models.DecimalField(max_digits=10, decimal_places=0)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    
    def __str__(self):
        return self.name
```

### Bước 3: Cập nhật settings.py
```python
# Thêm vào cuối file
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

### Bước 4: Cập nhật urls.py (config/urls.py)
```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... các url khác
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### Bước 5: Chạy migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Bước 6: Upload qua Admin
1. Truy cập: http://127.0.0.1:8000/admin/
2. Vào Products
3. Chọn sản phẩm → Upload ảnh
4. Ảnh sẽ được lưu tự động vào `media/products/`

## Cách 3: Sử dụng CDN (khuyến nghị cho production)

Upload ảnh lên:
- Cloudinary (miễn phí 25GB)
- AWS S3
- Google Cloud Storage
- Imgur

Sau đó dùng URL từ CDN:
```python
'image': 'https://res.cloudinary.com/your-cloud/image/upload/v1/ao-so-mi.jpg'
```

## Kích thước ảnh khuyến nghị

- **Giỏ hàng**: 80x100px (hiển thị nhỏ)
- **Checkout**: 100x120px (hiển thị vừa)
- **Chi tiết sản phẩm**: 400x500px (hiển thị lớn)
- **Gốc**: 800x1000px (lưu trữ chất lượng cao)

## Tối ưu ảnh

Sử dụng công cụ:
- TinyPNG: https://tinypng.com/
- Squoosh: https://squoosh.app/
- ImageOptim (Mac)

Hoặc tự động với Pillow:
```python
from PIL import Image

def optimize_image(image_path):
    img = Image.open(image_path)
    img = img.resize((400, 500), Image.LANCZOS)
    img.save(image_path, optimize=True, quality=85)
```
