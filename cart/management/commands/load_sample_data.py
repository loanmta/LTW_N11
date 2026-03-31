from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from cart.models import Product, CartItem

class Command(BaseCommand):
    help = 'Load sample data for cart'

    def handle(self, *args, **kwargs):
        # Create or get test user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User'
            }
        )
        if created:
            user.set_password('testpass123')
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created user: testuser'))
        
        # Create products
        products_data = [
            {
                'name': 'ÁO BLAZER PREMIUM RED EDITION',
                'color': 'Đỏ đậm',
                'size': 'M',
                'price': 1290000,
                'image': 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&h=500&fit=crop&q=80'
            },
            {
                'name': 'ÁO KHOÁC MỎNG TƠ WHITE ELEGANCE',
                'color': 'Xanh nhạt',
                'size': 'L',
                'price': 2450000,
                'image': 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=400&h=500&fit=crop&q=80'
            },
            {
                'name': 'ÁO KHOÁC DA BIKER URBAN',
                'color': 'Đen',
                'size': 'L',
                'price': 3100000,
                'image': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop&q=80'
            },
            {
                'name': 'BLAZER MINIMALIST CREAMY WHITE',
                'color': 'Trắng kem',
                'size': 'M',
                'price': 1850000,
                'image': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop&q=80'
            },
            {
                'name': 'ÁO SƠ MI LỤA PREMIUM',
                'color': 'Be',
                'size': 'S',
                'price': 1290000,
                'image': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop&q=80'
            },
            {
                'name': 'QUẦN TÂY ÂU CLASSIC',
                'color': 'Đen',
                'size': 'M',
                'price': 2450000,
                'image': 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=500&fit=crop&q=80'
            },
            {
                'name': 'ĐẦM DỰ TIỆC ELEGANT',
                'color': 'Đen',
                'size': 'M',
                'price': 2450000,
                'image': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop&q=80'
            },
            {
                'name': 'CHÂN VÁY LỤA SATIN',
                'color': 'Đỏ đậm',
                'size': 'L',
                'price': 1850000,
                'image': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop&q=80'
            },
        ]
        
        products = []
        for data in products_data:
            product, created = Product.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            products.append(product)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created product: {product.name}'))
        
        # Create cart items
        CartItem.objects.filter(user=user).delete()  # Clear existing
        
        for i, product in enumerate(products[:3]):  # Add first 3 products to cart
            CartItem.objects.create(
                user=user,
                product=product,
                quantity=1,
                selected=True
            )
            self.stdout.write(self.style.SUCCESS(f'Added to cart: {product.name}'))
        
        self.stdout.write(self.style.SUCCESS('\n=== Sample data loaded successfully ==='))
        self.stdout.write(self.style.SUCCESS('Username: testuser'))
        self.stdout.write(self.style.SUCCESS('Password: testpass123'))

        # Create reviews for first product
        from cart.models import Review
        if products:
            Review.objects.filter(product=products[0]).delete()
            Review.objects.create(
                product=products[0],
                name='Thanh Huyền',
                avatar='https://i.pravatar.cc/150?img=1',
                comment='Chất vải rất đẹp, form áo phù hợp tôn dáng. Màu sắc nay mặc lên sáng, mình rất ưng.',
                rating=5,
                date='1 tháng'
            )
            Review.objects.create(
                product=products[0],
                name='Nguyễn Khánh Linh',
                avatar='https://i.pravatar.cc/150?img=5',
                comment='Blazer lần đầu mặc rất đẹp, chất liệu mềm mại, may rất đẹp và chỉnh chu nhưng cắt thích. Mình 51kg, cao 1m60 mặc size S vừa chuẩn luôn.',
                rating=5,
                date='2 tuần'
            )
            self.stdout.write(self.style.SUCCESS('Created reviews'))
