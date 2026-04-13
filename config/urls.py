"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from cart.views_frontend import serve_frontend, serve_static_file

urlpatterns = [
    # Static files (must be BEFORE admin to avoid conflict)
    re_path(r'^assets/(?P<path>.*)$', serve_static_file, name='assets'),
    re_path(r'^static-admin/(?P<path>.*)$', serve_static_file, {'admin_assets': True}, name='admin_assets'),
    
    # Django admin
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include('backend.api.urls')),
    
    # Frontend pages
    path('', serve_frontend, name='home'),
    path('login.html', serve_frontend, {'path': 'login.html'}, name='login'),
    path('products.html', serve_frontend, {'path': 'products.html'}, name='products'),
    path('cart.html', serve_frontend, {'path': 'cart.html'}, name='cart'),
    path('checkout.html', serve_frontend, {'path': 'checkout.html'}, name='checkout'),
    path('orders.html', serve_frontend, {'path': 'orders.html'}, name='orders'),
    path('order_detail.html', serve_frontend, {'path': 'order_detail.html'}, name='order_detail'),
    path('product_detail.html', serve_frontend, {'path': 'product_detail.html'}, name='product_detail'),
    path('profile.html', serve_frontend, {'path': 'profile.html'}, name='profile'),
    
    # Admin dashboard (custom) - dùng /manage/ để tránh xung đột với Django Admin /admin/
    path('dashboard/', serve_frontend, {'path': 'admin_dashboard.html'}, name='admin_dashboard'),
    path('manage/orders.html', serve_frontend, {'path': 'admin_orders.html'}, name='admin_orders'),
    path('manage/order_detail.html', serve_frontend, {'path': 'admin_order_detail.html'}, name='admin_order_detail'),
    path('manage/customers.html', serve_frontend, {'path': 'admin_customers.html'}, name='admin_customers'),
    path('manage/products.html', serve_frontend, {'path': 'admin_products.html'}, name='admin_products'),
    path('manage/reports.html', serve_frontend, {'path': 'admin_reports.html'}, name='admin_reports'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
