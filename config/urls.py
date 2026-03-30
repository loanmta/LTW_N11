from django.contrib import admin
from django.urls import path, include
from django.shortcuts import render
from django.http import HttpResponse


# 1. Hàm gọi giao diện Dashboard siêu đẹp bạn vừa làm
def dummy_dashboard(request):
    return render(request, 'accounts/dashboard.html')


# 2. Hàm tạm cho Trang chủ khách hàng (để không bị lỗi)
def dummy_home(request):
    return render(request, 'accounts/home.html')

# 3. Bản đồ đường đi của toàn bộ trang web
urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),  # Đường vào khu vực đăng nhập của bạn
    path('users/', include('users.urls')), # App quản lý cho Khách hàng

    # --- ĐÂY LÀ 2 DÒNG ĐỂ SỬA CÁI LỖI VÀNG KHÈ KHÔNG TÌM THẤY TRANG ---
    path('dashboard/', dummy_dashboard, name='dashboard'),
    path('', dummy_home, name='home'),
]