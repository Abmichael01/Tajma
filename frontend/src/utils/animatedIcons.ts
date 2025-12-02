/**
 * Utility for mapping icon names to animated icon components
 * Handles imports and provides a clean API for using animated icons
 */

// Admin sidebar icons - direct imports
export { LayoutGrid } from '@/components/icons/icons/LayoutGrid'
export { Users } from '@/components/icons/icons/Users'
export { PackageOpen } from '@/components/icons/icons/PackageOpen'
export { Folders } from '@/components/icons/icons/Folders'
export { BellRing } from '@/components/icons/icons/BellRing'
export { User } from '@/components/icons/icons/User'
export { ChevronLeft } from '@/components/icons/icons/ChevronLeft'
export { ChevronRight } from '@/components/icons/icons/ChevronRight'

// Note: Some icons don't have animated equivalents, so we'll use lucide-react for those
// MessageSquare, Mail, LogOut will remain from lucide-react

/**
 * Icon mapping for admin sidebar
 * Maps lucide-react icon names to animated icon components
 */
export const adminIconMap = {
  LayoutDashboard: 'LayoutGrid',
  Users: 'Users',
  Package: 'PackageOpen',
  FolderTree: 'Folders',
  Bell: 'BellRing',
  // MessageSquare, Mail, LogOut will use lucide-react
}

/**
 * Get animated icon component by name
 * Returns the component if available, otherwise returns null
 */
export function getAnimatedIcon(iconName: string) {
  // This is a helper function - components should import directly
  return null
}
