import { Skeleton } from './skeleton'

export default function AdDetailSkeleton() {
  return (
    <div className="container py-6 lg:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column - Images and Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery Skeleton */}
          <div className="bg-white border border-gray-200">
            <Skeleton className="w-full h-[400px] lg:h-[500px]" />
          </div>

          {/* Description Skeleton */}
          <div className="bg-white border border-gray-200 p-4 sm:p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          {/* Ad Info Skeleton */}
          <div className="bg-white border border-gray-200 p-4 sm:p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Reviews Section Skeleton */}
          <div className="bg-white border border-gray-200 p-4 sm:p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Product Info and Seller */}
        <div className="lg:col-span-1 space-y-6">
          {/* Product Info Skeleton */}
          <div className="bg-white border border-gray-200 p-4 sm:p-6">
            <Skeleton className="h-7 w-3/4 mb-4" />
            <Skeleton className="h-8 w-40 mb-6" />
            <div className="space-y-3 mb-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-12 w-full mb-3" />
            <Skeleton className="h-12 w-full" />
          </div>

          {/* Seller Info Skeleton */}
          <div className="bg-white border border-gray-200 p-4 sm:p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Safety Tips Skeleton */}
          <div className="bg-white border border-gray-200 p-4 sm:p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


