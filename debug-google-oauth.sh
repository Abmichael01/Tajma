#!/bin/bash

# Google OAuth Debug Script
# Run this to check your current configuration and test the OAuth flow

echo "=== Google OAuth Configuration Check ==="
echo ""

# Check backend configuration
echo "1. Backend Configuration (.env):"
echo "--------------------------------"
cd backend
if [ -f .env ]; then
    echo "✓ .env file found"
    echo "GOOGLE_OAUTH_CLIENT_ID: $(grep GOOGLE_OAUTH_CLIENT_ID .env | cut -d'=' -f2)"
    echo "GOOGLE_OAUTH_CLIENT_SECRET: $(grep GOOGLE_OAUTH_CLIENT_SECRET .env | cut -d'=' -f2 | sed 's/./*/g')"
    echo "FRONTEND_URL: $(grep FRONTEND_URL .env | cut -d'=' -f2)"
else
    echo "✗ .env file NOT found!"
fi
echo ""

# Check frontend configuration
echo "2. Frontend Configuration:"
echo "-------------------------"
cd ../frontend
if [ -f .env.local ]; then
    echo "✓ .env.local found"
    grep NEXT_PUBLIC_API_URL .env.local || echo "NEXT_PUBLIC_API_URL not set"
elif [ -f .env ]; then
    echo "✓ .env found"
    grep NEXT_PUBLIC_API_URL .env || echo "NEXT_PUBLIC_API_URL not set"
else
    echo "✗ No .env file found!"
fi
echo ""

# Expected redirect URIs
echo "3. Required Google Cloud Console Redirect URIs:"
echo "-----------------------------------------------"
echo "For Frontend (Next.js):"
echo "  - http://localhost:3000/auth/google/callback"
echo "  - http://localhost:3005/auth/google/callback (if using different port)"
echo ""
echo "For Mobile (Expo):"
echo "  - Will need expo-auth-session redirect URI (to be configured)"
echo ""

echo "4. Testing Steps:"
echo "----------------"
echo "1. Go to Google Cloud Console: https://console.cloud.google.com"
echo "2. Navigate to: APIs & Services > Credentials"
echo "3. Find your OAuth 2.0 Client ID"
echo "4. Check 'Authorized redirect URIs' section"
echo "5. Ensure the URIs listed above are added"
echo ""

echo "5. Quick Test:"
echo "-------------"
echo "Visit: http://localhost:3000/login"
echo "Click 'Continue with Google'"
echo "Watch browser console for errors"
echo ""

cd ..
