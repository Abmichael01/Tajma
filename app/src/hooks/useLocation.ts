import { useState, useEffect } from 'react'

interface LocationData {
  city: string
  region: string
  country: string
  countryCode: string
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Try to get location from IP-based geolocation API
    const fetchLocation = async () => {
      try {
        // Using ipapi.co - free tier allows 1000 requests/day
        const response = await fetch('https://ipapi.co/json/')
        
        if (!response.ok) {
          throw new Error('Failed to fetch location')
        }

        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.reason || 'Location service unavailable')
        }

        setLocation({
          city: data.city || 'Unknown',
          region: data.region || '',
          country: data.country_name || 'Unknown',
          countryCode: data.country_code || '',
        })
        setError(null)
      } catch (err) {
        console.error('Error fetching location:', err)
        setError(err instanceof Error ? err.message : 'Failed to get location')
        // Fallback to default location
        setLocation({
          city: 'Niamey',
          region: '',
          country: 'Niger',
          countryCode: 'NE',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLocation()
  }, [])

  const getLocationString = (): string => {
    if (!location) return 'Niamey, Niger'
    
    if (location.city && location.country) {
      return `${location.city}, ${location.country}`
    }
    return location.country || 'Niamey, Niger'
  }

  const getShortLocationString = (): string => {
    if (!location) return 'Niamey'
    return location.city || 'Niamey'
  }

  return {
    location,
    loading,
    error,
    getLocationString,
    getShortLocationString,
  }
}
