#!/bin/bash
set -euo pipefail

# Source bashrc for Poetry
source /home/devuser/.bashrc 2>/dev/null || true

# Set PATH
export PATH="$HOME/.local/bin:$PATH"

# Load environment variables from .env
export $(cat /var/www/Tajma/backend/.env | grep -v '^#' | xargs)

# Set production environment
export ENV=production

# Change to backend directory
cd /var/www/Tajma/backend

# Start Daphne on port 8001 (8000 is used by nigercanton-backend)
exec poetry run daphne -b 0.0.0.0 -p 8001 serverConfig.asgi:application --access-log -

