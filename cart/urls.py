from django.urls import path
from . import views, api_views

app_name = 'cart'

urlpatterns = [
    path('', views.cart_view, name='cart'),
    path('checkout/', views.checkout_view, name='checkout'),
    path('popup-demo/', views.popup_demo_view, name='popup_demo'),
    path('products/', views.products_view, name='products'),
    path('products/<int:product_id>/', views.product_detail_view, name='product_detail'),
    
    # API endpoints
    path('api/add-to-cart/', api_views.add_to_cart_api, name='add_to_cart_api'),
    path('api/cart-count/', api_views.get_cart_count, name='cart_count_api'),
    path('api/save-profile/', api_views.save_profile_api, name='save_profile_api'),
]
