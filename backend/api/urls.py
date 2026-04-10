from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, CartItemViewSet, OrderViewSet,
    ReviewViewSet, UserProfileViewSet, CategoryViewSet, VoucherViewSet
)
from .auth_views import register, login, logout, check_auth, profile, change_password

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
    
    # Other API endpoints
    path('', include(router.urls)),
]
