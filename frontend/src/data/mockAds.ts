export interface Ad {
  id: string
  slug?: string // URL-friendly identifier
  title: string
  price: string
  location: string
  region: string
  city: string
  imageUrl: string
  views?: number
  isFavorite?: boolean
  category: string
  subcategory?: string
  condition?: string
  brand?: string
  description?: string
  postedDate?: string
  userId?: string
  userName?: string
  status?: 'active' | 'sold' | 'expired' | 'pending'
  favorites?: number
  messages?: number
}

export const mockAds: Ad[] = [
  // Electronics
  {
    id: "1",
    title: "iPhone 14 Pro Max 256GB - Space Black",
    price: "₦850,000",
    location: "Victoria Island, Niamey",
    region: "niamey",
    city: "Victoria Island",
    imageUrl: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400",
    views: 245,
    category: "electronics",
    subcategory: "mobile-phones",
    condition: "new",
    brand: "Apple",
    description: "Brand new iPhone 14 Pro Max in Space Black. 256GB storage, unlocked, with original accessories and warranty.",
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "john_doe_123",
    userName: "John Doe"
  },
  {
    id: "4",
    title: "MacBook Pro M2 14-inch - Like New",
    price: "₦1,200,000",
    location: "Surulere, Niamey",
    region: "niamey",
    city: "Surulere",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    views: 189,
    category: "electronics",
    subcategory: "computers-laptops",
    condition: "like-new",
    brand: "Apple",
    description: "MacBook Pro M2 14-inch, barely used, perfect condition with original box.",
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "sarah_johnson",
    userName: "Sarah Johnson"
  },
  {
    id: "5",
    title: "Samsung Galaxy S23 Ultra 512GB",
    price: "₦950,000",
    location: "Gbagada, Niamey",
    region: "niamey",
    city: "Gbagada",
    imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400",
    views: 432,
    category: "electronics",
    subcategory: "mobile-phones",
    condition: "excellent",
    brand: "Samsung",
    description: "Samsung Galaxy S23 Ultra, 512GB, excellent condition with S-Pen.",
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "michael_chen",
    userName: "Michael Chen"
  },
  {
    id: "8",
    title: "Dell XPS 13 Laptop - 2023 Model",
    price: "₦780,000",
    location: "Yaba, Niamey",
    region: "niamey",
    city: "Yaba",
    imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
    views: 156,
    category: "electronics",
    subcategory: "computers-laptops",
    condition: "good",
    brand: "Dell",
    description: "Dell XPS 13, 2023 model, i7 processor, 16GB RAM.",
    postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "john_doe_123",
    userName: "John Doe"
  },
  {
    id: "11",
    title: "Sony PlayStation 5 - Brand New",
    price: "₦450,000",
    location: "Alaba, Niamey",
    region: "niamey",
    city: "Alaba",
    imageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400",
    views: 678,
    category: "electronics",
    subcategory: "video-games",
    condition: "new",
    brand: "Sony",
    description: "Brand new PlayStation 5 console with controller and games.",
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "sarah_johnson",
    userName: "Sarah Johnson"
  },
  
  // Vehicles
  {
    id: "2",
    title: "Toyota Camry 2020 - Clean Title",
    price: "₦8,500,000",
    location: "Ikoyi, Niamey",
    region: "niamey",
    city: "Ikoyi",
    imageUrl: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400",
    views: 1203,
    category: "vehicles",
    subcategory: "cars",
    condition: "excellent",
    brand: "Toyota",
    description: "Toyota Camry 2020, clean title, well maintained, automatic transmission.",
    postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "michael_chen",
    userName: "Michael Chen"
  },
  {
    id: "6",
    title: "Honda Accord 2019 - Excellent Condition",
    price: "₦6,800,000",
    location: "Ikeja, Niamey",
    region: "niamey",
    city: "Ikeja",
    imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400",
    views: 892,
    category: "vehicles",
    subcategory: "cars",
    condition: "excellent",
    brand: "Honda",
    description: "Honda Accord 2019, excellent condition, low mileage.",
    postedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "john_doe_123",
    userName: "John Doe"
  },
  {
    id: "9",
    title: "Mercedes Benz C-Class 2021",
    price: "₦15,500,000",
    location: "Ikoyi, Niamey",
    region: "niamey",
    city: "Ikoyi",
    imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400",
    views: 2103,
    category: "vehicles",
    subcategory: "cars",
    condition: "like-new",
    brand: "Mercedes",
    description: "Mercedes Benz C-Class 2021, like new condition, fully loaded.",
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "sarah_johnson",
    userName: "Sarah Johnson"
  },
  {
    id: "12",
    title: "Nissan Altima 2020 - Clean Title",
    price: "₦4,200,000",
    location: "Ojodu, Niamey",
    region: "niamey",
    city: "Ojodu",
    imageUrl: "https://images.unsplash.com/photo-1549317336-206569e8475c?w=400",
    views: 321,
    category: "vehicles",
    subcategory: "cars",
    condition: "good",
    brand: "Nissan",
    description: "Nissan Altima 2020, good condition, clean title.",
    postedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "michael_chen",
    userName: "Michael Chen"
  },
  
  // Property
  {
    id: "3",
    title: "3 Bedroom Apartment for Rent",
    price: "₦2,500,000/yr",
    location: "Lekki Phase 1, Niamey",
    region: "niamey",
    city: "Lekki",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
    views: 567,
    category: "property",
    subcategory: "houses-rent",
    description: "Spacious 3 bedroom apartment in Lekki Phase 1, serviced.",
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "john_doe_123",
    userName: "John Doe"
  },
  {
    id: "7",
    title: "2 Bedroom Duplex for Sale",
    price: "₦45,000,000",
    location: "Banana Island, Niamey",
    region: "niamey",
    city: "Banana Island",
    imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400",
    views: 1234,
    category: "property",
    subcategory: "houses-sale",
    description: "Luxury 2 bedroom duplex in Banana Island with pool and gym.",
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "sarah_johnson",
    userName: "Sarah Johnson"
  },
  {
    id: "10",
    title: "Studio Apartment for Rent",
    price: "₦800,000/yr",
    location: "Magodo, Niamey",
    region: "niamey",
    city: "Magodo",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
    views: 445,
    category: "property",
    subcategory: "houses-rent",
    description: "Cozy studio apartment in Magodo, fully furnished.",
    postedDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "michael_chen",
    userName: "Michael Chen"
  },

  // Fashion
  {
    id: "13",
    title: "Nike Air Jordan 1 - Size 42",
    price: "₦85,000",
    location: "Surulere, Niamey",
    region: "niamey",
    city: "Surulere",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    views: 234,
    category: "fashion",
    subcategory: "shoes",
    condition: "new",
    brand: "Nike",
    description: "Brand new Nike Air Jordan 1, size 42, original packaging.",
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "john_doe_123",
    userName: "John Doe"
  },
  {
    id: "14",
    title: "Gucci Handbag - Authentic",
    price: "₦350,000",
    location: "Victoria Island, Niamey",
    region: "niamey",
    city: "Victoria Island",
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400",
    views: 567,
    category: "fashion",
    subcategory: "bags",
    condition: "like-new",
    brand: "Gucci",
    description: "Authentic Gucci handbag, like new condition with certificate.",
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "sarah_johnson",
    userName: "Sarah Johnson"
  },

  // Home & Furniture
  {
    id: "15",
    title: "Modern L-Shaped Sofa - Grey",
    price: "₦280,000",
    location: "Ikeja, Niamey",
    region: "niamey",
    city: "Ikeja",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
    views: 178,
    category: "home-furniture",
    subcategory: "furniture",
    condition: "good",
    description: "Modern L-shaped sofa in grey, comfortable and stylish.",
    postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "michael_chen",
    userName: "Michael Chen"
  },
  {
    id: "16",
    title: "LG 43 Inch Smart TV - 4K",
    price: "₦250,000",
    location: "Yaba, Niamey",
    region: "niamey",
    city: "Yaba",
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400",
    views: 312,
    category: "home-furniture",
    subcategory: "home-appliances",
    condition: "excellent",
    brand: "LG",
    description: "LG 43 inch 4K Smart TV, excellent condition, barely used.",
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "john_doe_123",
    userName: "John Doe"
  },

  // More in Abuja
  {
    id: "17",
    title: "iPhone 13 Pro 128GB",
    price: "₦650,000",
    location: "Wuse 2, Abuja",
    region: "niamey",
    city: "Wuse 2",
    imageUrl: "https://images.unsplash.com/photo-1632633173522-47456de71b76?w=400",
    views: 198,
    category: "electronics",
    subcategory: "mobile-phones",
    condition: "excellent",
    brand: "Apple",
    description: "iPhone 13 Pro, 128GB, excellent condition.",
    postedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "john_doe_123",
    userName: "John Doe"
  },
  {
    id: "18",
    title: "Honda CRV 2021",
    price: "₦12,000,000",
    location: "Maitama, Abuja",
    region: "niamey",
    city: "Maitama",
    imageUrl: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400",
    views: 892,
    category: "vehicles",
    subcategory: "cars",
    condition: "like-new",
    brand: "Honda",
    description: "Honda CRV 2021, like new, low mileage, well maintained.",
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "sarah_johnson",
    userName: "Sarah Johnson"
  },

  // Fashion & Sports
  {
    id: "19",
    title: "Adidas Ultraboost Running Shoes",
    price: "₦45,000",
    location: "Gbagada, Niamey",
    region: "niamey",
    city: "Gbagada",
    imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400",
    views: 123,
    category: "fashion",
    subcategory: "shoes",
    condition: "good",
    brand: "Adidas",
    description: "Adidas Ultraboost running shoes, size 43, good condition.",
    postedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "michael_chen",
    userName: "Michael Chen"
  },
  {
    id: "20",
    title: "Gym Equipment Set - Home Workout",
    price: "₦120,000",
    location: "Lekki, Niamey",
    region: "niamey",
    city: "Lekki",
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400",
    views: 267,
    category: "sports-hobbies",
    subcategory: "gym-fitness",
    condition: "good",
    description: "Complete home gym equipment set including dumbbells, bench, and mat.",
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    userId: "john_doe_123",
    userName: "John Doe"
  }
]

