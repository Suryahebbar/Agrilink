import { NextRequest } from 'next/server';
import { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';

export interface ClientInfo {
  req: {
    ip: string;
    headers: {
      'user-agent'?: string;
      'x-forwarded-for'?: string;
      'x-real-ip'?: string;
      [key: string]: string | undefined;
    };
    get: (header: string) => string | null;
  };
}

// For Next.js API routes
export function getClientInfoFromRequest(req: NextRequest): ClientInfo {
  const ip = req.headers.get('x-real-ip') ||
             req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-client-ip') ||
             '127.0.0.1';
  
  return {
    req: {
      ip,
      headers: {
        'user-agent': req.headers.get('user-agent') || undefined,
        'x-forwarded-for': req.headers.get('x-forwarded-for') || undefined,
        'x-real-ip': req.headers.get('x-real-ip') || undefined,
      },
      get(header: string) {
        return req.headers.get(header);
      },
    },
  };
}

// For server components and API routes
export async function getClientInfo(): Promise<ClientInfo> {
  try {
    const { headers } = await import('next/headers');
    const headersList = headers() as unknown as ReadonlyHeaders;
    
    const ip = headersList.get('x-real-ip') || 
               headersList.get('x-forwarded-for')?.split(',')[0] ||
               '127.0.0.1';
    
    return {
      req: {
        ip,
        headers: {
          'user-agent': headersList.get('user-agent') || undefined,
          'x-forwarded-for': headersList.get('x-forwarded-for') || undefined,
          'x-real-ip': headersList.get('x-real-ip') || undefined,
        },
        get(header: string) {
          return headersList.get(header);
        },
      },
    };
  } catch (error) {
    console.error('Error getting client info:', error);
    return {
      req: {
        ip: '127.0.0.1',
        headers: {},
        get: () => null,
      },
    };
  }
}

// For client-side usage (simplified version)
export function getClientInfoFromBrowser() {
  if (typeof window === 'undefined') {
    return {
      req: {
        ip: '127.0.0.1',
        headers: {},
        get: () => null,
      },
    };
  }

  return {
    req: {
      ip: '127.0.0.1', // Not available in browser without external service
      headers: {
        'user-agent': window.navigator.userAgent,
        referer: document.referrer,
        origin: window.location.origin,
      },
      get(header: string) {
        const headers: Record<string, string> = {
          'user-agent': window.navigator.userAgent,
          referer: document.referrer,
          origin: window.location.origin,
        };
        return headers[header.toLowerCase()] || null;
      },
    },
  };
}
