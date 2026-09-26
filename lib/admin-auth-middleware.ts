import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
  name: string;
}

export function verifyAdminToken(request: NextRequest): AdminUser | null {
  try {
    // 1. Check Authorization header
    let token = '';
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // 2. Check admin-token cookie
      token = request.cookies.get('admin-token')?.value ||
        request.headers.get('cookie')?.split('; ')
          .find(row => row.startsWith('admin-token='))
          ?.split('=')[1] || '';
    }

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verify user is admin
    if (decoded.role !== 'admin') {
      return null;
    }

    return {
      id: decoded.id || decoded.sub,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name || 'Admin'
    };
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return null;
  }
}

export function adminAuthMiddleware(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const admin = verifyAdminToken(request);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Add admin user to request context
    (request as any).admin = admin;
    
    return handler(request, ...args);
  };
}

// For client-side admin authentication
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('adminToken');
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('adminToken', token);
}

export function removeAdminToken(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('adminToken');
}

export function isAdminAuthenticated(): boolean {
  const token = getAdminToken();
  if (!token) return false;
  
  try {
    const decoded = jwt.decode(token) as any;
    return decoded?.role === 'admin';
  } catch {
    return false;
  }
}
