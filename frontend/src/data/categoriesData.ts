// Comprehensive marketplace categories data
// This structure is designed to work seamlessly with backend APIs

export interface SubcategoryData {
  id: string
  name: string
  count?: number // Number of ads (for display purposes)
  icon?: string // Icon name (Lucide icon identifier) - optional, falls back to category icon
}

export interface CategoryData {
  id: string
  name: string
  icon: string // Icon name (Lucide icon identifier)
  type: 'product' | 'service' | 'job' | 'cv'
  description?: string
  subcategories: SubcategoryData[]
  customFields?: string[] // Fields required for this category
}

// All categories with realistic data
export const categoriesData: CategoryData[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    icon: 'Smartphone',
    type: 'product',
    description: 'Phones, computers, and electronic devices',
    customFields: ['brand', 'model', 'condition', 'warranty'],
    subcategories: [
      { id: 'mobile-phones', name: 'Mobile Phones', count: 3421, icon: 'Phone' },
      { id: 'mobile-accessories', name: 'Mobile Phone Accessories', count: 2156, icon: 'Smartphone' },
      { id: 'computers-laptops', name: 'Computers & Laptops', count: 1834, icon: 'Laptop' },
      { id: 'computer-accessories', name: 'Computer Accessories', count: 987, icon: 'Monitor' },
      { id: 'tv-dvd', name: 'TVs & DVD Equipment', count: 856, icon: 'Monitor' },
      { id: 'audio-music', name: 'Audio & Music Equipment', count: 645, icon: 'Headphones' },
      { id: 'cameras', name: 'Photo & Video Cameras', count: 423, icon: 'Camera' },
      { id: 'video-games', name: 'Video Games & Consoles', count: 789, icon: 'Gamepad' },
      { id: 'other-electronics', name: 'Other Electronics', count: 1245 }
    ]
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    icon: 'Car',
    type: 'product',
    description: 'Cars, motorcycles, and vehicle accessories',
    customFields: ['brand', 'year', 'condition', 'mileage', 'transmission', 'fuel_type', 'color'],
    subcategories: [
      { id: 'cars', name: 'Cars', count: 5678, icon: 'Car' },
      { id: 'car-parts', name: 'Car Parts & Accessories', count: 2341, icon: 'Settings' },
      { id: 'trucks-trailers', name: 'Trucks & Trailers', count: 456, icon: 'Truck' },
      { id: 'motorcycles', name: 'Motorcycles & Scooters', count: 892, icon: 'Bike' },
      { id: 'buses', name: 'Buses & Microbuses', count: 234, icon: 'Truck' },
      { id: 'heavy-equipment', name: 'Heavy Equipment', count: 145, icon: 'Hammer' },
      { id: 'watercrafts', name: 'Watercrafts & Boats', count: 89, icon: 'Ship' }
    ]
  },
  {
    id: 'property',
    name: 'Property',
    icon: 'Home',
    type: 'product',
    description: 'Houses, apartments, and land for sale or rent',
    customFields: ['property_type', 'bedrooms', 'bathrooms', 'furnishing', 'size_sqm'],
    subcategories: [
      { id: 'houses-sale', name: 'Houses & Apartments for Sale', count: 1892, icon: 'Home' },
      { id: 'houses-rent', name: 'Houses & Apartments for Rent', count: 3456, icon: 'Key' },
      { id: 'land-sale', name: 'Land & Plots for Sale', count: 1234, icon: 'TreePine' },
      { id: 'land-rent', name: 'Land & Plots for Rent', count: 567, icon: 'TreePine' },
      { id: 'commercial-sale', name: 'Commercial Property for Sale', count: 678, icon: 'Building' },
      { id: 'commercial-rent', name: 'Commercial Property for Rent', count: 892, icon: 'Building2' },
      { id: 'event-centres', name: 'Event Centres, Venues & Workstations', count: 345, icon: 'Store' },
      { id: 'short-let', name: 'Short Let', count: 789, icon: 'Key' }
    ]
  },
  {
    id: 'fashion',
    name: 'Fashion',
    icon: 'ShoppingBag',
    type: 'product',
    description: 'Clothing, shoes, bags, and accessories',
    customFields: ['condition', 'size', 'gender', 'brand'],
    subcategories: [
      { id: 'clothing', name: 'Clothing', count: 4567, icon: 'Shirt' },
      { id: 'shoes', name: 'Shoes', count: 3421, icon: 'Footprints' },
      { id: 'bags', name: 'Bags', count: 2345, icon: 'ShoppingBag' },
      { id: 'accessories', name: 'Fashion Accessories', count: 1876, icon: 'Crown' },
      { id: 'jewelry', name: 'Jewelry', count: 987, icon: 'Gem' },
      { id: 'watches', name: 'Watches', count: 1234, icon: 'Watch' },
      { id: 'wedding-wear', name: 'Wedding Wear', count: 456, icon: 'Crown' }
    ]
  },
  {
    id: 'home-furniture',
    name: 'Home, Furniture & Appliances',
    icon: 'Sofa',
    type: 'product',
    description: 'Furniture, home appliances, and decor',
    customFields: ['condition', 'material', 'color'],
    subcategories: [
      { id: 'home-appliances', name: 'Home Appliances', count: 2345, icon: 'Settings' },
      { id: 'furniture', name: 'Furniture', count: 1987, icon: 'Sofa' },
      { id: 'kitchen-dining', name: 'Kitchen & Dining', count: 1234, icon: 'Home' },
      { id: 'garden-outdoor', name: 'Garden & Outdoor', count: 678, icon: 'TreePine' },
      { id: 'home-decor', name: 'Home Decor', count: 892, icon: 'Heart' },
      { id: 'bedding-bath', name: 'Bedding & Bath', count: 567, icon: 'Home' }
    ]
  },
  {
    id: 'health-beauty',
    name: 'Health & Beauty',
    icon: 'Heart',
    type: 'product',
    description: 'Skincare, makeup, and wellness products',
    customFields: ['brand', 'condition'],
    subcategories: [
      { id: 'skincare', name: 'Skin Care', count: 1456, icon: 'Heart' },
      { id: 'hair-care', name: 'Hair Care & Styling', count: 987, icon: 'Scissors' },
      { id: 'makeup', name: 'Make Up', count: 1234, icon: 'Heart' },
      { id: 'fragrance', name: 'Fragrance', count: 678, icon: 'Heart' },
      { id: 'bath-body', name: 'Bath & Body', count: 543, icon: 'Heart' },
      { id: 'vitamins', name: 'Vitamins & Supplements', count: 432, icon: 'Heart' }
    ]
  },
  {
    id: 'sports-hobbies',
    name: 'Sports, Arts & Outdoors',
    icon: 'Dumbbell',
    type: 'product',
    description: 'Sports equipment, musical instruments, and hobbies',
    customFields: ['condition', 'brand'],
    subcategories: [
      { id: 'gym-fitness', name: 'Gym & Fitness', count: 876, icon: 'Dumbbell' },
      { id: 'team-sports', name: 'Team Sports', count: 654, icon: 'Trophy' },
      { id: 'camping-hiking', name: 'Camping & Hiking', count: 432, icon: 'Mountain' },
      { id: 'musical-instruments', name: 'Musical Instruments', count: 567, icon: 'Headphones' },
      { id: 'books', name: 'Books & Magazines', count: 1234, icon: 'Book' },
      { id: 'arts-crafts', name: 'Arts & Crafts', count: 345, icon: 'Target' }
    ]
  },
  {
    id: 'babies-kids',
    name: 'Babies & Kids',
    icon: 'Baby',
    type: 'product',
    description: 'Baby and children\'s items',
    customFields: ['condition', 'age_range', 'size'],
    subcategories: [
      { id: 'baby-kids-clothing', name: 'Baby & Kids Clothing', count: 2345, icon: 'Shirt' },
      { id: 'baby-kids-shoes', name: 'Baby & Kids Shoes', count: 1234, icon: 'Footprints' },
      { id: 'toys', name: 'Toys', count: 3456, icon: 'Package' },
      { id: 'baby-gear', name: 'Baby Gear & Furniture', count: 876, icon: 'Baby' },
      { id: 'feeding', name: 'Feeding & Nursing', count: 654, icon: 'Heart' },
      { id: 'maternity', name: 'Maternity Items', count: 432, icon: 'Heart' }
    ]
  },
  {
    id: 'animals-pets',
    name: 'Animals & Pets',
    icon: 'Dog',
    type: 'product',
    description: 'Pets and pet accessories',
    customFields: ['breed', 'age', 'gender'],
    subcategories: [
      { id: 'dogs', name: 'Dogs & Puppies', count: 567, icon: 'Dog' },
      { id: 'cats', name: 'Cats & Kittens', count: 432, icon: 'Dog' },
      { id: 'birds', name: 'Birds', count: 234, icon: 'Package' },
      { id: 'fish-aquarium', name: 'Fish & Aquarium', count: 123, icon: 'Package' },
      { id: 'livestock', name: 'Livestock & Poultry', count: 345, icon: 'Dog' },
      { id: 'pet-accessories', name: 'Pet Accessories & Food', count: 876, icon: 'Package' }
    ]
  },
  {
    id: 'services',
    name: 'Services',
    icon: 'Wrench',
    type: 'service',
    description: 'Professional and personal services',
    customFields: ['service_type', 'availability', 'experience_years'],
    subcategories: [
      { id: 'building-trades', name: 'Building & Trade Services', count: 1234, icon: 'Hammer' },
      { id: 'cleaning', name: 'Cleaning & Fumigation', count: 876, icon: 'Scissors' },
      { id: 'computer-it', name: 'Computer & IT Services', count: 987, icon: 'Laptop' },
      { id: 'education-classes', name: 'Education & Classes', count: 765, icon: 'GraduationCap' },
      { id: 'event-services', name: 'Event Services', count: 543, icon: 'Store' },
      { id: 'health-beauty-services', name: 'Health & Beauty Services', count: 654, icon: 'Heart' },
      { id: 'legal-services', name: 'Legal Services', count: 234, icon: 'FileText' },
      { id: 'logistics', name: 'Logistics & Delivery', count: 456, icon: 'Truck' },
      { id: 'photography', name: 'Photography & Videography', count: 789, icon: 'Camera' },
      { id: 'repair-services', name: 'Repair Services', count: 567, icon: 'Wrench' }
    ]
  },
  {
    id: 'jobs',
    name: 'Jobs',
    icon: 'Briefcase',
    type: 'job',
    description: 'Job postings - Find employees and hire talent',
    customFields: ['job_type', 'experience_level', 'salary_range', 'education_level', 'work_location', 'application_deadline'],
    subcategories: [
      { id: 'accounting-finance', name: 'Accounting & Finance', count: 892, icon: 'Briefcase' },
      { id: 'admin-office', name: 'Admin & Office', count: 1234, icon: 'Briefcase' },
      { id: 'advertising-marketing', name: 'Advertising & Marketing', count: 678, icon: 'Target' },
      { id: 'computing-it', name: 'Computing & IT', count: 1456, icon: 'Laptop' },
      { id: 'customer-service', name: 'Customer Service', count: 543, icon: 'Users' },
      { id: 'education-training', name: 'Education & Training', count: 765, icon: 'GraduationCap' },
      { id: 'engineering', name: 'Engineering & Architecture', count: 987, icon: 'Hammer' },
      { id: 'health-medicine', name: 'Health & Medicine', count: 456, icon: 'Heart' },
      { id: 'hospitality', name: 'Hospitality & Tourism', count: 567, icon: 'Store' },
      { id: 'legal', name: 'Legal', count: 234, icon: 'FileText' },
      { id: 'sales-retail', name: 'Sales & Retail', count: 1234, icon: 'ShoppingBag' },
      { id: 'security', name: 'Security', count: 345, icon: 'Shield' },
      { id: 'other-jobs', name: 'Other Jobs', count: 876, icon: 'Briefcase' }
    ]
  },
  {
    id: 'cv',
    name: 'CV / Resume',
    icon: 'FileText',
    type: 'cv',
    description: 'Post your CV - Let employers find you',
    customFields: ['experience_years', 'education_level', 'skills', 'desired_salary', 'availability'],
    subcategories: [
      { id: 'accounting-finance-cv', name: 'Accounting & Finance', count: 234, icon: 'FileText' },
      { id: 'admin-office-cv', name: 'Admin & Office', count: 456, icon: 'FileText' },
      { id: 'advertising-marketing-cv', name: 'Advertising & Marketing', count: 189, icon: 'FileText' },
      { id: 'computing-it-cv', name: 'Computing & IT', count: 678, icon: 'FileText' },
      { id: 'customer-service-cv', name: 'Customer Service', count: 234, icon: 'FileText' },
      { id: 'education-training-cv', name: 'Education & Training', count: 345, icon: 'FileText' },
      { id: 'engineering-cv', name: 'Engineering & Architecture', count: 456, icon: 'FileText' },
      { id: 'health-medicine-cv', name: 'Health & Medicine', count: 123, icon: 'FileText' },
      { id: 'hospitality-cv', name: 'Hospitality & Tourism', count: 234, icon: 'FileText' },
      { id: 'legal-cv', name: 'Legal', count: 89, icon: 'FileText' },
      { id: 'sales-retail-cv', name: 'Sales & Retail', count: 567, icon: 'FileText' },
      { id: 'security-cv', name: 'Security', count: 123, icon: 'FileText' },
      { id: 'other-cv', name: 'Other Fields', count: 234, icon: 'FileText' }
    ]
  },
  {
    id: 'commercial-equipment',
    name: 'Commercial Equipment & Tools',
    icon: 'Hammer',
    type: 'product',
    description: 'Business and industrial equipment',
    customFields: ['condition', 'brand', 'warranty'],
    subcategories: [
      { id: 'restaurant-equipment', name: 'Restaurant & Catering Equipment', count: 456, icon: 'Store' },
      { id: 'construction-tools', name: 'Construction Tools', count: 678, icon: 'Hammer' },
      { id: 'farming-equipment', name: 'Farming Equipment', count: 234, icon: 'Wheat' },
      { id: 'office-equipment', name: 'Office Equipment & Stationery', count: 543, icon: 'Briefcase' },
      { id: 'medical-equipment', name: 'Medical Equipment', count: 123, icon: 'Heart' },
      { id: 'salon-equipment', name: 'Salon & Spa Equipment', count: 345, icon: 'Scissors' }
    ]
  },
  {
    id: 'food-agriculture',
    name: 'Food & Agriculture',
    icon: 'Wheat',
    type: 'product',
    description: 'Food products and agricultural items',
    customFields: ['quantity', 'unit', 'organic'],
    subcategories: [
      { id: 'grains-cereals', name: 'Grains & Cereals', count: 345, icon: 'Wheat' },
      { id: 'vegetables', name: 'Vegetables', count: 456, icon: 'Wheat' },
      { id: 'fruits', name: 'Fruits', count: 567, icon: 'Wheat' },
      { id: 'livestock-products', name: 'Livestock Products', count: 234, icon: 'Dog' },
      { id: 'processed-foods', name: 'Processed Foods', count: 789, icon: 'Package' },
      { id: 'beverages', name: 'Beverages', count: 432, icon: 'Package' }
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

export const getCategoryType = (categoryId: string): 'product' | 'service' | 'job' | 'cv' => {
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

// Niger regions for location dropdown
export const nigerianStates = [
  { value: 'niamey', label: 'Niamey' },
  { value: 'agadez', label: 'Agadez' },
  { value: 'diffa', label: 'Diffa' },
  { value: 'dosso', label: 'Dosso' },
  { value: 'maradi', label: 'Maradi' },
  { value: 'tahoua', label: 'Tahoua' },
  { value: 'tillaberi', label: 'Tillabéri' },
  { value: 'zinder', label: 'Zinder' }
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

