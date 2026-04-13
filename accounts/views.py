from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages

# --- XỬ LÝ ĐĂNG NHẬP VÀ PHÂN LUỒNG ---
def login_view(request):
    # Nếu đã đăng nhập rồi thì đá ra trang chủ luôn, không cho đăng nhập lại
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        # 1. Hứng dữ liệu từ form
        email = request.POST.get('email')
        password = request.POST.get('password')

        # Kiểm tra nếu bỏ trống
        if not email or not password:
            messages.error(request, "Vui lòng nhập đầy đủ Email và Mật khẩu!")
            return render(request, "accounts/login.html")

        # 2. Kiểm tra tài khoản trong Database
        # Vì lúc đăng ký gán username = email nên authenticate dùng username=email
        user = authenticate(request, username=email, password=password)

        if user is not None:
            # 3. Đăng nhập thành công -> Lưu phiên đăng nhập (Session)
            login(request, user)

            # 4. PHÂN LUỒNG: Admin/Staff vào Dashboard, Khách vào Home
            if user.is_superuser or user.is_staff:
                messages.success(request, f"Chào mừng Quản trị viên {user.first_name}!")
                return redirect('dashboard')
            else:
                messages.success(request, f"Chào mừng {user.first_name} quay trở lại!")
                return redirect('home')
        else:
            # Đăng nhập thất bại
            messages.error(request, "Email hoặc mật khẩu không chính xác!")
            return redirect('login')

    return render(request, "accounts/login.html")


# --- XỬ LÝ ĐĂNG KÝ (Dùng Email làm Username) ---
def register_view(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        # 1. Hứng dữ liệu
        fullname = request.POST.get('fullname')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        # 2. Kiểm tra các điều kiện cơ bản
        if not all([fullname, email, password, confirm_password]):
            messages.error(request, "Vui lòng điền đầy đủ tất cả thông tin!")
            return render(request, "accounts/register.html")

        if password != confirm_password:
            messages.error(request, "Mật khẩu xác nhận không khớp!")
            return render(request, "accounts/register.html")

        if User.objects.filter(username=email).exists():
            messages.error(request, "Email này đã được sử dụng. Vui lòng chọn email khác!")
            return render(request, "accounts/register.html")

        # 3. Lưu vào Database
        try:
            # Gán username bằng email để đăng nhập bằng email
            user = User.objects.create_user(username=email, email=email, password=password)
            user.first_name = fullname # Lưu họ tên vào trường first_name của Django
            user.save()

            messages.success(request, "Đăng ký thành công! Mời bạn đăng nhập.")
            return redirect('login')
        except Exception as e:
            messages.error(request, f"Có lỗi xảy ra: {e}")
            return render(request, "accounts/register.html")

    return render(request, "accounts/register.html")


# --- XỬ LÝ ĐĂNG XUẤT ---
def logout_view(request):
    logout(request)
    messages.info(request, "Bạn đã đăng xuất khỏi hệ thống.")
    return redirect('login')