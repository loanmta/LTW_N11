from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from cart.models import (
    Product, CartItem, Order, OrderItem, Review, 
    UserProfile, CustomUser, Category, Voucher
)
from .serializers import (
    ProductSerializer, CartItemSerializer, OrderSerializer,
    ReviewSerializer, UserProfileSerializer, CategorySerializer,
    CustomUserSerializer, VoucherSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    
    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True)
        
        # Filter by category
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by search query
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
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
        query = request.query_params.get('q', '')
        products = self.get_queryset().filter(name__icontains=query)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        products = self.get_queryset().filter(is_featured=True)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)


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
        
        # Get or create cart item
        cart_item, created = CartItem.objects.get_or_create(
            session_key=session_key,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += int(quantity)
            cart_item.save()
        
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
        session_key = self.request.session.session_key
        if self.request.user.is_authenticated:
            return Order.objects.filter(user=self.request.user)
        return Order.objects.filter(session_key=session_key)
    
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
        
        # Create order
        order = Order.objects.create(
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


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer


class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return UserProfile.objects.filter(user=self.request.user)
        return UserProfile.objects.none()


class VoucherViewSet(viewsets.ModelViewSet):
    queryset = Voucher.objects.filter(is_active=True)
    serializer_class = VoucherSerializer
    
    @action(detail=False, methods=['post'])
    def validate_code(self, request):
        code = request.data.get('code')
        try:
            voucher = Voucher.objects.get(code=code, is_active=True)
            serializer = self.get_serializer(voucher)
            return Response({
                'valid': True,
                'voucher': serializer.data
            })
        except Voucher.DoesNotExist:
            return Response({
                'valid': False,
                'message': 'Mã giảm giá không hợp lệ'
            }, status=status.HTTP_404_NOT_FOUND)
