"""
Admin API Views - Quản lý danh mục, sản phẩm và báo cáo doanh thu
Yêu cầu đăng nhập với role='admin'
"""
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connection
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import json

from cart.models import Category, Product, Order, OrderItem, CustomUser
from .serializers import CategorySerializer, ProductSerializer


# =============================================
# Helper: Kiểm tra quyền admin
# =============================================

def get_admin_user(request):
    """Lấy user từ session, trả về None nếu không phải admin"""
    user_id = request.session.get('user_id')
    role = request.session.get('role')
    if not user_id or role != 'admin':
        return None
    try:
        return CustomUser.objects.get(user_id=user_id, is_active=True, role='admin')
    except CustomUser.DoesNotExist:
        return None


def admin_required(view_func):
    """Decorator kiểm tra quyền admin"""
    def wrapper(request, *args, **kwargs):
        if not get_admin_user(request):
            return Response({
                'success': False,
                'message': 'Bạn không có quyền truy cập. Chỉ admin mới được phép.'
            }, status=status.HTTP_403_FORBIDDEN)
        return view_func(request, *args, **kwargs)
    wrapper.__name__ = view_func.__name__
    return wrapper


# =============================================
# QUẢN LÝ DANH MỤC (Category Management)
# =============================================

@api_view(['GET', 'POST'])
def admin_categories(request):
    """
    GET  /api/admin/categories/        - Danh sách tất cả danh mục
    POST /api/admin/categories/        - Tạo danh mục mới
    """
    if not get_admin_user(request):
        return Response({'success': False, 'message': 'Không có quyền truy cập'}, status=403)

    if request.method == 'GET':
        # Lấy tất cả danh mục, kể cả inactive
        search = request.query_params.get('search', '')
        is_active = request.query_params.get('is_active', None)

        queryset = Category.objects.all().order_by('-category_id')

        if search:
            queryset = queryset.filter(name__icontains=search)
        if is_active is not None:
            queryset = queryset.filter(is_active=(is_active == 'true'))

        serializer = CategorySerializer(queryset, many=True)

        # Thêm số lượng sản phẩm cho mỗi danh mục
        data = serializer.data
        for item in data:
            item['product_count'] = Product.objects.filter(
                category_id=item['category_id']
            ).count()
            item['active_product_count'] = Product.objects.filter(
                category_id=item['category_id'], is_active=True
            ).count()

        return Response({
            'success': True,
            'total': queryset.count(),
            'categories': data
        })

    elif request.method == 'POST':
        # Tạo danh mục mới
        name = request.data.get('name', '').strip()
        slug = request.data.get('slug', '').strip()
        description = request.data.get('description', '').strip()
        is_active = request.data.get('is_active', True)

        if not name:
            return Response({'success': False, 'message': 'Tên danh mục không được để trống'}, status=400)
        if not slug:
            # Tự động tạo slug từ tên
            import re
            slug = re.sub(r'[^\w\s-]', '', name.lower())
            slug = re.sub(r'[\s_-]+', '-', slug)
            slug = slug.strip('-')

        # Kiểm tra slug trùng
        if Category.objects.filter(slug=slug).exists():
            return Response({'success': False, 'message': f'Slug "{slug}" đã tồn tại'}, status=400)

        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO Categories (name, slug, description, is_active, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                """, [name, slug, description, is_active, datetime.now()])

                cursor.execute("SELECT SCOPE_IDENTITY()")
                new_id = cursor.fetchone()[0]

            category = Category.objects.get(category_id=new_id)
            serializer = CategorySerializer(category)
            return Response({
                'success': True,
                'message': 'Tạo danh mục thành công',
                'category': serializer.data
            }, status=201)

        except Exception as e:
            return Response({'success': False, 'message': f'Lỗi: {str(e)}'}, status=500)


@api_view(['GET', 'PUT', 'DELETE'])
def admin_category_detail(request, pk):
    """
    GET    /api/admin/categories/{id}/ - Chi tiết danh mục
    PUT    /api/admin/categories/{id}/ - Cập nhật danh mục
    DELETE /api/admin/categories/{id}/ - Xóa mềm danh mục (set is_active=False)
    """
    if not get_admin_user(request):
        return Response({'success': False, 'message': 'Không có quyền truy cập'}, status=403)

    try:
        category = Category.objects.get(category_id=pk)
    except Category.DoesNotExist:
        return Response({'success': False, 'message': 'Danh mục không tồn tại'}, status=404)

    if request.method == 'GET':
        serializer = CategorySerializer(category)
        data = serializer.data
        data['product_count'] = Product.objects.filter(category_id=pk).count()
        data['active_product_count'] = Product.objects.filter(category_id=pk, is_active=True).count()
        return Response({'success': True, 'category': data})

    elif request.method == 'PUT':
        name = request.data.get('name', category.name).strip()
        slug = request.data.get('slug', category.slug).strip()
        description = request.data.get('description', category.description or '').strip()
        is_active = request.data.get('is_active', category.is_active)

        if not name:
            return Response({'success': False, 'message': 'Tên danh mục không được để trống'}, status=400)

        # Kiểm tra slug trùng (trừ chính nó)
        if Category.objects.filter(slug=slug).exclude(category_id=pk).exists():
            return Response({'success': False, 'message': f'Slug "{slug}" đã tồn tại'}, status=400)

        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE Categories
                    SET name=%s, slug=%s, description=%s, is_active=%s
                    WHERE category_id=%s
                """, [name, slug, description, is_active, pk])

            category.refresh_from_db()
            serializer = CategorySerializer(category)
            return Response({
                'success': True,
                'message': 'Cập nhật danh mục thành công',
                'category': serializer.data
            })

        except Exception as e:
            return Response({'success': False, 'message': f'Lỗi: {str(e)}'}, status=500)

    elif request.method == 'DELETE':
        # Soft delete - chỉ ẩn danh mục, không xóa thật
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE Categories SET is_active=0 WHERE category_id=%s", [pk]
                )
            return Response({
                'success': True,
                'message': 'Đã ẩn danh mục thành công'
            })
        except Exception as e:
            return Response({'success': False, 'message': f'Lỗi: {str(e)}'}, status=500)


