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


def orders_view(request):
    """Trang danh sách đơn hàng"""
    # Lấy filter status từ URL
    status_filter = request.GET.get('status', 'all')
    search_query = request.GET.get('search', '').strip()
    
    # Lấy đơn hàng
    if request.user.is_authenticated:
        orders = Order.objects.filter(user=request.user)
        
        # Filter by status
        if status_filter != 'all':
            orders = orders.filter(status=status_filter)
        
        # Search by order number
        if search_query:
            orders = orders.filter(order_number__icontains=search_query)
    else:
        # Dữ liệu mẫu cho demo
        orders = get_sample_orders()
        
        # Filter sample data
        if status_filter != 'all':
            orders = [o for o in orders if o.status == status_filter]
        
        if search_query:
            orders = [o for o in orders if search_query.upper() in o.order_number]
    
    context = {
        'orders': orders,
        'status_filter': status_filter,
        'search_query': search_query,
    }
    return render(request, 'cart/orders.html', context)


def order_detail_view(request, order_number):
    """Trang chi tiết đơn hàng"""
    if request.user.is_authenticated:
        order = get_object_or_404(Order, order_number=order_number, user=request.user)
        order_items = order.items.all()
    else:
        # Dữ liệu mẫu
        order = get_sample_order_detail(order_number)
        order_items = order.items if hasattr(order, 'items') else []
    
    context = {
        'order': order,
        'order_items': order_items,
    }
    return render(request, 'cart/order_detail.html', context)


def get_sample_orders():
    """Return sample orders for demo"""
    from datetime import datetime
    
    class SampleOrder:
        def __init__(self, order_number, status, total, created_at):
            self.order_number = order_number
            self.status = status
            self.total = total
            self.created_at = created_at
        
        def get_status_display(self):
            status_map = {
                'completed': 'Hoàn thành',
                'shipping': 'Đang giao',
                'pending': 'Chờ xác nhận',
                'cancelled': 'Đã hủy',
            }
            return status_map.get(self.status, self.status)
        
        def get_status_display_class(self):
            return f'status-{self.status}'
    
    return [
        SampleOrder('#CAT001', 'completed', 1250000, datetime(2026, 1, 12)),
        SampleOrder('#CAT002', 'shipping', 890000, datetime(2026, 1, 12)),
        SampleOrder('#CAT003', 'pending', 1400000, datetime(2026, 1, 15)),
        SampleOrder('#CAT004', 'cancelled', 550000, datetime(2026, 1, 14)),
    ]


