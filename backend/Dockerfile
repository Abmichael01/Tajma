# ------------------------------------------------------------------------------
#  Tajma Backend – Production Dockerfile (Dokploy)
# ------------------------------------------------------------------------------

# -- Stage 1: Build Dependencies --
FROM python:3.11-slim-bullseye AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

WORKDIR /app

# Install build essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install poetry>=1.8.0

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Install dependencies (without dev)
RUN poetry lock && poetry install --without dev --no-root && rm -rf $POETRY_CACHE_DIR

# -- Stage 2: Final Runtime --
FROM python:3.11-slim-bullseye AS runtime

ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app" \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install runtime system dependencies for Postgres
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code
COPY . .

# Ensure scripts are executable
RUN chmod +x docker-entrypoint.sh

# Create directories for volumes (if not using Cloudinary for everything)
RUN mkdir -p /app/staticfiles /app/media

EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Default command: Daphne for HTTP + WebSockets
CMD ["daphne", "serverConfig.asgi:application", "--bind", "0.0.0.0", "--port", "8000"]
