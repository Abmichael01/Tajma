import type { Ad as BackendAd } from '@/api/types'
import type { Ad as FrontendAd } from '@/data/mockAds'

/**
 * Converts backend Ad format to frontend Ad format
 */
export function transformBackendAdToFrontend(backendAd: BackendAd): FrontendAd {
  // Format price with currency
  let formattedPrice = 'Contact for price'
  if (backendAd.price) {
    try {
      // Handle both string and number prices
      const priceValue = typeof backendAd.price === 'string' 
        ? parseFloat(backendAd.price.replace(/[^0-9.]/g, ''))
        : parseFloat(String(backendAd.price))
      
      if (!isNaN(priceValue) && priceValue > 0) {
        formattedPrice = `${backendAd.currency || 'XOF'} ${Math.floor(priceValue).toLocaleString()}`
      }
    } catch (e) {
      console.warn('Error formatting price:', e, backendAd.price)
    }
  }

  // Get first image or placeholder
  const imageUrl = backendAd.images && backendAd.images.length > 0
    ? backendAd.images[0]
    : 'https://via.placeholder.com/400x300?text=No+Image'

  // Extract location from seller or use default
  const location = backendAd.seller?.location || 'Location not specified'
  
  // Parse location to extract city and region if possible
  const locationParts = location.split(',').map(s => s.trim())
  const city = locationParts[0] || ''
  const region = locationParts[1] || locationParts[0] || ''

  // Get category name from category_details or use slug
  const category = backendAd.category_details?.name || backendAd.category || 'uncategorized'
  
  // Extract subcategory from category_path if available
  const subcategory = backendAd.category_path && backendAd.category_path.length > 1
    ? backendAd.category_path[backendAd.category_path.length - 1].slug
    : undefined

  // Format posted date
  const postedDate = backendAd.created_at || backendAd.published_at || new Date().toISOString()

  return {
    id: backendAd.id.toString(),
    slug: backendAd.slug,
    title: backendAd.title,
    price: formattedPrice,
    location: location,
    region: region.toLowerCase().replace(/\s+/g, '-'),
    city: city,
    imageUrl: imageUrl,
    views: backendAd.views || 0,
    category: category.toLowerCase().replace(/\s+/g, '-'),
    subcategory: subcategory,
    condition: backendAd.attributes?.condition as string | undefined,
    brand: backendAd.attributes?.brand as string | undefined,
    description: backendAd.description,
    postedDate: postedDate,
    userId: backendAd.seller?.id?.toString(),
    userName: backendAd.seller?.full_name || `${backendAd.seller?.first_name || ''} ${backendAd.seller?.last_name || ''}`.trim() || backendAd.seller?.email || 'Unknown',
    status: backendAd.status === 'published' ? 'active' : 
            backendAd.status === 'archived' ? 'expired' : 
            backendAd.status === 'draft' ? 'pending' :
            backendAd.status === 'sold' ? 'sold' :
            'pending' as 'active' | 'sold' | 'expired' | 'pending',
    favorites: 0, // Backend doesn't provide this yet
    messages: 0, // Backend doesn't provide this yet
  }
}

/**
 * Converts an array of backend ads to frontend format
 */
export function transformBackendAdsToFrontend(backendAds: BackendAd[]): FrontendAd[] {
  return backendAds.map(transformBackendAdToFrontend)
}

