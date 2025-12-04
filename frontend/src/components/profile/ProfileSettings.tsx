"use client"

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUpdateProfile, useChangePassword } from '@/hooks/useAuth'
import { useRegions } from '@/hooks/useRegions'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Shield,
  Camera,
  Eye,
  EyeOff,
  Lock,
  CheckCircle
} from 'lucide-react'
import type { User } from '@/api/types'
import { getUserFullName, getUserInitials } from '@/utils/user'

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

  // Get region ID from user location by matching region name
  const getUserRegionId = () => {
    if (!user?.location || !regions) return ''
    const matchingRegion = regions.find(r => r.name === user.location)
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
    })
  }, [user, profileForm, regions])

  const profileFieldNames: Array<keyof ProfileFormValues> = ['first_name', 'last_name', 'phone', 'location', 'address']
  const passwordFieldNames: Array<keyof PasswordFormValues> = ['old_password', 'new_password', 'new_password_confirm']

  const handleProfileSubmit = profileForm.handleSubmit(async (values) => {
    const payload = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      // Username is not included - users cannot change their username
      phone: values.phone?.trim() || undefined,
      location: values.location ? parseInt(values.location) : undefined,
      address: values.address?.trim() || undefined,
    }

    try {
      await updateProfile.mutateAsync(payload)
      toast.success('Profile updated successfully')
      
      // Get region name for display
      const selectedRegion = regions?.find(r => r.id === payload.location)
      const locationDisplay = selectedRegion?.name || ''
      
      profileForm.reset({
        first_name: payload.first_name,
        last_name: payload.last_name,
        username: user.username || '',
        phone: payload.phone || '',
        location: payload.location?.toString() || '',
        address: payload.address || '',
      })
      const userPatch: Partial<User> = {
        first_name: payload.first_name,
        last_name: payload.last_name,
        // Username is not updated - users cannot change their username
      }

      userPatch.phone = payload.phone !== undefined ? payload.phone : null
      userPatch.location = locationDisplay || null
      userPatch.address = payload.address || null

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

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
      
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar || undefined} alt={fullName} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 bg-secondary text-secondary-foreground p-1 rounded-full hover:bg-secondary/90 transition-colors">
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">{fullName}</h4>
            <p className="text-gray-600">{user.email}</p>
            {user.is_verified && (
              <span className="inline-flex items-center gap-1 text-sm text-green-600 mt-1">
                <Shield className="w-4 h-4" />
                Verified Account
              </span>
            )}
          </div>
        </div>
        

        <Form {...profileForm}>
          <form onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={profileForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      First Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter first name" {...field} />
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
                    <FormLabel>
                      Last Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <Input 
                  type="text" 
                  value={user.username || ''} 
                  disabled 
                  className="bg-gray-50 cursor-not-allowed" 
                />
                <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <Input type="email" value={user.email} disabled className="bg-gray-50 cursor-not-allowed" />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>
              <FormField
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+227 92 64 99 99" {...field} />
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
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      {regionsLoading ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          <span className="text-sm text-gray-500">Loading regions...</span>
                        </div>
                      ) : (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your region" />
                          </SelectTrigger>
                          <SelectContent>
                            {regions?.map((region) => (
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
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g., 123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                type="submit" 
                variant="primary"
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
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => {
                  const regionId = getUserRegionId()
                  profileForm.reset({
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    username: user.username || '', // Keep for form state but not editable
                    phone: user.phone || '',
                    location: regionId,
                    address: user.address || '',
                  })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Change Password Section */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-gray-700" />
          <h4 className="text-lg font-semibold text-gray-900">Change Password</h4>
        </div>

        {passwordSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Password changed successfully!</p>
              <p className="text-sm text-green-700 mt-1">Your password has been updated.</p>
            </div>
          </div>
        )}

        {passwordError && (
          <div className="mb-6 bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{passwordError}</p>
          </div>
        )}

        <Form {...passwordForm}>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="old_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="pr-10"
                        placeholder="Enter current password"
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        type={showNewPassword ? 'text' : 'password'}
                        className="pr-10"
                        placeholder="Enter new password"
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="new_password_confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="pr-10"
                        placeholder="Confirm new password"
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                variant="primary"
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
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => {
                  passwordForm.reset({
                    old_password: '',
                    new_password: '',
                    new_password_confirm: '',
                  })
                  setPasswordError(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Preferences Section */}
      <div className="bg-white border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive email updates about your ads and messages</p>
            </div>
            <Checkbox defaultChecked />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium text-gray-900">SMS Notifications</p>
              <p className="text-sm text-gray-600">Get text alerts for important updates</p>
            </div>
            <Checkbox />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium text-gray-900">Marketing Communications</p>
              <p className="text-sm text-gray-600">Receive promotional offers and news</p>
            </div>
            <Checkbox defaultChecked />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="primary">Save Preferences</Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 p-6">
        <h4 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h4>
        <p className="text-sm text-red-700 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-100">
          Delete Account
        </Button>
      </div>
    </div>
  )
}
