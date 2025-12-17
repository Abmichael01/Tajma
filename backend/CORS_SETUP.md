# CORS Configuration for React Native/Expo

## Current Configuration

The Django backend is configured to accept requests from:
- Frontend (Next.js): `http://localhost:3000`, `http://127.0.0.1:3000`
- Expo Dev Server: `http://localhost:8081`, `http://127.0.0.1:8081`
- Expo Go: `exp://4zeu84i-urkelcodes-8081.exp.direct`

## For Physical Devices

When testing on a physical device, you need to add your computer's local IP address to CORS settings.

### Steps:

1. **Find your local IP address:**
   ```bash
   # Mac/Linux:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows:
   ipconfig
   ```
   Example: `192.168.1.100`

2. **Update backend `.env` file** (create if it doesn't exist in `backend/` directory):
   ```env
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8081,http://127.0.0.1:8081,http://192.168.1.100:8081,exp://4zeu84i-urkelcodes-8081.exp.direct
   CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8081,http://127.0.0.1:8081,http://192.168.1.100:8081
   ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.100
   ```
   Replace `192.168.1.100` with your actual IP address.

3. **Update React Native app `.env` file** (in `app/` directory):
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
   ```
   Replace `192.168.1.100` with your actual IP address.

4. **Restart both servers:**
   - Django backend
   - Expo dev server

## Testing

After updating, test the connection:
1. Open the login screen in your React Native app
2. Check the console for API connection status
3. Try logging in - it should now connect to the backend

## Troubleshooting

### Still getting CORS errors?
- Make sure you restarted the Django server after updating `.env`
- Verify the IP address is correct (it can change if you reconnect to WiFi)
- Check that both devices are on the same network
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For iOS simulator, `localhost` should work

### Network errors?
- Ensure Django server is running on port 8000
- Check firewall isn't blocking port 8000
- Verify the IP address in `.env` matches your current network IP

