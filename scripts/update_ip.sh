#!/bin/bash

# Get the current local IP address
# This tries to get the first IP that starts with 192.168. or 10.
CURRENT_IP=$(ip addr show | grep -oE "\b(192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+)\b" | head -n 1)

if [ -z "$CURRENT_IP" ]; then
    echo "Error: Could not detect a valid local IP address (192.168.x.x or 10.x.x.x)."
    exit 1
fi

echo "Detected current network IP: $CURRENT_IP"

# Directories
PROJECT_ROOT="/home/urkelcodes/Desktop/MyProjects/Clients/tajma"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
APP_DIR="$PROJECT_ROOT/app"

# Ensure .env files exist
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "Creating backend/.env from backup..."
    cp "$BACKEND_DIR/.env.backup" "$BACKEND_DIR/.env"
fi

if [ ! -f "$FRONTEND_DIR/.env" ]; then
    echo "Creating frontend/.env..."
    echo "NEXT_PUBLIC_API_URL=http://$CURRENT_IP:8001" > "$FRONTEND_DIR/.env"
fi

if [ ! -f "$APP_DIR/.env" ]; then
    echo "Creating app/.env..."
    echo "EXPO_PUBLIC_API_URL=http://$CURRENT_IP:8001" > "$APP_DIR/.env"
fi

# Files to update with the new IP
FILES=(
    "$APP_DIR/.env"
    "$APP_DIR/package.json"
    "$FRONTEND_DIR/.env"
    "$BACKEND_DIR/.env"
)

# Replace any local IP pattern (192.168.x.x or 10.x.x.x) with the current IP
LOCAL_IP_REGEX="(\b192\.168\.[0-9]+\.[0-9]+\b|\b10\.[0-9]+\.[0-9]+\.[0-9]+\b)"

for FILE in "${FILES[@]}"; do
    if [ -f "$FILE" ]; then
        echo "Updating IP in $FILE..."
        sed -i -E "s/$LOCAL_IP_REGEX/$CURRENT_IP/g" "$FILE"
    else
        echo "Warning: $FILE not found, skipping."
    fi
done

echo "IP update complete. Current IP: $CURRENT_IP"

