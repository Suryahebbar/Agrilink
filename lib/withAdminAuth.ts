import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from './admin-auth';

export function withAdminAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      // Get admin token from cookie
      const token = request.cookies.get('admin-token')?.value ||
        request.headers.get('cookie')?.split('; ')
          .find(row => row.startsWith('admin-token='))
          ?.split('=')[1];

      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin token required' },
          { status: 401 }
        );
      }

      const payload = await verifyAdminToken(token);
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid or expired admin token' },
          { status: 401 }
        );
      }

      // Add admin payload to request context
      (request as any).admin = payload;
      
      return handler(request, ...args);
    } catch (error) {
      console.error('Admin authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}
