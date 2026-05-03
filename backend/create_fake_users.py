import os, sys, django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'serverConfig.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

usernames = ['alice', 'bob', 'charlie', 'diana', 'eve']
for name in usernames:
    email = f"{name}@example.com"
    if not User.objects.filter(email=email).exists():
        u = User.objects.create_user(email=email, password='password123', first_name=name.capitalize(), last_name='User')
        print(f"Created user: {email}")
    else:
        print(f"User {email} already exists")
