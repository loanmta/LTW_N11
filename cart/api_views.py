from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from .models import Product, CartItem
import json

@csrf_exempt
@require_POST
def add_to_cart_api(request):
    """API để thêm sản phẩm vào giỏ hàng"""
    try:
        data = json.loads(request.body)
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        color = data.get('color', '')
        size = data.get('size', '')
        
        if request.user.is_authenticated:
            # Thêm vào database
            product = Product.objects.get(id=product_id)
            cart_item, created = CartItem.objects.get_or_create(
                user=request.user,
                product=product,
                defaults={'quantity': quantity, 'selected': True}
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
            
            # Đếm tổng số sản phẩm trong giỏ
            cart_count = CartItem.objects.filter(user=request.user).count()
        else:
            # Lưu vào session cho user chưa đăng nhập
            if not request.session.session_key:
                request.session.create()
            
            cart = request.session.get('cart', {})
            
            if str(product_id) in cart:
                cart[str(product_id)]['quantity'] += quantity
            else:
                cart[str(product_id)] = {
                    'product_id': product_id,
                    'quantity': quantity,
                    'color': color,
                    'size': size
                }
            
            request.session['cart'] = cart
            request.session.modified = True
            cart_count = len(cart)
        
        return JsonResponse({
            'success': True,
            'message': 'Đã thêm vào giỏ hàng',
            'cart_count': cart_count
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@csrf_exempt
def get_cart_count(request):
    """API lấy số lượng sản phẩm trong giỏ"""
    if request.user.is_authenticated:
        count = CartItem.objects.filter(user=request.user).count()
    else:
        cart = request.session.get('cart', {})
        count = len(cart)
    
    return JsonResponse({'cart_count': count})


@csrf_exempt
@require_POST
def save_profile_api(request):
    """API để lưu thông tin người dùng"""
    try:
        data = json.loads(request.body)
        full_name = data.get('full_name', '')
        phone = data.get('phone', '')
        address = data.get('address', '')
        
        if request.user.is_authenticated:
            # Lưu vào database
            from .models import UserProfile
            profile, created = UserProfile.objects.get_or_create(user=request.user)
            profile.full_name = full_name
            profile.phone = phone
            profile.address = address
            profile.save()
        else:
            # Lưu vào session
            if not request.session.session_key:
                request.session.create()
            
            request.session['user_profile'] = {
                'full_name': full_name,
                'phone': phone,
                'address': address
            }
            request.session.modified = True
        
        return JsonResponse({
            'success': True,
            'message': 'Đã lưu thông tin'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)
