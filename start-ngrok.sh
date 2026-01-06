#!/bin/bash

# Start ngrok tunnel for backend server
# This creates an HTTPS tunnel required for Google OAuth on mobile

echo "🚀 Starting ngrok tunnel for backend..."
echo ""
echo "⚠️  IMPORTANT: After ngrok starts, you need to:"
echo "   1. Copy the HTTPS URL (e.g., https://abc123xyz.ngrok-free.app)"
echo "   2. Update app/.env with: EXPO_PUBLIC_API_URL=https://YOUR_NGROK_URL"
echo "   3. Add https://YOUR_NGROK_URL/api/auth/google/callback to Google Cloud Console"
echo ""
echo "Starting tunnel..."
echo ""

ngrok http 8005
