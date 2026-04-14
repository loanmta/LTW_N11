"""
Admin API Views - Quản lý danh mục, sản phẩm và báo cáo doanh thu
Yêu cầu đăng nhập với role='admin'
Tương thích SQLite (Django ORM thuần)
"""
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, Max, Q
from django.db.models.functions import TruncDay, TruncMonth, TruncYear
from datetime import datetime, timedelta
from decimal import Decimal
import re

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


def _no_permission():
    return Response(
        {'success': False, 'message': 'Không có quyền truy cập. Chỉ admin mới được phép.'},
        status=status.HTTP_403_FORBIDDEN
    )


def _make_slug(name):
    slug = name.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    return slug.strip('-')


# =============================================
# QUẢN LÝ DANH MỤC (Category Management)
# =============================================

@api_view(['GET', 'POST'])
def admin_categories(request):
    """
    GET  /api/admin/categories/  - Danh sách tất cả danh mục
    POST /api/admin/categories/  - Tạo danh mục mới
    """
    if not get_admin_user(request):
        return _no_permission()

    if request.method == 'GET':
        queryset = Category.objects.all().order_by('-category_id')

        search = request.query_params.get('search', '')
        is_active = request.query_params.get('is_active', None)

        if search:
            queryset = queryset.filter(name__icontains=search)
        if is_active is not None:
            queryset = queryset.filter(is_active=(is_active == 'true'))

        serializer = CategorySerializer(queryset, many=True)
        data = serializer.data

        # Đếm sản phẩm cho mỗi danh mục
        for item in data:
            item['product_count'] = Product.objects.filter(category_id=item['category_id']).count()
            item['active_product_count'] = Product.objects.filter(
                category_id=item['category_id'], is_active=True
            ).count()

        return Response({'success': True, 'total': queryset.count(), 'categories': data})

    elif request.method == 'POST':
        name = request.data.get('name', '').strip()
        slug = request.data.get('slug', '').strip()
        description = request.data.get('description', '').strip()
        is_active = request.data.get('is_active', True)

        if not name:
            return Response({'success': False, 'message': 'Tên danh mục không được để trống'}, status=400)

        if not slug:
            slug = _make_slug(name)

        if Category.objects.filter(slug=slug).exists():
            return Response({'success': False, 'message': f'Slug "{slug}" đã tồn tại'}, status=400)

        try:
            category = Category.objects.create(
                name=name,
                slug=slug,
                description=description,
                is_active=is_active,
            )
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
    DELETE /api/admin/categories/{id}/ - Ẩn danh mục (xóa mềm)
    """
    if not get_admin_user(request):
        return _no_permission()

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

        if Category.objects.filter(slug=slug).exclude(category_id=pk).exists():
            return Response({'success': False, 'message': f'Slug "{slug}" đã tồn tại'}, status=400)

        try:
            category.name = name
            category.slug = slug
            category.description = description
            category.is_active = is_active
            category.save()

            serializer = CategorySerializer(category)
            return Response({
                'success': True,
                'message': 'Cập nhật danh mục thành công',
                'category': serializer.data
            })
        except Exception as e:
            return Response({'success': False, 'message': f'Lỗi: {str(e)}'}, status=500)

    elif request.method == 'DELETE':
        try:
            category.is_active = False
            category.save(update_fields=['is_active'])
            return Response({'success': True, 'message': 'Đã ẩn danh mục thành công'})
        except Exception as e:
            return Response({'success': False, 'message': f'Lỗi: {str(e)}'}, status=500)


@api_view(['POST'])
def admin_category_toggle(request, pk):
    """POST /api/admin/categories/{id}/toggle/ - Bật/tắt trạng thái danh mục"""
    if not get_admin_user(request):
        return _no_permission()

    try:
        category = Category.objects.get(category_id=pk)
        category.is_active = not category.is_active
        category.save(update_fields=['is_active'])
        return Response({
            'success': True,
            'message': f'Danh mục đã được {"kích hoạt" if category.is_active else "ẩn"}',
            'is_active': category.is_active
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
        return _no_permission()

    if request.method == 'GET':
        queryset = Product.objects.select_related('category').order_by('-created_at')

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

        # Phân trang
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
    name = request.data.get('name', '').strip()
    if not name:
        return Response({'success': False, 'message': 'Tên sản phẩm không được để trống'}, status=400)

    slug = request.data.get('slug', '').strip() or _make_slug(name)
    if Product.objects.filter(slug=slug).exists():
        slug = f"{slug}-{int(datetime.now().timestamp())}"

    try:
        price = Decimal(str(request.data.get('price', 0)))
        if price <= 0:
            return Response({'success': False, 'message': 'Giá sản phẩm phải lớn hơn 0'}, status=400)
    except Exception:
        return Response({'success': False, 'message': 'Giá sản phẩm không hợp lệ'}, status=400)

    old_price_raw = request.data.get('old_price')
    old_price = Decimal(str(old_price_raw)) if old_price_raw else None
    category_id = request.data.get('category_id') or request.data.get('category')

    if category_id and not Category.objects.filter(category_id=category_id).exists():
        return Response({'success': False, 'message': 'Danh mục không tồn tại'}, status=400)

    try:
        product = Product.objects.create(
            category_id=category_id,
            name=name,
            slug=slug,
            description=request.data.get('description', ''),
            price=price,
            old_price=old_price,
            stock_quantity=int(request.data.get('stock_quantity', 0)),
            color=request.data.get('color', ''),
            size=request.data.get('size', ''),
            image_url=request.data.get('image_url', ''),
            image_2_url=request.data.get('image_2_url', ''),
            image_3_url=request.data.get('image_3_url', ''),
            is_new=request.data.get('is_new', False),
            is_featured=request.data.get('is_featured', False),
            is_active=request.data.get('is_active', True),
        )
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
    DELETE /api/admin/products/{id}/ - Ẩn sản phẩm (xóa mềm)
    """
    if not get_admin_user(request):
        return _no_permission()

    try:
        product = Product.objects.select_related('category').get(product_id=pk)
    except Product.DoesNotExist:
        return Response({'success': False, 'message': 'Sản phẩm không tồn tại'}, status=404)

    if request.method == 'GET':
        serializer = ProductSerializer(product)
        return Response({'success': True, 'product': serializer.data})

    elif request.method == 'PUT':
        data = request.data
        name = data.get('name', product.name).strip()
        slug = data.get('slug', product.slug).strip()

        if not name:
            return Response({'success': False, 'message': 'Tên sản phẩm không được để trống'}, status=400)

        try:
            price = Decimal(str(data.get('price', product.price)))
            if price <= 0:
                return Response({'success': False, 'message': 'Giá sản phẩm phải lớn hơn 0'}, status=400)
        except Exception:
            return Response({'success': False, 'message': 'Giá sản phẩm không hợp lệ'}, status=400)

        if Product.objects.filter(slug=slug).exclude(product_id=pk).exists():
            return Response({'success': False, 'message': f'Slug "{slug}" đã tồn tại'}, status=400)

        old_price_raw = data.get('old_price', product.old_price)
        old_price = Decimal(str(old_price_raw)) if old_price_raw else None
        category_id = data.get('category_id') or data.get('category') or (product.category_id if product.category else None)

        try:
            product.name = name
            product.slug = slug
            product.description = data.get('description', product.description)
            product.price = price
            product.old_price = old_price
            product.stock_quantity = int(data.get('stock_quantity', product.stock_quantity))
            product.color = data.get('color', product.color)
            product.size = data.get('size', product.size)
            product.image_url = data.get('image_url', product.image_url)
            product.image_2_url = data.get('image_2_url', product.image_2_url)
            product.image_3_url = data.get('image_3_url', product.image_3_url)
            product.is_new = data.get('is_new', product.is_new)
            product.is_featured = data.get('is_featured', product.is_featured)
            product.is_active = data.get('is_active', product.is_active)
            product.category_id = category_id
            product.save()

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
            product.is_active = False
            product.save(update_fields=['is_active', 'updated_at'])
            return Response({'success': True, 'message': 'Đã ẩn sản phẩm thành công'})
        except Exception as e:
            return Response({'success': False, 'message': f'Lỗi: {str(e)}'}, status=500)


