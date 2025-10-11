// Comprehensive marketplace categories data
// This structure is designed to work seamlessly with backend APIs

export interface SubcategoryData {
  id: string
  name: string
  count?: number // Number of ads (for display purposes)
}

export interface CategoryData {
  id: string
  name: string
  icon: string
  type: 'product' | 'service' | 'cv'
  description?: string
  subcategories: SubcategoryData[]
  customFields?: string[] // Fields required for this category
}

// All categories with realistic data
export const categoriesData: CategoryData[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    icon: '📱',
    type: 'product',
    description: 'Phones, computers, and electronic devices',
    customFields: ['brand', 'model', 'condition', 'warranty'],
    subcategories: [
      { id: 'mobile-phones', name: 'Mobile Phones', count: 3421 },
      { id: 'mobile-accessories', name: 'Mobile Phone Accessories', count: 2156 },
      { id: 'computers-laptops', name: 'Computers & Laptops', count: 1834 },
      { id: 'computer-accessories', name: 'Computer Accessories', count: 987 },
      { id: 'tv-dvd', name: 'TVs & DVD Equipment', count: 856 },
      { id: 'audio-music', name: 'Audio & Music Equipment', count: 645 },
      { id: 'cameras', name: 'Photo & Video Cameras', count: 423 },
      { id: 'video-games', name: 'Video Games & Consoles', count: 789 },
      { id: 'other-electronics', name: 'Other Electronics', count: 1245 }
    ]
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    icon: '🚗',
    type: 'product',
    description: 'Cars, motorcycles, and vehicle accessories',
    customFields: ['brand', 'year', 'condition', 'mileage', 'transmission', 'fuel_type', 'color'],
    subcategories: [
      { id: 'cars', name: 'Cars', count: 5678 },
      { id: 'car-parts', name: 'Car Parts & Accessories', count: 2341 },
      { id: 'trucks-trailers', name: 'Trucks & Trailers', count: 456 },
      { id: 'motorcycles', name: 'Motorcycles & Scooters', count: 892 },
      { id: 'buses', name: 'Buses & Microbuses', count: 234 },
      { id: 'heavy-equipment', name: 'Heavy Equipment', count: 145 },
      { id: 'watercrafts', name: 'Watercrafts & Boats', count: 89 }
    ]
  },
  {
    id: 'property',
    name: 'Property',
    icon: '🏠',
    type: 'product',
    description: 'Houses, apartments, and land for sale or rent',
    customFields: ['property_type', 'bedrooms', 'bathrooms', 'furnishing', 'size_sqm'],
    subcategories: [
      { id: 'houses-sale', name: 'Houses & Apartments for Sale', count: 1892 },
      { id: 'houses-rent', name: 'Houses & Apartments for Rent', count: 3456 },
      { id: 'land-sale', name: 'Land & Plots for Sale', count: 1234 },
      { id: 'land-rent', name: 'Land & Plots for Rent', count: 567 },
      { id: 'commercial-sale', name: 'Commercial Property for Sale', count: 678 },
      { id: 'commercial-rent', name: 'Commercial Property for Rent', count: 892 },
      { id: 'event-centres', name: 'Event Centres, Venues & Workstations', count: 345 },
      { id: 'short-let', name: 'Short Let', count: 789 }
    ]
  },
  {
    id: 'fashion',
    name: 'Fashion',
    icon: '👗',
    type: 'product',
    description: 'Clothing, shoes, bags, and accessories',
    customFields: ['condition', 'size', 'gender', 'brand'],
    subcategories: [
      { id: 'clothing', name: 'Clothing', count: 4567 },
      { id: 'shoes', name: 'Shoes', count: 3421 },
      { id: 'bags', name: 'Bags', count: 2345 },
      { id: 'accessories', name: 'Fashion Accessories', count: 1876 },
      { id: 'jewelry', name: 'Jewelry', count: 987 },
      { id: 'watches', name: 'Watches', count: 1234 },
      { id: 'wedding-wear', name: 'Wedding Wear', count: 456 }
    ]
  },
  {
    id: 'home-furniture',
    name: 'Home, Furniture & Appliances',
    icon: '🛋️',
    type: 'product',
    description: 'Furniture, home appliances, and decor',
    customFields: ['condition', 'material', 'color'],
    subcategories: [
      { id: 'home-appliances', name: 'Home Appliances', count: 2345 },
      { id: 'furniture', name: 'Furniture', count: 1987 },
      { id: 'kitchen-dining', name: 'Kitchen & Dining', count: 1234 },
      { id: 'garden-outdoor', name: 'Garden & Outdoor', count: 678 },
      { id: 'home-decor', name: 'Home Decor', count: 892 },
      { id: 'bedding-bath', name: 'Bedding & Bath', count: 567 }
    ]
  },
  {
    id: 'health-beauty',
    name: 'Health & Beauty',
    icon: '💄',
    type: 'product',
    description: 'Skincare, makeup, and wellness products',
    customFields: ['brand', 'condition'],
    subcategories: [
      { id: 'skincare', name: 'Skin Care', count: 1456 },
      { id: 'hair-care', name: 'Hair Care & Styling', count: 987 },
      { id: 'makeup', name: 'Make Up', count: 1234 },
      { id: 'fragrance', name: 'Fragrance', count: 678 },
      { id: 'bath-body', name: 'Bath & Body', count: 543 },
      { id: 'vitamins', name: 'Vitamins & Supplements', count: 432 }
    ]
  },
  {
    id: 'sports-hobbies',
    name: 'Sports, Arts & Outdoors',
    icon: '⚽',
    type: 'product',
    description: 'Sports equipment, musical instruments, and hobbies',
    customFields: ['condition', 'brand'],
    subcategories: [
      { id: 'gym-fitness', name: 'Gym & Fitness', count: 876 },
      { id: 'team-sports', name: 'Team Sports', count: 654 },
      { id: 'camping-hiking', name: 'Camping & Hiking', count: 432 },
      { id: 'musical-instruments', name: 'Musical Instruments', count: 567 },
      { id: 'books', name: 'Books & Magazines', count: 1234 },
      { id: 'arts-crafts', name: 'Arts & Crafts', count: 345 }
    ]
  },
  {
    id: 'babies-kids',
    name: 'Babies & Kids',
    icon: '👶',
    type: 'product',
    description: 'Baby and children\'s items',
    customFields: ['condition', 'age_range', 'size'],
    subcategories: [
      { id: 'baby-kids-clothing', name: 'Baby & Kids Clothing', count: 2345 },
      { id: 'baby-kids-shoes', name: 'Baby & Kids Shoes', count: 1234 },
      { id: 'toys', name: 'Toys', count: 3456 },
      { id: 'baby-gear', name: 'Baby Gear & Furniture', count: 876 },
      { id: 'feeding', name: 'Feeding & Nursing', count: 654 },
      { id: 'maternity', name: 'Maternity Items', count: 432 }
    ]
  },
  {
    id: 'animals-pets',
    name: 'Animals & Pets',
    icon: '🐕',
    type: 'product',
    description: 'Pets and pet accessories',
    customFields: ['breed', 'age', 'gender'],
    subcategories: [
      { id: 'dogs', name: 'Dogs & Puppies', count: 567 },
      { id: 'cats', name: 'Cats & Kittens', count: 432 },
      { id: 'birds', name: 'Birds', count: 234 },
      { id: 'fish-aquarium', name: 'Fish & Aquarium', count: 123 },
      { id: 'livestock', name: 'Livestock & Poultry', count: 345 },
      { id: 'pet-accessories', name: 'Pet Accessories & Food', count: 876 }
    ]
  },
  {
    id: 'services',
    name: 'Services',
    icon: '🔧',
    type: 'service',
    description: 'Professional and personal services',
    customFields: ['service_type', 'availability', 'experience_years'],
    subcategories: [
      { id: 'building-trades', name: 'Building & Trade Services', count: 1234 },
      { id: 'cleaning', name: 'Cleaning & Fumigation', count: 876 },
      { id: 'computer-it', name: 'Computer & IT Services', count: 987 },
      { id: 'education-classes', name: 'Education & Classes', count: 765 },
      { id: 'event-services', name: 'Event Services', count: 543 },
      { id: 'health-beauty-services', name: 'Health & Beauty Services', count: 654 },
      { id: 'legal-services', name: 'Legal Services', count: 234 },
      { id: 'logistics', name: 'Logistics & Delivery', count: 456 },
      { id: 'photography', name: 'Photography & Videography', count: 789 },
      { id: 'repair-services', name: 'Repair Services', count: 567 }
    ]
  },
  {
    id: 'jobs',
    name: 'Jobs',
    icon: '💼',
    type: 'cv',
    description: 'Job listings and CV posting',
    customFields: ['job_type', 'experience_level', 'salary_range', 'education_level'],
    subcategories: [
      { id: 'accounting-finance', name: 'Accounting & Finance', count: 892 },
      { id: 'admin-office', name: 'Admin & Office', count: 1234 },
      { id: 'advertising-marketing', name: 'Advertising & Marketing', count: 678 },
      { id: 'computing-it', name: 'Computing & IT', count: 1456 },
      { id: 'customer-service', name: 'Customer Service', count: 543 },
      { id: 'education-training', name: 'Education & Training', count: 765 },
      { id: 'engineering', name: 'Engineering & Architecture', count: 987 },
      { id: 'health-medicine', name: 'Health & Medicine', count: 456 },
      { id: 'hospitality', name: 'Hospitality & Tourism', count: 567 },
      { id: 'legal', name: 'Legal', count: 234 },
      { id: 'sales-retail', name: 'Sales & Retail', count: 1234 },
      { id: 'security', name: 'Security', count: 345 },
      { id: 'other-jobs', name: 'Other Jobs', count: 876 }
    ]
  },
  {
    id: 'commercial-equipment',
    name: 'Commercial Equipment & Tools',
    icon: '🏭',
    type: 'product',
    description: 'Business and industrial equipment',
    customFields: ['condition', 'brand', 'warranty'],
    subcategories: [
      { id: 'restaurant-equipment', name: 'Restaurant & Catering Equipment', count: 456 },
      { id: 'construction-tools', name: 'Construction Tools', count: 678 },
      { id: 'farming-equipment', name: 'Farming Equipment', count: 234 },
      { id: 'office-equipment', name: 'Office Equipment & Stationery', count: 543 },
      { id: 'medical-equipment', name: 'Medical Equipment', count: 123 },
      { id: 'salon-equipment', name: 'Salon & Spa Equipment', count: 345 }
    ]
  },
  {
    id: 'food-agriculture',
    name: 'Food & Agriculture',
    icon: '🌾',
    type: 'product',
    description: 'Food products and agricultural items',
    customFields: ['quantity', 'unit', 'organic'],
    subcategories: [
      { id: 'grains-cereals', name: 'Grains & Cereals', count: 345 },
      { id: 'vegetables', name: 'Vegetables', count: 456 },
      { id: 'fruits', name: 'Fruits', count: 567 },
      { id: 'livestock-products', name: 'Livestock Products', count: 234 },
      { id: 'processed-foods', name: 'Processed Foods', count: 789 },
      { id: 'beverages', name: 'Beverages', count: 432 }
    ]
  }
]

