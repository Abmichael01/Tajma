"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUpdateProfile, useChangePassword } from '@/hooks/useAuth'
import { useRegions } from '@/hooks/useRegions'
import type { Region } from '@/api/regions'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Shield,
  Camera,
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
  X,
  User as UserIcon,
  Bell,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'
import type { User, ProfileUpdateResponse } from '@/api/types'
import { getUserFullName, getUserInitials, normalizeAvatarUrl } from '@/utils/user'

interface ProfileSettingsProps {
  user: User
  onUpdateUser?: (updates: Partial<User>) => void
}

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  username: z.string().optional(), // Username is kept in form but not editable/required
  phone: z
    .string()
    .max(20, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  address: z.string().max(500, 'Address is too long').optional().or(z.literal('')),
  email_notifications: z.boolean(),
  sms_notifications: z.boolean(),
  marketing_notifications: z.boolean(),
})

const passwordSchema = z
  .object({
    old_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    new_password_confirm: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.new_password_confirm, {
    path: ['new_password_confirm'],
    message: 'Passwords do not match',
  })

type ProfileFormValues = z.infer<typeof profileSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

export default function ProfileSettings({ user, onUpdateUser }: ProfileSettingsProps) {
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const { data: regions, isLoading: regionsLoading } = useRegions()
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Get region ID from user location by matching region name
  const getUserRegionId = () => {
    if (!user?.location || !regions?.results) return ''
    const matchingRegion = regions.results.find((r: Region) => r.name === user.location)
    return matchingRegion?.id.toString() || ''
  }

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      phone: user.phone || '',
      location: getUserRegionId(),
      address: user.address || '',
      email_notifications: user.email_notifications ?? true,
      sms_notifications: user.sms_notifications ?? false,
      marketing_notifications: user.marketing_notifications ?? true,
    },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      new_password_confirm: '',
    },
  })

  useEffect(() => {
    const regionId = getUserRegionId()
    profileForm.reset({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      phone: user.phone || '',
      location: regionId,
      address: user.address || '',
      email_notifications: user.email_notifications ?? true,
      sms_notifications: user.sms_notifications ?? false,
      marketing_notifications: user.marketing_notifications ?? true,
    })
    setAvatarPreview(user.avatar || null)
    setAvatarFile(null)
  }, [user, profileForm, regions])

  const profileFieldNames: Array<keyof ProfileFormValues> = ['first_name', 'last_name', 'phone', 'location', 'address', 'email_notifications', 'sms_notifications', 'marketing_notifications']
  const passwordFieldNames: Array<keyof PasswordFormValues> = ['old_password', 'new_password', 'new_password_confirm']

  const handleProfileSubmit = profileForm.handleSubmit(async (values) => {
    try {
      // If avatar file is present, use FormData; otherwise use JSON
      const hasAvatarFile = avatarFile !== null

      let response: ProfileUpdateResponse

      if (hasAvatarFile) {
        // Use FormData for file upload
        const formData = new FormData()
        formData.append('first_name', values.first_name.trim())
        formData.append('last_name', values.last_name.trim())
        if (values.phone?.trim()) {
          formData.append('phone', values.phone.trim())
        }
        if (values.location) {
          formData.append('location', parseInt(values.location).toString())
        }
        if (values.address?.trim()) {
          formData.append('address', values.address.trim())
        }
        formData.append('email_notifications', values.email_notifications.toString())
        formData.append('sms_notifications', values.sms_notifications.toString())
        formData.append('marketing_notifications', values.marketing_notifications.toString())
        formData.append('avatar', avatarFile)

        // Make FormData request directly
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1]

        const formDataResponse = await fetch(`${API_BASE_URL}/api/auth/profile/update/`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'X-CSRFToken': csrfToken || '',
          },
          body: formData,
        })

        if (!formDataResponse.ok) {
          const errorData = await formDataResponse.json()
          throw { response: { data: errorData } }
        }

        response = await formDataResponse.json()
      } else {
        // Use JSON payload (no file upload)
        const payload = {
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          phone: values.phone?.trim() || undefined,
          location: values.location ? parseInt(values.location) : undefined,
          address: values.address?.trim() || undefined,
          email_notifications: values.email_notifications,
          sms_notifications: values.sms_notifications,
          marketing_notifications: values.marketing_notifications,
        }

        response = await updateProfile.mutateAsync(payload)
      }
      toast.success('Profile updated successfully')
      
      // Get region name for display
      const selectedRegion = regions?.results?.find((r: Region) => r.id === (values.location ? parseInt(values.location) : undefined))
      const locationDisplay = selectedRegion?.name || ''

      profileForm.reset({
        ...values,
        username: user.username || '',
      })

      if (response?.user?.avatar) {
        setAvatarPreview(response.user.avatar)
      } else if (!response?.user?.avatar) {
        setAvatarPreview(null)
      }

      if (avatarFile) {
        setAvatarFile(null)
      }

      // Ensure we use the full user object from response if available
      const updatedUser = response?.user || response
      
      // Construct a clean update object from the response
      const userPatch: Partial<User> = {
        first_name: updatedUser.first_name || values.first_name.trim(),
        last_name: updatedUser.last_name || values.last_name.trim(),
        phone: updatedUser.phone || values.phone?.trim() || null,
        location: updatedUser.location || locationDisplay || null,
        address: updatedUser.address || values.address?.trim() || null,
        avatar: updatedUser.avatar || null,
        email_notifications: updatedUser.email_notifications ?? values.email_notifications,
        sms_notifications: updatedUser.sms_notifications ?? values.sms_notifications,
        marketing_notifications: updatedUser.marketing_notifications ?? values.marketing_notifications,
      }

      onUpdateUser?.(userPatch)
    } catch (error: any) {
      const apiErrors = error.response?.data || {}
      Object.entries(apiErrors).forEach(([key, value]) => {
        if (profileFieldNames.includes(key as keyof ProfileFormValues)) {
          profileForm.setError(key as keyof ProfileFormValues, {
            type: 'server',
            message: Array.isArray(value) ? value[0] : String(value),
          })
        }
      })
    }
  })

  const handleAvatarClick = () => {
    avatarInputRef.current?.click()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error('Image size must be less than 5MB')
        return
      }

      setAvatarFile(file)

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        if (base64) {
          setAvatarPreview(base64)
        }
      }
      reader.onerror = () => {
        toast.error('Failed to read image file')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
  }

  const handlePasswordSubmit = passwordForm.handleSubmit(async (values) => {
    setPasswordError(null)
    setPasswordSuccess(false)

    try {
      await changePassword.mutateAsync(values)
      setPasswordSuccess(true)
      toast.success('Password updated successfully')
      passwordForm.reset({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      })
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (error: any) {
      const apiErrors = error.response?.data || {}
      const message =
        apiErrors?.message ||
        apiErrors?.old_password?.[0] ||
        apiErrors?.new_password?.[0] ||
        'Failed to change password. Please try again.'
      setPasswordError(message)
      Object.entries(apiErrors).forEach(([key, value]) => {
        if (passwordFieldNames.includes(key as keyof PasswordFormValues)) {
          passwordForm.setError(key as keyof PasswordFormValues, {
            type: 'server',
            message: Array.isArray(value) ? value[0] : String(value),
          })
        }
      })
    }
  })

  const fullName = getUserFullName(user)

  const sectionContainer = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-end justify-between px-2">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Account Settings</h2>
          <p className="text-sm text-gray-500 font-medium">Manage your personal information and preferences</p>
        </div>
      </div>
      
      {/* Profile Information Section */}
      <motion.div
        variants={sectionContainer}
        className="bg-white border border-gray-200 p-6 sm:p-8 rounded-[32px]"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-gray-50">
          <div className="relative group">
            <div className="relative flex flex-col items-center gap-3">
              {(() => {
                const avatarSrc = avatarPreview 
                  ? (avatarPreview.startsWith('data:') ? avatarPreview : normalizeAvatarUrl(avatarPreview))
                  : (user.avatar ? normalizeAvatarUrl(user.avatar) : null)
                
                return (
                  <Avatar className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white bg-gray-100 ring-1 ring-gray-100">
                    {avatarSrc ? (
                      <AvatarImage
                        src={avatarSrc}
                        alt={fullName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <AvatarFallback className="bg-secondary text-white text-2xl w-full h-full flex items-center justify-center">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    )}
                    
                    {/* Hover Overlay */}
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-300 text-white z-10"
                    >
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-semibold">Change</span>
                    </button>
                  </Avatar>
                )
              })()}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              {avatarFile && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-[10px] font-semibold text-red-500 hover:text-red-600"
                >
                  Discard Changes
                </button>
              )}
            </div>
          </div>
          
          <div className="text-center sm:text-left">
            <h4 className="text-xl font-semibold text-gray-900 tracking-tight">{fullName}</h4>
            <p className="text-gray-500 font-medium text-sm">{user.email}</p>
            {user.is_verified ? (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 mt-2">
                <Shield className="w-3.5 h-3.5" />
                Verified Seller
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 mt-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Verification Required
              </div>
            )}
          </div>
        </div>
        

        <Form {...profileForm}>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={profileForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-500">First Name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter first name" {...field} className="rounded-full border-gray-100 bg-gray-50/30 focus:bg-white transition-all h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-500">Last Name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter last name" {...field} className="rounded-full border-gray-100 bg-gray-50/30 focus:bg-white transition-all h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2.5">
                  Username
                </label>
                <Input 
                  type="text" 
                  value={user.username || ''} 
                  disabled 
                  className="bg-gray-100/50 cursor-not-allowed rounded-full border-gray-100 h-12 italic text-gray-400" 
                />
              </div>
              <FormField
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-500">Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+227 92 64 99 99" {...field} className="rounded-full border-gray-100 bg-gray-50/30 focus:bg-white transition-all h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-500">Business Region</FormLabel>
                    <FormControl>
                      {regionsLoading ? (
                        <div className="flex items-center gap-2 py-3 bg-gray-50/30 rounded-full border border-gray-100 px-4 h-12">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-xs text-gray-400 font-medium">Loading regions...</span>
                        </div>
                      ) : (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="rounded-full border-gray-100 bg-gray-50/30 focus:bg-white transition-all h-12">
                            <SelectValue placeholder="Select your region" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-gray-200">
                            {regions?.results?.map((region: Region) => (
                              <SelectItem key={region.id} value={region.id.toString()}>
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-500">Physical Address</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g., 123 Main Street" {...field} className="rounded-full border-gray-100 bg-gray-50/30 focus:bg-white transition-all h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-50">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  type="submit" 
                  variant="primary"
                  className="rounded-full px-10 h-12 font-semibold text-sm"
                  disabled={updateProfile.isPending || profileForm.formState.isSubmitting}
                >
                  {updateProfile.isPending || profileForm.formState.isSubmitting ? (
                    <>
                      <MarketplaceLoader inline size="sm" white />
                      <span className="ml-2">Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </motion.div>
              <Button 
                type="button" 
                variant="ghost"
                className="rounded-full px-8 h-12 text-xs font-semibold text-gray-400 hover:text-gray-900"
                onClick={() => {
                  const regionId = getUserRegionId()
                  profileForm.reset({
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    username: user.username || '',
                    phone: user.phone || '',
                    location: regionId,
                    address: user.address || '',
                    email_notifications: user.email_notifications ?? true,
                    sms_notifications: user.sms_notifications ?? false,
                    marketing_notifications: user.marketing_notifications ?? true,
                  })
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>

      {/* Security & Password Section */}
      <motion.div
        variants={sectionContainer}
        className="bg-white border border-gray-200 p-6 sm:p-8 rounded-[32px]"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-center text-secondary">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 tracking-tight">Security & Privacy</h4>
            <p className="text-xs text-gray-500 font-medium">Keep your account safe with a strong password</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {passwordSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-start gap-3 overflow-hidden"
            >
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 text-sm">Security updated!</p>
                <p className="text-xs text-green-700 mt-0.5 font-medium">Your password has been changed successfully.</p>
              </div>
            </motion.div>
          )}

          {passwordError && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 overflow-hidden"
            >
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">{passwordError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <Form {...passwordForm}>
          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-2xl">
            <FormField
              control={passwordForm.control}
              name="old_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-gray-500">Current Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="rounded-full border-gray-100 bg-gray-50/30 focus:bg-white transition-all h-12 pr-12"
                        placeholder="••••••••"
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField
                control={passwordForm.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-500">New Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          type={showNewPassword ? 'text' : 'password'}
                          className="rounded-full border-gray-100 bg-gray-50/30 focus:bg-white transition-all h-12 pr-12"
                          placeholder="••••••••"
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="new_password_confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-500">Confirm New Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="rounded-full border-gray-100 bg-gray-50/30 focus:bg-white transition-all h-12 pr-12"
                          placeholder="••••••••"
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  type="submit" 
                  variant="secondary"
                  className="rounded-full px-10 h-12 font-semibold text-sm"
                  disabled={changePassword.isPending || passwordForm.formState.isSubmitting}
                >
                  {changePassword.isPending || passwordForm.formState.isSubmitting ? (
                    <>
                      <MarketplaceLoader inline size="sm" white />
                      <span className="ml-2">Updating...</span>
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </motion.div>
            </div>
          </form>
        </Form>
      </motion.div>

      {/* Notifications Section */}
      <motion.div
        variants={sectionContainer}
        className="bg-white border border-gray-200 p-6 sm:p-8 rounded-[32px]"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 tracking-tight">Notification Preferences</h4>
            <p className="text-xs text-gray-500 font-medium">Control how and when you hear from us</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <Form {...profileForm}>
            <form onSubmit={handleProfileSubmit}>
              <FormField
                control={profileForm.control}
                name="marketing_notifications"
                render={({ field }) => (
                  <div className="flex items-center justify-between py-5 border-b border-gray-50">
                    <div className="max-w-md">
                      <p className="font-semibold text-gray-900 text-sm mb-0.5">Marketing & Offers</p>
                      <p className="text-xs text-gray-400 font-medium">Stay updated with promotional offers and platform news</p>
                    </div>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                      className="w-6 h-6 rounded-lg border-gray-200" 
                    />
                  </div>
                )}
              />
              <FormField
                control={profileForm.control}
                name="email_notifications"
                render={({ field }) => (
                  <div className="flex items-center justify-between py-5 border-b border-gray-50">
                    <div className="max-w-md">
                      <p className="font-semibold text-gray-900 text-sm mb-0.5">Email Notifications</p>
                      <p className="text-xs text-gray-400 font-medium">Receive updates about your ads and messages via email</p>
                    </div>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                      className="w-6 h-6 rounded-lg border-gray-200" 
                    />
                  </div>
                )}
              />
              <FormField
                control={profileForm.control}
                name="sms_notifications"
                render={({ field }) => (
                  <div className="flex items-center justify-between py-5">
                    <div className="max-w-md">
                      <p className="font-semibold text-gray-900 text-sm mb-0.5">SMS Notifications</p>
                      <p className="text-xs text-gray-400 font-medium">Get critical alerts directly to your phone via SMS</p>
                    </div>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                      className="w-6 h-6 rounded-lg border-gray-200" 
                    />
                  </div>
                )}
              />
              
              <div className="mt-8 pt-6 border-t border-gray-50">
                <Button 
                  type="submit"
                  variant="outline" 
                  className="rounded-full px-8 h-10 text-xs font-semibold border-gray-200 hover:bg-gray-50"
                  disabled={updateProfile.isPending || profileForm.formState.isSubmitting}
                >
                  {updateProfile.isPending || profileForm.formState.isSubmitting ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </motion.div>

      {/* Account Management / Danger Zone */}
      <motion.div
        variants={sectionContainer}
        className="bg-red-50/30 border border-red-100 p-6 sm:p-8 rounded-[32px]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <X className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-red-900 tracking-tight">Deactivate Account</h4>
              <p className="text-xs text-red-700 font-medium max-w-sm">
                Once you delete your account, all your data including active listings will be permanently removed.
              </p>
            </div>
          </div>
          <Button variant="ghost" className="rounded-full px-8 border border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 font-semibold text-xs transition-colors h-12">
            Delete Profile
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
