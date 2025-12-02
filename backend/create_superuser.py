#!/usr/bin/env python
"""
Script to create a Django superuser
Usage: python create_superuser.py
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'serverConfig.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_superuser():
    print("Creating superuser...")
    print("=" * 50)
    
    # Get user input
    email = input("Email: ").strip()
    if not email:
        print("Email is required!")
        return
    
    # Check if user already exists
    if User.objects.filter(email=email).exists():
        print(f"User with email {email} already exists!")
        response = input("Do you want to make this user a superuser? (y/n): ").strip().lower()
        if response == 'y':
            user = User.objects.get(email=email)
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.save()
            print(f"✓ User {email} is now a superuser!")
            return
        else:
            return
    
    first_name = input("First name: ").strip() or "Admin"
    last_name = input("Last name: ").strip() or "User"
    username = input("Username (optional): ").strip() or None
    
    password = input("Password: ").strip()
    if not password:
        print("Password is required!")
        return
    
    password_confirm = input("Password (again): ").strip()
    if password != password_confirm:
        print("Passwords don't match!")
        return
    
    # Create superuser
    try:
        user = User.objects.create_superuser(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            username=username,
        )
        print(f"\n✓ Superuser created successfully!")
        print(f"  Email: {user.email}")
        print(f"  Name: {user.get_full_name()}")
        print(f"  Staff: {user.is_staff}")
        print(f"  Superuser: {user.is_superuser}")
    except Exception as e:
        print(f"\n✗ Error creating superuser: {e}")

if __name__ == '__main__':
    create_superuser()




