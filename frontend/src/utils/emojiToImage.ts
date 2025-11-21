/**
 * Convert emoji to image URL using Twemoji CDN
 * Twemoji provides high-quality emoji images
 * Handles both single and multi-code point emojis
 */
export function getEmojiImageUrl(emoji: string, size: number = 72): string {
  if (!emoji || typeof emoji !== 'string' || emoji.trim() === '') return ''
  
  try {
    // Convert emoji to code points
    // Handle emojis that may have multiple code points (like flags, skin tones, etc.)
    const codePoints: string[] = []
    
    // Use spread operator or Array.from to properly handle multi-byte emojis
    // This handles surrogate pairs correctly
    let i = 0
    while (i < emoji.length) {
      const codePoint = emoji.codePointAt(i)
      if (codePoint) {
        codePoints.push(codePoint.toString(16).padStart(4, '0'))
        // Advance by 2 if it's a surrogate pair, otherwise by 1
        i += codePoint > 0xFFFF ? 2 : 1
      } else {
        i++
      }
    }
    
    if (codePoints.length === 0) return ''
    
    // Twemoji CDN format: https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/{code}.svg
    // For single code point: 1f4f1.svg
    // For multiple: 1f1e8-1f1f3.svg
    const codePointString = codePoints.join('-')
    return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${codePointString}.svg`
  } catch (error) {
    console.error('Error converting emoji to image URL:', error, emoji)
    return ''
  }
}

