import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Clock, Loader2, DollarSign, Tag } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from '@/i18n/routing'
import { adsApi } from '@/api/ads'
import { Ad } from '@/api/types'
import { getMediaUrl } from '@/lib/utils'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const t = useTranslations('common')
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<Ad[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Live Suggestions Logic
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (searchQuery.trim().length < 2) {
      setSuggestions([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await adsApi.list({ q: searchQuery, page_size: 5 })
        setSuggestions(results as Ad[])
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  const handleSearch = (query: string) => {
    if (!query.trim()) return
    
    // Save to recent searches
    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(newRecent)
    localStorage.setItem('recentSearches', JSON.stringify(newRecent))
    
    onClose()
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchQuery)
  }

  const removeRecent = (query: string) => {
    const newRecent = recentSearches.filter(s => s !== query)
    setRecentSearches(newRecent)
    localStorage.setItem('recentSearches', JSON.stringify(newRecent))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('what_looking_for')}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {/* Search Input */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="relative group">
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_items_placeholder')}
                className="h-14 pl-14 pr-4 text-lg rounded-2xl border-gray-200 focus:border-primary/30 transition-all shadow-sm"
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                {isSearching ? (
                   <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </div>
            </div>
          </form>

          <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Live Suggestions */}
            {searchQuery.trim().length >= 2 && (
              <div>
                <h3 className="text-[10px] font-black text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
                  <Tag className="w-3.5 h-3.5" />
                  {t('product_suggestions')}
                </h3>
                
                {suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {suggestions.map((ad) => (
                      <button
                        key={ad.id}
                        onClick={() => {
                          onClose()
                          router.push(`/ads/${ad.slug}`)
                        }}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all text-left group"
                      >
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {ad.images?.[0] ? (
                            <Image
                              src={getMediaUrl(ad.images[0])}
                              alt={ad.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Tag className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate group-hover:text-primary transition-colors">
                            {ad.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-primary font-black text-xs">
                              {ad.currency} {ad.price ? Number(ad.price).toLocaleString() : t('negotiable')}
                            </span>
                            {ad.category_details?.name && (
                              <span className="text-[10px] text-gray-400 font-medium truncate">
                                • {ad.category_details.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : !isSearching ? (
                  <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-sm text-gray-400 font-medium">{t('no_matches_found')}</p>
                    <p className="text-[10px] text-gray-300 mt-1">{t('try_different_keyword')}</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Recent Searches - Only show if no suggestions */}
            {searchQuery.trim().length < 2 && recentSearches.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
                  <Clock className="w-3.5 h-3.5" />
                  {t('recent_searches')}
                </h3>
                <div className="flex flex-col gap-1">
                  {recentSearches.map((query) => (
                    <div key={query} className="flex items-center justify-between group">
                      <button
                        onClick={() => handleSearch(query)}
                        className="flex-1 text-left py-3 px-4 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors flex items-center gap-3"
                      >
                        <Clock className="w-4 h-4 text-gray-300" />
                        <span className="text-sm font-medium">{query}</span>
                      </button>
                      <button 
                        onClick={() => removeRecent(query)}
                        className="p-3 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

