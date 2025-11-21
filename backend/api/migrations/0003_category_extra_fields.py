from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_category'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='category_type',
            field=models.CharField(choices=[('product', 'Product'), ('service', 'Service'), ('job', 'Job'), ('cv', 'CV')], default='product', max_length=20),
        ),
        migrations.AddField(
            model_name='category',
            name='custom_fields',
            field=models.JSONField(blank=True, default=list),
        ),
    ]


