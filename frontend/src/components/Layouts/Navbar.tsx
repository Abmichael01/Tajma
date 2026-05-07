"use client"

import React, { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter, Link } from '@/i18n/routing'
import Logo from '../General/Logo'
import { Button } from '../ui/button'
import AuthButton from '../ui/AuthButton'
import UserDropdown from '../ui/UserDropdown'
import NotificationDropdown from '../ui/NotificationDropdown'
import { Skeleton } from '../ui/skeleton'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import SearchModal from '../modals/SearchModal'
import { useAuthStore } from '@/store/authStore'
import { useSavedAds } from '@/hooks/useSavedAds'
import { useChats } from '@/hooks/useChat'
import { useTranslations } from 'next-intl'
import { 
  MapPin, 
  Menu, 
  X, 
  Plus, 
  Heart, 
  MessageCircleMore,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import CategoryImage from '@/components/ui/CategoryImage'
import { useLocation } from '@/hooks/useLocation'
import { useLocationStore } from '@/store/locationStore'
import LocationSelectorModal from '../modals/LocationSelectorModal'

export default function Navbar() {
    const t = useTranslations('common');
    const navT = useTranslations('nav');
    const pathname = usePathname()
    const isChatPage = pathname === '/chat'
    const router = useRouter()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const { isAuthenticated, user } = useAuthStore()
    const { data: savedAdsData } = useSavedAds(undefined, undefined)
    const { data: chats = [] } = useChats()
    const { rootCategories, loading: categoriesLoading, error: categoriesError } = useCategories()
    const { getLocationString, getShortLocationString, loading: locationLoading } = useLocation()
    // Location State
    const { selectedCountry, setSelectedCountry } = useLocationStore()
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

    // Get count from paginated response or calculate from results
    const favoritesCount = savedAdsData?.count ?? (savedAdsData?.results?.length || 0)
    // Calculate total unread messages from all chats
    const totalUnreadMessages = chats.reduce((total, chat) => total + (chat.unread_count || 0), 0)
    const profileSlug = user ? (user.username || user.id || 'profile') : 'profile'

    // Horizontal scroll shadows for categories bar
    const categoriesScrollRef = useRef<HTMLDivElement | null>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const marqueeIntervalRef = useRef<NodeJS.Timeout | null>(null)


    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        const params = new URLSearchParams()
        if (searchQuery.trim()) params.append('q', searchQuery.trim())
        router.push(`/search?${params.toString()}`)
    }

    const updateCategoryScrollShadows = () => {
        const el = categoriesScrollRef.current
        if (!el) return
        const { scrollLeft, scrollWidth, clientWidth } = el
        setCanScrollLeft(scrollLeft > 4)
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4)
    }

    const scrollCategories = (direction: 'left' | 'right') => {
        const el = categoriesScrollRef.current
        if (!el) return
        const scrollAmount = 200 // pixels to scroll
        const newScrollLeft = direction === 'left' 
            ? el.scrollLeft - scrollAmount 
            : el.scrollLeft + scrollAmount
        el.scrollTo({ left: newScrollLeft, behavior: 'smooth' })
    }

    // Auto-scroll marquee effect
    useEffect(() => {
        const el = categoriesScrollRef.current
        if (!el || isHovered) return

        // Check if content overflows
        const checkOverflow = () => {
            return el.scrollWidth > el.clientWidth
        }

        if (!checkOverflow()) return

        // Auto-scroll function
        const autoScroll = () => {
            if (!el || isHovered) return
            
            const { scrollLeft, scrollWidth, clientWidth } = el
            const halfWidth = scrollWidth / 2 // Half of total width (since we duplicate categories)
            
            // If reached the end of the duplicated content, reset to beginning seamlessly
            // This creates an infinite loop effect
            if (scrollLeft >= halfWidth - 1) {
                el.scrollTo({ left: scrollLeft - halfWidth, behavior: 'auto' })
            } else {
                // Scroll 1px to the right
                el.scrollBy({ left: 1, behavior: 'auto' })
            }
        }

        // Start auto-scrolling
        marqueeIntervalRef.current = setInterval(autoScroll, 20) // Smooth scroll every 20ms

        return () => {
            if (marqueeIntervalRef.current) {
                clearInterval(marqueeIntervalRef.current)
            }
        }
    }, [rootCategories.length, isHovered])
    
    // Track navbar height for mobile menu positioning
    useEffect(() => {
        const updateNavbarHeight = () => {
            const navbar = document.querySelector('header')
            if (navbar) {
                const height = navbar.offsetHeight
                document.documentElement.style.setProperty('--navbar-height', `${height}px`)
            }
        }
        
        updateNavbarHeight()
        window.addEventListener('resize', updateNavbarHeight)
        
        return () => window.removeEventListener('resize', updateNavbarHeight)
    }, [])
    
    // Update scroll shadows when categories change or scroll happens
    useEffect(() => {
        updateCategoryScrollShadows()
        const el = categoriesScrollRef.current
        if (!el) return
        el.addEventListener('scroll', updateCategoryScrollShadows)
        window.addEventListener('resize', updateCategoryScrollShadows)
        return () => {
            el.removeEventListener('scroll', updateCategoryScrollShadows)
            window.removeEventListener('resize', updateCategoryScrollShadows)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rootCategories.length])

    // Update shadows during auto-scroll
    useEffect(() => {
        if (!isHovered && marqueeIntervalRef.current) {
            const interval = setInterval(() => {
                updateCategoryScrollShadows()
            }, 100) // Update shadows every 100ms during auto-scroll
            return () => clearInterval(interval)
        }
    }, [isHovered])


    return (
        <header className='bg-white sticky top-0 z-50'>
            {/* Top Bar */}
            <div className='bg-secondary text-secondary-foreground py-2 text-xs sm:text-sm border-b border-white/10'>
                <div className='container flex justify-between items-center'>
                    <div className='flex items-center gap-2 sm:gap-4'>
                        <span className='hidden sm:inline'>{t('welcome_msg')}</span>
                        <span className='sm:hidden'>Tajma</span>
                        <button 
                            onClick={() => setIsLocationModalOpen(true)}
                            className='flex items-center gap-1 sm:gap-2 hover:text-primary transition-colors cursor-pointer group'
                        >
                            <MapPin className='w-3 h-3 sm:w-4 sm:h-4 group-hover:animate-bounce' />
                            {!locationLoading ? (
                                <>
                                    <span className='hidden xs:inline sm:inline'>
                                        {selectedCountry === 'All Countries' ? getLocationString() : selectedCountry}
                                    </span>
                                    <span className='xs:hidden sm:hidden'>
                                        {selectedCountry === 'All Countries' ? getShortLocationString() : selectedCountry.split(',')[0]}
                                    </span>
                                </>
                            ) : (
                                <span className='text-xs'>{t('loading')}</span>
                            )}
                        </button>
                    </div>
                    <div className='hidden sm:flex items-center gap-4'>
                        <Link href='/contact' className='hover:underline'>{navT('support')}</Link>
                        <Link href='/create-ad' className='hover:underline'>{navT('sell')}</Link>
                        <Link href='/' className='hover:underline'>{navT('buy')}</Link>
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <div className='border-b border-gray-100'>
                <div className='container py-2 sm:py-4'>
                <div className='flex justify-between items-center gap-4'>
                    {/* Logo */}
                    <div className='flex items-center flex-shrink-0'>
                        <Logo />
                    </div>

                    {/* Search Bar - Desktop */}
                    <div className='hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8 relative items-center gap-2'>
                        <form onSubmit={handleSearch} className="relative flex-1">
                            <input
                                type="text"
                                placeholder={t("search_placeholder")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-100 hover:bg-gray-200 focus:bg-white border border-transparent focus:border-primary/20 
                                transition-colors px-5 py-2.5 rounded-full outline-none text-sm text-gray-900 pr-10"
                            />
                            <button 
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white bg-primary hover:bg-primary/90 transition-all rounded-full shadow-md active:scale-95"
                            >
                                <Search className='w-4 h-4' />
                            </button>
                        </form>
                    </div>

                    {/* Spacer for Mobile */}
                    <div className='flex-1 md:hidden'></div>

                    {/* User Actions */}
                    <div className='flex items-center gap-1 sm:gap-2'>
                        {/* Search Icon - Mobile Only */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsSearchModalOpen(true)}
                            className="hidden sm:flex md:hidden"
                        >
                            <Search className='w-5 h-5' />
                        </Button>

                        {/* Language Switcher */}
                        <div className="flex items-center">
                            <LanguageSwitcher />
                        </div>
                        {!isAuthenticated ? (
                            <div className='flex items-center gap-1 sm:gap-2'>
                                <Link href="/login" className="hidden sm:block">
                                    <Button variant="primary" size="sm">
                                        {t('login')}
                                    </Button>
                                </Link>
                                <Link href="/login" className="sm:hidden">
                                    <Button variant="primary" size="sm">
                                        {t('login')}
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className='flex items-center gap-1 sm:gap-2'>
                                <Link href='/create-ad' className='hidden sm:block'>
                                    <Button variant="primary" size="sm">
                                        <Plus className='w-4 h-4 mr-2' />
                                        {t('post_ad')}
                                    </Button>
                                </Link>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className='sm:hidden'
                                    onClick={() => setIsSearchModalOpen(true)}
                                >
                                    <Search className='w-5 h-5' />
                                </Button>
                                <Link href={`/profile/${profileSlug}?tab=saved`} className="relative hidden lg:block">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="w-10 h-10 rounded-full border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
                                    >
                                        <Heart className='w-5 h-5 text-gray-700' />
                                    </Button>
                                    {favoritesCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] min-w-[20px] h-[20px] px-1 flex items-center justify-center font-bold z-10 rounded-full border-2 border-white shadow-sm">
                                            {favoritesCount > 9 ? '9+' : favoritesCount}
                                        </span>
                                    )}
                                </Link>
                                <Link href="/chat" className="relative hidden lg:block">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="w-10 h-10 rounded-full border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
                                    >
                                        <MessageCircleMore className='w-5 h-5 text-gray-700' />
                                    </Button>
                                    {totalUnreadMessages > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] min-w-[20px] h-[20px] px-1 flex items-center justify-center font-bold z-10 rounded-full border-2 border-white shadow-sm">
                                            {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                                        </span>
                                    )}
                                </Link>
                                <div className="hidden lg:block">
                                    <NotificationDropdown />
                                </div>
                                <UserDropdown />
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>

            {/* Categories Bar - Hidden on Mobile */}
            <div className='border-t border-b border-gray-100 bg-gray-50 hidden md:block'>
                <div className='container py-2 sm:py-3 relative h-full'>
                    <div 
                        className="relative flex items-center h-full"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {/* Left Fade Gradient */}
                        {canScrollLeft && (
                            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-50 to-transparent z-[5]" />
                        )}

                        {/* Right Fade Gradient */}
                        {canScrollRight && (
                            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 to-transparent z-[5]" />
                        )}

                        {/* Left Scroll Button */}
                        {canScrollLeft && (
                            <button
                                onClick={() => scrollCategories('left')}
                                className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center bg-transparent hover:bg-gray-100/50 z-10 transition-colors rounded-r"
                                aria-label="Scroll categories left"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>
                        )}

                        {/* Right Scroll Button */}
                        {canScrollRight && (
                            <button
                                onClick={() => scrollCategories('right')}
                                className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center bg-transparent hover:bg-gray-100/50 z-10 transition-colors rounded-l"
                                aria-label="Scroll categories right"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                        )}

                        <div
                            ref={categoriesScrollRef}
                            className='flex items-center gap-3 sm:gap-6 overflow-x-auto overflow-y-visible pb-1 [&::-webkit-scrollbar]:hidden px-10 h-full'
                            style={{ 
                                scrollbarWidth: 'none', 
                                msOverflowStyle: 'none'
                            }}
                        >
                        {categoriesLoading && (
                          <div className="flex items-center gap-6 overflow-hidden">
                            {[...Array(8)].map((_, i) => (
                              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                                <Skeleton className="w-7 h-7 rounded-full" />
                                <Skeleton className="h-4 w-16 sm:w-20 rounded-full" />
                              </div>
                            ))}
                          </div>
                        )}
                        {!categoriesLoading && categoriesError && (
                            <span className="text-xs sm:text-sm text-red-500">
                                {t('categories_unavailable')}
                            </span>
                        )}
                        {!categoriesLoading && !categoriesError && (
                            <>
                                {/* First set of categories */}
                                {rootCategories.map((category) => (
                                    <Link 
                                        key={category.id} 
                                        href={`/category/${category.slug}`}
                                        className='whitespace-nowrap text-xs sm:text-sm text-gray-600 hover:text-secondary hover:font-medium flex-shrink-0 px-1 flex items-center gap-1.5 sm:gap-2'
                                    >
                                        <CategoryImage
                                          imageUrl={category.imageUrl}
                                          name={category.name}
                                          size={28}
                                          className="w-7 h-7 flex-shrink-0"
                                        />
                                        <span>{category.name}</span>
                                    </Link>
                                ))}
                                {/* Second set of categories for seamless loop */}
                                {rootCategories.map((category) => (
                                    <Link 
                                        key={`${category.id}-duplicate`} 
                                        href={`/category/${category.slug}`}
                                        className='whitespace-nowrap text-xs sm:text-sm text-gray-600 hover:text-secondary hover:font-medium flex-shrink-0 px-1 flex items-center gap-1.5 sm:gap-2'
                                    >
                                        <CategoryImage
                                          imageUrl={category.imageUrl}
                                          name={category.name}
                                          size={28}
                                          className="w-7 h-7 flex-shrink-0"
                                        />
                                        <span>{category.name}</span>
                                    </Link>
                                ))}
                            </>
                        )}
                        </div>
                    </div>
                </div>
            </div>


            {/* Search Modal */}
            <SearchModal 
                isOpen={isSearchModalOpen} 
                onClose={() => setIsSearchModalOpen(false)} 
            />

            {/* Location Selector Modal (Drawer on Mobile) */}
            <LocationSelectorModal
                isOpen={isLocationModalOpen}
                onClose={() => setIsLocationModalOpen(false)}
                selectedLocation={selectedCountry}
                onSelectLocation={(location: any, country: any) => {
                    const countryPrefix = country ? `${country.flag_emoji} ` : ''
                    setSelectedCountry(location ? `${countryPrefix}${location.name}` : (country ? `${countryPrefix}${country.name}` : 'All Countries'))
                }}
            />
        </header>
    )
}