@api_view(['POST'])
def admin_product_toggle(request, pk):
    """POST /api/admin/products/{id}/toggle/ - Bật/tắt trạng thái sản phẩm"""
    if not get_admin_user(request):
        return _no_permission()

    try:
        product = Product.objects.get(product_id=pk)
        product.is_active = not product.is_active
        product.save(update_fields=['is_active', 'updated_at'])
        return Response({
            'success': True,
            'message': f'Sản phẩm đã được {"kích hoạt" if product.is_active else "ẩn"}',
            'is_active': product.is_active
        })
    except Product.DoesNotExist:
        return Response({'success': False, 'message': 'Sản phẩm không tồn tại'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Lỗi: {str(e)}'}, status=500)


@api_view(['PATCH'])
def admin_product_stock(request, pk):
    """PATCH /api/admin/products/{id}/stock/ - Cập nhật tồn kho"""
    if not get_admin_user(request):
        return _no_permission()

    try:
        product = Product.objects.get(product_id=pk)
        stock_quantity = request.data.get('stock_quantity')

        if stock_quantity is None or int(stock_quantity) < 0:
            return Response({'success': False, 'message': 'Số lượng tồn kho không hợp lệ'}, status=400)

        product.stock_quantity = int(stock_quantity)
        product.save(update_fields=['stock_quantity', 'updated_at'])
        return Response({
            'success': True,
            'message': 'Cập nhật tồn kho thành công',
            'stock_quantity': product.stock_quantity
        })
    except Product.DoesNotExist:
        return Response({'success': False, 'message': 'Sản phẩm không tồn tại'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Lỗi: {str(e)}'}, status=500)


# =============================================
# BÁO CÁO DOANH THU (Revenue Reports)
# =============================================

def _parse_date(date_str):
    """Parse chuỗi YYYY-MM-DD thành datetime, trả về None nếu lỗi"""
    try:
        return datetime.strptime(date_str, '%Y-%m-%d')
    except (ValueError, TypeError):
        return None


def _revenue_stats(date_from=None, date_to=None):
    """Tính doanh thu và số đơn trong khoảng thời gian"""
    orders = Order.objects.filter(status__in=['completed', 'shipping', 'confirmed'])
    if date_from:
        orders = orders.filter(created_at__gte=date_from)
    if date_to:
        orders = orders.filter(created_at__lt=date_to)
    agg = orders.aggregate(revenue=Sum('total'), count=Count('order_id'))
    return {
        'revenue': float(agg['revenue'] or 0),
        'order_count': agg['count'] or 0
    }


@api_view(['GET'])
def admin_report_overview(request):
    """
    GET /api/admin/reports/overview/
    Tổng quan: hôm nay, tuần này, tháng này, tổng cộng
    """
    if not get_admin_user(request):
        return _no_permission()

    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today_start + timedelta(days=1)

    # Đơn hàng theo trạng thái
    by_status = {}
    for s in ['pending', 'confirmed', 'shipping', 'completed', 'cancelled']:
        by_status[s] = Order.objects.filter(status=s).count()

    return Response({
        'success': True,
        'revenue': {
            'today': _revenue_stats(today_start, tomorrow),
            'this_week': _revenue_stats(week_start),
            'this_month': _revenue_stats(month_start),
            'all_time': _revenue_stats(),
        },
        'orders': {
            'by_status': by_status,
            'total': sum(by_status.values())
        },
        'inventory': {
            'total_products': Product.objects.filter(is_active=True).count(),
            'low_stock_products': Product.objects.filter(is_active=True, stock_quantity__lte=5).count(),
            'total_categories': Category.objects.filter(is_active=True).count(),
        },
        'customers': {
            'total': CustomUser.objects.filter(role='user', is_active=True).count()
        }
    })


@api_view(['GET'])
def admin_report_revenue_by_period(request):
    """
    GET /api/admin/reports/revenue/by_period/
    Doanh thu theo ngày / tháng / năm

    Params:
        period:    day | month | year  (default: day)
        date_from: YYYY-MM-DD
        date_to:   YYYY-MM-DD
    """
    if not get_admin_user(request):
        return _no_permission()

    period = request.query_params.get('period', 'day')
    now = datetime.now()

    date_from = _parse_date(request.query_params.get('date_from', '')) or (now - timedelta(days=29))
    date_to = _parse_date(request.query_params.get('date_to', ''))
    if date_to:
        date_to = date_to.replace(hour=23, minute=59, second=59)
    else:
        date_to = now

    orders = Order.objects.filter(
        created_at__gte=date_from,
        created_at__lte=date_to,
    ).exclude(status='cancelled')

    # Chọn hàm Trunc theo period
    trunc_map = {'year': TruncYear, 'month': TruncMonth, 'day': TruncDay}
    TruncFunc = trunc_map.get(period, TruncDay)

    data_qs = (
        orders
        .annotate(period_label=TruncFunc('created_at'))
        .values('period_label')
        .annotate(
            order_count=Count('order_id'),
            revenue=Sum('total'),
            completed_revenue=Sum(
                'total',
                filter=Q(status='completed')
            )
        )
        .order_by('period_label')
    )

    data = []
    for row in data_qs:
        label = row['period_label']
        if period == 'year':
            label_str = label.strftime('%Y')
        elif period == 'month':
            label_str = label.strftime('%Y-%m')
        else:
            label_str = label.strftime('%Y-%m-%d')

        data.append({
            'period': label_str,
            'order_count': row['order_count'],
            'revenue': float(row['revenue'] or 0),
            'completed_revenue': float(row['completed_revenue'] or 0),
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
            'completed_revenue': sum(d['completed_revenue'] for d in data),
        }
    })


@api_view(['GET'])
def admin_report_top_products(request):
    """
    GET /api/admin/reports/top_products/
    Top sản phẩm bán chạy nhất

    Params:
        limit:     số lượng (default: 10)
        date_from: YYYY-MM-DD
        date_to:   YYYY-MM-DD
    """
    if not get_admin_user(request):
        return _no_permission()

    limit = int(request.query_params.get('limit', 10))
    date_from = _parse_date(request.query_params.get('date_from', ''))
    date_to_raw = _parse_date(request.query_params.get('date_to', ''))
    date_to = date_to_raw.replace(hour=23, minute=59, second=59) if date_to_raw else None

    order_items = OrderItem.objects.exclude(order__status='cancelled')
    if date_from:
        order_items = order_items.filter(order__created_at__gte=date_from)
    if date_to:
        order_items = order_items.filter(order__created_at__lte=date_to)

    top = (
        order_items
        .values('product_id', 'product_name')
        .annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('subtotal'),
            order_count=Count('order_id', distinct=True),
        )
        .order_by('-total_quantity')[:limit]
    )

    data = []
    for i, row in enumerate(top):
        # Lấy thêm thông tin sản phẩm
        try:
            p = Product.objects.select_related('category').get(product_id=row['product_id'])
            image_url = p.image_url
            category_name = p.category.name if p.category else 'Chưa phân loại'
            stock_quantity = p.stock_quantity
            current_price = float(p.price)
        except Product.DoesNotExist:
            image_url = ''
            category_name = ''
            stock_quantity = 0
            current_price = 0

        data.append({
            'rank': i + 1,
            'product_id': row['product_id'],
            'product_name': row['product_name'],
            'image_url': image_url,
            'category_name': category_name,
            'total_quantity': row['total_quantity'],
            'total_revenue': float(row['total_revenue'] or 0),
            'order_count': row['order_count'],
            'stock_quantity': stock_quantity,
            'current_price': current_price,
        })

    return Response({'success': True, 'data': data, 'total': len(data)})


@api_view(['GET'])
def admin_report_by_category(request):
    """
    GET /api/admin/reports/by_category/
    Doanh thu theo danh mục
    """
    if not get_admin_user(request):
        return _no_permission()

    date_from = _parse_date(request.query_params.get('date_from', ''))
    date_to_raw = _parse_date(request.query_params.get('date_to', ''))
    date_to = date_to_raw.replace(hour=23, minute=59, second=59) if date_to_raw else None

    order_items = OrderItem.objects.exclude(order__status='cancelled')
    if date_from:
        order_items = order_items.filter(order__created_at__gte=date_from)
    if date_to:
        order_items = order_items.filter(order__created_at__lte=date_to)

    by_category = (
        order_items
        .values('product__category_id', 'product__category__name')
        .annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('subtotal'),
            order_count=Count('order_id', distinct=True),
            product_count=Count('product_id', distinct=True),
        )
        .order_by('-total_revenue')
    )

    data = []
    total_revenue = sum(float(r['total_revenue'] or 0) for r in by_category)

    for row in by_category:
        rev = float(row['total_revenue'] or 0)
        data.append({
            'category_id': row['product__category_id'],
            'category_name': row['product__category__name'] or 'Chưa phân loại',
            'product_count': row['product_count'],
            'total_quantity': row['total_quantity'],
            'total_revenue': rev,
            'order_count': row['order_count'],
            'percentage': round((rev / total_revenue * 100) if total_revenue > 0 else 0, 2),
        })

    return Response({
        'success': True,
        'data': data,
        'summary': {
            'total_revenue': total_revenue,
            'total_categories': len(data),
        }
    })


@api_view(['GET'])
def admin_report_orders(request):
    """
    GET /api/admin/reports/orders/
    Thống kê đơn hàng theo trạng thái và phương thức thanh toán
    """
    if not get_admin_user(request):
        return _no_permission()

    date_from = _parse_date(request.query_params.get('date_from', ''))
    date_to_raw = _parse_date(request.query_params.get('date_to', ''))
    date_to = date_to_raw.replace(hour=23, minute=59, second=59) if date_to_raw else None

    orders = Order.objects.all()
    if date_from:
        orders = orders.filter(created_at__gte=date_from)
    if date_to:
        orders = orders.filter(created_at__lte=date_to)

    # Theo trạng thái đơn hàng
    by_status = {}
    for s in ['pending', 'confirmed', 'shipping', 'completed', 'cancelled']:
        agg = orders.filter(status=s).aggregate(count=Count('order_id'), revenue=Sum('total'))
        by_status[s] = {
            'count': agg['count'] or 0,
            'revenue': float(agg['revenue'] or 0)
        }

    # Theo phương thức thanh toán
    by_payment = (
        orders
        .values('payment_method')
        .annotate(count=Count('order_id'), revenue=Sum('total'))
        .order_by('-count')
    )

    # Theo trạng thái thanh toán
    by_payment_status = (
        orders
        .values('payment_status')
        .annotate(count=Count('order_id'), revenue=Sum('total'))
        .order_by('-count')
    )

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
            'avg_order_value': float(total_agg['avg_order'] or 0),
        },
        'by_status': by_status,
        'by_payment_method': [
            {
                'payment_method': r['payment_method'],
                'count': r['count'],
                'revenue': float(r['revenue'] or 0)
            } for r in by_payment
        ],
        'by_payment_status': [
            {
                'payment_status': r['payment_status'],
                'count': r['count'],
                'revenue': float(r['revenue'] or 0)
            } for r in by_payment_status
        ],
    })


