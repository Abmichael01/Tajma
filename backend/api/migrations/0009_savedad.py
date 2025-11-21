# Generated manually

from django.conf import settings
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0008_alter_chat_unique_together_message_delivered_at_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='SavedAd',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('ad', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saved_by_users', to='api.ad')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saved_ads', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'saved_ads',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='savedad',
            index=models.Index(fields=['user', '-created_at'], name='api_savedad_user_id_created_idx'),
        ),
        migrations.AddIndex(
            model_name='savedad',
            index=models.Index(fields=['ad'], name='api_savedad_ad_id_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='savedad',
            unique_together={('user', 'ad')},
        ),
    ]


