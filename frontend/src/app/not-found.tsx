import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary">404</h1>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/" 
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          
          <Link 
            href="/search" 
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 bg-white text-gray-900 font-medium hover:bg-gray-50 transition-colors"
          >
            <Search className="w-5 h-5 mr-2" />
            Browse Ads
          </Link>
        </div>
      </div>
    </div>
  )
}

