from rest_framework import serializers
from cart.models import (
    Product, CartItem, Order, OrderItem, Review, 
    UserProfile, CustomUser, Category, Voucher
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['category_id', 'name', 'slug', 'description', 'is_active']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'product_id', 'category', 'category_name', 'name', 'slug', 
            'description', 'price', 'old_price', 'stock_quantity', 
            'color', 'size', 'image_url', 'image_2_url', 'image_3_url',
            'is_new', 'is_featured', 'is_active', 'created_at'
        ]


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True, source='product.product_id')
    
    class Meta:
        model = CartItem
        fields = ['cart_item_id', 'product', 'product_id', 'quantity', 'selected', 'created_at']


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'order_item_id', 'product', 'product_name', 'product_image',
            'quantity', 'price', 'color', 'size', 'subtotal'
        ]


class OrderSerializer(serializers.ModelSerializer):
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
    class Meta:
        model = Review
        fields = [
            'review_id', 'product', 'user', 'name', 'email', 
            'rating', 'comment', 'avatar_url', 'is_verified', 'created_at'
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'profile_id', 'user', 'address', 'city', 'district', 
            'postal_code', 'avatar_url', 'date_of_birth', 'gender',
            'created_at', 'updated_at'
        ]


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['user_id', 'email', 'full_name', 'phone', 'role', 'is_active', 'created_at']
        extra_kwargs = {'password_hash': {'write_only': True}}


class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = [
            'voucher_id', 'code', 'description', 'discount_type', 
            'discount_value', 'min_order_value', 'max_discount',
            'usage_limit', 'used_count', 'start_date', 'end_date', 'is_active'
        ]
