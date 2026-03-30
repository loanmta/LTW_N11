from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.profile_view, name='profile'),
    path('orders/', views.orders_view, name='orders'),
    path('orders/<str:order_id>/', views.order_detail_view, name='order_detail'),
    path('customers/', views.customers_view, name='customers'),
]
