from django.db import migrations


def fix_avatar_urls(apps, schema_editor):
    """Update all review avatar URLs to use correct path"""
    Review = apps.get_model('cart', 'Review')
    Review.objects.filter(avatar_url='/assets/images/avatar.svg').update(
        avatar_url='/user/assets/images/avatar.svg'
    )


def revert_avatar_urls(apps, schema_editor):
    """Revert avatar URLs back to old path"""
    Review = apps.get_model('cart', 'Review')
    Review.objects.filter(avatar_url='/user/assets/images/avatar.svg').update(
        avatar_url='/assets/images/avatar.svg'
    )


class Migration(migrations.Migration):

    dependencies = [
        ('cart', '0003_add_sample_reviews'),
    ]

    operations = [
        migrations.RunPython(fix_avatar_urls, revert_avatar_urls),
    ]