def get_sample_order_detail(order_number):
    """Return sample order detail"""
    from datetime import datetime
    
    class SampleOrderItem:
        def __init__(self, product_name, quantity, color, size, price, image):
            self.product_name = product_name
            self.quantity = quantity
            self.color = color
            self.size = size
            self.price = price
            self.image = image
        
        def get_total_price(self):
            return self.price * self.quantity
    
    class SampleOrder:
        def __init__(self, order_number, status, created_at):
            self.order_number = order_number
            self.status = status
            self.created_at = created_at
            self.full_name = 'Nguyễn Minh Khoa'
            self.phone = '0966196548'
            self.address = '71 Ngũ Hành Sơn, Đà Nẵng'
            self.payment_method = 'cod'
            self.shipping_company = 'GHN Express'
            self.tracking_number = 'GHN987654321'
            
            # Set timeline based on status
            if status == 'pending':
                # Chờ xác nhận - chỉ bước đầu hoàn thành
                self.timeline = [
                    {'status': 'ordered', 'label': 'Đã đặt hàng', 'date': '08:30, 20/10/2025', 'completed': True, 'active': True},
                    {'status': 'confirmed', 'label': 'Chờ xác nhận', 'date': 'Dự kiến: 20/10/2025', 'completed': False},
                    {'status': 'packed', 'label': 'Đang đóng gói', 'date': 'Dự kiến: 20/10/2025', 'completed': False},
                    {'status': 'shipping', 'label': 'Đang giao hàng', 'date': 'Dự kiến: 21/10/2025', 'completed': False},
                    {'status': 'delivered', 'label': 'Thành công', 'date': 'Dự kiến: 22/10', 'completed': False},
                ]
                self.subtotal = 350000
                self.shipping_fee = 50000
                self.total = 400000
                self.items = [
                    SampleOrderItem(
                        'Combo Áo Blazer Đỏ Classic',
                        2,
                        'Đỏ Thẫm',
                        'L',
                        150000,
                        'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=200&h=200&fit=crop&q=80'
                    ),
                    SampleOrderItem(
                        'Quần Tây Ống Suông Lưng Cao',
                        1,
                        'Đen',
                        'M',
                        200000,
                        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200&h=200&fit=crop&q=80'
                    ),
                ]
            elif status == 'shipping':
                # Đang giao - 4 bước đầu hoàn thành
                self.timeline = [
                    {'status': 'ordered', 'label': 'Đã đặt hàng', 'date': '08:30, 20/10/2025', 'completed': True},
                    {'status': 'confirmed', 'label': 'Đã xác nhận', 'date': '10:15, 20/10/2025', 'completed': True},
                    {'status': 'packed', 'label': 'Đang đóng gói', 'date': '14:40, 20/10/2025', 'completed': True},
                    {'status': 'shipping', 'label': 'Đang giao hàng', 'date': '09:08, 21/10/2025', 'completed': True, 'active': True},
                    {'status': 'delivered', 'label': 'Thành công', 'date': 'Dự kiến: 22/10', 'completed': False},
                ]
                self.subtotal = 1450000
                self.shipping_fee = 50000
                self.total = 1500000
                self.items = [
                    SampleOrderItem(
                        'Combo 2 Áo thun Red Edition',
                        2,
                        'Đỏ Đậm',
                        'L',
                        500000,
                        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&h=200&fit=crop&q=80'
                    ),
                    SampleOrderItem(
                        'Quần Jean Slim Fit Denim',
                        1,
                        'Xanh đậm',
                        '32',
                        450000,
                        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&h=200&fit=crop&q=80'
                    ),
                ]
            elif status == 'completed':
                # Hoàn thành - tất cả bước hoàn thành
                self.timeline = [
                    {'status': 'ordered', 'label': 'Đã đặt hàng', 'date': '08:30, 12/01/2026', 'completed': True},
                    {'status': 'confirmed', 'label': 'Đã xác nhận', 'date': '10:15, 12/01/2026', 'completed': True},
                    {'status': 'packed', 'label': 'Đang đóng gói', 'date': '14:40, 12/01/2026', 'completed': True},
                    {'status': 'shipping', 'label': 'Đang giao hàng', 'date': '09:08, 13/01/2026', 'completed': True},
                    {'status': 'delivered', 'label': 'Thành công', 'date': '15:30, 14/01/2026', 'completed': True, 'active': True},
                ]
                self.subtotal = 1200000
                self.shipping_fee = 50000
                self.total = 1250000
                self.items = [
                    SampleOrderItem(
                        'Áo Blazer Premium Edition',
                        1,
                        'Đỏ Ruby',
                        'M',
                        1200000,
                        'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=200&h=200&fit=crop&q=80'
                    ),
                ]
            elif status == 'cancelled':
                # Đã hủy - chỉ bước đầu hoàn thành
                self.timeline = [
                    {'status': 'ordered', 'label': 'Đã đặt hàng', 'date': '08:30, 14/01/2026', 'completed': True, 'active': True},
                    {'status': 'confirmed', 'label': 'Đã hủy', 'date': '09:15, 14/01/2026', 'completed': False},
                    {'status': 'packed', 'label': 'Đang đóng gói', 'date': '', 'completed': False},
                    {'status': 'shipping', 'label': 'Đang giao hàng', 'date': '', 'completed': False},
                    {'status': 'delivered', 'label': 'Thành công', 'date': '', 'completed': False},
                ]
                self.subtotal = 500000
                self.shipping_fee = 50000
                self.total = 550000
                self.items = [
                    SampleOrderItem(
                        'Áo Thun Basic Cotton',
                        1,
                        'Trắng',
                        'L',
                        500000,
                        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop&q=80'
                    ),
                ]
            else:
                # Default
                self.timeline = [
                    {'status': 'ordered', 'label': 'Đã đặt hàng', 'date': '08:30, 20/10/2025', 'completed': True},
                    {'status': 'confirmed', 'label': 'Chờ xác nhận', 'date': 'Dự kiến: 20/10/2025', 'completed': False},
                    {'status': 'packed', 'label': 'Đang đóng gói', 'date': 'Dự kiến: 20/10/2025', 'completed': False},
                    {'status': 'shipping', 'label': 'Đang giao hàng', 'date': 'Dự kiến: 21/10/2025', 'completed': False},
                    {'status': 'delivered', 'label': 'Thành công', 'date': 'Dự kiến: 22/10', 'completed': False},
                ]
                self.subtotal = 500000
                self.shipping_fee = 50000
                self.total = 550000
                self.items = []
        
        def get_status_display(self):
            status_map = {
                'completed': 'Hoàn thành',
                'shipping': 'Đang giao',
                'pending': 'Chờ xác nhận',
                'cancelled': 'Đã hủy',
            }
            return status_map.get(self.status, self.status)
        
        def get_status_display_class(self):
            return f'status-{self.status}'
    
    # Return different order based on order_number
    if order_number == '#CAT002':
        return SampleOrder('#CAT002', 'shipping', datetime(2026, 1, 12))
    elif order_number == '#CAT003':
        return SampleOrder('#CAT003', 'pending', datetime(2026, 1, 15))
    elif order_number == '#CAT001':
        return SampleOrder('#CAT001', 'completed', datetime(2026, 1, 12))
    elif order_number == '#CAT004':
        return SampleOrder('#CAT004', 'cancelled', datetime(2026, 1, 14))
    else:
        return SampleOrder(order_number, 'pending', datetime(2026, 1, 12))