// Helper function to filter ads
export const filterAds = (
  ads: Ad[],
  filters: {
    category?: string
    subcategory?: string
    searchQuery?: string
    location?: string
    region?: string
    priceRange?: { min?: number; max?: number }
    condition?: string[]
    brand?: string[]
  }
) => {
  return ads.filter((ad) => {
    // Category filter
    if (filters.category && ad.category !== filters.category) {
      return false
    }

    // Subcategory filter
    if (filters.subcategory && ad.subcategory !== filters.subcategory) {
      return false
    }

    // Search query (title, description, category)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      const searchableText = `${ad.title} ${ad.description} ${ad.category}`.toLowerCase()
      if (!searchableText.includes(query)) {
        return false
      }
    }

    // Location filter (city or full location)
    if (filters.location) {
      const locationQuery = filters.location.toLowerCase()
      if (!ad.location.toLowerCase().includes(locationQuery) && 
          !ad.city.toLowerCase().includes(locationQuery)) {
        return false
      }
    }

    // Region filter
    if (filters.region && ad.region !== filters.region) {
      return false
    }

    // Price range filter
    if (filters.priceRange) {
      const priceNum = parseInt(ad.price.replace(/[₦,]/g, ''))
      if (filters.priceRange.min && priceNum < filters.priceRange.min) {
        return false
      }
      if (filters.priceRange.max && priceNum > filters.priceRange.max) {
        return false
      }
    }

    // Condition filter
    if (filters.condition && filters.condition.length > 0) {
      if (!ad.condition || !filters.condition.includes(ad.condition)) {
        return false
      }
    }

    // Brand filter
    if (filters.brand && filters.brand.length > 0) {
      if (!ad.brand || !filters.brand.includes(ad.brand.toLowerCase())) {
        return false
      }
    }

    return true
  })
}

