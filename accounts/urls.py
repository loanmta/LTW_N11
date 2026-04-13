from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # Luồng chính: Đăng nhập - Đăng ký - Đăng xuất
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),

    # Luồng Quên mật khẩu (Dùng hệ thống sẵn có của Django)
    # 1. Trang nhập Email để nhận link reset
    path('password_reset/',
         auth_views.PasswordResetView.as_view(template_name='accounts/password_reset.html'),
         name='password_reset'),

    # 2. Trang thông báo đã gửi mail thành công
    path('password_reset/done/',
         auth_views.PasswordResetDoneView.as_view(template_name='accounts/password_reset_done.html'),
         name='password_reset_done'),

    # 3. Trang thực hiện đặt mật khẩu mới (Người dùng bấm từ link trong mail)
    path('reset/<uidb64>/<token>/',
         auth_views.PasswordResetConfirmView.as_view(template_name='accounts/password_reset_confirm.html'),
         name='password_reset_confirm'),

    # 4. Trang thông báo hoàn tất đổi mật khẩu
    path('reset/done/',
         auth_views.PasswordResetCompleteView.as_view(template_name='accounts/password_reset_complete.html'),
         name='password_reset_complete'),
]