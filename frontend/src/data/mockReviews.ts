export interface Review {
  id: string
  reviewerName: string
  reviewerAvatar?: string
  rating: number
  comment: string
  date: string
  helpful: number
  verified: boolean
}

export const mockReviews: Review[] = [
  {
    id: '1',
    reviewerName: 'Sarah Johnson',
    reviewerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    comment: 'Excellent seller! The iPhone was exactly as described and arrived in perfect condition. Fast communication and smooth transaction. Highly recommended!',
    date: '2024-01-15',
    helpful: 8,
    verified: true
  },
  {
    id: '2',
    reviewerName: 'Michael Chen',
    reviewerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    comment: 'Great experience buying from this seller. The product was in excellent condition, exactly as shown in photos. Quick response to messages and very professional.',
    date: '2024-01-12',
    helpful: 5,
    verified: true
  },
  {
    id: '3',
    reviewerName: 'Emma Wilson',
    reviewerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    rating: 4,
    comment: 'Good seller, product was as described. Only minor issue was the delivery took a bit longer than expected, but overall satisfied with the purchase.',
    date: '2024-01-10',
    helpful: 3,
    verified: false
  },
  {
    id: '4',
    reviewerName: 'David Brown',
    reviewerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    comment: 'Outstanding service! The seller was very helpful and answered all my questions promptly. The item was packaged well and arrived quickly. Will definitely buy from again.',
    date: '2024-01-08',
    helpful: 12,
    verified: true
  },
  {
    id: '5',
    reviewerName: 'Lisa Anderson',
    reviewerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    comment: 'Perfect transaction! The seller was honest about the product condition and provided excellent customer service. Highly trustworthy seller.',
    date: '2024-01-05',
    helpful: 7,
    verified: true
  },
  {
    id: '6',
    reviewerName: 'James Taylor',
    reviewerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    rating: 4,
    comment: 'Good seller overall. Product was as described, though there was a small delay in shipping. Communication was clear throughout the process.',
    date: '2024-01-03',
    helpful: 2,
    verified: false
  },
  {
    id: '7',
    reviewerName: 'Maria Garcia',
    reviewerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    comment: 'Excellent seller! Very professional and responsive. The product exceeded my expectations and was delivered on time. I would definitely recommend this seller to others.',
    date: '2024-01-01',
    helpful: 9,
    verified: true
  }
]

export const calculateReviewStats = (reviews: Review[]) => {
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0
  
  return {
    totalReviews,
    averageRating,
    ratingDistribution: {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    }
  }
}
