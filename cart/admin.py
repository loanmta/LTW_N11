from django.contrib import admin
from .models import Product, CartItem, Review, UserProfile

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'color', 'size', 'price', 'is_new']

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'quantity', 'selected', 'created_at']

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['name', 'product', 'rating', 'date', 'created_at']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'phone', 'user', 'created_at']
