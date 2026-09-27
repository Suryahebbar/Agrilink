import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host');

  // Enforce HTTPS in production if requested over HTTP
  if (isProduction && forwardedProto === 'http' && host) {
    const httpsUrl = `https://${host}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(httpsUrl, 301);
  }

  const response = NextResponse.next();

  // Add HSTS security header in production
  if (isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  // Apply middleware to all routes except static files, _next, favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