// Helper function to sort ads
export const sortAds = (ads: Ad[], sortBy: 'newest' | 'oldest' | 'price-low' | 'price-high' | 'views' | 'title') => {
  const sorted = [...ads]
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.postedDate || 0).getTime()
        const dateB = new Date(b.postedDate || 0).getTime()
        return dateB - dateA
      })
    case 'oldest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.postedDate || 0).getTime()
        const dateB = new Date(b.postedDate || 0).getTime()
        return dateA - dateB
      })
    case 'price-low':
      return sorted.sort((a, b) => {
        // Handle "Contact for price" and different currency formats
        if (a.price === 'Contact for price' || !a.price) return 1
        if (b.price === 'Contact for price' || !b.price) return -1
        const priceA = parseInt(a.price.replace(/[₦Fr,\s]/g, '')) || 0
        const priceB = parseInt(b.price.replace(/[₦Fr,\s]/g, '')) || 0
        return priceA - priceB
      })
    case 'price-high':
      return sorted.sort((a, b) => {
        // Handle "Contact for price" and different currency formats
        if (a.price === 'Contact for price' || !a.price) return 1
        if (b.price === 'Contact for price' || !b.price) return -1
        const priceA = parseInt(a.price.replace(/[₦Fr,\s]/g, '')) || 0
        const priceB = parseInt(b.price.replace(/[₦Fr,\s]/g, '')) || 0
        return priceB - priceA
      })
    case 'views':
      return sorted.sort((a, b) => (b.views || 0) - (a.views || 0))
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    default:
      return sorted
  }
}