// Helper functions for backend-like operations
export const getCategoryById = (categoryId: string): CategoryData | undefined => {
  return categoriesData.find(cat => cat.id === categoryId)
}

export const getSubcategoriesByCategoryId = (categoryId: string): SubcategoryData[] => {
  const category = getCategoryById(categoryId)
  return category?.subcategories || []
}

export const getCategoryType = (categoryId: string): 'product' | 'service' | 'cv' => {
  const category = getCategoryById(categoryId)
  return category?.type || 'product'
}

export const getCustomFieldsByCategoryId = (categoryId: string): string[] => {
  const category = getCategoryById(categoryId)
  return category?.customFields || []
}

// Convert to select options format
export const getCategoryOptions = () => {
  return categoriesData.map(cat => ({
    value: cat.id,
    label: cat.name,
    icon: cat.icon
  }))
}

export const getSubcategoryOptions = (categoryId: string) => {
  const subcategories = getSubcategoriesByCategoryId(categoryId)
  return subcategories.map(sub => ({
    value: sub.id,
    label: sub.name
  }))
}

// Nigerian states for location dropdown
export const nigerianStates = [
  { value: 'abia', label: 'Abia' },
  { value: 'abuja', label: 'Abuja (FCT)' },
  { value: 'adamawa', label: 'Adamawa' },
  { value: 'akwa-ibom', label: 'Akwa Ibom' },
  { value: 'anambra', label: 'Anambra' },
  { value: 'bauchi', label: 'Bauchi' },
  { value: 'bayelsa', label: 'Bayelsa' },
  { value: 'benue', label: 'Benue' },
  { value: 'borno', label: 'Borno' },
  { value: 'cross-river', label: 'Cross River' },
  { value: 'delta', label: 'Delta' },
  { value: 'ebonyi', label: 'Ebonyi' },
  { value: 'edo', label: 'Edo' },
  { value: 'ekiti', label: 'Ekiti' },
  { value: 'enugu', label: 'Enugu' },
  { value: 'gombe', label: 'Gombe' },
  { value: 'imo', label: 'Imo' },
  { value: 'jigawa', label: 'Jigawa' },
  { value: 'kaduna', label: 'Kaduna' },
  { value: 'kano', label: 'Kano' },
  { value: 'katsina', label: 'Katsina' },
  { value: 'kebbi', label: 'Kebbi' },
  { value: 'kogi', label: 'Kogi' },
  { value: 'kwara', label: 'Kwara' },
  { value: 'lagos', label: 'Lagos' },
  { value: 'nasarawa', label: 'Nasarawa' },
  { value: 'niger', label: 'Niger' },
  { value: 'ogun', label: 'Ogun' },
  { value: 'ondo', label: 'Ondo' },
  { value: 'osun', label: 'Osun' },
  { value: 'oyo', label: 'Oyo' },
  { value: 'plateau', label: 'Plateau' },
  { value: 'rivers', label: 'Rivers' },
  { value: 'sokoto', label: 'Sokoto' },
  { value: 'taraba', label: 'Taraba' },
  { value: 'yobe', label: 'Yobe' },
  { value: 'zamfara', label: 'Zamfara' }
]

