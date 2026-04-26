"""
URL configuration for config project.

Cấu trúc URL:
- /user/assets/: Static files của user (CSS, JS, images)
- /admin/assets/: Static files của admin panel
- /admin/pages/: Các trang quản trị
- /admin/: Django admin (quản lý database)
- /api/: REST API endpoints
- /: Các trang user (home, products, cart, etc.)
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from cart.views_frontend import serve_frontend, serve_static_file

urlpatterns = [
    # ===== STATIC FILES =====
    # Serve user static files (CSS, JS, images)
    re_path(r'^user/assets/(?P<path>.*)', serve_static_file, name='user_assets'),
    
    # Serve admin static files (CSS, JS)
    re_path(r'^admin/assets/(?P<path>.*)', serve_static_file, {'admin_assets': True}, name='admin_assets'),
    
    # ===== ADMIN PAGES =====
    # Trang quản lý sản phẩm
    path('admin/pages/products.html', serve_frontend, {'path': 'admin/pages/products.html'}, name='admin_products'),
    path('admin/pages/product-form.html', serve_frontend, {'path': 'admin/pages/product-form.html'}, name='admin_product_form'),
    
    # Trang quản lý danh mục
    path('admin/pages/categories.html', serve_frontend, {'path': 'admin/pages/categories.html'}, name='admin_categories'),
    
    # Trang quản lý đơn hàng
    path('admin/pages/orders.html', serve_frontend, {'path': 'admin/pages/orders.html'}, name='admin_orders'),
    path('admin/pages/order-detail.html', serve_frontend, {'path': 'admin/pages/order-detail.html'}, name='admin_order_detail'),
    
    # Trang quản lý khách hàng
    path('admin/pages/customers.html', serve_frontend, {'path': 'admin/pages/customers.html'}, name='admin_customers'),
    
    # Trang báo cáo và dashboard
    path('admin/pages/reports.html', serve_frontend, {'path': 'admin/pages/reports.html'}, name='admin_reports'),
    path('admin/pages/dashboard.html', serve_frontend, {'path': 'admin/pages/dashboard.html'}, name='admin_dashboard_page'),
    
    # Trang đăng nhập admin
    path('admin/pages/login.html', serve_frontend, {'path': 'admin/pages/login.html'}, name='admin_login'),
    
    # ===== DJANGO ADMIN =====
    # Django admin mặc định (quản lý database trực tiếp)
    path('admin/', admin.site.urls),
    
    # ===== API ENDPOINTS =====
    # Tất cả API endpoints (products, orders, cart, auth, etc.)
    path('api/', include('backend.api.urls')),
    
    # ===== USER PAGES =====
    # Trang chủ
    path('', serve_frontend, {'path': 'user/pages/index.html'}, name='home'),
    
    # Trang đăng nhập/đăng ký
    path('login', serve_frontend, {'path': 'user/pages/login.html'}, name='login_short'),
    path('login.html', serve_frontend, {'path': 'user/pages/login.html'}, name='login'),
    
    # Trang sản phẩm
    path('products.html', serve_frontend, {'path': 'user/pages/products.html'}, name='products'),
    path('product_detail.html', serve_frontend, {'path': 'user/pages/product_detail.html'}, name='product_detail'),
    
    # Trang giỏ hàng và thanh toán
    path('cart.html', serve_frontend, {'path': 'user/pages/cart.html'}, name='cart'),
    path('checkout.html', serve_frontend, {'path': 'user/pages/checkout.html'}, name='checkout'),
    
    # Trang đơn hàng
    path('orders.html', serve_frontend, {'path': 'user/pages/orders.html'}, name='orders'),
    path('order_detail.html', serve_frontend, {'path': 'user/pages/order_detail.html'}, name='order_detail'),
    
    # Trang thông tin cá nhân
    path('profile.html', serve_frontend, {'path': 'user/pages/profile.html'}, name='profile'),
]

# Serve media files trong môi trường development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
