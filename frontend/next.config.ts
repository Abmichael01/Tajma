import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

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

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "tajma",
  project: "frontend",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite into a third-party domain.
  // This can be used to bypass ad blockers that might block requests to Sentry.
  tunnelRoute: "/monitoring",

  // New configuration format to resolve deprecation warnings
  // Note: These settings are primarily for Webpack and may not fully apply to Turbopack yet
  webpack: {
    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,
    },
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
    // Enables automatic instrumentation of Vercel Cron Monitors.
    automaticVercelMonitors: true,
  },
});
