import { Skeleton } from './skeleton'

interface AdsListSkeletonProps {
  columns?: 2 | 3 | 4 | 5
  count?: number
}

export default function AdsListSkeleton({ columns = 4, count = 8 }: AdsListSkeletonProps) {
  const getColumnClasses = () => {
    switch (columns) {
      case 2:
        return "grid-cols-1 min-[420px]:grid-cols-2"
      case 3:
        return "grid-cols-1 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3"
      case 4:
        return "grid-cols-1 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3 lg:grid-cols-4"
      case 5:
        return "grid-cols-1 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5"
      default:
        return "grid-cols-1 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3 lg:grid-cols-3"
    }
  }

  return (
    <div className={`grid ${getColumnClasses()} gap-4 sm:gap-6`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white border border-gray-200 overflow-hidden">
          {/* Image Skeleton */}
          <div className="relative w-full overflow-hidden aspect-[4/3]">
            <Skeleton className="w-full h-full" />
          </div>

          {/* Content Skeleton */}
          <div className="p-3">
            {/* Price Skeleton */}
            <Skeleton className="h-6 w-24 mb-1.5" />
            
            {/* Title Skeleton */}
            <Skeleton className="h-4 w-full mb-1.5" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            
            {/* Description Skeleton */}
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-5/6 mb-2" />
            
            {/* Location and Views Skeleton */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


