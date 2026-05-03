import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMediaUrl(path: any): string {
  if (!path) return 'https://via.placeholder.com/400x300?text=No+Image'
  
  let finalPath = path

  // 1. Handle Array (if the backend returns a list of images)
  if (Array.isArray(finalPath) && finalPath.length > 0) {
    finalPath = finalPath[0]
  }

  // 2. Handle Stringified JSON Array/Object
  if (typeof finalPath === 'string' && (finalPath.startsWith('[') || finalPath.startsWith('{'))) {
    try {
      const parsed = JSON.parse(finalPath)
      if (Array.isArray(parsed) && parsed.length > 0) {
        finalPath = parsed[0]
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Handle object if needed, but usually we want a string/URL
        finalPath = parsed.url || parsed.path || finalPath
      }
    } catch (e) {
      // Not valid JSON, continue with original string
    }
  }

  // Ensure we have a string to work with
  if (typeof finalPath !== 'string') {
    return 'https://via.placeholder.com/400x300?text=Invalid+Path'
  }

  // Base API URL and Origin
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8026'
  let apiOrigin = 'http://localhost:8026'
  try {
      apiOrigin = new URL(apiUrl).origin
  } catch (e) {}
  
  // 3. Handle data: URLs (base64)
  if (typeof finalPath === 'string' && finalPath.startsWith('data:')) {
    return finalPath
  }


  // If we are on an IP address in the browser, and the API is set to localhost, 
  // we SHOULD use the current hostname for the API origin too.
  if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)
      if (isIp && (apiOrigin.includes('localhost') || apiOrigin.includes('127.0.0.1'))) {
          apiOrigin = apiOrigin.replace('localhost', hostname).replace('127.0.0.1', hostname)
      }
  }

  // If it's already an absolute URL (http/https), return as is
  if (finalPath.startsWith('http://') || finalPath.startsWith('https://')) {
    // Fix origin if it points to localhost but we're on an IP
    if (apiOrigin && (finalPath.includes('localhost') || finalPath.includes('127.0.0.1'))) {
        try {
            const urlObj = new URL(finalPath)
            if (urlObj.origin !== apiOrigin) {
                return finalPath.replace(urlObj.origin, apiOrigin)
            }
        } catch(e) {}
    }
    return finalPath
  }
  
  // If it's a relative path starting with /, prepend the API origin
  if (finalPath.startsWith('/')) {
      return `${apiOrigin}${finalPath}`
  }
  
  // Relative path without leading slash (e.g., 'avatars/uuid.jpg')
  // We assume it's a media file, so we use /api/media/ prefix
  return `${apiOrigin}/api/media/${finalPath}`
}

/**
 * Robustly copy text to clipboard with modern API and fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  // 1. Try modern clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('Clipboard API failed, falling back to execCommand:', err)
    }
  }

  // 2. Fallback to older execCommand('copy')
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    
    // Ensure it's not visible but still in the DOM
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '0'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    
    textArea.focus()
    textArea.select()
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.error('Final fallback for copy failed:', err)
    return false
  }
}




