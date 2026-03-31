from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import CartItem, Product, Review, UserProfile

def cart_view(request):
    # Lấy giỏ hàng
    cart_items = []
    if request.user.is_authenticated:
        cart_items = CartItem.objects.filter(user=request.user).select_related('product')
    else:
        # Lấy từ session
        cart_session = request.session.get('cart', {})
        if cart_session:
            # Convert session data to cart items
            all_products = get_sample_products()
            for product_id, item_data in cart_session.items():
                product = next((p for p in all_products if p.id == int(product_id)), None)
                if product:
                    # Create a dynamic cart item object
                    class DynamicCartItem:
                        def __init__(self, product, quantity):
                            self.product = product
                            self.quantity = quantity
                            self.selected = True
                        
                        def get_total_price(self):
                            return self.product.price * self.quantity
                    
                    cart_items.append(DynamicCartItem(product, item_data['quantity']))
        else:
            # Hiển thị dữ liệu mẫu nếu session trống
            cart_items = get_sample_cart_items()
    
    # Tính toán tổng tiền
    selected_items = [item for item in cart_items if item.selected]
    subtotal = sum(item.get_total_price() for item in selected_items)
    discount = 100000 if subtotal > 0 else 0
    shipping = 0  # Miễn phí
    total = subtotal - discount
    
    context = {
        'cart_items': cart_items,
        'selected_count': len(selected_items),
        'subtotal': subtotal,
        'discount': discount,
        'shipping': shipping,
        'total': total,
    }
    return render(request, 'cart/cart.html', context)

def checkout_view(request):
    """Trang đặt hàng"""
    # Kiểm tra xem có "mua ngay" từ trang chi tiết không
    quick_buy = request.GET.get('quick_buy', None)
    
    cart_items = []
    
    if quick_buy:
        # Chế độ mua ngay - không hiển thị giỏ hàng
        # Sản phẩm sẽ được load từ sessionStorage bằng JavaScript
        pass
    elif request.user.is_authenticated:
        # Lấy các sản phẩm đã chọn từ giỏ hàng
        cart_items = CartItem.objects.filter(
            user=request.user, 
            selected=True
        ).select_related('product')
    else:
        # Hiển thị dữ liệu mẫu nếu chưa đăng nhập
        cart_items = get_sample_cart_items()
    
    # Lấy thông tin user profile
    user_profile = None
    if request.user.is_authenticated:
        user_profile, created = UserProfile.objects.get_or_create(user=request.user)
    else:
        # Lấy từ session cho user chưa đăng nhập
        profile_data = request.session.get('user_profile', {})
        if profile_data:
            class SessionProfile:
                def __init__(self, data):
                    self.full_name = data.get('full_name', '')
                    self.phone = data.get('phone', '')
                    self.address = data.get('address', '')
            user_profile = SessionProfile(profile_data)
        else:
            # Dữ liệu mẫu
            class SessionProfile:
                full_name = 'Nguyễn Minh Khoa'
                phone = '0966196548'
                address = '71 Ngũ Hành Sơn, Đà Nẵng'
            user_profile = SessionProfile()
    
    # Tính toán
    subtotal = sum(item.get_total_price() for item in cart_items) if cart_items else 0
    discount = 100000 if subtotal > 0 else 0
    shipping = 0
    total = subtotal - discount
    
    context = {
        'cart_items': cart_items,
        'subtotal': subtotal,
        'discount': discount,
        'shipping': shipping,
        'total': total,
        'quick_buy': quick_buy,
        'user_profile': user_profile,
    }
    return render(request, 'cart/checkout.html', context)

def popup_demo_view(request):
    return render(request, 'cart/popup_demo.html')

def products_view(request):
    """Trang danh sách sản phẩm"""
    search_query = request.GET.get('search', '').strip()
    
    # Lấy tất cả sản phẩm
    if request.user.is_authenticated:
        products = Product.objects.all()
        if search_query:
            products = products.filter(name__icontains=search_query)
    else:
        # Dữ liệu mẫu
        all_products = get_sample_products()
        if search_query:
            products = [p for p in all_products if search_query.lower() in p.name.lower()]
        else:
            products = all_products
    
    context = {
        'products': products,
        'search_query': search_query,
        'no_results': len(products) == 0 and search_query,
    }
    return render(request, 'cart/products.html', context)

