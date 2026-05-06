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
  DollarSign,
  Monitor,
  Watch,
  BaggageClaim,
  WashingMachine
} from 'lucide-react'

// Category Icon Mapping
export const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case 'electronics': return <Laptop className="w-4 h-4 text-primary" />
    case 'vehicles': return <Car className="w-4 h-4 text-primary" />
    case 'real-estate': return <Home className="w-4 h-4 text-primary" />
    case 'jobs': return <Briefcase className="w-4 h-4 text-primary" />
    case 'fashion': return <Shirt className="w-4 h-4 text-primary" />
    case 'services': return <Wrench className="w-4 h-4 text-primary" />
    default: return <Tag className="w-4 h-4 text-primary" />
  }
}

// Subcategory Icon Mapping
export const getSubcategoryIcon = (slug: string) => {
  if (slug?.includes('phone')) return <Smartphone className="w-4 h-4 text-primary" />
  if (slug?.includes('laptop')) return <Laptop className="w-4 h-4 text-primary" />
  if (slug?.includes('gaming')) return <Gamepad className="w-4 h-4 text-primary" />
  return <Layers className="w-4 h-4 text-primary" />
}

// Niger Departments Data
const nigerDepartments = [
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
      { id: "electronics", label: "Electronics", icon: <Laptop className="w-4 h-4 text-primary" /> },
      { id: "vehicles", label: "Vehicles", icon: <Car className="w-4 h-4 text-primary" /> },
      { id: "real-estate", label: "Real Estate", icon: <Home className="w-4 h-4 text-primary" /> },
      { id: "jobs", label: "Jobs", icon: <Briefcase className="w-4 h-4 text-primary" /> },
      { id: "fashion", label: "Fashion", icon: <Shirt className="w-4 h-4 text-primary" /> },
      { id: "services", label: "Services", icon: <Wrench className="w-4 h-4 text-primary" /> },
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
    id: "country",
    title: "Country",
    type: "radio",
    defaultExpanded: true,
    options: []
  },
  {
    id: "condition",
    title: "Condition",
    type: "checkbox",
    defaultExpanded: false,
    options: [
      { id: "new", label: "New", icon: <Tag className="w-4 h-4 text-primary" /> },
      { id: "used", label: "Used", icon: <Tag className="w-4 h-4 text-primary" /> },
      { id: "refurbished", label: "Refurbished", icon: <Wrench className="w-4 h-4 text-primary" /> },
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
        icon: <Smartphone className="w-4 h-4 text-primary" />,
        children: [
          { id: "iphone", label: "iPhone", action: "/category/electronics/phones/iphone", icon: <Smartphone className="w-4 h-4 text-primary" /> },
          { id: "samsung", label: "Samsung", action: "/category/electronics/phones/samsung", icon: <Smartphone className="w-4 h-4 text-primary" /> },
          { id: "xiaomi", label: "Xiaomi", action: "/category/electronics/phones/xiaomi", icon: <Smartphone className="w-4 h-4 text-primary" /> },
          { id: "huawei", label: "Huawei", action: "/category/electronics/phones/huawei", icon: <Smartphone className="w-4 h-4 text-primary" /> },
        ]
      },
      {
        id: "laptops",
        label: "Laptops",
        action: "/category/electronics/laptops",
        icon: <Laptop className="w-4 h-4 text-primary" />,
        children: [
          { id: "macbook", label: "MacBook", action: "/category/electronics/laptops/macbook", icon: <Laptop className="w-4 h-4 text-primary" /> },
          { id: "dell", label: "Dell", action: "/category/electronics/laptops/dell", icon: <Laptop className="w-4 h-4 text-primary" /> },
          { id: "hp", label: "HP", action: "/category/electronics/laptops/hp", icon: <Laptop className="w-4 h-4 text-primary" /> },
        ]
      },
      {
        id: "gaming",
        label: "Gaming",
        action: "/category/electronics/gaming",
        icon: <Gamepad className="w-4 h-4 text-primary" />,
        children: [
          { id: "consoles", label: "Consoles", action: "/category/electronics/gaming/consoles", icon: <Gamepad className="w-4 h-4 text-primary" /> },
          { id: "accessories", label: "Accessories", action: "/category/electronics/gaming/accessories", icon: <Gamepad className="w-4 h-4 text-primary" /> },
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
      { id: "apple", label: "Apple", icon: <Laptop className="w-4 h-4 text-primary" /> },
      { id: "samsung", label: "Samsung", icon: <Smartphone className="w-4 h-4 text-primary" /> },
      { id: "xiaomi", label: "Xiaomi", icon: <Smartphone className="w-4 h-4 text-primary" /> },
      { id: "huawei", label: "Huawei", icon: <Smartphone className="w-4 h-4 text-primary" /> },
      { id: "dell", label: "Dell", icon: <Laptop className="w-4 h-4 text-primary" /> },
      { id: "hp", label: "HP", icon: <Laptop className="w-4 h-4 text-primary" /> },
      { id: "sony", label: "Sony", icon: <Gamepad className="w-4 h-4 text-primary" /> },
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
      { id: "new", label: "New", icon: <Tag className="w-4 h-4 text-primary" /> },
      { id: "used", label: "Used", icon: <Tag className="w-4 h-4 text-primary" /> },
      { id: "refurbished", label: "Refurbished", icon: <Wrench className="w-4 h-4 text-primary" /> },
      { id: "damaged", label: "Damaged", icon: <Tag className="w-4 h-4 text-red-400" /> },
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
        icon: <Car className="w-4 h-4 text-primary" />,
        children: [
          { id: "sedan", label: "Sedan", action: "/category/vehicles/cars/sedan", icon: <Car className="w-4 h-4 text-primary" /> },
          { id: "suv", label: "SUV", action: "/category/vehicles/cars/suv", icon: <Car className="w-4 h-4 text-primary" /> },
          { id: "hatchback", label: "Hatchback", action: "/category/vehicles/cars/hatchback", icon: <Car className="w-4 h-4 text-primary" /> },
          { id: "coupe", label: "Coupe", action: "/category/vehicles/cars/coupe", icon: <Car className="w-4 h-4 text-primary" /> },
        ]
      },
      {
        id: "motorcycles",
        label: "Motorcycles",
        action: "/category/vehicles/motorcycles",
        icon: <Car className="w-4 h-4 text-primary" />, 
        children: [
          { id: "sport", label: "Sport", action: "/category/vehicles/motorcycles/sport", icon: <Car className="w-4 h-4 text-primary" /> },
          { id: "cruiser", label: "Cruiser", action: "/category/vehicles/motorcycles/cruiser", icon: <Car className="w-4 h-4 text-primary" /> },
          { id: "scooter", label: "Scooter", action: "/category/vehicles/motorcycles/scooter", icon: <Car className="w-4 h-4 text-primary" /> },
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
      { id: "toyota", label: "Toyota", icon: <Car className="w-4 h-4 text-primary" /> },
      { id: "honda", label: "Honda", icon: <Car className="w-4 h-4 text-primary" /> },
      { id: "nissan", label: "Nissan", icon: <Car className="w-4 h-4 text-primary" /> },
      { id: "hyundai", label: "Hyundai", icon: <Car className="w-4 h-4 text-primary" /> },
      { id: "ford", label: "Ford", icon: <Car className="w-4 h-4 text-primary" /> },
      { id: "mercedes", label: "Mercedes", icon: <Car className="w-4 h-4 text-primary" /> },
    ]
  },
  {
    id: "year",
    title: "Year",
    type: "checkbox",
    defaultExpanded: true,
    options: [
      { id: "2024", label: "2024", icon: <Calendar className="w-4 h-4 text-primary" /> },
      { id: "2023", label: "2023", icon: <Calendar className="w-4 h-4 text-primary" /> },
      { id: "2022", label: "2022", icon: <Calendar className="w-4 h-4 text-primary" /> },
      { id: "2021", label: "2021", icon: <Calendar className="w-4 h-4 text-primary" /> },
      { id: "2020", label: "2020", icon: <Calendar className="w-4 h-4 text-primary" /> },
      { id: "2019", label: "2019", icon: <Calendar className="w-4 h-4 text-primary" /> },
      { id: "older", label: "2018 & Older", icon: <Calendar className="w-4 h-4 text-primary" /> },
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