@api_view(['GET'])
def admin_report_customers(request):
    """
    GET /api/admin/reports/customers/
    Thống kê khách hàng: top mua nhiều, khách mới theo tháng
    """
    if not get_admin_user(request):
        return _no_permission()

    # Top 10 khách hàng chi tiêu nhiều nhất
    top_customers_qs = (
        Order.objects
        .exclude(status='cancelled')
        .exclude(user__isnull=True)
        .values('user__user_id', 'user__full_name', 'user__email', 'user__phone')
        .annotate(
            order_count=Count('order_id'),
            total_spent=Sum('total'),
            last_order_date=Max('created_at'),
        )
        .order_by('-total_spent')[:10]
    )

    top_customers = [
        {
            'user_id': r['user__user_id'],
            'full_name': r['user__full_name'],
            'email': r['user__email'],
            'phone': r['user__phone'],
            'order_count': r['order_count'],
            'total_spent': float(r['total_spent'] or 0),
            'last_order_date': r['last_order_date'].strftime('%Y-%m-%d %H:%M') if r['last_order_date'] else None,
        }
        for r in top_customers_qs
    ]

    # Khách mới theo tháng (6 tháng gần nhất)
    six_months_ago = datetime.now() - timedelta(days=180)
    new_by_month_qs = (
        CustomUser.objects
        .filter(role='user', created_at__gte=six_months_ago)
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(new_customers=Count('user_id'))
        .order_by('month')
    )

    new_by_month = [
        {
            'month': r['month'].strftime('%Y-%m'),
            'new_customers': r['new_customers']
        }
        for r in new_by_month_qs
    ]

    return Response({
        'success': True,
        'summary': {
            'total_customers': CustomUser.objects.filter(role='user', is_active=True).count()
        },
        'top_customers': top_customers,
        'new_customers_by_month': new_by_month,
    })