def product_detail_view(request, product_id):
    """Trang chi tiết sản phẩm"""
    if request.user.is_authenticated:
        product = get_object_or_404(Product, id=product_id)
        reviews = product.reviews.all()
    else:
        # Dữ liệu mẫu - lấy theo ID
        all_products = get_sample_products_with_details()
        product = next((p for p in all_products if p.id == product_id), None)
        if not product:
            product = all_products[0]  # Fallback to first product
        reviews = get_sample_reviews()
    
    context = {
        'product': product,
        'reviews': reviews,
    }
    return render(request, 'cart/product_detail.html', context)

# Helper function for sample data
def get_sample_cart_items():
    """Return sample cart items for demo purposes"""
    class SampleProduct:
        def __init__(self, name, color, size, price, image):
            self.name = name
            self.color = color
            self.size = size
            self.price = price
            self.image = image
    
    class SampleCartItem:
        def __init__(self, product, quantity, selected=True):
            self.product = product
            self.quantity = quantity
            self.selected = selected
        
        def get_total_price(self):
            return self.product.price * self.quantity
    
    products = [
        SampleProduct('Áo Sơ Mi Lụa Premium', 'Trắng', 'M', 650000, 
                     'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop&q=80'),
        SampleProduct('Quần Tây Âu Classic', 'Xanh Navy', 'L', 850000,
                     'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop&q=80'),
        SampleProduct('Áo Blazer Dạ Thu', 'Xám Ghi', 'S', 1500000,
                     'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop&q=80'),
    ]
    
    return [SampleCartItem(p, 1, True) for p in products]

def get_sample_products():
    """Return sample products for demo purposes"""
    class SampleProduct:
        def __init__(self, id, name, color, size, price, image, is_new=False):
            self.id = id
            self.name = name
            self.color = color
            self.size = size
            self.price = price
            self.image = image
            self.is_new = is_new
    
    return [
        SampleProduct(1, 'ÁO BLAZER PREMIUM RED EDITION', 'Đỏ đậm', 'M', 1290000,
                     'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&h=500&fit=crop&q=80', True),
        SampleProduct(2, 'ÁO KHOÁC MỎNG TƠ WHITE ELEGANCE COSTUME', 'Xanh nhạt', 'L', 2450000,
                     'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=400&h=500&fit=crop&q=80'),
        SampleProduct(3, 'ÁO KHOÁC DA BIKER URBAN BAD SIGNATURE', 'Đen', 'L', 3100000,
                     'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop&q=80'),
        SampleProduct(4, 'BLAZER MINIMALIST CREAMY WHITE EDITION', 'Trắng kem', 'M', 1850000,
                     'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop&q=80'),
        SampleProduct(5, 'ÁO BLAZER PREMIUM RED EDITION', 'Be', 'S', 1290000,
                     'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop&q=80', True),
        SampleProduct(6, 'ÁO KHOÁC MỎNG TƠ WHITE ELEGANCE COSTUME', 'Đen', 'M', 2450000,
                     'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=500&fit=crop&q=80'),
        SampleProduct(7, 'ÁO KHOÁC MỎNG TƠ WHITE ELEGANCE COSTUME', 'Đen', 'M', 2450000,
                     'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop&q=80'),
        SampleProduct(8, 'BLAZER MINIMALIST CREAMY WHITE EDITION', 'Đỏ đậm', 'L', 1850000,
                     'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop&q=80'),
    ]


def get_sample_product_detail():
    """Return sample product detail"""
    class SampleProduct:
        def __init__(self):
            self.name = 'Áo Blazer Premium Red Edition'
            self.color = 'Đỏ Ruby'
            self.size = 'S'
            self.price = 1250000
            self.old_price = 3100000
            self.image = 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600&h=700&fit=crop&q=80'
            self.image_2 = 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=700&fit=crop&q=80'
            self.image_3 = 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=700&fit=crop&q=80'
            self.description = '''Sản phẩm Áo Blazer Premium Red Edition nằm trong bộ sưu tập Thu Đông mới nhất. Được chế tác từ chất liệu len pha cao cấp, phom dáng Âu chuẩn giúp tôn dáng. Sản phẩm hợp cho các buổi gặp mặt trang trọng cũng như các buổi tiệc tối.

Sáng trọng. Lịch thiệp. Lưu ý khi mua hàng lưu cẩm nang giặc Phải mặt tuyệt đối.'''
    
    return SampleProduct()

