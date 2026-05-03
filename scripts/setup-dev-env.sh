#!/bin/bash

# Configuration
PORT_RANGE_MIN=8010
PORT_RANGE_MAX=8090
PROJECT_ROOT="/home/urkelcodes/Desktop/MyProjects/Clients/tajma"

# Function to find a random available port
find_free_port() {
    local port
    while true; do
        port=$(shuf -i $PORT_RANGE_MIN-$PORT_RANGE_MAX -n 1)
        if ! ss -tuln | grep -q ":$port "; then
            echo "$port"
            return
        fi
    done
}

# 1. Detect Local IP (Prioritizing wlan0)
CURRENT_IP=$(ip -4 addr show wlan0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1)

# Fallback to any local IP if wlan0 fails
if [ -z "$CURRENT_IP" ]; then
    CURRENT_IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$CURRENT_IP" ]; then
    echo "Error: Could not detect a valid local IP address."
    exit 1
fi

echo "🚀 [Setup] Detected local IP: $CURRENT_IP"

# 2. Generate Unique Ports (Preserving existing if possible)
if [ -f "$PROJECT_ROOT/.backend_port" ]; then
    BACKEND_PORT=$(cat "$PROJECT_ROOT/.backend_port")
else
    BACKEND_PORT=$(find_free_port)
fi

if [ -f "$PROJECT_ROOT/.frontend_port" ]; then
    FRONTEND_PORT=$(cat "$PROJECT_ROOT/.frontend_port")
else
    FRONTEND_PORT=$(find_free_port)
fi

echo "📌 [Setup] Using Backend Port: $BACKEND_PORT"
echo "📌 [Setup] Using Frontend Port: $FRONTEND_PORT"

# 3. Update Backend .env
BACKEND_ENV="$PROJECT_ROOT/backend/.env"
if [ -f "$BACKEND_ENV" ]; then
    echo "📝 [Setup] Updating Backend .env..."

    # Update CORS and CSRF
    LOCAL_URLS="http://localhost:3000,http://127.0.0.1:3000,http://localhost:3005,http://localhost:$FRONTEND_PORT,http://127.0.0.1:$FRONTEND_PORT,http://$CURRENT_IP:$FRONTEND_PORT"
    sed -i "s|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=$LOCAL_URLS,https://tajma.net,https://www.tajma.net|" "$BACKEND_ENV"
    sed -i "s|^CSRF_TRUSTED_ORIGINS=.*|CSRF_TRUSTED_ORIGINS=$LOCAL_URLS,https://tajma.net,https://www.tajma.net|" "$BACKEND_ENV"
    
    # Update ALLOWED_HOSTS if needed (ensure IP is in there)
    if ! grep -q "$CURRENT_IP" "$BACKEND_ENV"; then
        sed -i "s|^ALLOWED_HOSTS=.*|&,$CURRENT_IP|" "$BACKEND_ENV"
    fi
fi

# 4. Update Frontend .env.local
FRONTEND_ENV="$PROJECT_ROOT/frontend/.env.local"
if [ -f "$FRONTEND_ENV" ]; then
    echo "📝 [Setup] Updating Frontend .env.local..."
    # Update Dynamic Image Pattern Variables
    if grep -q "NEXT_PUBLIC_DYNAMIC_HOSTNAME" "$FRONTEND_ENV"; then
        sed -i "s|^NEXT_PUBLIC_DYNAMIC_HOSTNAME=.*|NEXT_PUBLIC_DYNAMIC_HOSTNAME=$CURRENT_IP|" "$FRONTEND_ENV"
        sed -i "s|^NEXT_PUBLIC_DYNAMIC_PORT=.*|NEXT_PUBLIC_DYNAMIC_PORT=$BACKEND_PORT|" "$FRONTEND_ENV"
    else
        echo "NEXT_PUBLIC_DYNAMIC_HOSTNAME=$CURRENT_IP" >> "$FRONTEND_ENV"
        echo "NEXT_PUBLIC_DYNAMIC_PORT=$BACKEND_PORT" >> "$FRONTEND_ENV"
    fi
fi

# 5. Update/Create App .env
APP_ENV="$PROJECT_ROOT/app/.env"
echo "📝 [Setup] Updating App .env..."
cat > "$APP_ENV" <<EOF
EXPO_PUBLIC_API_URL=http://$CURRENT_IP:$BACKEND_PORT
EOF

# Store the ports for the VS Code tasks
echo "$BACKEND_PORT" > "$PROJECT_ROOT/.backend_port"
echo "$FRONTEND_PORT" > "$PROJECT_ROOT/.frontend_port"
# 6. Ensure App dependencies are installed
if [ ! -d "$PROJECT_ROOT/app/node_modules" ]; then
    echo "📦 [Setup] App node_modules missing. Installing..."
    cd "$PROJECT_ROOT/app" && npx -y pnpm install
    cd "$PROJECT_ROOT"
fi

echo "✅ [Setup] Environment successfully synchronized."
