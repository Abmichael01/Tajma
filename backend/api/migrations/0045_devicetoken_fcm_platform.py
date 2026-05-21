from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0044_remove_chat_is_muted'),
    ]

    operations = [
        migrations.AlterField(
            model_name='devicetoken',
            name='platform',
            field=models.CharField(
                choices=[
                    ('expo', 'Expo (iOS/Android)'),
                    ('web', 'Web Push'),
                    ('fcm', 'Firebase Cloud Messaging (native iOS/Android)'),
                ],
                max_length=10,
            ),
        ),
    ]
