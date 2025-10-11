export interface Subcategory {
  id: string
  name: string
  icon?: string
}

export interface Category {
  id: string
  name: string
  icon: string
  type: 'product' | 'service' | 'both'
  subcategories: Subcategory[]
  customFields?: string[] // Additional fields specific to this category
}

// Comprehensive categories with subcategories (like Jiji)
export const categories: Category[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    icon: '📱',
    type: 'product',
    subcategories: [
      { id: 'phones-tablets', name: 'Phones & Tablets' },
      { id: 'computers-laptops', name: 'Computers & Laptops' },
      { id: 'tv-video', name: 'TV & Video Equipment' },
      { id: 'audio-music', name: 'Audio & Music Equipment' },
      { id: 'cameras', name: 'Cameras & Camcorders' },
      { id: 'games', name: 'Video Games & Consoles' },
      { id: 'computer-accessories', name: 'Computer Accessories' },
      { id: 'phone-accessories', name: 'Mobile Phone Accessories' },
      { id: 'other-electronics', name: 'Other Electronics' }
    ],
    customFields: ['brand', 'model', 'condition', 'warranty']
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    icon: '🚗',
    type: 'product',
    subcategories: [
      { id: 'cars', name: 'Cars' },
      { id: 'trucks-trailers', name: 'Trucks & Trailers' },
      { id: 'motorcycles-scooters', name: 'Motorcycles & Scooters' },
      { id: 'buses-microbuses', name: 'Buses & Microbuses' },
      { id: 'heavy-equipment', name: 'Heavy Equipment' },
      { id: 'watercrafts', name: 'Watercrafts & Boats' },
      { id: 'auto-parts', name: 'Auto Parts & Accessories' },
      { id: 'other-vehicles', name: 'Other Vehicles' }
    ],
    customFields: ['brand', 'year', 'condition', 'mileage', 'transmission', 'fuel_type']
  },
  {
    id: 'property',
    name: 'Property',
    icon: '🏠',
    type: 'both',
    subcategories: [
      { id: 'houses-apartments-sale', name: 'Houses & Apartments for Sale' },
      { id: 'houses-apartments-rent', name: 'Houses & Apartments for Rent' },
      { id: 'land-plots-sale', name: 'Land & Plots for Sale' },
      { id: 'land-plots-rent', name: 'Land & Plots for Rent' },
      { id: 'commercial-property-sale', name: 'Commercial Property for Sale' },
      { id: 'commercial-property-rent', name: 'Commercial Property for Rent' },
      { id: 'event-centres', name: 'Event Centres & Venues' },
      { id: 'shortlet', name: 'Short Let' }
    ],
    customFields: ['bedrooms', 'bathrooms', 'furnishing', 'property_type']
  },
  {
    id: 'jobs',
    name: 'Jobs',
    icon: '💼',
    type: 'both',
    subcategories: [
      { id: 'accounting-finance', name: 'Accounting & Finance Jobs' },
      { id: 'admin-office', name: 'Admin & Office Jobs' },
      { id: 'advertising-pr', name: 'Advertising, PR & Marketing' },
      { id: 'computing-it', name: 'Computing & IT Jobs' },
      { id: 'customer-service', name: 'Customer Service Jobs' },
      { id: 'education', name: 'Education & Training' },
      { id: 'engineering', name: 'Engineering & Architecture' },
      { id: 'health-medicine', name: 'Health & Medicine' },
      { id: 'hospitality-tourism', name: 'Hospitality & Tourism' },
      { id: 'legal', name: 'Legal Jobs' },
      { id: 'manufacturing', name: 'Manufacturing Jobs' },
      { id: 'real-estate', name: 'Real Estate Jobs' },
      { id: 'sales-retail', name: 'Sales & Retail Jobs' },
      { id: 'security', name: 'Security Jobs' },
      { id: 'other-jobs', name: 'Other Jobs' },
      { id: 'cv', name: 'Post Your CV' } // Like Jiji - users can post CV
    ],
    customFields: ['job_type', 'experience_level', 'salary_range']
  },
  {
    id: 'services',
    name: 'Services',
    icon: '🔧',
    type: 'service',
    subcategories: [
      { id: 'automotive-services', name: 'Automotive Services' },
      { id: 'building-trade', name: 'Building & Trade Services' },
      { id: 'catering-events', name: 'Catering & Event Services' },
      { id: 'cleaning', name: 'Cleaning & Fumigation' },
      { id: 'computer-services', name: 'Computer & IT Services' },
      { id: 'education-classes', name: 'Education & Classes' },
      { id: 'electronics-repair', name: 'Electronics Repair' },
      { id: 'health-beauty', name: 'Health & Beauty Services' },
      { id: 'home-services', name: 'Home & Office Services' },
      { id: 'legal-services', name: 'Legal Services' },
      { id: 'logistics-delivery', name: 'Logistics & Delivery' },
      { id: 'photography', name: 'Photography & Videography' },
      { id: 'printing-branding', name: 'Printing & Branding' },
      { id: 'travel-visa', name: 'Travel & Visa Services' },
      { id: 'other-services', name: 'Other Services' }
    ],
    customFields: ['service_type', 'availability']
  },
  {
    id: 'fashion',
    name: 'Fashion',
    icon: '👗',
    type: 'product',
    subcategories: [
      { id: 'clothing', name: 'Clothing' },
      { id: 'shoes', name: 'Shoes' },
      { id: 'bags', name: 'Bags' },
      { id: 'accessories', name: 'Accessories' },
      { id: 'jewelry', name: 'Jewelry' },
      { id: 'watches', name: 'Watches' },
      { id: 'wedding-wear', name: 'Wedding Wear' },
      { id: 'other-fashion', name: 'Other Fashion Items' }
    ],
    customFields: ['size', 'condition', 'gender']
  },
  {
    id: 'home-furniture',
    name: 'Home, Furniture & Appliances',
    icon: '🛋️',
    type: 'product',
    subcategories: [
      { id: 'furniture', name: 'Furniture' },
      { id: 'home-appliances', name: 'Home Appliances' },
      { id: 'kitchen-dining', name: 'Kitchen & Dining' },
      { id: 'home-decor', name: 'Home Decor' },
      { id: 'garden-outdoor', name: 'Garden & Outdoor' },
      { id: 'bedding-towels', name: 'Bedding & Towels' },
      { id: 'lighting-fans', name: 'Lighting & Fans' },
      { id: 'other-home', name: 'Other Home Items' }
    ],
    customFields: ['condition', 'material']
  },
  {
    id: 'health-beauty',
    name: 'Health & Beauty',
    icon: '💄',
    type: 'product',
    subcategories: [
      { id: 'skin-care', name: 'Skin Care' },
      { id: 'hair-products', name: 'Hair Care & Styling' },
      { id: 'makeup', name: 'Make Up' },
      { id: 'fragrance', name: 'Fragrance' },
      { id: 'bath-body', name: 'Bath & Body' },
      { id: 'tools-accessories', name: 'Tools & Accessories' },
      { id: 'vitamins-supplements', name: 'Vitamins & Supplements' },
      { id: 'sexual-wellness', name: 'Sexual Wellness' },
      { id: 'other-health-beauty', name: 'Other Health & Beauty' }
    ],
    customFields: ['brand', 'condition']
  },
  {
    id: 'sports-equipment',
    name: 'Sports, Arts & Outdoors',
    icon: '⚽',
    type: 'product',
    subcategories: [
      { id: 'gym-fitness', name: 'Gym & Fitness Equipment' },
      { id: 'sports-equipment', name: 'Sports Equipment' },
      { id: 'camping-outdoor', name: 'Camping & Outdoor Gear' },
      { id: 'musical-instruments', name: 'Musical Instruments' },
      { id: 'arts-crafts', name: 'Arts, Crafts & Sewing' },
      { id: 'books', name: 'Books & Magazines' },
      { id: 'other-hobbies', name: 'Other Hobbies & Leisure' }
    ],
    customFields: ['condition', 'brand']
  },
  {
    id: 'babies-kids',
    name: 'Babies & Kids',
    icon: '👶',
    type: 'product',
    subcategories: [
      { id: 'baby-clothing', name: 'Baby & Kids Clothing' },
      { id: 'baby-shoes', name: 'Baby & Kids Shoes' },
      { id: 'toys', name: 'Toys' },
      { id: 'baby-gear', name: 'Baby Gear & Furniture' },
      { id: 'feeding', name: 'Feeding & Nursing' },
      { id: 'maternity', name: 'Maternity Items' },
      { id: 'other-baby-kids', name: 'Other Baby & Kids Items' }
    ],
    customFields: ['age_range', 'condition']
  },
  {
    id: 'animals-pets',
    name: 'Animals & Pets',
    icon: '🐕',
    type: 'both',
    subcategories: [
      { id: 'dogs', name: 'Dogs & Puppies' },
      { id: 'cats', name: 'Cats & Kittens' },
      { id: 'birds', name: 'Birds' },
      { id: 'fish', name: 'Fish & Aquarium' },
      { id: 'livestock', name: 'Livestock & Poultry' },
      { id: 'pet-accessories', name: 'Pet Accessories' },
      { id: 'pet-services', name: 'Pet Services' },
      { id: 'other-animals', name: 'Other Animals' }
    ],
    customFields: ['breed', 'age']
  },
  {
    id: 'commercial-equipment',
    name: 'Commercial Equipment & Tools',
    icon: '🏭',
    type: 'product',
    subcategories: [
      { id: 'restaurant-equipment', name: 'Restaurant & Catering Equipment' },
      { id: 'construction-tools', name: 'Construction Tools & Materials' },
      { id: 'farming-equipment', name: 'Farming Equipment' },
      { id: 'office-equipment', name: 'Office Equipment' },
      { id: 'medical-equipment', name: 'Medical Equipment' },
      { id: 'salon-equipment', name: 'Salon & Spa Equipment' },
      { id: 'other-commercial', name: 'Other Commercial Equipment' }
    ],
    customFields: ['condition', 'brand']
  },
  {
    id: 'repair-construction',
    name: 'Repair, Construction & Manufacturing',
    icon: '🔨',
    type: 'service',
    subcategories: [
      { id: 'building-construction', name: 'Building & Construction' },
      { id: 'plumbing', name: 'Plumbing Services' },
      { id: 'electrical', name: 'Electrical Services' },
      { id: 'carpentry', name: 'Carpentry & Woodwork' },
      { id: 'painting', name: 'Painting & Decorating' },
      { id: 'roofing', name: 'Roofing Services' },
      { id: 'manufacturing', name: 'Manufacturing Services' },
      { id: 'other-repair', name: 'Other Repair Services' }
    ],
    customFields: ['service_type', 'experience_years']
  },
  {
    id: 'food-stuff',
    name: 'Food & Agro Products',
    icon: '🌾',
    type: 'product',
    subcategories: [
      { id: 'grains-cereals', name: 'Grains & Cereals' },
      { id: 'vegetables', name: 'Vegetables' },
      { id: 'fruits', name: 'Fruits' },
      { id: 'livestock-products', name: 'Livestock Products' },
      { id: 'processed-foods', name: 'Processed Foods' },
      { id: 'beverages', name: 'Beverages' },
      { id: 'other-food', name: 'Other Food Items' }
    ],
    customFields: ['quantity', 'expiry_date']
  },
  {
    id: 'seeking',
    name: 'Seeking Work - CVs',
    icon: '📄',
    type: 'service',
    subcategories: [
      { id: 'seeking-accounting', name: 'Accounting & Finance' },
      { id: 'seeking-admin', name: 'Admin & Office' },
      { id: 'seeking-computing', name: 'Computing & IT' },
      { id: 'seeking-customer-service', name: 'Customer Service' },
      { id: 'seeking-education', name: 'Education & Training' },
      { id: 'seeking-engineering', name: 'Engineering' },
      { id: 'seeking-health', name: 'Health & Medicine' },
      { id: 'seeking-hospitality', name: 'Hospitality & Tourism' },
      { id: 'seeking-sales', name: 'Sales & Marketing' },
      { id: 'seeking-security', name: 'Security' },
      { id: 'seeking-other', name: 'Other Fields' }
    ],
    customFields: ['experience_years', 'education_level', 'availability']
  }
]

// Get category by ID
export const getCategoryById = (categoryId: string): Category | undefined => {
  return categories.find(cat => cat.id === categoryId)
}

// Get subcategories by category ID
export const getSubcategories = (categoryId: string): Subcategory[] => {
  const category = getCategoryById(categoryId)
  return category?.subcategories || []
}

// Check if category is for products, services, or both
export const getCategoryType = (categoryId: string): 'product' | 'service' | 'both' => {
  const category = getCategoryById(categoryId)
  return category?.type || 'product'
}

// Get custom fields for a category
export const getCustomFields = (categoryId: string): string[] => {
  const category = getCategoryById(categoryId)
  return category?.customFields || []
}

