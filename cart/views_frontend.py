from django.shortcuts import render
from django.views.generic import TemplateView
from pathlib import Path
from django.conf import settings
from django.http import HttpResponse, FileResponse, Http404
import mimetypes


def serve_frontend(request, path=''):
    """Serve frontend HTML files"""
    if not path or path == '/':
        path = 'index.html'
    
    # Map of routes to HTML files
    route_map = {
        '': 'index.html',
        'index.html': 'index.html',
        'login.html': 'login.html',
        'products.html': 'products.html',
        'cart.html': 'cart.html',
        'checkout.html': 'checkout.html',
        'orders.html': 'orders.html',
        'order_detail.html': 'order_detail.html',
        'product_detail.html': 'product_detail.html',
        'admin_dashboard.html': 'admin/pages/dashboard.html',
        'admin_orders.html': 'admin/pages/orders.html',
        'admin_order_detail.html': 'admin/pages/order_detail.html',
        'admin_customers.html': 'admin/pages/customers.html',
        'admin_products.html': 'admin/pages/products.html',
        'admin_reports.html': 'admin/pages/reports.html',
    }
    
    html_file = route_map.get(path, path)
    
    # Check if it's an admin file
    if html_file.startswith('admin/'):
        file_path = settings.BASE_DIR / 'frontend' / html_file
    else:
        file_path = settings.BASE_DIR / 'frontend' / 'pages' / html_file
    
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    else:
        return HttpResponse('Page not found', status=404)


def serve_static_file(request, path, admin_assets=False):
    """Serve static files (CSS, JS, images)"""
    # Determine the base directory
    if admin_assets:
        # Admin assets from /static-admin/
        file_path = settings.BASE_DIR / 'frontend' / 'admin' / 'assets' / path
    elif path.startswith('admin/'):
        # This shouldn't happen anymore, but keep for safety
        file_path = settings.BASE_DIR / 'frontend' / path
    else:
        # Regular assets from /assets/
        file_path = settings.BASE_DIR / 'frontend' / 'assets' / path
    
    if file_path.exists() and file_path.is_file():
        # Guess the content type
        content_type, _ = mimetypes.guess_type(str(file_path))
        if content_type is None:
            content_type = 'application/octet-stream'
        
        return FileResponse(open(file_path, 'rb'), content_type=content_type)
    else:
        raise Http404(f"File not found: {path}")
