"use client"

import React, { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Logo from '../General/Logo'
import { Button } from '../ui/button'
import AuthButton from '../ui/AuthButton'
import UserDropdown from '../ui/UserDropdown'
import NotificationDropdown from '../ui/NotificationDropdown'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import SearchModal from '../modals/SearchModal'
import { useAuthStore } from '@/store/authStore'
import { useSavedAds } from '@/hooks/useSavedAds'
import { useChats } from '@/hooks/useChat'
import Link from 'next/link'
import { 
  MapPin, 
  Menu, 
  X, 
  Plus, 
  Heart, 
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { getCategoryIcon } from '@/utils/categoryIcons'

export default function Navbar() {
    const pathname = usePathname()
    const isChatPage = pathname === '/chat'
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
    const { isAuthenticated, user } = useAuthStore()
    const { data: savedAdsData } = useSavedAds(undefined, undefined)
    const { data: chats = [] } = useChats()
    const { rootCategories, loading: categoriesLoading, error: categoriesError } = useCategories()
    // Get count from paginated response or calculate from results
    const favoritesCount = savedAdsData?.count ?? (savedAdsData?.results?.length || 0)
    // Calculate total unread messages from all chats
    const totalUnreadMessages = chats.reduce((total, chat) => total + (chat.unread_count || 0), 0)
    const profileSlug = user ? (user.username || user.email?.split('@')[0] || 'profile') : 'profile'

    // Horizontal scroll shadows for categories bar
    const categoriesScrollRef = useRef<HTMLDivElement | null>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const marqueeIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
            <div className='bg-secondary text-secondary-foreground py-2 text-xs sm:text-sm'>
                <div className='container flex justify-between items-center'>
                    <div className='flex items-center gap-2 sm:gap-4'>
                        <span className='hidden sm:inline'>Welcome to Tajma Marketplace</span>
                        <span className='sm:hidden'>Tajma Marketplace</span>
                        <div className='flex items-center gap-1 sm:gap-2'>
                            <MapPin className='w-3 h-3 sm:w-4 sm:h-4' />
                            <span className='hidden xs:inline sm:inline'>Niamey, Niger</span>
                            <span className='xs:hidden sm:hidden'>Niamey</span>
                        </div>
                    </div>
                    <div className='hidden sm:flex items-center gap-4'>
                        <Link href='/help' className='hover:underline'>Help</Link>
                        <Link href='/create-ad' className='hover:underline'>Sell</Link>
                        <Link href='/' className='hover:underline'>Buy</Link>
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <div className='container py-2 sm:py-4'>
                <div className='flex justify-between items-center gap-4'>
                    {/* Logo */}
                    <div className='flex items-center flex-shrink-0'>
                        <Logo />
                    </div>

                    {/* Spacer */}
                    <div className='flex-1'></div>

                    {/* User Actions */}
                    <div className='flex items-center gap-1 sm:gap-2'>
                        {/* Search Icon */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsSearchModalOpen(true)}
                            className="hidden sm:flex"
                        >
                            <Search className='w-5 h-5' />
                        </Button>

                        {/* Language Switcher */}
                        <div className="hidden sm:block">
                            <LanguageSwitcher />
                        </div>
                        {!isAuthenticated ? (
                            <div className='flex items-center gap-1 sm:gap-2'>
                                <Link href="/login" className="hidden sm:block">
                                    <Button variant="secondary" size="sm" className="hover:bg-secondary/90">
                                        Login
                                    </Button>
                                </Link>
                                <Link href="/login" className="sm:hidden">
                                    <Button variant="primary" size="sm">
                                        Login
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className='flex items-center gap-1 sm:gap-2'>
                                <Link href='/create-ad' className='hidden sm:block'>
                                    <Button variant="primary" size="sm">
                                        <Plus className='w-4 h-4 mr-2' />
                                        Post Ad
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
                                    <Button variant="ghost" size="icon">
                                        <Heart className='w-5 h-5' />
                                    </Button>
                                    {favoritesCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs min-w-5 h-5 px-1 flex items-center justify-center font-semibold z-10 rounded-full">
                                            {favoritesCount > 9 ? '9+' : favoritesCount}
                                        </span>
                                    )}
                                </Link>
                                <Link href="/chat" className="hidden lg:block relative">
                                    <Button variant="ghost" size="icon">
                                        <MessageSquare className='w-5 h-5' />
                                    </Button>
                                    {totalUnreadMessages > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs min-w-5 h-5 px-1 flex items-center justify-center font-semibold z-10 rounded-full">
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

                        {/* Mobile Menu Button */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className='lg:hidden ml-1 relative'
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <div className="flex flex-col gap-1 w-5 h-5 items-center justify-center">
                                <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                                <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                                <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                            </div>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Categories Bar - Hidden on Mobile */}
            <div className='border-t bg-gray-50 hidden md:block'>
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
                            <span className="text-xs sm:text-sm text-gray-400">
                                Loading categories...
                            </span>
                        )}
                        {!categoriesLoading && categoriesError && (
                            <span className="text-xs sm:text-sm text-red-500">
                                Categories unavailable
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
                                        <span className="text-primary flex-shrink-0">
                                            {getCategoryIcon(category.icon || 'Package', 'w-3.5 h-3.5 sm:w-4 sm:h-4', 16)}
                                        </span>
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
                                        <span className="text-primary flex-shrink-0">
                                            {getCategoryIcon(category.icon || 'Package', 'w-3.5 h-3.5 sm:w-4 sm:h-4', 16)}
                                        </span>
                                        <span>{category.name}</span>
                                    </Link>
                                ))}
                            </>
                        )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className='lg:hidden fixed inset-0 bg-black/50 animate-fadeIn z-[60]'
                    style={{ top: 'var(--navbar-height, 64px)' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu - Slide from Right */}
            <div 
                className={`lg:hidden fixed right-0 top-0 bottom-0 w-[280px] bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ease-out z-[70] ${
                    isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                style={{ 
                    top: 'var(--navbar-height, 64px)',
                    height: 'calc(100vh - var(--navbar-height, 64px))',
                }}
            >
                <div className='h-full overflow-y-auto px-4 py-6 space-y-6'>
                    {/* Login/Register */}
                    {!isAuthenticated ? (
                        <div className='flex flex-col gap-2'>
                            <AuthButton />
                        </div>
                    ) : null}

                    {/* Quick Links */}
                    <div className='space-y-1 border-t pt-3'>
                        <Link href='/help' className='block py-3 px-3 text-gray-600 hover:text-secondary hover:bg-gray-50 rounded' onClick={() => setIsMobileMenuOpen(false)}>Help & Support</Link>
                        <Link href='/about' className='block py-3 px-3 text-gray-600 hover:text-secondary hover:bg-gray-50 rounded' onClick={() => setIsMobileMenuOpen(false)}>About Us</Link>
                        <Link href='/contact' className='block py-3 px-3 text-gray-600 hover:text-secondary hover:bg-gray-50 rounded' onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
                    </div>

                    {/* Language Switcher */}
                    <div className='border-t pt-3'>
                        <div className='flex items-center justify-between px-3'>
                            <span className='text-sm text-gray-600'>Language</span>
                            <LanguageSwitcher />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Modal */}
            <SearchModal 
                isOpen={isSearchModalOpen} 
                onClose={() => setIsSearchModalOpen(false)} 
            />
        </header>
    )
}
