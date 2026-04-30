"""
Data Serializers

Module này chứa các serializers để chuyển đổi giữa Python objects và JSON.
Serializers xử lý:
- Validation dữ liệu
- Nested relationships (quan hệ giữa các models)
- Custom fields và computed fields
- Read-only và write-only fields

Sử dụng trong API views để:
- Serialize: Python object → JSON (response)
- Deserialize: JSON → Python object (request)
"""
from rest_framework import serializers
from cart.models import (
    Product, CartItem, Order, OrderItem, Review, 
    UserProfile, CustomUser, Category
)


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer cho Category model
    
    Fields:
        - category_id: ID danh mục
        - name: Tên danh mục (vd: "Áo", "Quần")
        - slug: URL-friendly name (vd: "ao", "quan")
        - description: Mô tả danh mục
        - is_active: Trạng thái hoạt động
    
    Sử dụng:
        - GET /api/categories/ - List danh mục
        - GET /api/categories/{id}/ - Chi tiết danh mục
    """
    class Meta:
        model = Category
        fields = ['category_id', 'name', 'slug', 'description', 'is_active']


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer cho Product model
    
    Fields:
        - product_id: ID sản phẩm
        - category: ID danh mục (write)
        - category_name: Tên danh mục (read-only, từ category.name)
        - name: Tên sản phẩm
        - slug: URL-friendly name
        - sku: Mã sản phẩm (auto-generated)
        - description: Mô tả sản phẩm
        - price: Giá hiện tại
        - old_price: Giá cũ (để hiển thị giảm giá)
        - stock_quantity: Số lượng tồn kho
        - color: Màu sắc
        - size: Kích thước
        - image_url: Ảnh chính (base64 hoặc URL)
        - image_2_url, image_3_url: Ảnh phụ
        - is_new: Sản phẩm mới
        - is_featured: Sản phẩm nổi bật
        - is_active: Trạng thái hoạt động
        - created_at: Ngày tạo
    
    Custom fields:
        - category_name: Lấy từ category.name, chỉ đọc
    
    Sử dụng:
        - GET /api/products/ - List sản phẩm
        - GET /api/products/{id}/ - Chi tiết sản phẩm
        - POST /api/products/ - Tạo sản phẩm (admin)
        - PUT/PATCH /api/products/{id}/ - Cập nhật (admin)
    """
    # Custom field: Lấy tên danh mục từ relationship
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'product_id', 'category', 'category_name', 'name', 'slug', 'sku',
            'description', 'price', 'old_price', 'stock_quantity', 
            'color', 'size', 'image_url', 'image_2_url', 'image_3_url',
            'is_new', 'is_featured', 'is_active', 'created_at'
        ]
        read_only_fields = ['sku']


class CartItemSerializer(serializers.ModelSerializer):
    """
    Serializer cho CartItem model
    
    Fields:
        - cart_item_id: ID cart item
        - product: Thông tin sản phẩm đầy đủ (nested, read-only)
        - product_id: ID sản phẩm (write-only, để thêm vào giỏ)
        - quantity: Số lượng
        - color: Màu sắc đã chọn
        - size: Kích cỡ đã chọn
        - selected: Đã chọn để thanh toán chưa
        - created_at: Ngày thêm vào giỏ
    
    Nested serializers:
        - product: Sử dụng ProductSerializer để trả về đầy đủ thông tin
    
    Write-only fields:
        - product_id: Chỉ dùng khi thêm vào giỏ, không trả về trong response
    
    Sử dụng:
        - GET /api/cart/ - Lấy giỏ hàng
        - POST /api/cart/add_item/ - Thêm vào giỏ
        - PATCH /api/cart/{id}/update_quantity/ - Cập nhật số lượng
    """
    # Nested serializer: Trả về đầy đủ thông tin sản phẩm
    product = ProductSerializer(read_only=True)
    
    # Write-only field: Chỉ dùng khi thêm vào giỏ
    product_id = serializers.IntegerField(write_only=True, source='product.product_id')
    
    class Meta:
        model = CartItem
        fields = ['cart_item_id', 'product', 'product_id', 'quantity', 'color', 'size', 'selected', 'created_at']


class OrderItemSerializer(serializers.ModelSerializer):
    """
    Serializer cho OrderItem model
    
    Fields:
        - order_item_id: ID order item
        - product: ID sản phẩm (reference)
        - product_name: Tên sản phẩm (snapshot tại thời điểm đặt)
        - product_image: Ảnh sản phẩm (snapshot)
        - quantity: Số lượng
        - price: Giá tại thời điểm đặt
        - color: Màu sắc đã chọn
        - size: Size đã chọn
        - subtotal: Tổng tiền (price * quantity)
    
    Note:
        - Lưu snapshot của sản phẩm để tránh thay đổi khi sản phẩm bị sửa/xóa
        - product_name, product_image, price là giá trị tại thời điểm đặt hàng
    
    Sử dụng:
        - Nested trong OrderSerializer
        - Hiển thị chi tiết sản phẩm trong đơn hàng
    """
    class Meta:
        model = OrderItem
        fields = [
            'order_item_id', 'product', 'product_name', 'product_image',
            'quantity', 'price', 'color', 'size', 'subtotal'
        ]


