"use client"

import React, { useState, useEffect } from 'react'
import Logo from '../General/Logo'
import { Button } from '../ui/button'
import AuthButton from '../ui/AuthButton'
import UserDropdown from '../ui/UserDropdown'
import NotificationDropdown from '../ui/NotificationDropdown'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import SearchModal from '../modals/SearchModal'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import Link from 'next/link'
import { 
  MapPin, 
  Menu, 
  X, 
  Plus, 
  Heart, 
  MessageSquare,
  Search,
  ChevronDown
} from 'lucide-react'

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
    const { isAuthenticated, user } = useAuthStore()
    const { getFavoritesCount } = useFavoritesStore()
    const favoritesCount = getFavoritesCount()
    
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

    const categories = [
        'Electronics',
        'Vehicles', 
        'Real Estate',
        'Jobs',
        'Services',
        'Fashion',
        'Home & Garden',
        'Sports'
    ]

    // Close categories dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (isCategoriesOpen && !target.closest('.categories-dropdown')) {
                setIsCategoriesOpen(false)
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [isCategoriesOpen])

    return (
        <header className='border-b bg-white sticky top-0 z-50'>
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
            <div className='container py-3 sm:py-4'>
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
                                <div className='hidden sm:block'>
                                    <AuthButton />
                                </div>
                                <div className='sm:hidden'>
                                    <Button variant="primary" size="sm">
                                        Login
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className='flex items-center gap-1 sm:gap-2'>
                                <Link href='/create-ad' className='hidden sm:block'>
                                    <Button variant="primary" size="sm">
                                        <Plus className='w-4 h-4 mr-2' />
                                        Post Ad
                                    </Button>
                                </Link>
                                <Link href='/create-ad' className='sm:hidden'>
                                    <Button variant="primary" size="sm">
                                        <Plus className='w-4 h-4' />
                                    </Button>
                                </Link>
                                <Link href={`/profile/${user?.uid}?tab=saved`} className="relative hidden lg:block">
                                    <Button variant="ghost" size="icon">
                                        <Heart className='w-5 h-5' />
                                    </Button>
                                    {favoritesCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs min-w-5 h-5 px-1 flex items-center justify-center font-semibold z-10">
                                            {favoritesCount > 9 ? '9+' : favoritesCount}
                                        </span>
                                    )}
                                </Link>
                                <Link href="/chat" className="hidden lg:block">
                                    <Button variant="ghost" size="icon">
                                        <MessageSquare className='w-5 h-5' />
                                    </Button>
                                </Link>
                                <div className="hidden lg:block">
                                    <NotificationDropdown />
                                </div>
                                <UserDropdown />
                            </div>
                        )}

                        {/* Mobile Search Icon */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className='sm:hidden'
                            onClick={() => setIsSearchModalOpen(true)}
                        >
                            <Search className='w-5 h-5' />
                        </Button>

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
                <div className='container py-2 sm:py-3'>
                    <div className='flex items-center gap-3 sm:gap-6 overflow-x-auto overflow-y-visible pb-1'>
                        <div className='relative categories-dropdown'>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className='whitespace-nowrap text-xs sm:text-sm flex-shrink-0'
                                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                            >
                                All Categories
                                <ChevronDown className='w-3 h-3 sm:w-4 sm:h-4 ml-1' />
                            </Button>
                            
                            {/* Categories Dropdown */}
                            {isCategoriesOpen && (
                                <div className='absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 shadow-lg z-50'>
                                    {categories.map((category) => (
                                        <Link
                                            key={category}
                                            href={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                                            className='block px-4 py-2 text-sm text-gray-700 hover:bg-secondary/10 hover:text-secondary transition-colors'
                                            onClick={() => setIsCategoriesOpen(false)}
                                        >
                                            {category}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                        {categories.map((category) => (
                            <Link 
                                key={category} 
                                href={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                                className='whitespace-nowrap text-xs sm:text-sm text-gray-600 hover:text-secondary hover:font-medium flex-shrink-0 px-1'
                            >
                                {category}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className='lg:hidden fixed inset-0 bg-black/50 animate-fadeIn'
                    style={{ top: 'var(--navbar-height, 64px)', zIndex: 40 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu - Slide from Right */}
            <div 
                className={`lg:hidden fixed right-0 top-0 bottom-0 w-[280px] bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ease-out ${
                    isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                style={{ 
                    top: 'var(--navbar-height, 64px)',
                    height: 'calc(100vh - var(--navbar-height, 64px))',
                    zIndex: 50
                }}
            >
                <div className='h-full overflow-y-auto px-4 py-6 space-y-6'>
                    {/* Login/Register or Post Ad */}
                    {!isAuthenticated ? (
                        <div className='flex flex-col gap-2'>
                            <AuthButton />
                        </div>
                    ) : (
                        <Link href='/create-ad' className='block'>
                            <Button variant="primary" className='w-full' onClick={() => setIsMobileMenuOpen(false)}>
                                <Plus className='w-4 h-4 mr-2' />
                                Post Ad
                            </Button>
                        </Link>
                    )}

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
