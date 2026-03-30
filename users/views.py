from django.shortcuts import render

def profile_view(request):
    return render(request, 'users/profile.html')

def orders_view(request):
    return render(request, 'users/orders.html')

def order_detail_view(request, order_id):
    return render(request, 'users/order_detail.html', {'order_id': order_id})

def customers_view(request):
    return render(request, 'users/customers.html')
