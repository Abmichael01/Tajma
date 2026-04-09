import React from 'react'
import { FilterGroup } from '@/components/ui/FiltersSection'
import { 
  Laptop, 
  Car, 
  Home, 
  Briefcase, 
  Shirt, 
  Wrench, 
  MapPin, 
  Tag, 
  Layers,
  Smartphone,
  Gamepad,
  ShieldCheck,
  Calendar,
  DollarSign
} from 'lucide-react'

// Category Icon Mapping
export const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case 'electronics': return <Laptop className="w-4 h-4" />
    case 'vehicles': return <Car className="w-4 h-4" />
    case 'real-estate': return <Home className="w-4 h-4" />
    case 'jobs': return <Briefcase className="w-4 h-4" />
    case 'fashion': return <Shirt className="w-4 h-4" />
    case 'services': return <Wrench className="w-4 h-4" />
    default: return <Tag className="w-4 h-4" />
  }
}

// Subcategory Icon Mapping
export const getSubcategoryIcon = (slug: string) => {
  if (slug?.includes('phone')) return <Smartphone className="w-4 h-4" />
  if (slug?.includes('laptop')) return <Laptop className="w-4 h-4" />
  if (slug?.includes('gaming')) return <Gamepad className="w-4 h-4" />
  return <Layers className="w-4 h-4" />
}

// Niger Regions Data
const nigerRegions = [
  { id: "niamey", label: "Niamey" },
  { id: "dosso", label: "Dosso" },
  { id: "maradi", label: "Maradi" },
  { id: "tahoua", label: "Tahoua" },
  { id: "tillaberi", label: "Tillabéri" },
  { id: "zinder", label: "Zinder" },
  { id: "agadez", label: "Agadez" },
  { id: "diffa", label: "Diffa" }
]

// Search page filters - simplified and focused on important ones
export const searchFilters: FilterGroup[] = [
  {
    id: "category",
    title: "Category",
    type: "checkbox",
    defaultExpanded: true,
    options: [
      { id: "electronics", label: "Electronics" },
      { id: "vehicles", label: "Vehicles" },
      { id: "real-estate", label: "Real Estate" },
      { id: "jobs", label: "Jobs" },
      { id: "fashion", label: "Fashion" },
      { id: "services", label: "Services" },
    ]
  },
  {
    id: "price",
    title: "Price Range",
    type: "range",
    defaultExpanded: true,
    options: []
  },
  {
    id: "location",
    title: "Location",
    type: "checkbox",
    defaultExpanded: true,
    options: nigerRegions.map(r => ({ ...r, icon: <MapPin className="w-4 h-4" /> }))
  },
  {
    id: "condition",
    title: "Condition",
    type: "checkbox",
    defaultExpanded: false,
    options: [
      { id: "new", label: "New" },
      { id: "used", label: "Used" },
      { id: "refurbished", label: "Refurbished" },
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
        icon: <Smartphone className="w-4 h-4" />,
        children: [
          { id: "iphone", label: "iPhone", action: "/category/electronics/phones/iphone" },
          { id: "samsung", label: "Samsung", action: "/category/electronics/phones/samsung" },
          { id: "xiaomi", label: "Xiaomi", action: "/category/electronics/phones/xiaomi" },
          { id: "huawei", label: "Huawei", action: "/category/electronics/phones/huawei" },
        ]
      },
      {
        id: "laptops",
        label: "Laptops",
        action: "/category/electronics/laptops",
        icon: <Laptop className="w-4 h-4" />,
        children: [
          { id: "macbook", label: "MacBook", action: "/category/electronics/laptops/macbook" },
          { id: "dell", label: "Dell", action: "/category/electronics/laptops/dell" },
          { id: "hp", label: "HP", action: "/category/electronics/laptops/hp" },
        ]
      },
      {
        id: "gaming",
        label: "Gaming",
        action: "/category/electronics/gaming",
        icon: <Gamepad className="w-4 h-4" />,
        children: [
          { id: "consoles", label: "Consoles", action: "/category/electronics/gaming/consoles" },
          { id: "accessories", label: "Accessories", action: "/category/electronics/gaming/accessories" },
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
      { id: "apple", label: "Apple" },
      { id: "samsung", label: "Samsung" },
      { id: "xiaomi", label: "Xiaomi" },
      { id: "huawei", label: "Huawei" },
      { id: "dell", label: "Dell" },
      { id: "hp", label: "HP" },
      { id: "sony", label: "Sony" },
    ]
  },
  {
    id: "price",
    title: "Price Range",
    type: "range",
    defaultExpanded: true,
    options: []
  },
  {
    id: "condition",
    title: "Condition",
    type: "checkbox",
    defaultExpanded: true,
    options: [
      { id: "new", label: "New" },
      { id: "used", label: "Used" },
      { id: "refurbished", label: "Refurbished" },
      { id: "damaged", label: "Damaged" },
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
        icon: <Car className="w-4 h-4" />,
        children: [
          { id: "sedan", label: "Sedan", action: "/category/vehicles/cars/sedan" },
          { id: "suv", label: "SUV", action: "/category/vehicles/cars/suv" },
          { id: "hatchback", label: "Hatchback", action: "/category/vehicles/cars/hatchback" },
          { id: "coupe", label: "Coupe", action: "/category/vehicles/cars/coupe" },
        ]
      },
      {
        id: "motorcycles",
        label: "Motorcycles",
        action: "/category/vehicles/motorcycles",
        icon: <Car className="w-4 h-4" />, // Need a motorcycle icon? Using Car as fallback or bike below
        children: [
          { id: "sport", label: "Sport", action: "/category/vehicles/motorcycles/sport" },
          { id: "cruiser", label: "Cruiser", action: "/category/vehicles/motorcycles/cruiser" },
          { id: "scooter", label: "Scooter", action: "/category/vehicles/motorcycles/scooter" },
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
      { id: "toyota", label: "Toyota" },
      { id: "honda", label: "Honda" },
      { id: "nissan", label: "Nissan" },
      { id: "hyundai", label: "Hyundai" },
      { id: "ford", label: "Ford" },
      { id: "mercedes", label: "Mercedes" },
    ]
  },
  {
    id: "year",
    title: "Year",
    type: "checkbox",
    defaultExpanded: true,
    options: [
      { id: "2024", label: "2024" },
      { id: "2023", label: "2023" },
      { id: "2022", label: "2022" },
      { id: "2021", label: "2021" },
      { id: "2020", label: "2020" },
      { id: "2019", label: "2019" },
      { id: "older", label: "2018 & Older" },
    ]
  },
  {
    id: "price",
    title: "Price Range",
    type: "range",
    defaultExpanded: true,
    options: []
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
