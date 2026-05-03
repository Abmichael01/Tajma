import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tajma.net'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/profile/',
        '/api/',
        '/chat/',
        '/create-ad/',
        '/alerts/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
