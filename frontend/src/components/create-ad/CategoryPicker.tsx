"use client"

import React, { useState, useMemo } from 'react'
import { ChevronRight, ChevronLeft, Check, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CategoryTree } from '@/types/category'
import CategoryImage from '@/components/ui/CategoryImage'
import { cn } from '@/lib/utils'

interface CategoryPickerProps {
  categoryTree: CategoryTree[]
  onSelect: (category: CategoryTree, path: string[]) => void
  initialPath?: string[]
}

import { useTranslations } from 'next-intl'

export default function CategoryPicker({ 
  categoryTree, 
  onSelect,
  initialPath = [] 
}: CategoryPickerProps) {
  const t = useTranslations('create_ad')
  const [currentPath, setCurrentPath] = useState<string[]>(initialPath)
  const [searchQuery, setSearchQuery] = useState('')

  // Navigate to subcategories
  const handleNext = (slug: string) => {
    setCurrentPath(prev => [...prev, slug])
    setSearchQuery('')
  }

  // Go back one level
  const handleBack = () => {
    setCurrentPath(prev => prev.slice(0, -1))
  }

  // Get current nodes based on path
  const currentNodes = useMemo(() => {
    let nodes = categoryTree
    for (const slug of currentPath) {
      const found = nodes.find(n => n.slug === slug)
      if (found && found.children) {
        nodes = found.children
      } else {
        nodes = []
        break
      }
    }
    
    if (searchQuery.trim()) {
      // Simple search within current nodes or globally? 
      // Let's do simple search within current displayed nodes for now
      return nodes.filter(n => 
        n.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return nodes
  }, [categoryTree, currentPath, searchQuery])

  // Get current parent node for labeling
  const currentParent = useMemo(() => {
    if (currentPath.length === 0) return null
    let node: CategoryTree | null = null
    let nodes = categoryTree
    for (const slug of currentPath) {
      node = nodes.find(n => n.slug === slug) || null
      if (node && node.children) {
        nodes = node.children
      }
    }
    return node
  }, [categoryTree, currentPath])

  return (
    <div className="border border-gray-200 rounded-[2rem] overflow-hidden bg-white">
      {/* Header / Navigation */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {currentPath.length > 0 && (
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="h-8 w-8 rounded-full hover:bg-gray-200"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </Button>
            )}
            <h3 className="font-bold text-gray-900">
              {currentParent ? currentParent.name : t('select_category')}
            </h3>
          </div>
          {currentParent && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onSelect(currentParent, currentPath)}
              className="text-xs h-8 gap-1 border-gray-200 text-primary hover:bg-primary/5 rounded-full font-medium"
            >
              <Check className="h-3 w-3" />
              {t('select_this_category')}
            </Button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder={t('search_categories')} 
            className="pl-9 bg-white border-gray-200 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary h-10 rounded-full text-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
        {currentNodes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm italic">{t('no_categories_found')}</p>
          </div>
        ) : (
          currentNodes.map((category) => {
            const hasChildren = category.children && category.children.length > 0
            
            return (
              <div 
                key={category.id}
                className="group flex items-center justify-between p-3 sm:p-4 hover:bg-primary/5 cursor-pointer transition-all duration-200"
                onClick={() => {
                  if (hasChildren) {
                    handleNext(category.slug)
                  } else {
                    onSelect(category, [...currentPath, category.slug])
                  }
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
      <CategoryImage 
        imageUrl={category.imageUrl} 
        name={category.name}
        size={44} 
        className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl shrink-0"
      />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 group-hover:text-primary transition-colors text-sm sm:text-base truncate">
                      {category.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium tracking-tight">
                      {category.adsCount || 0} listings {hasChildren && `• ${category.children?.length} sub-categories`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {hasChildren ? (
                    <div className="flex items-center gap-1">
                       <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect(category, [...currentPath, category.slug])
                        }}
                        className="text-[10px] h-7 font-medium text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full px-3 tracking-wide opacity-0 group-hover:opacity-100 transition-all"
                      >
                        {t('edit')}
                      </Button>
                      <ChevronRight className="h-5 w-5 text-gray-200 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                      <Check className="h-3.5 w-3.5 text-transparent group-hover:text-primary" />
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      
      {/* Selection Path Footer */}
      {currentPath.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-medium text-gray-400 shrink-0">{t('path')}:</span>
          {currentPath.map((slug, idx) => (
            <React.Fragment key={slug}>
              <span className="text-[11px] font-medium text-gray-600 whitespace-nowrap">
                {slug}
              </span>
              {idx < currentPath.length - 1 && (
                <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
