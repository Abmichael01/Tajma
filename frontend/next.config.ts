import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './src/i18n/request.ts'
);

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      // 1. Development: Dynamic Hostname from Env (Local IP, etc.)
      {
        protocol: 'http',
        hostname: process.env.NEXT_PUBLIC_DYNAMIC_HOSTNAME || 'localhost',
        port: '8026', // Specifically allowed for backend images
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: process.env.NEXT_PUBLIC_DYNAMIC_HOSTNAME || 'localhost',
        pathname: '/**',
      },
      // 2. Development: Localhost and Standard Dev Ports
      ...['8000', '8001', '8005', '8007', '8050'].flatMap(port => [
        { protocol: 'http' as const, hostname: 'localhost', port, pathname: '/**' },
        { protocol: 'http' as const, hostname: '127.0.0.1', port, pathname: '/**' },
      ]),
      // 3. Production: Official Tajma Domains
      {
        protocol: 'https',
        hostname: 'tajma.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.tajma.net',
        pathname: '/**',
      },
      // 4. Third-party: Essential External Services
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/**',
      },
      // 5. User Content: Google Avatars
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
