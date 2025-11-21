import { FilterGroup } from '@/components/ui/FiltersSection'

// Niger Regions Data
const nigerianStates = [
  { id: "niamey", label: "Niamey", count: 2341 },
  { id: "maradi", label: "Maradi", count: 892 },
  { id: "zinder", label: "Zinder", count: 634 },
  { id: "agadez", label: "Agadez", count: 445 },
  { id: "tahoua", label: "Tahoua", count: 356 },
  { id: "dosso", label: "Dosso", count: 278 },
  { id: "tillaberi", label: "Tillabéri", count: 234 },
  { id: "diffa", label: "Diffa", count: 189 }
]

// Search page filters - simplified and focused on important ones
export const searchFilters: FilterGroup[] = [
  {
    id: "category",
    title: "Category",
    type: "checkbox",
    defaultExpanded: true,
    options: [
      { id: "electronics", label: "Electronics", count: 1247 },
      { id: "vehicles", label: "Vehicles", count: 892 },
      { id: "real-estate", label: "Real Estate", count: 634 },
      { id: "jobs", label: "Jobs", count: 445 },
      { id: "fashion", label: "Fashion", count: 723 },
      { id: "services", label: "Services", count: 356 },
    ]
  },
  {
    id: "price",
    title: "Price Range",
    type: "radio",
    defaultExpanded: true,
    options: [
      { id: "any", label: "Any Price" },
      { id: "0-50000", label: "₦0 - ₦50,000" },
      { id: "50000-200000", label: "₦50,000 - ₦200,000" },
      { id: "200000-500000", label: "₦200,000 - ₦500,000" },
      { id: "500000-1000000", label: "₦500,000 - ₦1M" },
      { id: "1000000+", label: "₦1M+" },
    ]
  },
  {
    id: "location",
    title: "Location",
    type: "checkbox",
    defaultExpanded: true,
    options: nigerianStates
  },
  {
    id: "condition",
    title: "Condition",
    type: "checkbox",
    defaultExpanded: false,
    options: [
      { id: "new", label: "New", count: 2341 },
      { id: "used", label: "Used", count: 1892 },
      { id: "refurbished", label: "Refurbished", count: 456 },
    ]
  }
]

// Electronics category filters
export const electronicsFilters: FilterGroup[] = [
  {
    id: "subcategory",
    title: "Subcategory",
    type: "nested",
    defaultExpanded: true,
    options: [
      {
        id: "phones",
        label: "Phones",
        action: "/category/electronics/phones",
        children: [
          { id: "iphone", label: "iPhone", action: "/category/electronics/phones/iphone", count: 123 },
          { id: "samsung", label: "Samsung", action: "/category/electronics/phones/samsung", count: 89 },
          { id: "xiaomi", label: "Xiaomi", action: "/category/electronics/phones/xiaomi", count: 67 },
          { id: "huawei", label: "Huawei", action: "/category/electronics/phones/huawei", count: 45 },
        ]
      },
      {
        id: "laptops",
        label: "Laptops",
        action: "/category/electronics/laptops",
        children: [
          { id: "macbook", label: "MacBook", action: "/category/electronics/laptops/macbook", count: 56 },
          { id: "dell", label: "Dell", action: "/category/electronics/laptops/dell", count: 78 },
          { id: "hp", label: "HP", action: "/category/electronics/laptops/hp", count: 45 },
        ]
      },
      {
        id: "gaming",
        label: "Gaming",
        action: "/category/electronics/gaming",
        children: [
          { id: "consoles", label: "Consoles", action: "/category/electronics/gaming/consoles", count: 34 },
          { id: "accessories", label: "Accessories", action: "/category/electronics/gaming/accessories", count: 89 },
        ]
      }
    ]
  },
  {
    id: "brand",
    title: "Brand",
    type: "checkbox",
    defaultExpanded: true,
    options: [
      { id: "apple", label: "Apple", count: 234 },
      { id: "samsung", label: "Samsung", count: 189 },
      { id: "xiaomi", label: "Xiaomi", count: 156 },
      { id: "huawei", label: "Huawei", count: 98 },
      { id: "dell", label: "Dell", count: 87 },
      { id: "hp", label: "HP", count: 76 },
      { id: "sony", label: "Sony", count: 65 },
    ]
  },
  {
    id: "price",
    title: "Price Range",
    type: "radio",
    defaultExpanded: true,
    options: [
      { id: "any", label: "Any Price" },
      { id: "0-50000", label: "₦0 - ₦50,000" },
      { id: "50000-150000", label: "₦50,000 - ₦150,000" },
      { id: "150000-300000", label: "₦150,000 - ₦300,000" },
      { id: "300000-500000", label: "₦300,000 - ₦500,000" },
      { id: "500000+", label: "₦500,000+" },
    ]
  },
  {
    id: "condition",
    title: "Condition",
    type: "checkbox",
    defaultExpanded: true,
    options: [
      { id: "new", label: "New", count: 1234 },
      { id: "used", label: "Used", count: 892 },
      { id: "refurbished", label: "Refurbished", count: 456 },
      { id: "damaged", label: "Damaged", count: 123 },
    ]
  }
]

