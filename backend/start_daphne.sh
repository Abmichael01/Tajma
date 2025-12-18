#!/bin/bash
set -euo pipefail

# Source bashrc for Poetry
source /home/devuser/.bashrc 2>/dev/null || true

# Set PATH
export PATH="$HOME/.local/bin:$PATH"

# Load environment variables from .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Set production environment
export ENV=production

# Change to backend directory (ensure we are in the right place)
cd "$(dirname "$0")"

# Start Daphne on port 8001 (8000 is used by nigercanton-backend)
exec poetry run daphne -b 0.0.0.0 -p 8001 serverConfig.asgi:application --access-log -

