from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password, check_password
from cart.models import CustomUser


@api_view(['POST'])
def register(request):
    """Đăng ký tài khoản mới"""
    email = request.data.get('email')
    password = request.data.get('password')
    full_name = request.data.get('full_name')
    phone = request.data.get('phone', '')

    if not email or not password or not full_name:
        return Response({
            'success': False,
            'message': 'Vui lòng điền đầy đủ thông tin'
        }, status=status.HTTP_400_BAD_REQUEST)

    if CustomUser.objects.filter(email=email).exists():
        return Response({
            'success': False,
            'message': 'Email đã được sử dụng'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = CustomUser.objects.create(
            email=email,
            password_hash=make_password(password),
            full_name=full_name,
            phone=phone,
            role='user',
            is_active=True,
        )

        return Response({
            'success': True,
            'message': 'Đăng ký thành công',
            'user': {
                'user_id': user.user_id,
                'email': user.email,
                'full_name': user.full_name,
                'phone': user.phone,
                'role': user.role,
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'Lỗi: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def login(request):
    """Đăng nhập"""
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({
            'success': False,
            'message': 'Vui lòng nhập email và mật khẩu'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = CustomUser.objects.get(email=email, is_active=True)

        if check_password(password, user.password_hash):
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
                    'role': user.role,
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
    """Đăng xuất"""
    request.session.flush()
    return Response({
        'success': True,
        'message': 'Đăng xuất thành công'
    })


@api_view(['GET'])
def check_auth(request):
    """Kiểm tra trạng thái đăng nhập"""
    user_id = request.session.get('user_id')

    if user_id:
        try:
            user = CustomUser.objects.get(user_id=user_id, is_active=True)
            return Response({
                'authenticated': True,
                'user': {
                    'user_id': user.user_id,
                    'email': user.email,
                    'full_name': user.full_name,
                    'phone': user.phone,
                    'role': user.role,
                }
            })
        except CustomUser.DoesNotExist:
            request.session.flush()

    return Response({'authenticated': False})


@api_view(['GET', 'PUT'])
def profile(request):
    """Lấy hoặc cập nhật thông tin profile"""
    user_id = request.session.get('user_id')

    if not user_id:
        return Response({
            'success': False,
            'message': 'Chưa đăng nhập'
        }, status=status.HTTP_401_UNAUTHORIZED)

    try:
        user = CustomUser.objects.get(user_id=user_id, is_active=True)

        if request.method == 'GET':
            return Response({
                'success': True,
                'user': {
                    'user_id': user.user_id,
                    'email': user.email,
                    'full_name': user.full_name,
                    'phone': user.phone,
                    'role': user.role,
                }
            })

        elif request.method == 'PUT':
            full_name = request.data.get('full_name', '').strip()
            phone = request.data.get('phone', user.phone)

            if not full_name:
                return Response({
                    'success': False,
                    'message': 'Vui lòng nhập họ tên'
                }, status=status.HTTP_400_BAD_REQUEST)

            user.full_name = full_name
            user.phone = phone
            user.save(update_fields=['full_name', 'phone', 'updated_at'])

            request.session['full_name'] = full_name

            return Response({
                'success': True,
                'message': 'Cập nhật thông tin thành công',
                'user': {
                    'user_id': user.user_id,
                    'email': user.email,
                    'full_name': user.full_name,
                    'phone': user.phone,
                    'role': user.role,
                }
            })

    except CustomUser.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Người dùng không tồn tại'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def change_password(request):
    """Đổi mật khẩu"""
    user_id = request.session.get('user_id')

    if not user_id:
        return Response({
            'success': False,
            'message': 'Chưa đăng nhập'
        }, status=status.HTTP_401_UNAUTHORIZED)

    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')

    if not all([current_password, new_password, confirm_password]):
        return Response({
            'success': False,
            'message': 'Vui lòng điền đầy đủ thông tin'
        }, status=status.HTTP_400_BAD_REQUEST)

    if new_password != confirm_password:
        return Response({
            'success': False,
            'message': 'Mật khẩu mới không khớp'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 6:
        return Response({
            'success': False,
            'message': 'Mật khẩu mới phải có ít nhất 6 ký tự'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = CustomUser.objects.get(user_id=user_id, is_active=True)

        if not check_password(current_password, user.password_hash):
            return Response({
                'success': False,
                'message': 'Mật khẩu hiện tại không đúng'
            }, status=status.HTTP_400_BAD_REQUEST)

        user.password_hash = make_password(new_password)
        user.save(update_fields=['password_hash', 'updated_at'])

        return Response({
            'success': True,
            'message': 'Đổi mật khẩu thành công'
        })

    except CustomUser.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Người dùng không tồn tại'
        }, status=status.HTTP_404_NOT_FOUND)
