from django.db import models
from django.contrib.auth.models import User

class Product(models.Model):
    name = models.CharField(max_length=200)
    color = models.CharField(max_length=100)
    size = models.CharField(max_length=10)
    price = models.DecimalField(max_digits=10, decimal_places=0)
    old_price = models.DecimalField(max_digits=10, decimal_places=0, null=True, blank=True)
    image = models.CharField(max_length=500, blank=True)
    image_2 = models.CharField(max_length=500, blank=True)
    image_3 = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    is_new = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name

class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    selected = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def get_total_price(self):
        return self.product.price * self.quantity
    
    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    name = models.CharField(max_length=100)
    avatar = models.CharField(max_length=500, blank=True)
    comment = models.TextField()
    rating = models.IntegerField(default=5)
    date = models.CharField(max_length=50, default='1 tháng')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.product.name}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', null=True, blank=True)
    full_name = models.CharField(max_length=200, default='')
    phone = models.CharField(max_length=20, default='')
    address = models.TextField(default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # For non-authenticated users, store in session
    session_key = models.CharField(max_length=100, blank=True, null=True)
    
    def __str__(self):
        return self.full_name or f"Profile {self.id}"
