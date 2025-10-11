import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Shield,
  Camera,
  Eye,
  EyeOff,
  Lock,
  CheckCircle
} from 'lucide-react'

interface User {
  id: string
  uid: string
  name: string
  email: string
  avatar?: string
  location?: string
  phone?: string
  isVerified: boolean
  joinedDate: string
}

interface ProfileSettingsProps {
  user: User
  onUpdateUser: (updates: Partial<User>) => void
}

export default function ProfileSettings({ user, onUpdateUser }: ProfileSettingsProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters!')
      return
    }

    // Simulate password change
    setPasswordSuccess(true)
    setTimeout(() => {
      setPasswordSuccess(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    }, 3000)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
      
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 bg-secondary text-secondary-foreground p-1 rounded-full hover:bg-secondary/90 transition-colors">
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">{user.name}</h4>
            <p className="text-gray-600">{user.email}</p>
            {user.isVerified && (
              <span className="inline-flex items-center gap-1 text-sm text-green-600 mt-1">
                <Shield className="w-4 h-4" />
                Verified Account
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input 
              type="text" 
              value={user.name}
              onChange={(e) => onUpdateUser({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              value={user.email}
              onChange={(e) => onUpdateUser({ email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input 
              type="tel" 
              value={user.phone || ''}
              onChange={(e) => onUpdateUser({ phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input 
              type="text" 
              value={user.location || ''}
              onChange={(e) => onUpdateUser({ location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button variant="primary">Save Changes</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
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

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="pr-10"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="pr-10"
                placeholder="Enter new password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="pr-10"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary">
              Update Password
            </Button>
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
            >
              Cancel
            </Button>
          </div>
        </form>
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
            <input type="checkbox" defaultChecked className="w-5 h-5 text-primary" />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium text-gray-900">SMS Notifications</p>
              <p className="text-sm text-gray-600">Get text alerts for important updates</p>
            </div>
            <input type="checkbox" className="w-5 h-5 text-primary" />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium text-gray-900">Marketing Communications</p>
              <p className="text-sm text-gray-600">Receive promotional offers and news</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-primary" />
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
