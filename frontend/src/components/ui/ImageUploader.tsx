"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  value?: string // Current image URL or base64 string
  onChange: (value: string | null) => void // Callback with base64 string or null
  className?: string
  maxSizeMB?: number
  accept?: string
  label?: string
  aspectRatio?: 'square' | 'wide' | 'auto'
}

export default function ImageUploader({
  value,
  onChange,
  className = '',
  maxSizeMB = 5,
  accept = 'image/*',
  label = 'Category Image',
  aspectRatio = 'square',
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const convertToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      if (file.size > maxSizeBytes) {
        reject(new Error(`Image size must be less than ${maxSizeMB}MB`))
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        reject(new Error('File must be an image'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        resolve(result)
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }, [maxSizeMB])

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)
    try {
      const base64 = await convertToBase64(file)
      setPreview(base64)
      onChange(base64)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image'
      setError(errorMessage)
      onChange(null)
    }
  }, [convertToBase64, onChange])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // Update preview when value changes externally
  React.useEffect(() => {
    if (value && value !== preview) {
      setPreview(value)
    } else if (!value) {
      setPreview(null)
    }
  }, [value])

  const aspectRatioClass = {
    square: 'aspect-square',
    wide: 'aspect-video',
    auto: 'aspect-auto',
  }[aspectRatio]

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-900">{label}</label>
      )}
      
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors',
          isDragging
            ? 'border-secondary bg-secondary/5'
            : 'border-gray-300 hover:border-gray-400',
          error && 'border-red-300',
          preview ? 'border-solid' : ''
        )}
      >
        {preview ? (
          <div className="relative group">
            <div className={cn('relative overflow-hidden rounded-lg', aspectRatioClass)}>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 p-4 bg-gray-100 rounded-full">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 mb-4">
              PNG, JPG, GIF up to {maxSizeMB}MB
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClick}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Choose Image
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {preview && !error && (
        <p className="text-xs text-gray-500">
          Image ready. Click the X to remove and upload a different image.
        </p>
      )}
    </div>
  )
}

