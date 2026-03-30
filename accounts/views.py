from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages


# --- XỬ LÝ ĐĂNG NHẬP VÀ PHÂN LUỒNG ---
def login_view(request):
    if request.method == 'POST':
        # 1. Hứng dữ liệu từ form
        email_input = request.POST.get('email')
        password = request.POST.get('password')

        # 2. Xử lý đăng nhập thông minh bằng Email
        try:
            # Tìm xem có user nào sở hữu cái email này không
            user_obj = User.objects.get(email=email_input)
            # Nếu có, lấy username thật của người đó để authenticate
            user = authenticate(request, username=user_obj.username, password=password)
        except User.DoesNotExist:
            # Trường hợp khách nhập Username vào ô Email (như cách 1 ở trên) thì vẫn cho qua
            user = authenticate(request, username=email_input, password=password)

        if user is not None:
            # 3. Đăng nhập thành công -> Lưu phiên đăng nhập
            login(request, user)

            # 4. PHÂN LUỒNG ADMIN VÀ KHÁCH HÀNG
            if user.is_superuser or user.is_staff:
                # Nếu là Chủ shop -> Bay thẳng vào màn hình Admin Dashboard
                return redirect('dashboard')
            else:
                # Nếu là Khách -> Bay ra màn hình mua sắm Trang chủ
                return redirect('home')
        else:
            # Đăng nhập thất bại
            messages.error(request, "Email hoặc mật khẩu không chính xác!")
            return redirect('login')

    # Nếu là GET request thì hiện form đăng nhập
    return render(request, "accounts/login.html")


# --- XỬ LÝ ĐĂNG KÝ (Giữ nguyên code chuẩn của Rin) ---
def register_view(request):
    if request.method == 'POST':
        # 1. Hứng dữ liệu từ các ô input
        fullname = request.POST.get('fullname')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        # 2. Kiểm tra mật khẩu khớp nhau
        if password != confirm_password:
            messages.error(request, "Mật khẩu xác nhận không khớp!")
            return redirect('register')

        # 3. Kiểm tra Email trùng lặp
        if User.objects.filter(username=email).exists():
            messages.error(request, "Email này đã được sử dụng. Vui lòng chọn email khác!")
            return redirect('register')

        # 4. Lưu vào Database
        # Mẹo: Gán username bằng email để khách hàng đăng nhập bằng email cho tiện
        user = User.objects.create_user(username=email, email=email, password=password)
        user.first_name = fullname
        user.save()

        # Báo thành công và đá về trang Đăng nhập
        messages.success(request, "Đăng ký thành công! Vui lòng đăng nhập.")
        return redirect('login')

    return render(request, "accounts/register.html")


# --- XỬ LÝ ĐĂNG XUẤT (Giữ nguyên code chuẩn của Rin) ---
def logout_view(request):
    logout(request)
    return redirect('login')