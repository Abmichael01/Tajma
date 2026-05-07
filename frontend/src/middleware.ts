import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match internationalized pathnames + bare /auth/* so Google callback
  // gets locale-prefixed by the middleware (e.g. /auth/google/callback → /en/auth/google/callback)
  matcher: ['/', '/(fr|ha|en)/:path*', '/auth/:path*']
};