@api_view(['POST'])
def admin_category_toggle(request, pk):
    """POST /api/admin/categories/{id}/toggle/ - Bật/tắt trạng thái danh mục"""
    if not get_admin_user(request):
        return Response({'success': False, 'message': 'Không có quyền truy cập'}, status=403)

    try:
        category = Category.objects.get(category_id=pk)
        new_status = not category.is_active
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE Categories SET is_active=%s WHERE category_id=%s",
                [new_status, pk]
            )
        return Response({
            'success': True,
            'message': f'Danh mục đã được {"kích hoạt" if new_status else "ẩn"}',
            'is_active': new_status
        })
    except Category.DoesNotExist:
        return Response({'success': False, 'message': 'Danh mục không tồn tại'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Lỗi: {str(e)}'}, status=500)


# =============================================
# QUẢN LÝ SẢN PHẨM (Product Management)
# =============================================

@api_view(['GET', 'POST'])
def admin_products(request):
    """
    GET  /api/admin/products/  - Danh sách tất cả sản phẩm
    POST /api/admin/products/  - Tạo sản phẩm mới
    """
    if not get_admin_user(request):
        return Response({'success': False, 'message': 'Không có quyền truy cập'}, status=403)

    if request.method == 'GET':
        queryset = Product.objects.select_related('category').order_by('-created_at')

        # Filters
        search = request.query_params.get('search', '')
        category_id = request.query_params.get('category', '')
        is_active = request.query_params.get('is_active', None)
        is_featured = request.query_params.get('is_featured', None)
        is_new = request.query_params.get('is_new', None)
        low_stock = request.query_params.get('low_stock', None)

        if search:
            queryset = queryset.filter(name__icontains=search)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if is_active is not None:
            queryset = queryset.filter(is_active=(is_active == 'true'))
        if is_featured is not None:
            queryset = queryset.filter(is_featured=(is_featured == 'true'))
        if is_new is not None:
            queryset = queryset.filter(is_new=(is_new == 'true'))
        if low_stock == 'true':
            queryset = queryset.filter(stock_quantity__lte=5)

        # Phân trang đơn giản
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size

        serializer = ProductSerializer(queryset[start:end], many=True)

        return Response({
            'success': True,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size,
            'products': serializer.data
        })

    elif request.method == 'POST':
        return _create_product(request)


def _create_product(request):
    """Tạo sản phẩm mới"""
    import re

    name = request.data.get('name', '').strip()
    if not name:
        return Response({'success': False, 'message': 'Tên sản phẩm không được để trống'}, status=400)

    slug = request.data.get('slug', '').strip()
    if not slug:
        slug = re.sub(r'[^\w\s-]', '', name.lower())
        slug = re.sub(r'[\s_-]+', '-', slug)
        slug = slug.strip('-')

    if Product.objects.filter(slug=slug).exists():
        slug = f"{slug}-{int(datetime.now().timestamp())}"

    try:
        price = Decimal(str(request.data.get('price', 0)))
        if price <= 0:
            return Response({'success': False, 'message': 'Giá sản phẩm phải lớn hơn 0'}, status=400)
    except Exception:
        return Response({'success': False, 'message': 'Giá sản phẩm không hợp lệ'}, status=400)

    old_price = request.data.get('old_price')
    category_id = request.data.get('category_id') or request.data.get('category')
    stock_quantity = int(request.data.get('stock_quantity', 0))
    description = request.data.get('description', '')
    color = request.data.get('color', '')
    size = request.data.get('size', '')
    image_url = request.data.get('image_url', '')
    image_2_url = request.data.get('image_2_url', '')
    image_3_url = request.data.get('image_3_url', '')
    is_new = request.data.get('is_new', False)
    is_featured = request.data.get('is_featured', False)
    is_active = request.data.get('is_active', True)

    # Kiểm tra category tồn tại
    if category_id:
        if not Category.objects.filter(category_id=category_id).exists():
            return Response({'success': False, 'message': 'Danh mục không tồn tại'}, status=400)

    now = datetime.now()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO Products (
                    category_id, name, slug, description, price, old_price,
                    stock_quantity, color, size, image_url, image_2_url, image_3_url,
                    is_new, is_featured, is_active, created_at, updated_at
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, [
                category_id, name, slug, description, price, old_price,
                stock_quantity, color, size, image_url, image_2_url, image_3_url,
                is_new, is_featured, is_active, now, now
            ])
            cursor.execute("SELECT SCOPE_IDENTITY()")
            new_id = cursor.fetchone()[0]

        product = Product.objects.select_related('category').get(product_id=new_id)
        serializer = ProductSerializer(product)
        return Response({
            'success': True,
            'message': 'Tạo sản phẩm thành công',
            'product': serializer.data
        }, status=201)

    except Exception as e:
        return Response({'success': False, 'message': f'Lỗi: {str(e)}'}, status=500)


@api_view(['GET', 'PUT', 'DELETE'])
def admin_product_detail(request, pk):
    """
    GET    /api/admin/products/{id}/ - Chi tiết sản phẩm
    PUT    /api/admin/products/{id}/ - Cập nhật sản phẩm
    DELETE /api/admin/products/{id}/ - Xóa mềm sản phẩm
    """
    if not get_admin_user(request):
        return Response({'success': False, 'message': 'Không có quyền truy cập'}, status=403)

    try:
        product = Product.objects.select_related('category').get(product_id=pk)
    except Product.DoesNotExist:
        return Response({'success': False, 'message': 'Sản phẩm không tồn tại'}, status=404)

    if request.method == 'GET':
        serializer = ProductSerializer(product)
        return Response({'success': True, 'product': serializer.data})

    elif request.method == 'PUT':
        data = request.data
        try:
            price = Decimal(str(data.get('price', product.price)))
            old_price = data.get('old_price', product.old_price)
            category_id = data.get('category_id') or data.get('category') or (product.category_id if product.category else None)
            name = data.get('name', product.name).strip()
            slug = data.get('slug', product.slug).strip()

            if not name:
                return Response({'success': False, 'message': 'Tên sản phẩm không được để trống'}, status=400)
            if price <= 0:
                return Response({'success': False, 'message': 'Giá sản phẩm phải lớn hơn 0'}, status=400)

            # Kiểm tra slug trùng (trừ chính nó)
            if Product.objects.filter(slug=slug).exclude(product_id=pk).exists():
                return Response({'success': False, 'message': f'Slug "{slug}" đã tồn tại'}, status=400)

            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE Products SET
                        category_id=%s, name=%s, slug=%s, description=%s,
                        price=%s, old_price=%s, stock_quantity=%s,
                        color=%s, size=%s, image_url=%s, image_2_url=%s, image_3_url=%s,
                        is_new=%s, is_featured=%s, is_active=%s, updated_at=%s
                    WHERE product_id=%s
                """, [
                    category_id,
                    name,
                    slug,
                    data.get('description', product.description),
                    price,
                    old_price,
                    int(data.get('stock_quantity', product.stock_quantity)),
                    data.get('color', product.color),
                    data.get('size', product.size),
                    data.get('image_url', product.image_url),
                    data.get('image_2_url', product.image_2_url),
                    data.get('image_3_url', product.image_3_url),
                    data.get('is_new', product.is_new),
                    data.get('is_featured', product.is_featured),
                    data.get('is_active', product.is_active),
                    datetime.now(),
                    pk
                ])

            product.refresh_from_db()
            serializer = ProductSerializer(product)
            return Response({
                'success': True,
                'message': 'Cập nhật sản phẩm thành công',
                'product': serializer.data
            })

        except Exception as e:
            return Response({'success': False, 'message': f'Lỗi: {str(e)}'}, status=500)

    elif request.method == 'DELETE':
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE Products SET is_active=0, updated_at=%s WHERE product_id=%s",
                    [datetime.now(), pk]
                )
            return Response({'success': True, 'message': 'Đã ẩn sản phẩm thành công'})
        except Exception as e:
            return Response({'success': False, 'message': f'Lỗi: {str(e)}'}, status=500)


@api_view(['POST'])
def admin_product_toggle(request, pk):
    """POST /api/admin/products/{id}/toggle/ - Bật/tắt trạng thái sản phẩm"""
    if not get_admin_user(request):
        return Response({'success': False, 'message': 'Không có quyền truy cập'}, status=403)

    try:
        product = Product.objects.get(product_id=pk)
        new_status = not product.is_active
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE Products SET is_active=%s, updated_at=%s WHERE product_id=%s",
                [new_status, datetime.now(), pk]
            )
        return Response({
            'success': True,
            'message': f'Sản phẩm đã được {"kích hoạt" if new_status else "ẩn"}',
            'is_active': new_status
        })
    except Product.DoesNotExist:
        return Response({'success': False, 'message': 'Sản phẩm không tồn tại'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Lỗi: {str(e)}'}, status=500)


@api_view(['PATCH'])
def admin_product_stock(request, pk):
    """PATCH /api/admin/products/{id}/stock/ - Cập nhật tồn kho"""
    if not get_admin_user(request):
        return Response({'success': False, 'message': 'Không có quyền truy cập'}, status=403)

    try:
        product = Product.objects.get(product_id=pk)
        stock_quantity = request.data.get('stock_quantity')
        if stock_quantity is None or int(stock_quantity) < 0:
            return Response({'success': False, 'message': 'Số lượng tồn kho không hợp lệ'}, status=400)

        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE Products SET stock_quantity=%s, updated_at=%s WHERE product_id=%s",
                [int(stock_quantity), datetime.now(), pk]
            )
        return Response({
            'success': True,
            'message': 'Cập nhật tồn kho thành công',
            'stock_quantity': int(stock_quantity)
        })
    except Product.DoesNotExist:
        return Response({'success': False, 'message': 'Sản phẩm không tồn tại'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Lỗi: {str(e)}'}, status=500)


# =============================================
# BÁO CÁO DOANH THU (Revenue Reports)
# =============================================

@api_view(['GET'])
def admin_report_overview(request):
    """
    GET /api/admin/reports/overview/
    Tổng quan doanh thu: hôm nay, tuần này, tháng này, tổng cộng
    """
    if not get_admin_user(request):
        return Response({'success': False, 'message': 'Không có quyền truy cập'}, status=403)

    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def get_stats(date_from=None, date_to=None):
        orders = Order.objects.filter(status__in=['completed', 'shipping', 'confirmed'])
        if date_from:
            orders = orders.filter(created_at__gte=date_from)
        if date_to:
            orders = orders.filter(created_at__lt=date_to)

        from django.db.models import Sum, Count
        agg = orders.aggregate(revenue=Sum('total'), count=Count('order_id'))
        return {
            'revenue': float(agg['revenue'] or 0),
            'order_count': agg['count'] or 0
        }

    # Đơn hàng theo trạng thái
    from django.db.models import Count, Sum
    status_stats = {}
    for s in ['pending', 'confirmed', 'shipping', 'completed', 'cancelled']:
        cnt = Order.objects.filter(status=s).count()
        status_stats[s] = cnt

    # Tổng sản phẩm, danh mục
    total_products = Product.objects.filter(is_active=True).count()
    low_stock_products = Product.objects.filter(is_active=True, stock_quantity__lte=5).count()
    total_categories = Category.objects.filter(is_active=True).count()
    total_customers = CustomUser.objects.filter(role='user', is_active=True).count()

    return Response({
        'success': True,
        'revenue': {
            'today': get_stats(today_start),
            'this_week': get_stats(week_start),
            'this_month': get_stats(month_start),
            'all_time': get_stats()
        },
        'orders': {
            'by_status': status_stats,
            'total': sum(status_stats.values())
        },
        'inventory': {
            'total_products': total_products,
            'low_stock_products': low_stock_products,
            'total_categories': total_categories
        },
        'customers': {
            'total': total_customers
        }
    })


@api_view(['GET'])
def admin_report_revenue_by_period(request):
    """
    GET /api/admin/reports/revenue/by_period/
    Doanh thu theo khoảng thời gian

    Params:
        period: day | month | year (default: day)
        date_from: YYYY-MM-DD
        date_to:   YYYY-MM-DD
    """
    if not get_admin_user(request):
        return Response({'success': False, 'message': 'Không có quyền truy cập'}, status=403)

    period = request.query_params.get('period', 'day')
    date_from_str = request.query_params.get('date_from', '')
    date_to_str = request.query_params.get('date_to', '')

    # Mặc định: 30 ngày gần nhất
    now = datetime.now()
    if not date_from_str:
        date_from = now - timedelta(days=29)
    else:
        try:
            date_from = datetime.strptime(date_from_str, '%Y-%m-%d')
        except ValueError:
            return Response({'success': False, 'message': 'Định dạng date_from không hợp lệ (YYYY-MM-DD)'}, status=400)

    if not date_to_str:
        date_to = now
    else:
        try:
            date_to = datetime.strptime(date_to_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
        except ValueError:
            return Response({'success': False, 'message': 'Định dạng date_to không hợp lệ (YYYY-MM-DD)'}, status=400)

    # Query doanh thu theo period
    if period == 'year':
        group_format = "YEAR(created_at)"
        label_format = "CAST(YEAR(created_at) AS NVARCHAR)"
    elif period == 'month':
        group_format = "YEAR(created_at), MONTH(created_at)"
        label_format = "CAST(YEAR(created_at) AS NVARCHAR) + '-' + RIGHT('0' + CAST(MONTH(created_at) AS NVARCHAR), 2)"
    else:  # day
        group_format = "CAST(created_at AS DATE)"
        label_format = "CAST(CAST(created_at AS DATE) AS NVARCHAR)"

    try:
        with connection.cursor() as cursor:
            cursor.execute(f"""
                SELECT
                    {label_format} as period_label,
                    COUNT(order_id) as order_count,
                    SUM(total) as revenue,
                    SUM(CASE WHEN status='completed' THEN total ELSE 0 END) as completed_revenue
                FROM Orders
                WHERE created_at >= %s AND created_at <= %s
                    AND status NOT IN ('cancelled')
                GROUP BY {group_format}
                ORDER BY {group_format}
            """, [date_from, date_to])

            rows = cursor.fetchall()
            data = []
            for row in rows:
                data.append({
                    'period': row[0],
                    'order_count': row[1],
                    'revenue': float(row[2] or 0),
                    'completed_revenue': float(row[3] or 0)
                })

        return Response({
            'success': True,
            'period': period,
            'date_from': date_from.strftime('%Y-%m-%d'),
            'date_to': date_to.strftime('%Y-%m-%d'),
            'data': data,
            'summary': {
                'total_revenue': sum(d['revenue'] for d in data),
                'total_orders': sum(d['order_count'] for d in data),
                'completed_revenue': sum(d['completed_revenue'] for d in data)
            }
        })

    except Exception as e:
        return Response({'success': False, 'message': f'Lỗi truy vấn: {str(e)}'}, status=500)


@api_view(['GET'])
def admin_report_top_products(request):
    """
    GET /api/admin/reports/top_products/
    Top sản phẩm bán chạy nhất

    Params:
        limit:     số lượng sản phẩm (default: 10)
        date_from: YYYY-MM-DD
        date_to:   YYYY-MM-DD
    """
    if not get_admin_user(request):
        return Response({'success': False, 'message': 'Không có quyền truy cập'}, status=403)

    limit = int(request.query_params.get('limit', 10))
    date_from_str = request.query_params.get('date_from', '')
    date_to_str = request.query_params.get('date_to', '')

    where_clause = "WHERE o.status NOT IN ('cancelled')"
    params = []

    if date_from_str:
        try:
            date_from = datetime.strptime(date_from_str, '%Y-%m-%d')
            where_clause += " AND o.created_at >= %s"
            params.append(date_from)
        except ValueError:
            pass

    if date_to_str:
        try:
            date_to = datetime.strptime(date_to_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
            where_clause += " AND o.created_at <= %s"
            params.append(date_to)
        except ValueError:
            pass

    try:
        with connection.cursor() as cursor:
            cursor.execute(f"""
                SELECT TOP ({limit})
                    oi.product_id,
                    oi.product_name,
                    p.image_url,
                    c.name as category_name,
                    SUM(oi.quantity) as total_quantity,
                    SUM(oi.subtotal) as total_revenue,
                    COUNT(DISTINCT oi.order_id) as order_count,
                    p.stock_quantity,
                    p.price
                FROM OrderItems oi
                JOIN Orders o ON oi.order_id = o.order_id
                LEFT JOIN Products p ON oi.product_id = p.product_id
                LEFT JOIN Categories c ON p.category_id = c.category_id
                {where_clause}
                GROUP BY oi.product_id, oi.product_name, p.image_url, c.name,
                         p.stock_quantity, p.price
                ORDER BY total_quantity DESC
            """, params)

            rows = cursor.fetchall()
            data = []
            for i, row in enumerate(rows):
                data.append({
                    'rank': i + 1,
                    'product_id': row[0],
                    'product_name': row[1],
                    'image_url': row[2],
                    'category_name': row[3],
                    'total_quantity': row[4],
                    'total_revenue': float(row[5] or 0),
                    'order_count': row[6],
                    'stock_quantity': row[7],
                    'current_price': float(row[8] or 0)
                })

        return Response({'success': True, 'data': data, 'total': len(data)})

    except Exception as e:
        return Response({'success': False, 'message': f'Lỗi truy vấn: {str(e)}'}, status=500)


@api_view(['GET'])
def admin_report_by_category(request):
    """
    GET /api/admin/reports/by_category/
    Doanh thu theo danh mục
    """
    if not get_admin_user(request):
        return Response({'success': False, 'message': 'Không có quyền truy cập'}, status=403)

    date_from_str = request.query_params.get('date_from', '')
    date_to_str = request.query_params.get('date_to', '')

    where_clause = "WHERE o.status NOT IN ('cancelled')"
    params = []

    if date_from_str:
        try:
            date_from = datetime.strptime(date_from_str, '%Y-%m-%d')
            where_clause += " AND o.created_at >= %s"
            params.append(date_from)
        except ValueError:
            pass

    if date_to_str:
        try:
            date_to = datetime.strptime(date_to_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
            where_clause += " AND o.created_at <= %s"
            params.append(date_to)
        except ValueError:
            pass

    try:
        with connection.cursor() as cursor:
            cursor.execute(f"""
                SELECT
                    c.category_id,
                    c.name as category_name,
                    COUNT(DISTINCT oi.product_id) as product_count,
                    SUM(oi.quantity) as total_quantity,
                    SUM(oi.subtotal) as total_revenue,
                    COUNT(DISTINCT oi.order_id) as order_count
                FROM OrderItems oi
                JOIN Orders o ON oi.order_id = o.order_id
                LEFT JOIN Products p ON oi.product_id = p.product_id
                LEFT JOIN Categories c ON p.category_id = c.category_id
                {where_clause}
                GROUP BY c.category_id, c.name
                ORDER BY total_revenue DESC
            """, params)

            rows = cursor.fetchall()
            data = []
            total_revenue = sum(float(row[4] or 0) for row in rows)

            for row in rows:
                rev = float(row[4] or 0)
                data.append({
                    'category_id': row[0],
                    'category_name': row[1] or 'Chưa phân loại',
                    'product_count': row[2],
                    'total_quantity': row[3],
                    'total_revenue': rev,
                    'order_count': row[5],
                    'percentage': round((rev / total_revenue * 100) if total_revenue > 0 else 0, 2)
                })

        return Response({
            'success': True,
            'data': data,
            'summary': {
                'total_revenue': total_revenue,
                'total_categories': len(data)
            }
        })

    except Exception as e:
        return Response({'success': False, 'message': f'Lỗi truy vấn: {str(e)}'}, status=500)


@api_view(['GET'])
def admin_report_orders(request):
    """
    GET /api/admin/reports/orders/
    Thống kê đơn hàng theo trạng thái và thanh toán

    Params:
        date_from: YYYY-MM-DD
        date_to:   YYYY-MM-DD
    """
    if not get_admin_user(request):
        return Response({'success': False, 'message': 'Không có quyền truy cập'}, status=403)

    date_from_str = request.query_params.get('date_from', '')
    date_to_str = request.query_params.get('date_to', '')

    orders = Order.objects.all()
    if date_from_str:
        try:
            orders = orders.filter(created_at__gte=datetime.strptime(date_from_str, '%Y-%m-%d'))
        except ValueError:
            pass
    if date_to_str:
        try:
            date_to = datetime.strptime(date_to_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
            orders = orders.filter(created_at__lte=date_to)
        except ValueError:
            pass

    from django.db.models import Count, Sum, Avg

    # Thống kê theo trạng thái đơn hàng
    by_status = {}
    for s in ['pending', 'confirmed', 'shipping', 'completed', 'cancelled']:
        qs = orders.filter(status=s)
        agg = qs.aggregate(count=Count('order_id'), revenue=Sum('total'))
        by_status[s] = {
            'count': agg['count'] or 0,
            'revenue': float(agg['revenue'] or 0)
        }

    # Thống kê theo phương thức thanh toán
    by_payment = {}
    for pm in ['cod', 'bank_transfer', 'qr_code', 'qr']:
        qs = orders.filter(payment_method=pm)
        agg = qs.aggregate(count=Count('order_id'), revenue=Sum('total'))
        if (agg['count'] or 0) > 0:
            by_payment[pm] = {
                'count': agg['count'] or 0,
                'revenue': float(agg['revenue'] or 0)
            }

    # Thống kê trạng thái thanh toán
    by_payment_status = {}
    for ps in ['unpaid', 'paid', 'pending']:
        qs = orders.filter(payment_status=ps)
        agg = qs.aggregate(count=Count('order_id'), revenue=Sum('total'))
        if (agg['count'] or 0) > 0:
            by_payment_status[ps] = {
                'count': agg['count'] or 0,
                'revenue': float(agg['revenue'] or 0)
            }

    # Tổng quan
    total_agg = orders.aggregate(
        count=Count('order_id'),
        revenue=Sum('total'),
        avg_order=Avg('total')
    )

    return Response({
        'success': True,
        'summary': {
            'total_orders': total_agg['count'] or 0,
            'total_revenue': float(total_agg['revenue'] or 0),
            'avg_order_value': float(total_agg['avg_order'] or 0)
        },
        'by_status': by_status,
        'by_payment_method': by_payment,
        'by_payment_status': by_payment_status
    })


@api_view(['GET'])
def admin_report_customers(request):
    """
    GET /api/admin/reports/customers/
    Thống kê khách hàng
    """
    if not get_admin_user(request):
        return Response({'success': False, 'message': 'Không có quyền truy cập'}, status=403)

    try:
        with connection.cursor() as cursor:
            # Top khách hàng mua nhiều nhất
            cursor.execute("""
                SELECT TOP (10)
                    u.user_id,
                    u.full_name,
                    u.email,
                    u.phone,
                    COUNT(o.order_id) as order_count,
                    SUM(o.total) as total_spent,
                    MAX(o.created_at) as last_order_date
                FROM Users u
                JOIN Orders o ON u.user_id = o.user_id
                WHERE o.status NOT IN ('cancelled')
                GROUP BY u.user_id, u.full_name, u.email, u.phone
                ORDER BY total_spent DESC
            """)
            top_customers = []
            for row in cursor.fetchall():
                top_customers.append({
                    'user_id': row[0],
                    'full_name': row[1],
                    'email': row[2],
                    'phone': row[3],
                    'order_count': row[4],
                    'total_spent': float(row[5] or 0),
                    'last_order_date': row[6].strftime('%Y-%m-%d %H:%M') if row[6] else None
                })

            # Khách hàng mới theo tháng (6 tháng gần nhất)
            cursor.execute("""
                SELECT
                    CAST(YEAR(created_at) AS NVARCHAR) + '-' + RIGHT('0' + CAST(MONTH(created_at) AS NVARCHAR), 2) as month,
                    COUNT(user_id) as new_customers
                FROM Users
                WHERE role='user' AND created_at >= DATEADD(MONTH, -5, GETDATE())
                GROUP BY YEAR(created_at), MONTH(created_at)
                ORDER BY YEAR(created_at), MONTH(created_at)
            """)
            new_by_month = [{'month': r[0], 'new_customers': r[1]} for r in cursor.fetchall()]

        total_customers = CustomUser.objects.filter(role='user', is_active=True).count()

        return Response({
            'success': True,
            'summary': {
                'total_customers': total_customers
            },
            'top_customers': top_customers,
            'new_customers_by_month': new_by_month
        })

    except Exception as e:
        return Response({'success': False, 'message': f'Lỗi truy vấn: {str(e)}'}, status=500)