def get_sample_products_with_details():
    """Return sample products with full details for product detail page"""
    class SampleProduct:
        def __init__(self, id, name, color, size, price, old_price, image, image_2, image_3, description, is_new=False):
            self.id = id
            self.name = name
            self.color = color
            self.size = size
            self.price = price
            self.old_price = old_price
            self.image = image
            self.image_2 = image_2
            self.image_3 = image_3
            self.description = description
            self.is_new = is_new
    
    return [
        SampleProduct(
            1, 'ÁO BLAZER PREMIUM RED EDITION', 'Đỏ Ruby', 'M', 1290000, 1600000,
            'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=700&fit=crop&q=80',
            'Sản phẩm Áo Blazer Premium Red Edition nằm trong bộ sưu tập Thu Đông mới nhất. Được chế tác từ chất liệu len pha cao cấp, phom dáng Âu chuẩn giúp tôn dáng. Sản phẩm hợp cho các buổi gặp mặt trang trọng cũng như các buổi tiệc tối.\n\nSáng trọng. Lịch thiệp. Lưu ý khi mua hàng lưu cẩm nang giặc Phải mặt tuyệt đối.',
            True
        ),
        SampleProduct(
            2, 'ÁO KHOÁC MỎNG TƠ WHITE ELEGANCE COSTUME', 'Xanh nhạt', 'L', 2450000, 3000000,
            'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=700&fit=crop&q=80',
            'Áo khoác mỏng từ chất liệu tơ cao cấp, thiết kế thanh lịch phù hợp cho mùa thu. Form dáng rộng thoải mái, dễ phối đồ.',
            False
        ),
        SampleProduct(
            3, 'ÁO KHOÁC DA BIKER URBAN BAD SIGNATURE', 'Đen', 'L', 3100000, 3800000,
            'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=700&fit=crop&q=80',
            'Áo khoác da biker phong cách urban, chất liệu da tổng hợp cao cấp. Thiết kế cá tính, mạnh mẽ.',
            False
        ),
        SampleProduct(
            4, 'BLAZER MINIMALIST CREAMY WHITE EDITION', 'Trắng kem', 'M', 1850000, 2200000,
            'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=700&fit=crop&q=80',
            'Blazer tối giản màu trắng kem, phong cách thanh lịch. Chất liệu vải cao cấp, form dáng chuẩn.',
            False
        ),
        SampleProduct(
            5, 'ÁO BLAZER PREMIUM BEIGE EDITION', 'Be', 'S', 1290000, 1600000,
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=700&fit=crop&q=80',
            'Áo blazer màu be thanh lịch, phù hợp cho môi trường công sở và dạo phố. Chất liệu cao cấp.',
            True
        ),
        SampleProduct(
            6, 'ÁO KHOÁC ĐEN CLASSIC', 'Đen', 'M', 2450000, 2900000,
            'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=700&fit=crop&q=80',
            'Áo khoác đen cổ điển, thiết kế đơn giản nhưng sang trọng. Dễ phối đồ cho mọi dịp.',
            False
        ),
        SampleProduct(
            7, 'ĐẦM DỰ TIỆC ELEGANT', 'Đen', 'M', 2450000, 3000000,
            'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=700&fit=crop&q=80',
            'Đầm dự tiệc sang trọng, thiết kế thanh lịch. Phù hợp cho các buổi tiệc tối và sự kiện quan trọng.',
            False
        ),
        SampleProduct(
            8, 'CHÂN VÁY LỤA SATIN ĐỎ', 'Đỏ đậm', 'L', 1850000, 2300000,
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=700&fit=crop&q=80',
            'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=700&fit=crop&q=80',
            'Chân váy lụa satin màu đỏ đậm, chất liệu mềm mại, bóng đẹp. Thiết kế xòe nhẹ tôn dáng.',
            False
        ),
    ]

def get_sample_reviews():
    """Return sample reviews"""
    class SampleReview:
        def __init__(self, name, avatar, comment, date):
            self.name = name
            self.avatar = avatar
            self.comment = comment
            self.date = date
    
    return [
        SampleReview(
            'Thanh Huyền',
            'https://i.pravatar.cc/150?img=1',
            'Chất vải rất đẹp, form áo phù hợp tôn dáng. Màu sắc nay mặc lên sáng, mình rất ưng.',
            '1 tháng'
        ),
        SampleReview(
            'Nguyễn Khánh Linh',
            'https://i.pravatar.cc/150?img=5',
            'Blazer lần đầu mặc rất đẹp, chất liệu mềm mại, may rất đẹp và chỉnh chu nhưng cắt thích. Mình 51kg, cao 1m60 mặc size S vừa chuẩn luôn.',
            '2 tuần'
        ),
    ]
