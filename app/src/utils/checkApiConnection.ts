import axios from 'axios';

/**
 * Check if the API server is reachable
 * Useful for debugging connection issues
 */
export async function checkApiConnection(): Promise<{
  success: boolean;
  message: string;
  url?: string;
}> {
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
  const testUrl = `${API_BASE_URL}/api/auth/csrf/`;

  try {
    const response = await axios.get(testUrl, {
      timeout: 5000,
      withCredentials: true,
    });
    
    return {
      success: true,
      message: 'API server is reachable',
      url: testUrl,
    };
  } catch (error: any) {
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return {
        success: false,
        message: `Cannot reach API server at ${API_BASE_URL}\n\nPossible issues:\n- Backend server not running\n- Wrong IP address (use your local IP, not localhost)\n- CORS not configured\n- Firewall blocking connection`,
        url: testUrl,
      };
    }
    
    return {
      success: false,
      message: `API connection error: ${error.message}`,
      url: testUrl,
    };
  }
}

