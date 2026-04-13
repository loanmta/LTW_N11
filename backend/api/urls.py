"""
API URLs Configuration

Tổ chức các API endpoints:
- /api/dashboard/stats/: Thống kê dashboard
- /api/auth/*: Authentication (login, register, logout, etc.)
- /api/categories/: Quản lý danh mục
- /api/products/: Quản lý sản phẩm
- /api/cart/: Quản lý giỏ hàng
- /api/orders/: Quản lý đơn hàng
- /api/reviews/: Quản lý đánh giá
- /api/profile/: Quản lý thông tin cá nhân
- /api/vouchers/: Quản lý mã giảm giá
- /api/users/: Quản lý người dùng (admin)
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, CartItemViewSet, OrderViewSet,
    ReviewViewSet, UserProfileViewSet, CategoryViewSet, UserViewSet,
    dashboard_stats
)
from .auth_views import register, login, logout, check_auth, profile, change_password

# Router cho các ViewSets (tự động tạo CRUD endpoints)
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'cart', CartItemViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # ===== DASHBOARD =====
    # GET /api/dashboard/stats/ - Lấy thống kê cho dashboard admin
    path('dashboard/stats/', dashboard_stats, name='dashboard_stats'),
    
    # ===== AUTHENTICATION =====
    # POST /api/auth/register/ - Đăng ký tài khoản mới
    path('auth/register/', register, name='register'),
    
    # POST /api/auth/login/ - Đăng nhập
    path('auth/login/', login, name='login'),
    
    # POST /api/auth/logout/ - Đăng xuất
    path('auth/logout/', logout, name='logout'),
    
    # GET /api/auth/check/ - Kiểm tra trạng thái đăng nhập
    path('auth/check/', check_auth, name='check_auth'),
    
    # GET/PUT /api/auth/profile/ - Lấy/cập nhật thông tin profile
    path('auth/profile/', profile, name='profile'),
    
    # POST /api/auth/change-password/ - Đổi mật khẩu
    path('auth/change-password/', change_password, name='change_password'),
    
    # ===== ROUTER ENDPOINTS =====
    # Bao gồm tất cả endpoints từ router (categories, products, cart, orders, etc.)
    path('', include(router.urls)),
]