class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer cho Order model
    
    Fields:
        - order_id: ID đơn hàng
        - order_number: Mã đơn hàng (auto-generated, read-only)
        - user: ID user (null nếu guest)
        - session_key: Session key (cho guest checkout)
        - full_name: Tên người nhận
        - phone: Số điện thoại
        - email: Email
        - address: Địa chỉ giao hàng
        - city: Thành phố
        - district: Quận/Huyện
        - status: Trạng thái đơn hàng (pending, confirmed, packed, shipping, completed, cancelled)
        - payment_method: Phương thức thanh toán (cod, qr, card)
        - payment_status: Trạng thái thanh toán (unpaid, paid, pending)
        - subtotal: Tổng tiền sản phẩm
        - discount: Giảm giá
        - shipping_fee: Phí vận chuyển
        - total: Tổng cộng
        - notes: Ghi chú
        - tracking_number: Mã vận đơn
        - shipping_company: Đơn vị vận chuyển
        - items: Danh sách sản phẩm (nested, read-only)
        - created_at: Ngày tạo (read-only)
        - updated_at: Ngày cập nhật (read-only)
    
    Nested serializers:
        - items: Sử dụng OrderItemSerializer để trả về danh sách sản phẩm
    
    Read-only fields:
        - order_number: Auto-generated khi tạo đơn
        - created_at, updated_at: Auto-managed
    
    Sử dụng:
        - GET /api/orders/ - List đơn hàng
        - GET /api/orders/{id}/ - Chi tiết đơn hàng
        - POST /api/orders/ - Tạo đơn hàng
        - PATCH /api/orders/{id}/ - Cập nhật trạng thái (admin)
    """
    # Nested serializer: Trả về danh sách sản phẩm trong đơn
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'order_id', 'order_number', 'user', 'session_key', 'full_name', 
            'phone', 'email', 'address', 'city', 'district', 'status', 
            'payment_method', 'payment_status', 'subtotal', 'discount', 
            'shipping_fee', 'total', 'notes', 'tracking_number', 
            'shipping_company', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['order_number', 'created_at', 'updated_at']


class ReviewSerializer(serializers.ModelSerializer):
    """
    Serializer cho Review model
    
    Fields:
        - review_id: ID đánh giá
        - product: ID sản phẩm
        - user: ID user (null nếu guest)
        - name: Tên người đánh giá
        - email: Email người đánh giá
        - rating: Số sao (1-5)
        - comment: Nội dung đánh giá
        - avatar_url: Avatar người đánh giá
        - is_verified: Đã mua hàng chưa (verified purchase)
        - created_at: Ngày đánh giá
    
    Validation:
        - rating: Phải từ 1-5
        - comment: Không được rỗng
    
    Sử dụng:
        - GET /api/products/{id}/reviews/ - Lấy đánh giá sản phẩm
        - POST /api/products/{id}/submit_review/ - Gửi đánh giá
    """
    class Meta:
        model = Review
        fields = [
            'review_id', 'product', 'user', 'name', 'email', 
            'rating', 'comment', 'avatar_url', 'is_verified', 'created_at'
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer cho UserProfile model
    
    Fields:
        - profile_id: ID profile
        - user: ID user
        - address: Địa chỉ
        - city: Thành phố
        - district: Quận/Huyện
        - postal_code: Mã bưu điện
        - avatar_url: Avatar URL
        - date_of_birth: Ngày sinh
        - gender: Giới tính
        - created_at: Ngày tạo
        - updated_at: Ngày cập nhật
    
    Note:
        - UserProfile là thông tin bổ sung cho CustomUser
        - Quan hệ 1-1 với CustomUser
    
    Sử dụng:
        - GET /api/auth/profile/ - Lấy profile
        - PUT /api/auth/profile/ - Cập nhật profile
    """
    class Meta:
        model = UserProfile
        fields = [
            'profile_id', 'user', 'address', 'city', 'district', 
            'postal_code', 'avatar_url', 'date_of_birth', 'gender',
            'created_at', 'updated_at'
        ]


class CustomUserSerializer(serializers.ModelSerializer):
    """
    Serializer cho CustomUser model
    
    Fields:
        - user_id: ID user
        - email: Email (unique)
        - full_name: Họ tên
        - phone: Số điện thoại
        - role: Vai trò (user/admin)
        - is_active: Trạng thái hoạt động
        - created_at: Ngày đăng ký
        - order_count: Tổng số đơn hàng (calculated field)
    
    Extra kwargs:
        - password_hash: Write-only, không trả về trong response
    
    Note:
        - Không bao gồm password_hash trong response vì lý do bảo mật
        - Sử dụng make_password() khi tạo/cập nhật password
        - order_count được tính động từ Order model
    
    Sử dụng:
        - GET /api/users/ - List users (admin)
        - GET /api/users/{id}/ - Chi tiết user (admin)
        - Nested trong các serializers khác
    """
    order_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['user_id', 'email', 'full_name', 'phone', 'role', 'is_active', 'created_at', 'order_count']
        # Password không được trả về trong response
        extra_kwargs = {'password_hash': {'write_only': True}}
    
    def get_order_count(self, obj):
        """Tính tổng số đơn hàng của user"""
        from cart.models import Order
        return Order.objects.filter(user_id=obj.user_id).count()