// Condition options for products
export const conditionOptions = [
  { value: 'new', label: 'Brand New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'refurbished', label: 'Refurbished' }
]

// Other common dropdowns
export const transmissionOptions = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' }
]

export const fuelTypeOptions = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' }
]

export const furnishingOptions = [
  { value: 'furnished', label: 'Fully Furnished' },
  { value: 'semi-furnished', label: 'Semi-Furnished' },
  { value: 'unfurnished', label: 'Unfurnished' }
]

export const propertyTypeOptions = [
  { value: 'flat', label: 'Flat / Apartment' },
  { value: 'house', label: 'House' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'mansion', label: 'Mansion' },
  { value: 'commercial', label: 'Commercial Property' }
]

export const jobTypeOptions = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' }
]

export const experienceLevelOptions = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (3-5 years)' },
  { value: 'senior', label: 'Senior Level (6-10 years)' },
  { value: 'executive', label: 'Executive (10+ years)' }
]

export const educationLevelOptions = [
  { value: 'ssce', label: 'SSCE / WAEC' },
  { value: 'ond', label: 'OND' },
  { value: 'hnd', label: 'HND' },
  { value: 'bsc', label: 'BSc / BA' },
  { value: 'msc', label: 'MSc / MA' },
  { value: 'phd', label: 'PhD' },
  { value: 'other', label: 'Other' }
]

export const availabilityOptions = [
  { value: 'immediately', label: 'Immediately' },
  { value: '1-week', label: 'Within 1 Week' },
  { value: '2-weeks', label: 'Within 2 Weeks' },
  { value: '1-month', label: 'Within 1 Month' },
  { value: 'flexible', label: 'Flexible' }
]

