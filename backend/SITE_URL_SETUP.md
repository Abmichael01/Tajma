# SITE_URL Configuration Guide

## Problem
The warning `"SITE_URL not configured, using fallback localhost URL"` appears because the `SITE_URL` environment variable is not set in production. This causes ad images in chat to have incorrect URLs.

## Solution

### For Production

Set the `SITE_URL` environment variable to your production backend URL.

**Option 1: Set in your production environment (recommended)**

If your backend is at `https://tajma.net`:
```bash
export SITE_URL=https://tajma.net
```

If your backend is at `https://api.tajma.net`:
```bash
export SITE_URL=https://api.tajma.net
```

**Option 2: Add to your .env file (if using one)**

Create or update `backend/.env`:
```env
SITE_URL=https://tajma.net
# or
SITE_URL=https://api.tajma.net
```

**Option 3: Set in your deployment platform**

- **Docker**: Add to `docker-compose.yml` or Dockerfile
- **Heroku**: `heroku config:set SITE_URL=https://tajma.net`
- **AWS/EC2**: Add to `/etc/environment` or use systemd service file
- **Nginx/Gunicorn**: Add to your service file or environment file

### For Development

The default `http://localhost:8000` is fine for local development, but you can also set it explicitly:

```env
SITE_URL=http://localhost:8000
```

## How to Verify

After setting `SITE_URL`, restart your Django server and check the logs. The warning should disappear, and ad images in chat should have correct absolute URLs.

## Current Settings Location

The setting is defined in:
- File: `backend/serverConfig/settings.py`
- Line: 241
- Code: `SITE_URL = os.getenv('SITE_URL', 'http://localhost:8000')`

## What SITE_URL is Used For

- Generating absolute URLs for ad images in chat serializers
- Building full URLs for media files when request context is not available
- Used in `ChatSerializer.get_ad_image()` method


