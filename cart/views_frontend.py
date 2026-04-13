"""
Views để serve frontend files (HTML, CSS, JS, images)

Chức năng:
- serve_frontend: Serve các file HTML
- serve_static_file: Serve các file static (CSS, JS, images)
"""
from django.shortcuts import render
from django.views.generic import TemplateView
from pathlib import Path
from django.conf import settings
from django.http import HttpResponse, FileResponse, Http404
import mimetypes


def serve_frontend(request, path=''):
    """
    Serve frontend HTML files
    
    Args:
        request: Django request object
        path: Đường dẫn đến file HTML (vd: 'user/pages/index.html')
    
    Returns:
        HttpResponse với nội dung HTML
    """
    # Nếu không có path hoặc path là '/', serve trang chủ
    if not path or path == '/':
        path = 'user/pages/index.html'
    
    # Tạo đường dẫn đầy đủ đến file
    file_path = settings.BASE_DIR / 'frontend' / path
    
    # Kiểm tra file có tồn tại không
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    else:
        return HttpResponse('Page not found', status=404)


def serve_static_file(request, path, admin_assets=False):
    """
    Serve static files (CSS, JS, images)
    
    Args:
        request: Django request object
        path: Đường dẫn đến file static (vd: 'css/global.css')
        admin_assets: True nếu là file của admin, False nếu là file của user
    
    Returns:
        FileResponse với nội dung file
    """
    # Xác định thư mục gốc dựa vào loại assets
    if admin_assets:
        # Admin assets từ /admin/assets/
        file_path = settings.BASE_DIR / 'frontend' / 'admin' / 'assets' / path
    else:
        # User assets từ /user/assets/
        file_path = settings.BASE_DIR / 'frontend' / 'user' / 'assets' / path
    
    # Kiểm tra file có tồn tại và là file (không phải thư mục)
    if file_path.exists() and file_path.is_file():
        # Xác định content type dựa vào extension
        content_type, _ = mimetypes.guess_type(str(file_path))
        if content_type is None:
            content_type = 'application/octet-stream'
        
        return FileResponse(open(file_path, 'rb'), content_type=content_type)
    else:
        raise Http404(f"File not found: {path}")
