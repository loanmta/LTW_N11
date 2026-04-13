"""
Authentication Views

Module này xử lý tất cả các chức năng liên quan đến authentication:
- Đăng ký tài khoản mới
- Đăng nhập/Đăng xuất
- Kiểm tra trạng thái đăng nhập
- Quản lý profile
- Đổi mật khẩu

Sử dụng Django session để lưu trữ thông tin user
"""
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password, check_password
from django.db import connection
from cart.models import CustomUser, UserProfile
from datetime import datetime


@api_view(['POST'])
def register(request):
    """
    Đăng ký tài khoản mới
    
    POST /api/auth/register/
    Body: {
        "email": "user@example.com",
        "password": "password123",
        "full_name": "Nguyễn Văn A",
        "phone": "0123456789" (optional)
    }
    
    Returns:
        - 201: Đăng ký thành công
        - 400: Thiếu thông tin hoặc email đã tồn tại
        - 500: Lỗi server
    """
    # Lấy dữ liệu từ request
    email = request.data.get('email')
    password = request.data.get('password')
    full_name = request.data.get('full_name')
    phone = request.data.get('phone', '')
    
    # Validate: Kiểm tra các trường bắt buộc
    if not email or not password or not full_name:
        return Response({
            'success': False,
            'message': 'Vui lòng điền đầy đủ thông tin'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Kiểm tra email đã tồn tại chưa
    if CustomUser.objects.filter(email=email).exists():
        return Response({
            'success': False,
            'message': 'Email đã được sử dụng'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Tạo user mới sử dụng Django ORM
    try:
        user = CustomUser.objects.create(
            email=email,
            password_hash=make_password(password),  # Hash password trước khi lưu
            full_name=full_name,
            phone=phone,
            role='user',  # Mặc định là user, không phải admin
            is_active=True
        )
        
        return Response({
            'success': True,
            'message': 'Đăng ký thành công',
            'user': {
                'user_id': user.user_id,
                'email': user.email,
                'full_name': user.full_name,
                'phone': user.phone,
                'role': user.role
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def login(request):
    """
    Đăng nhập
    
    POST /api/auth/login/
    Body: {
        "email": "user@example.com",
        "password": "password123"
    }
    
    Returns:
        - 200: Đăng nhập thành công, lưu thông tin vào session
        - 400: Thiếu email hoặc password
        - 401: Mật khẩu không đúng
        - 404: Email không tồn tại
    """
    email = request.data.get('email')
    password = request.data.get('password')
    
    # Validate input
    if not email or not password:
        return Response({
            'success': False,
            'message': 'Vui lòng nhập email và mật khẩu'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Tìm user theo email và is_active=True
        user = CustomUser.objects.get(email=email, is_active=True)
        
        # Kiểm tra password
        if check_password(password, user.password_hash):
            # Lưu thông tin user vào session
            request.session['user_id'] = user.user_id
            request.session['email'] = user.email
            request.session['full_name'] = user.full_name
            request.session['role'] = user.role
            
            return Response({
                'success': True,
                'message': 'Đăng nhập thành công',
                'user': {
                    'user_id': user.user_id,
                    'email': user.email,
                    'full_name': user.full_name,
                    'phone': user.phone,
                    'role': user.role
                }
            })
        else:
            return Response({
                'success': False,
                'message': 'Mật khẩu không đúng'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except CustomUser.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Email không tồn tại'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def logout(request):
    """
    Đăng xuất
    
    POST /api/auth/logout/
    
    Xóa toàn bộ session data
    """
    request.session.flush()  # Xóa tất cả session data
    return Response({
        'success': True,
        'message': 'Đăng xuất thành công'
    })


@api_view(['GET'])
def check_auth(request):
    """
    Kiểm tra trạng thái đăng nhập
    
    GET /api/auth/check/
    
    Returns:
        - authenticated: true/false
        - user: thông tin user nếu đã đăng nhập
    """
    user_id = request.session.get('user_id')
    
    if user_id:
        try:
            # Lấy thông tin user từ database
            user = CustomUser.objects.get(user_id=user_id, is_active=True)
            return Response({
                'authenticated': True,
                'user': {
                    'user_id': user.user_id,
                    'email': user.email,
                    'full_name': user.full_name,
                    'phone': user.phone,
                    'role': user.role
                }
            })
        except CustomUser.DoesNotExist:
            # User không tồn tại, xóa session
            request.session.flush()
            return Response({
                'authenticated': False
            })
    
    return Response({
        'authenticated': False
    })


@api_view(['GET', 'PUT'])
def profile(request):
    """
    Lấy hoặc cập nhật thông tin profile
    
    GET /api/auth/profile/
    - Lấy thông tin profile của user hiện tại
    
    PUT /api/auth/profile/
    Body: {
        "full_name": "Nguyễn Văn A",
        "phone": "0123456789",
        "address": "123 Đường ABC",
        "city": "Hà Nội",
        "district": "Quận 1"
    }
    - Cập nhật thông tin profile
    
    Returns:
        - 200: Thành công
        - 401: Chưa đăng nhập
        - 404: User không tồn tại
    """
    user_id = request.session.get('user_id')
    
    # Kiểm tra đã đăng nhập chưa
    if not user_id:
        return Response({
            'success': False,
            'message': 'Chưa đăng nhập'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        user = CustomUser.objects.get(user_id=user_id, is_active=True)
        
        if request.method == 'GET':
            # GET: Lấy thông tin profile
            try:
                # Lấy địa chỉ từ UserProfile
                user_profile = UserProfile.objects.get(user=user)
                address = user_profile.address
                city = user_profile.city
                district = user_profile.district
            except UserProfile.DoesNotExist:
                # Chưa có UserProfile
                address = None
                city = None
                district = None
            
            return Response({
                'success': True,
                'user': {
                    'user_id': user.user_id,
                    'email': user.email,
                    'full_name': user.full_name,
                    'phone': user.phone,
                    'role': user.role,
                    'address': address,
                    'city': city,
                    'district': district
                }
            })
        
        elif request.method == 'PUT':
            # PUT: Cập nhật profile
            full_name = request.data.get('full_name')
            phone = request.data.get('phone')
            address = request.data.get('address')
            city = request.data.get('city')
            district = request.data.get('district')
            
            # Validate: Họ tên là bắt buộc
            if not full_name:
                return Response({
                    'success': False,
                    'message': 'Vui lòng nhập họ tên'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Cập nhật thông tin user
            user.full_name = full_name
            user.phone = phone
            user.save()
            
            # Cập nhật hoặc tạo UserProfile
            user_profile, created = UserProfile.objects.get_or_create(user=user)
            user_profile.address = address
            user_profile.city = city
            user_profile.district = district
            user_profile.save()
            
            # Cập nhật session
            request.session['full_name'] = full_name
            
            return Response({
                'success': True,
                'message': 'Cập nhật thông tin thành công',
                'user': {
                    'user_id': user_id,
                    'email': user.email,
                    'full_name': full_name,
                    'phone': phone,
                    'role': user.role,
                    'address': address,
                    'city': city,
                    'district': district
                }
            })
            
    except CustomUser.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Người dùng không tồn tại'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def change_password(request):
    """
    Đổi mật khẩu
    
    POST /api/auth/change-password/
    Body: {
        "current_password": "old_password",
        "new_password": "new_password",
        "confirm_password": "new_password"
    }
    
    Returns:
        - 200: Đổi mật khẩu thành công
        - 400: Validation error
        - 401: Chưa đăng nhập
        - 404: User không tồn tại
    """
    user_id = request.session.get('user_id')
    
    # Kiểm tra đã đăng nhập chưa
    if not user_id:
        return Response({
            'success': False,
            'message': 'Chưa đăng nhập'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Lấy dữ liệu từ request
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    # Validate: Kiểm tra đầy đủ thông tin
    if not all([current_password, new_password, confirm_password]):
        return Response({
            'success': False,
            'message': 'Vui lòng điền đầy đủ thông tin'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate: Mật khẩu mới phải khớp
    if new_password != confirm_password:
        return Response({
            'success': False,
            'message': 'Mật khẩu mới không khớp'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate: Mật khẩu phải có ít nhất 6 ký tự
    if len(new_password) < 6:
        return Response({
            'success': False,
            'message': 'Mật khẩu mới phải có ít nhất 6 ký tự'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = CustomUser.objects.get(user_id=user_id, is_active=True)
        
        # Kiểm tra mật khẩu hiện tại
        if not check_password(current_password, user.password_hash):
            return Response({
                'success': False,
                'message': 'Mật khẩu hiện tại không đúng'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Cập nhật mật khẩu mới
        user.password_hash = make_password(new_password)
        user.updated_at = datetime.now()
        user.save()
        
        return Response({
            'success': True,
            'message': 'Đổi mật khẩu thành công'
        })
        
    except CustomUser.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Người dùng không tồn tại'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)