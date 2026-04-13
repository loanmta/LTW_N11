from django.db import migrations
from datetime import datetime, timedelta
import random


def add_sample_reviews(apps, schema_editor):
    Product = apps.get_model('cart', 'Product')
    Review = apps.get_model('cart', 'Review')
    
    # Sample reviews data
    sample_reviews = [
        {
            'name': 'Thanh Huyền',
            'rating': 5,
            'comment': 'Sản phẩm rất đẹp, chất lượng tốt. Mặc vừa vặn, form dáng chuẩn tôn dáng. Màu đỏ mặc lên điều sang, mình rất ưng.',
        },
        {
            'name': 'Nguyễn Khánh Linh',
            'rating': 5,
            'comment': 'Blazer lên dáng rất đẹp, chất liệu mềm mịn, may rất đẹp cả chỉ chú mình cất tích. Mình 51kg, cao 1m60 mặc size S vừa chuẩn luôn.',
        },
        {
            'name': 'Minh Anh',
            'rating': 4,
            'comment': 'Chất vải đẹp, form áo vừa vặn. Giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop tiếp.',
        },
        {
            'name': 'Thu Trang',
            'rating': 5,
            'comment': 'Áo đẹp lắm, mặc lên sang trọng. Chất liệu tốt, không nhăn. Rất hài lòng với sản phẩm.',
        },
        {
            'name': 'Phương Anh',
            'rating': 4,
            'comment': 'Sản phẩm đúng như mô tả, chất lượng tốt. Màu sắc đẹp, form dáng chuẩn.',
        },
        {
            'name': 'Hương Giang',
            'rating': 5,
            'comment': 'Chất liệu cao cấp, mặc rất thoải mái. Shop giao hàng nhanh, đóng gói đẹp.',
        },
        {
            'name': 'Lan Anh',
            'rating': 4,
            'comment': 'Sản phẩm đẹp, giá hợp lý. Mình rất thích, sẽ mua thêm.',
        },
        {
            'name': 'Quỳnh Như',
            'rating': 5,
            'comment': 'Chất vải mềm mại, form dáng đẹp. Mặc lên rất sang, mình rất hài lòng.',
        }
    ]
    
    # Get all active products
    products = Product.objects.filter(is_active=True)
    
    for product in products:
        # Add exactly 2 reviews per product
        selected_reviews = random.sample(sample_reviews, 2)
        
        for i, review_data in enumerate(selected_reviews):
            # Create review with date in the past (1-30 days ago)
            days_ago = random.randint(1, 30)
            created_at = datetime.now() - timedelta(days=days_ago)
            
            Review.objects.create(
                product=product,
                name=review_data['name'],
                rating=review_data['rating'],
                comment=review_data['comment'],
                avatar_url='/assets/images/avatar.svg',
                is_verified=True,
                created_at=created_at
            )


def remove_sample_reviews(apps, schema_editor):
    Review = apps.get_model('cart', 'Review')
    Review.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('cart', '0002_alter_product_image_2_url_alter_product_image_3_url_and_more'),
    ]

    operations = [
        migrations.RunPython(add_sample_reviews, remove_sample_reviews),
    ]
