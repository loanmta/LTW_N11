from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, CartItemViewSet, OrderViewSet,
    ReviewViewSet, UserProfileViewSet, CategoryViewSet, VoucherViewSet
)
from .auth_views import register, login, logout, check_auth, profile, change_password
from .admin_views import (
    # Category management
    admin_categories, admin_category_detail, admin_category_toggle,
    # Product management
    admin_products, admin_product_detail, admin_product_toggle, admin_product_stock,
    # Revenue reports
    admin_report_overview, admin_report_revenue_by_period,
    admin_report_top_products, admin_report_by_category,
    admin_report_orders, admin_report_customers,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'cart', CartItemViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'vouchers', VoucherViewSet, basename='voucher')

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/logout/', logout, name='logout'),
    path('auth/check/', check_auth, name='check_auth'),
    path('auth/profile/', profile, name='profile'),
    path('auth/change-password/', change_password, name='change_password'),

    # =========================================
    # Admin - Quản lý danh mục
    # =========================================
    path('admin/categories/', admin_categories, name='admin_categories'),
    path('admin/categories/<int:pk>/', admin_category_detail, name='admin_category_detail'),
    path('admin/categories/<int:pk>/toggle/', admin_category_toggle, name='admin_category_toggle'),

    # =========================================
    # Admin - Quản lý sản phẩm
    # =========================================
    path('admin/products/', admin_products, name='admin_products'),
    path('admin/products/<int:pk>/', admin_product_detail, name='admin_product_detail'),
    path('admin/products/<int:pk>/toggle/', admin_product_toggle, name='admin_product_toggle'),
    path('admin/products/<int:pk>/stock/', admin_product_stock, name='admin_product_stock'),

    # =========================================
    # Admin - Báo cáo doanh thu
    # =========================================
    path('admin/reports/overview/', admin_report_overview, name='admin_report_overview'),
    path('admin/reports/revenue/by_period/', admin_report_revenue_by_period, name='admin_report_revenue_by_period'),
    path('admin/reports/top_products/', admin_report_top_products, name='admin_report_top_products'),
    path('admin/reports/by_category/', admin_report_by_category, name='admin_report_by_category'),
    path('admin/reports/orders/', admin_report_orders, name='admin_report_orders'),
    path('admin/reports/customers/', admin_report_customers, name='admin_report_customers'),

    # Other API endpoints
    path('', include(router.urls)),
]
