"""
Models mapped to SQL Server OldSchoolDB
These models use db_table to map to existing SQL Server tables
"""
from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    slug = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=500, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'Categories'
        managed = False  # Don't let Django manage this table
    
    def __str__(self):
        return self.name


class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, db_column='category_id')
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=18, decimal_places=2)
    old_price = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    stock_quantity = models.IntegerField(default=0)
    color = models.CharField(max_length=50, blank=True, null=True)
    size = models.CharField(max_length=20, blank=True, null=True)
    image_url = models.CharField(max_length=500, blank=True, null=True)
    image_2_url = models.CharField(max_length=500, blank=True, null=True)
    image_3_url = models.CharField(max_length=500, blank=True, null=True)
    is_new = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'Products'
        managed = False
    
    def __str__(self):
        return self.name


class CustomUser(models.Model):
    user_id = models.AutoField(primary_key=True)
    email = models.CharField(max_length=255, unique=True)
    password_hash = models.CharField(max_length=255)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=20, default='user')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'Users'
        managed = False
    
    def __str__(self):
        return self.email


class UserProfile(models.Model):
    profile_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, db_column='user_id')
    address = models.CharField(max_length=500, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    avatar_url = models.CharField(max_length=500, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'UserProfiles'
        managed = False
    
    def __str__(self):
        return f"Profile of {self.user.email}"


class Order(models.Model):
    order_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, db_column='user_id')
    order_number = models.CharField(max_length=50, unique=True)
    session_key = models.CharField(max_length=255, blank=True, null=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.CharField(max_length=255, blank=True, null=True)
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=50, default='pending')
    payment_method = models.CharField(max_length=50)
    payment_status = models.CharField(max_length=50, default='unpaid')
    subtotal = models.DecimalField(max_digits=18, decimal_places=2)
    discount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=18, decimal_places=2)
    notes = models.TextField(blank=True, null=True)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    shipping_company = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'Orders'
        managed = False
        ordering = ['-created_at']
    
    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order_item_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', db_column='order_id')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, db_column='product_id')
    product_name = models.CharField(max_length=255)
    product_image = models.CharField(max_length=500, blank=True, null=True)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=18, decimal_places=2)
    color = models.CharField(max_length=50, blank=True, null=True)
    size = models.CharField(max_length=20, blank=True, null=True)
    subtotal = models.DecimalField(max_digits=18, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'OrderItems'
        managed = False
    
    def __str__(self):
        return f"{self.product_name} x {self.quantity}"


class CartItem(models.Model):
    cart_item_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True, db_column='user_id')
    session_key = models.CharField(max_length=255, blank=True, null=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, db_column='product_id')
    quantity = models.IntegerField(default=1)
    selected = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'CartItems'
        managed = False
    
    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class Review(models.Model):
    review_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews', db_column='product_id')
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, db_column='user_id')
    name = models.CharField(max_length=255)
    email = models.CharField(max_length=255, blank=True, null=True)
    rating = models.IntegerField()
    comment = models.TextField(blank=True, null=True)
    avatar_url = models.CharField(max_length=500, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'Reviews'
        managed = False
    
    def __str__(self):
        return f"{self.name} - {self.product.name}"


class Voucher(models.Model):
    voucher_id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    discount_type = models.CharField(max_length=20)
    discount_value = models.DecimalField(max_digits=18, decimal_places=2)
    min_order_value = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    max_discount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    usage_limit = models.IntegerField(null=True, blank=True)
    used_count = models.IntegerField(default=0)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'Vouchers'
        managed = False
    
    def __str__(self):
        return self.code
