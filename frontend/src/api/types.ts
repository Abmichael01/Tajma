// User types matching backend User model
export interface User {
  id: number
  email: string
  username?: string | null
  first_name: string
  last_name: string
  full_name?: string
  avatar?: string | null
  phone?: string | null
  location?: string | null
  address?: string | null
  is_seller: boolean
  is_seller_account_setup: boolean
  business_name?: string | null
  business_type?: string | null
  website?: string | null
  bio?: string | null
  is_verified: boolean
  is_staff?: boolean
  is_superuser?: boolean
  date_joined: string
  last_login?: string | null
}

// Auth response types
export interface LoginResponse {
  user: User
  message: string
}

export interface RegisterResponse {
  user: User
  message: string
}

export interface AuthError {
  message: string
  errors?: Record<string, string[]>
}

// Request types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username?: string
  first_name: string
  last_name: string
  password: string
  password_confirm: string
}

export interface PasswordChangeRequest {
  old_password: string
  new_password: string
  new_password_confirm: string
}

export interface CSRFResponse {
  csrfToken: string
}

export interface ProfileUpdateRequest {
  username?: string
  first_name?: string
  last_name?: string
  avatar?: string
  phone?: string
  location?: number | string
  address?: string
  business_name?: string
  business_type?: string
  website?: string
  bio?: string
}

export interface ProfileUpdateResponse {
  user: User
  message: string
}

export interface SellerSetupRequest {
  phone: string
  location: string
  address: string
  business_name?: string
  business_type?: string
  website?: string
  bio?: string
}

export interface SellerSetupResponse {
  user: User
  message: string
}

export interface CategorySummary {
  id: string
  name: string
  slug: string
  icon?: string | null
  category_type: 'product' | 'service' | 'job' | 'cv'
}

export interface CategoryPathEntry {
  name: string
  slug: string
}

export interface Ad {
  id: string
  slug: string
  title: string
  description: string
  ad_type: 'product' | 'service' | 'job' | 'cv'
  category: string
  category_details?: CategorySummary
  category_path?: CategoryPathEntry[]
  price?: string
  currency: string
  is_negotiable: boolean
  attributes: Record<string, any>
  images: string[]
  status: 'draft' | 'published' | 'archived'
  views: number
  saved_count?: number
  is_saved?: boolean
  published_at?: string | null
  created_at: string
  updated_at: string
  seller: User & { response_stats?: ResponseStats }
}

export interface CreateAdRequest {
  title: string
  description: string
  category: string
  price?: string | null
  currency?: string
  is_negotiable: boolean
  attributes?: Record<string, any>
  images?: string[]
  status?: 'draft' | 'published'
}

export interface UpdateAdRequest {
  title?: string
  description?: string
  price?: string | null
  currency?: string
  is_negotiable?: boolean
  attributes?: Record<string, any>
  images?: string[]
  status?: 'draft' | 'published' | 'archived'
}

// Review types
export interface Review {
  id: string
  ad: string
  ad_title: string
  ad_slug: string
  reviewer: {
    id: number
    email: string
    username?: string | null
    first_name: string
    last_name: string
    full_name: string
    avatar?: string | null
  }
  reviewer_name: string
  reviewer_avatar?: string | null
  seller: number
  rating: 1 | 2 | 3 | 4 | 5
  comment: string
  is_verified_purchase: boolean
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_5: number
  rating_4: number
  rating_3: number
  rating_2: number
  rating_1: number
}

export interface ResponseStats {
  total_chats_with_inquiry: number
  answered_chats: number
  response_rate_1h: number
  response_rate_2h: number
  avg_response_minutes: number | null
  median_response_minutes: number | null
}

export interface CreateReviewRequest {
  ad: string
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
}

export interface UserWithReviewStats extends User {
  review_stats?: ReviewStats
  response_stats?: ResponseStats
}

// Notification types
export interface Notification {
  id: string
  recipient: number
  type: 'phone_view' | 'message' | 'ad_view' | 'favorite' | 'review' | 'report' | 'ad_status' | 'other'
  title: string
  message: string
  is_read: boolean
  related_ad?: string | null
  related_ad_title?: string | null
  related_ad_slug?: string | null
  related_user?: number | null
  related_user_name?: string | null
  created_at: string
  read_at?: string | null
}

export interface CreateNotificationRequest {
  recipient: number
  type: string
  title: string
  message: string
  related_ad?: string
  related_user?: number
}

// Chat types
export interface ChatMessage {
  id: string
  chat: string
  sender: User
  content: string
  is_read: boolean
  read_at?: string | null
  delivered_at?: string | null
  created_at: string
  updated_at: string
  send_failed?: boolean // Track if message failed to send
}

export interface ChatSummary {
  id: string
  participant1: User
  participant2: User
  ad: string | null
  ad_title?: string | null
  ad_slug?: string | null
  ad_image?: string | null
  ad_price?: string | null
  ad_currency?: string | null
  created_at: string
  updated_at: string
  last_message_at?: string | null
  last_message?: ChatMessage | null
  unread_count: number
}

export interface ChatDetail extends ChatSummary {
  messages: ChatMessage[]
}

export interface ChatCreateRequest {
  participant1_id: number
  participant2_id: number
  ad?: string
}

export interface ChatGetOrCreateRequest {
  participant2_id: number | string
  ad_id?: string | null
}

export interface SendMessageRequest {
  chat: string
  content: string
  sender_id?: number
}

export interface UserOnlineStatus {
  user: User
  is_online: boolean
  last_seen: string | null
}

