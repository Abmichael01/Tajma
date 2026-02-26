#!/bin/bash

# Get the current local IP address
# This tries to get the first IP that starts with 192.168.
CURRENT_IP=$(hostname -I | grep -oE "\b192\.168\.[0-9]+\.[0-9]+\b" | head -n 1)

if [ -z "$CURRENT_IP" ]; then
    echo "Error: Could not detect a valid 192.168.x.x IP address."
    exit 1
fi

echo "Detected current network IP: $CURRENT_IP"

# Files to update
FILES=(
    "app/.env"
    "frontend/.env"
    "frontend/next.config.ts"
    "backend/.env"
)

# Replace any 192.168.1.x with the current IP
# We use a regex to find previous IPs
OLD_IP_REGEX="192\.168\.[0-9]+\.[0-9]+"

for FILE in "${FILES[@]}"; do
    if [ -f "$FILE" ]; then
        echo "Updating $FILE..."
        # Update the file in-place
        sed -i -E "s/$OLD_IP_REGEX/$CURRENT_IP/g" "$FILE"
    else
        echo "Warning: $FILE not found, skipping."
    fi
done

echo "IP update complete."
