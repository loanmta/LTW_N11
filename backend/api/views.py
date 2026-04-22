"""
API Views - Main Business Logic

Module này chứa tất cả các ViewSets và API views cho ứng dụng.

ViewSets (tự động tạo CRUD endpoints):
- CategoryViewSet: Quản lý danh mục sản phẩm
- ProductViewSet: Quản lý sản phẩm (CRUD, search, filter, reviews)
- CartItemViewSet: Quản lý giỏ hàng
- OrderViewSet: Quản lý đơn hàng
- ReviewViewSet: Quản lý đánh giá
- UserProfileViewSet: Quản lý profile người dùng
- VoucherViewSet: Quản lý mã giảm giá
- UserViewSet: Quản lý users (admin only)

Function-based views:
- dashboard_stats: Thống kê cho admin dashboard

Mỗi ViewSet tự động tạo các endpoints:
- GET /api/resource/ - List (với pagination)
- GET /api/resource/{id}/ - Detail
- POST /api/resource/ - Create
- PUT/PATCH /api/resource/{id}/ - Update
- DELETE /api/resource/{id}/ - Delete

Custom actions sử dụng @action decorator
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Q
from decimal import Decimal
from datetime import datetime, timedelta
from cart.models import (
    Product, CartItem, Order, OrderItem, Review, 
    UserProfile, CustomUser, Category
)
from .serializers import (
    ProductSerializer, CartItemSerializer, OrderSerializer,
    ReviewSerializer, UserProfileSerializer, CategorySerializer,
    CustomUserSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet cho Category model
    
    Endpoints:
        GET /api/categories/ - List tất cả danh mục active
        GET /api/categories/{id}/ - Chi tiết danh mục
        POST /api/categories/ - Tạo danh mục mới (admin)
        PUT/PATCH /api/categories/{id}/ - Cập nhật (admin)
        DELETE /api/categories/{id}/ - Xóa (admin)
    
    Filters:
        - Chỉ hiển thị danh mục is_active=True
    
    Permissions:
        - GET: Public
        - POST/PUT/DELETE: Admin only (cần implement permission_classes)
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet cho Product model
    
    Endpoints:
        GET /api/products/ - List sản phẩm (có filter, search, pagination)
        GET /api/products/{id}/ - Chi tiết sản phẩm
        GET /api/products/search/?q=... - Tìm kiếm sản phẩm
        GET /api/products/featured/ - Sản phẩm nổi bật
        GET /api/products/{id}/reviews/ - Đánh giá sản phẩm
        POST /api/products/{id}/submit_review/ - Gửi đánh giá
        POST /api/products/ - Tạo sản phẩm (admin)
        PUT/PATCH /api/products/{id}/ - Cập nhật (admin)
        DELETE /api/products/{id}/ - Xóa (admin)
    
    Query Parameters:
        - category: Filter theo category_id
        - search: Tìm trong name, category name, description
        - is_new: Filter sản phẩm mới
        - is_featured: Filter sản phẩm nổi bật
        - ordering: Sắp xếp (default: -created_at)
    
    Custom Actions:
        - search: Tìm kiếm sản phẩm
        - featured: Lấy sản phẩm nổi bật
        - reviews: Lấy đánh giá của sản phẩm
        - submit_review: Gửi đánh giá mới
    """
    serializer_class = ProductSerializer
    
    def get_queryset(self):
        """
        Lấy queryset với filters
        
        Filters:
            - is_active=True (luôn luôn)
            - category: Filter theo danh mục
            - search: Tìm trong name, category name, description
            - is_new: Sản phẩm mới
            - is_featured: Sản phẩm nổi bật
        
        Ordering:
            - Default: -created_at (mới nhất trước)
            - Có thể custom qua query param 'ordering'
        """
        queryset = Product.objects.filter(is_active=True)
        
        # Filter by category
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by search query - search in product name AND category name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |  # Tìm trong tên sản phẩm
                Q(category__name__icontains=search) |  # Tìm trong tên danh mục
                Q(description__icontains=search)  # Tìm trong mô tả
            )
        
        # Filter by is_new
        is_new = self.request.query_params.get('is_new')
        if is_new:
            queryset = queryset.filter(is_new=True)
        
        # Filter by is_featured
        is_featured = self.request.query_params.get('is_featured')
        if is_featured:
            queryset = queryset.filter(is_featured=True)
        
        # Order by
        ordering = self.request.query_params.get('ordering', '-created_at')
        queryset = queryset.order_by(ordering)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Tìm kiếm sản phẩm
        
        GET /api/products/search/?q=keyword
        
        Returns: List sản phẩm matching keyword
        """
        query = request.query_params.get('q', '')
        products = self.get_queryset().filter(name__icontains=query)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Lấy sản phẩm nổi bật
        
        GET /api/products/featured/
        
        Returns: List sản phẩm có is_featured=True
        """
        products = self.get_queryset().filter(is_featured=True)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """
        Lấy đánh giá của sản phẩm
        
        GET /api/products/{id}/reviews/
        
        Returns:
            - reviews: List đánh giá
            - total_reviews: Tổng số đánh giá
            - average_rating: Điểm trung bình (1-5)
        """
        product = self.get_object()
        reviews = Review.objects.filter(product=product).order_by('-created_at')
        
        # Calculate average rating
        total_reviews = reviews.count()
        if total_reviews > 0:
            avg_rating = sum(r.rating for r in reviews) / total_reviews
        else:
            avg_rating = 0
        
        # Serialize reviews
        reviews_data = []
        for review in reviews:
            reviews_data.append({
                'review_id': review.review_id,
                'name': review.name,
                'email': review.email,
                'rating': review.rating,
                'comment': review.comment,
                'avatar_url': review.avatar_url or '/assets/images/avatar.svg',
                'is_verified': review.is_verified,
                'created_at': review.created_at.isoformat()
            })
        
        return Response({
            'success': True,
            'reviews': reviews_data,
            'total_reviews': total_reviews,
            'average_rating': round(avg_rating, 1)
        })
    
    @action(detail=True, methods=['post'])
    def submit_review(self, request, pk=None):
        """
        Gửi đánh giá cho sản phẩm
        
        POST /api/products/{id}/submit_review/
        Body: {
            "rating": 5,
            "comment": "Sản phẩm tốt",
            "name": "Nguyễn Văn A",
            "user_id": 1 (optional)
        }
        
        Validation:
            - rating: 1-5
            - comment: Required
        
        Verified Purchase:
            - Nếu có user_id và user đã mua sản phẩm này (order completed)
            - is_verified = True
        
        Returns:
            - success: true/false
            - message: Thông báo
            - review_id: ID đánh giá vừa tạo
        """
        product = self.get_object()
        
        # Get data from request
        rating = request.data.get('rating')
        comment = request.data.get('comment')
        name = request.data.get('name', 'Khách hàng')
        user_id = request.data.get('user_id')
        
        # Validate
        if not rating or not comment:
            return Response({
                'success': False,
                'message': 'Vui lòng nhập đầy đủ thông tin'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError()
        except:
            return Response({
                'success': False,
                'message': 'Đánh giá không hợp lệ'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user has purchased this product
        user = None
        is_verified = False
        if user_id:
            try:
                user = CustomUser.objects.get(user_id=user_id)
                # Check if user has completed order with this product
                has_purchased = OrderItem.objects.filter(
                    order__user=user,
                    order__status='completed',
                    product=product
                ).exists()
                is_verified = has_purchased
            except CustomUser.DoesNotExist:
                pass
        
        # Create review
        review = Review.objects.create(
            product=product,
            user=user,
            name=name,
            rating=rating,
            comment=comment,
            avatar_url='/user/assets/images/avatar.svg',
            is_verified=is_verified
        )
        
        return Response({
            'success': True,
            'message': 'Đánh giá của bạn đã được gửi thành công',
            'review_id': review.review_id
        })


class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    
    def get_queryset(self):
        session_key = self.request.session.session_key
        if not session_key:
            self.request.session.create()
            session_key = self.request.session.session_key
        
        return CartItem.objects.filter(session_key=session_key)
    
    def list(self, request):
        """Get all cart items with product details"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Calculate totals
        subtotal = sum(float(item.product.price) * item.quantity for item in queryset)
        
        return Response({
            'items': serializer.data,
            'subtotal': subtotal,
            'discount': 0,
            'shipping_fee': 0,
            'total': subtotal,
            'count': queryset.count()
        })
    
    @action(detail=False, methods=['post'])
    def add_item(self, request):
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)
        color = request.data.get('color')
        size = request.data.get('size')
        
        if not product_id:
            return Response({
                'success': False,
                'message': 'Thiếu thông tin sản phẩm'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        product = get_object_or_404(Product, product_id=product_id)
        
        # Ensure session exists
        if not request.session.session_key:
            request.session.create()
        session_key = request.session.session_key
        
        # Check if same product with same color and size already exists
        cart_item = CartItem.objects.filter(
            session_key=session_key,
            product=product,
            color=color,
            size=size
        ).first()
        
        if cart_item:
            # Update quantity if exists
            cart_item.quantity += int(quantity)
            cart_item.save()
        else:
            # Create new cart item
            cart_item = CartItem.objects.create(
                session_key=session_key,
                product=product,
                quantity=quantity,
                color=color,
                size=size
            )
        
        # Get cart count
        cart_count = CartItem.objects.filter(session_key=session_key).count()
        
        return Response({
            'success': True,
            'cart_count': cart_count,
            'message': 'Đã thêm vào giỏ hàng',
            'cart_item_id': cart_item.cart_item_id
        })
    
    @action(detail=True, methods=['patch'])
    def update_quantity(self, request, pk=None):
        """Update cart item quantity"""
        cart_item = self.get_object()
        quantity = request.data.get('quantity', 1)
        
        if quantity <= 0:
            cart_item.delete()
            return Response({
                'success': True,
                'message': 'Đã xóa sản phẩm khỏi giỏ hàng'
            })
        
        cart_item.quantity = quantity
        cart_item.save()
        
        return Response({
            'success': True,
            'message': 'Đã cập nhật số lượng',
            'quantity': cart_item.quantity
        })
    
    @action(detail=False, methods=['delete'])
    def clear(self, request):
        """Clear all cart items"""
        self.get_queryset().delete()
        return Response({
            'success': True,
            'message': 'Đã xóa tất cả sản phẩm'
        })
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        if not request.session.session_key:
            request.session.create()
        session_key = request.session.session_key
        count = CartItem.objects.filter(session_key=session_key).count()
        return Response({'cart_count': count})


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    
    def get_queryset(self):
        # Check if user is admin via session
        user_role = self.request.session.get('role')
        user_id = self.request.session.get('user_id')
        session_key = self.request.session.session_key
        
        # Debug logging
        print(f"DEBUG OrderViewSet.get_queryset:")
        print(f"  user_role: {user_role}")
        print(f"  user_id: {user_id}")
        print(f"  session_key: {session_key}")
        
        if user_role == 'admin':
            # Admin sees all orders
            queryset = Order.objects.all().order_by('-created_at')
            print(f"  Admin query - returning {queryset.count()} orders")
            return queryset
        
        # Regular user sees only their orders
        if user_id:
            queryset = Order.objects.filter(user_id=user_id).order_by('-created_at')
            print(f"  User query - returning {queryset.count()} orders")
            return queryset
        
        # Guest user sees orders by session
        if session_key:
            queryset = Order.objects.filter(session_key=session_key).order_by('-created_at')
            print(f"  Guest query - returning {queryset.count()} orders")
            return queryset
        
        print(f"  No match - returning 0 orders")
        return Order.objects.none()
    
    def create(self, request):
        """Create new order from cart items"""
        import uuid
        from decimal import Decimal
        
        # Get cart items
        session_key = request.session.session_key
        if not session_key:
            return Response({
                'success': False,
                'message': 'Không tìm thấy giỏ hàng'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cart_items = CartItem.objects.filter(session_key=session_key)
        if not cart_items.exists():
            return Response({
                'success': False,
                'message': 'Giỏ hàng trống'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get customer info from request
        full_name = request.data.get('full_name')
        phone = request.data.get('phone')
        email = request.data.get('email', '')
        address = request.data.get('address')
        city = request.data.get('city', '')
        district = request.data.get('district', '')
        payment_method = request.data.get('payment_method', 'cod')
        notes = request.data.get('notes', '')
        
        if not all([full_name, phone, address]):
            return Response({
                'success': False,
                'message': 'Thiếu thông tin khách hàng'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate totals
        subtotal = sum(Decimal(str(item.product.price)) * item.quantity for item in cart_items)
        discount = Decimal('0')
        shipping_fee = Decimal('0')
        total = subtotal - discount + shipping_fee
        
        # Generate order number
        order_number = f"ORD{uuid.uuid4().hex[:8].upper()}"
        
        # Get user_id from session if logged in
        user_id = request.session.get('user_id')
        user = None
        if user_id:
            try:
                user = CustomUser.objects.get(user_id=user_id)
            except CustomUser.DoesNotExist:
                pass
        
        # Create order
        order = Order.objects.create(
            user=user,
            order_number=order_number,
            session_key=session_key,
            full_name=full_name,
            phone=phone,
            email=email,
            address=address,
            city=city,
            district=district,
            payment_method=payment_method,
            payment_status='unpaid' if payment_method == 'qr' else 'pending',
            subtotal=subtotal,
            discount=discount,
            shipping_fee=shipping_fee,
            total=total,
            notes=notes,
            status='pending'
        )
        
        # Create order items
        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                product_name=cart_item.product.name,
                product_image=cart_item.product.image_url,
                quantity=cart_item.quantity,
                price=cart_item.product.price,
                color=cart_item.product.color,
                size=cart_item.product.size,
                subtotal=Decimal(str(cart_item.product.price)) * cart_item.quantity
            )
        
        # Clear cart
        cart_items.delete()
        
        return Response({
            'success': True,
            'message': 'Đặt hàng thành công',
            'order_id': order.order_id,
            'order_number': order.order_number,
            'total': float(total)
        })
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        orders = self.get_queryset().filter(order_number__icontains=query)
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Hủy đơn hàng
        
        POST /api/orders/{id}/cancel/
        
        Rules:
            - Chỉ có thể hủy đơn hàng ở trạng thái 'pending'
            - User chỉ có thể hủy đơn hàng của mình
            - Admin có thể hủy bất kỳ đơn hàng nào
        
        Returns:
            - success: true/false
            - message: Thông báo
        """
        order = self.get_object()
        user_role = request.session.get('role')
        user_id = request.session.get('user_id')
        
        # Check permission: user can only cancel their own orders
        if user_role != 'admin':
            if order.user_id != user_id and order.session_key != request.session.session_key:
                return Response({
                    'success': False,
                    'message': 'Bạn không có quyền hủy đơn hàng này'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if order can be cancelled (only pending orders)
        if order.status != 'pending':
            return Response({
                'success': False,
                'message': 'Chỉ có thể hủy đơn hàng đang chờ xác nhận'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Cancel order
        order.status = 'cancelled'
        order.save()
        
        return Response({
            'success': True,
            'message': 'Đã hủy đơn hàng thành công'
        })


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer


class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return UserProfile.objects.filter(user=self.request.user)
        return UserProfile.objects.none()


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for managing users/customers"""
    serializer_class = CustomUserSerializer
    
    def get_queryset(self):
        # Return all users (CustomUser model doesn't have is_staff/is_superuser)
        # Filter by role instead
        return CustomUser.objects.filter(role='user')
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        users = self.get_queryset().filter(email__icontains=query)
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)



@api_view(['GET'])
def dashboard_stats(request):
    """Get dashboard statistics"""
    try:
        # Total revenue
        total_revenue = Order.objects.filter(
            status__in=['completed', 'shipping']
        ).aggregate(total=Sum('total'))['total'] or 0
        
        # Total orders
        total_orders = Order.objects.count()
        
        # Total products
        total_products = Product.objects.filter(is_active=True).count()
        
        # Total customers
        total_customers = CustomUser.objects.filter(role='user').count()
        
        # Recent orders (last 7 days)
        seven_days_ago = datetime.now() - timedelta(days=7)
        recent_orders = Order.objects.filter(
            created_at__gte=seven_days_ago
        ).count()
        
        # Pending orders
        pending_orders = Order.objects.filter(status='pending').count()
        
        # Low stock products
        low_stock = Product.objects.filter(
            stock_quantity__lt=10,
            stock_quantity__gt=0,
            is_active=True
        ).count()
        
        # Revenue by month (last 6 months)
        revenue_by_month = []
        for i in range(5, -1, -1):
            month_start = datetime.now().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            revenue = Order.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end,
                status__in=['completed', 'shipping']
            ).aggregate(total=Sum('total'))['total'] or 0
            
            revenue_by_month.append({
                'month': month_start.strftime('%m/%Y'),
                'revenue': float(revenue)
            })
        
        # Top selling products
        top_products = OrderItem.objects.values(
            'product_id', 'product_name'
        ).annotate(
            total_sold=Sum('quantity')
        ).order_by('-total_sold')[:5]
        
        return Response({
            'success': True,
            'stats': {
                'total_revenue': float(total_revenue),
                'total_orders': total_orders,
                'total_products': total_products,
                'total_customers': total_customers,
                'recent_orders': recent_orders,
                'pending_orders': pending_orders,
                'low_stock': low_stock,
                'revenue_by_month': revenue_by_month,
                'top_products': list(top_products)
            }
        })
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