// Vehicles category filters
export const vehiclesFilters: FilterGroup[] = [
  {
    id: "subcategory",
    title: "Vehicle Type",
    type: "nested",
    defaultExpanded: true,
    options: [
      {
        id: "cars",
        label: "Cars",
        action: "/category/vehicles/cars",
        children: [
          { id: "sedan", label: "Sedan", action: "/category/vehicles/cars/sedan", count: 234 },
          { id: "suv", label: "SUV", action: "/category/vehicles/cars/suv", count: 189 },
          { id: "hatchback", label: "Hatchback", action: "/category/vehicles/cars/hatchback", count: 156 },
          { id: "coupe", label: "Coupe", action: "/category/vehicles/cars/coupe", count: 67 },
        ]
      },
      {
        id: "motorcycles",
        label: "Motorcycles",
        action: "/category/vehicles/motorcycles",
        children: [
          { id: "sport", label: "Sport", action: "/category/vehicles/motorcycles/sport", count: 89 },
          { id: "cruiser", label: "Cruiser", action: "/category/vehicles/motorcycles/cruiser", count: 45 },
          { id: "scooter", label: "Scooter", action: "/category/vehicles/motorcycles/scooter", count: 78 },
        ]
      }
    ]
  },
  {
    id: "brand",
    title: "Brand",
    type: "checkbox",
    defaultExpanded: true,
    options: [
      { id: "toyota", label: "Toyota", count: 234 },
      { id: "honda", label: "Honda", count: 189 },
      { id: "nissan", label: "Nissan", count: 156 },
      { id: "hyundai", label: "Hyundai", count: 98 },
      { id: "ford", label: "Ford", count: 87 },
      { id: "mercedes", label: "Mercedes", count: 76 },
    ]
  },
  {
    id: "year",
    title: "Year",
    type: "checkbox",
    defaultExpanded: true,
    options: [
      { id: "2024", label: "2024", count: 45 },
      { id: "2023", label: "2023", count: 89 },
      { id: "2022", label: "2022", count: 123 },
      { id: "2021", label: "2021", count: 156 },
      { id: "2020", label: "2020", count: 189 },
      { id: "2019", label: "2019", count: 234 },
      { id: "older", label: "2018 & Older", count: 456 },
    ]
  },
  {
    id: "price",
    title: "Price Range",
    type: "radio",
    defaultExpanded: true,
    options: [
      { id: "any", label: "Any Price" },
      { id: "0-500000", label: "₦0 - ₦500,000" },
      { id: "500000-1500000", label: "₦500,000 - ₦1.5M" },
      { id: "1500000-3000000", label: "₦1.5M - ₦3M" },
      { id: "3000000-5000000", label: "₦3M - ₦5M" },
      { id: "5000000+", label: "₦5M+" },
    ]
  }
]

// Function to get filters by category
export const getFiltersByCategory = (categorySlug: string): FilterGroup[] => {
  switch (categorySlug) {
    case 'electronics':
      return electronicsFilters
    case 'vehicles':
      return vehiclesFilters
    default:
      return searchFilters // Default to search filters
  }
}
