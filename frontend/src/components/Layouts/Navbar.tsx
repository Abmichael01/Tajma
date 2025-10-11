"use client"

import React, { useState, useEffect } from 'react'
import Logo from '../General/Logo'
import { Button } from '../ui/button'
import SearchBox from '../ui/SearchBox'
import AuthButton from '../ui/AuthButton'
import UserDropdown from '../ui/UserDropdown'
import NotificationDropdown from '../ui/NotificationDropdown'
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
  Bell,
  ChevronDown
} from 'lucide-react'

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
    const { isAuthenticated, user } = useAuthStore()
    const { getFavoritesCount } = useFavoritesStore()
    const favoritesCount = getFavoritesCount()

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
                            <span className='hidden xs:inline sm:inline'>Lagos, Nigeria</span>
                            <span className='xs:hidden sm:hidden'>Lagos</span>
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

                    {/* Search Bar */}
                    <div className='hidden lg:flex flex-1 max-w-2xl mx-4'>
                        <SearchBox 
                            placeholder='Search for anything...'
                            className='w-full'
                        />
                    </div>

                    {/* User Actions */}
                    <div className='flex items-center gap-1 sm:gap-2'>
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
                                <Link href='/create-ad'>
                                    <Button variant="primary" size="sm" className='hidden sm:flex'>
                                        <Plus className='w-4 h-4 mr-2' />
                                        Post Ad
                                    </Button>
                                </Link>
                                <Link href='/create-ad'>
                                    <Button variant="primary" size="sm" className='sm:hidden'>
                                        <Plus className='w-4 h-4' />
                                    </Button>
                                </Link>
                                <Link href={`/profile/${user?.uid}?tab=saved`} className="relative">
                                    <Button variant="ghost" size="icon" className="hidden lg:flex">
                                        <Heart className='w-5 h-5' />
                                    </Button>
                                    {favoritesCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs min-w-5 h-5 px-1 flex items-center justify-center font-semibold z-10">
                                            {favoritesCount > 9 ? '9+' : favoritesCount}
                                        </span>
                                    )}
                                </Link>
                                <Link href="/chat">
                                    <Button variant="ghost" size="icon" className="hidden lg:flex">
                                        <MessageSquare className='w-5 h-5' />
                                    </Button>
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
                            className='lg:hidden ml-1'
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
                        </Button>
                    </div>
                </div>

                {/* Mobile/Tablet Search */}
                <div className='lg:hidden mt-3 sm:mt-4'>
                    <SearchBox 
                        placeholder='Search for anything...'
                        className='w-full'
                    />
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

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className='lg:hidden border-t bg-white'>
                    <div className='container py-4 space-y-4'>
                        {!isAuthenticated && (
                            <div className='flex flex-col gap-2'>
                                <AuthButton />
                            </div>
                        )}
                        
                        {isAuthenticated && (
                            <div className='space-y-3'>
                                <div className='flex items-center justify-between'>
                                    <h3 className='font-semibold text-gray-900 text-sm'>Account</h3>
                                    <Link href='/create-ad'>
                                        <Button variant="primary" size="sm" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Plus className='w-4 h-4 mr-2' />
                                            Post Ad
                                        </Button>
                                    </Link>
                                </div>
                                <div className='space-y-1'>
                                       <Link href={`/profile/${user?.uid}`} className='block py-2 px-3 text-gray-600 hover:text-secondary hover:bg-gray-50 rounded' onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
                                       <Link href={`/profile/${user?.uid}?tab=ads`} className='block py-2 px-3 text-gray-600 hover:text-secondary hover:bg-gray-50 rounded' onClick={() => setIsMobileMenuOpen(false)}>My Ads</Link>
                                       <Link href={`/profile/${user?.uid}?tab=saved`} className='flex items-center justify-between py-2 px-3 text-gray-600 hover:text-secondary hover:bg-gray-50' onClick={() => setIsMobileMenuOpen(false)}>
                                           <span>Saved Ads</span>
                                           {favoritesCount > 0 && (
                                               <span className="bg-secondary text-white text-xs px-2 py-0.5 font-semibold">
                                                   {favoritesCount}
                                               </span>
                                           )}
                                       </Link>
                                       <Link href='/chat' className='block py-2 px-3 text-gray-600 hover:text-secondary hover:bg-gray-50 rounded' onClick={() => setIsMobileMenuOpen(false)}>Messages</Link>
                                       <Link href={`/profile/${user?.uid}?tab=notifications`} className='block py-2 px-3 text-gray-600 hover:text-secondary hover:bg-gray-50 rounded' onClick={() => setIsMobileMenuOpen(false)}>Notifications</Link>
                                </div>
                            </div>
                        )}

                        <div className='space-y-3'>
                            <h3 className='font-semibold text-gray-900 text-sm'>Categories</h3>
                            <div className='space-y-1'>
                                {categories.map((category) => (
                                    <Link 
                                        key={category} 
                                        href={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                                        className='block py-2 px-3 text-gray-600 hover:text-secondary hover:bg-gray-50 rounded'
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {category}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className='space-y-3'>
                            <h3 className='font-semibold text-gray-900 text-sm'>Quick Links</h3>
                            <div className='space-y-1'>
                                <Link href='/help' className='block py-2 px-3 text-gray-600 hover:text-primary hover:bg-gray-50 rounded' onClick={() => setIsMobileMenuOpen(false)}>Help</Link>
                                <Link href='/create-ad' className='block py-2 px-3 text-gray-600 hover:text-primary hover:bg-gray-50 rounded' onClick={() => setIsMobileMenuOpen(false)}>Sell</Link>
                                <Link href='/' className='block py-2 px-3 text-gray-600 hover:text-primary hover:bg-gray-50 rounded' onClick={() => setIsMobileMenuOpen(false)}>Buy</Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}
