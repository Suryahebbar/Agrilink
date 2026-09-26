import { NextRequest } from 'next/server';
import { Seller } from '@/lib/models/supplier';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';
import { AUTH_COOKIE_NAME, getUserFromRequest, verifyAuthToken } from '@/lib/auth';
import { verifyAdminToken } from '@/lib/admin-auth';

export interface AuthenticatedSeller {
  sellerId: string;
  email: string;
  companyName: string;
  verificationStatus: string;
  isAdmin?: boolean;
}

async function findActiveSellerByIdOrEmail(id?: string | null, email?: string | null) {
  if (id && mongoose.Types.ObjectId.isValid(id)) {
    const sellerById = await Seller.findById(id);
    if (sellerById && sellerById.isActive) {
      return sellerById;
    }
  }

  if (email) {
    const sellerByEmail = await Seller.findOne({ email: email.trim().toLowerCase() });
    if (sellerByEmail && sellerByEmail.isActive) {
      return sellerByEmail;
    }
  }

  return null;
}

export async function authenticateSupplier(request: NextRequest): Promise<AuthenticatedSeller | null> {
  try {
    await connectDB();

    const debug = process.env.NODE_ENV !== 'production';
    const context = request.nextUrl?.pathname ?? 'unknown';

    // 0. Legal Administrative Oversight: Check if an Admin is making this request
    const adminToken = request.cookies.get('admin-token')?.value ||
      request.headers.get('cookie')?.split('; ')
        .find(row => row.startsWith('admin-token='))
        ?.split('=')[1];

    if (adminToken) {
      const adminPayload = await verifyAdminToken(adminToken);
      if (adminPayload) {
        // If inspecting a specific supplier via x-seller-id or route param
        const targetId = request.headers.get('x-seller-id') ||
          request.nextUrl?.pathname?.match(/\/supplier\/([a-f0-9]{24})/i)?.[1];
        if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
          const targetSeller = await Seller.findById(targetId);
          if (targetSeller) {
            return {
              sellerId: targetSeller._id.toString(),
              email: targetSeller.email,
              companyName: targetSeller.companyName,
              verificationStatus: targetSeller.verificationStatus,
              isAdmin: true
            };
          }
        }
        // If no target ID is specified, pick a sample seller for administrative preview
        const sampleSeller = await Seller.findOne().sort({ createdAt: -1 });
        if (sampleSeller) {
          return {
            sellerId: sampleSeller._id.toString(),
            email: sampleSeller.email,
            companyName: sampleSeller.companyName,
            verificationStatus: sampleSeller.verificationStatus,
            isAdmin: true
          };
        }

        return {
          sellerId: 'admin-legal-access',
          email: (adminPayload as any).email || 'admin@bpfis.com',
          companyName: 'Platform Administrator',
          verificationStatus: 'verified',
          isAdmin: true
        };
      }
    }

    // Prefer cookie-based auth (shared with farmer flow)
    const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    
    if (cookieToken) {
      try {
        const payload = await verifyAuthToken(cookieToken);
        if (debug) {
          console.debug('[SupplierAuth] Cookie payload', {
            context,
            hasPayload: !!payload,
            role: payload?.role,
            sub: payload?.sub
          });
        }
        if (payload && payload.role === 'supplier') {
          const seller = await findActiveSellerByIdOrEmail(payload.sub, payload.email);
          if (debug) {
            console.debug('[SupplierAuth] Cookie seller lookup', {
              context,
              found: !!seller,
              by: seller ? 'cookieToken' : 'cookieToken-miss'
            });
          }
          if (seller) {
            return {
              sellerId: seller._id.toString(),
              email: seller.email,
              companyName: seller.companyName,
              verificationStatus: seller.verificationStatus
            };
          }
        }
      } catch (tokenError) {
        if (debug) {
          console.error('[SupplierAuth] Token verification error:', tokenError);
        }
      }
    }

    const cookiePayload = await getUserFromRequest(request);
    if (debug) {
      console.debug('[SupplierAuth] Header cookie payload', {
        context,
        hasPayload: !!cookiePayload,
        role: cookiePayload?.role,
        sub: cookiePayload?.sub
      });
    }
    if (cookiePayload && cookiePayload.role === 'supplier') {
      const seller = await findActiveSellerByIdOrEmail(cookiePayload.sub, cookiePayload.email);
      if (debug) {
        console.debug('[SupplierAuth] Header cookie seller lookup', {
          context,
          found: !!seller,
          by: seller ? 'cookieHeader' : 'cookieHeader-miss'
        });
      }
      if (seller) {
        return {
          sellerId: seller._id.toString(),
          email: seller.email,
          companyName: seller.companyName,
          verificationStatus: seller.verificationStatus
        };
      }
    }

    // Fallback to Authorization header for backwards compatibility
    const authHeader = request.headers.get('authorization');
    if (debug) {
      console.debug('[SupplierAuth] Authorization header present', {
        context,
        hasAuthHeader: !!authHeader
      });
    }
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token) {
        const payload = await verifyAuthToken(token);
        if (debug) {
          console.debug('[SupplierAuth] Bearer payload', {
            context,
            hasPayload: !!payload,
            role: payload?.role,
            sub: payload?.sub
          });
        }
        if (payload && payload.role === 'supplier') {
          const seller = await findActiveSellerByIdOrEmail(payload.sub, payload.email);
          if (debug) {
            console.debug('[SupplierAuth] Bearer seller lookup', {
              context,
              found: !!seller,
              by: seller ? 'bearer' : 'bearer-miss'
            });
          }
          if (seller) {
            return {
              sellerId: seller._id.toString(),
              email: seller.email,
              companyName: seller.companyName,
              verificationStatus: seller.verificationStatus
            };
          }
        }
      }
    }

    // Development fallback: allow explicit seller ID header
    const sellerIdHeader = request.headers.get('x-seller-id');
    if (debug) {
      console.debug('[SupplierAuth] x-seller-id header', {
        context,
        hasSellerIdHeader: !!sellerIdHeader
      });
    }
    if (sellerIdHeader && mongoose.Types.ObjectId.isValid(sellerIdHeader)) {
      const seller = await Seller.findById(sellerIdHeader);
      if (debug) {
        console.debug('[SupplierAuth] x-seller-id lookup', {
          context,
          found: !!seller
        });
      }
      if (seller && seller.isActive) {
        return {
          sellerId: seller._id.toString(),
          email: seller.email,
          companyName: seller.companyName,
          verificationStatus: seller.verificationStatus
        };
      }
      return null;
    }

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function requireAuth(
  request: NextRequest,
  paramsOrPromise?: { params?: { supplierId?: string } } | Promise<{ params: { supplierId?: string } }>
): Promise<AuthenticatedSeller> {
  const auth = await authenticateSupplier(request);
  
  if (!auth) {
    throw new Error('Authentication required');
  }

  // Handle the case where params might be a Promise
  let resolvedParams: { params?: { supplierId?: string } } = {};
  try {
    resolvedParams = await Promise.resolve(paramsOrPromise || {});
  } catch (error) {
    console.error('Error resolving params:', error);
    throw new Error('Invalid route parameters');
  }

  // Verify supplierId in route matches authenticated user
  const supplierIdFromRoute = resolvedParams?.params?.supplierId;

  // Platform administrators have legal oversight authority over all supplier resources
  if (auth.isAdmin) {
    return auth;
  }
  
  // For orders routes, allow access if user is authenticated (they can only see their own orders anyway)
  const isOrdersRoute = request.nextUrl?.pathname?.includes('/orders');
  
  // For document uploads and other sensitive routes, we need to verify the supplier ID in the URL matches the authenticated user
  if (supplierIdFromRoute && supplierIdFromRoute !== 'temp' && !isOrdersRoute) {
    if (supplierIdFromRoute !== auth.sellerId) {
      console.error(`Unauthorized access attempt: User ${auth.sellerId} tried to access ${supplierIdFromRoute}`);
      throw new Error('Unauthorized access to this supplier resource');
    }
    return auth;
  }

  // Skip supplierId validation for analytics and orders routes
  const isAnalyticsRoute = request.nextUrl?.pathname?.includes('/analytics');
  if (!isAnalyticsRoute && !isOrdersRoute && !supplierIdFromRoute) {
    console.error('Supplier ID is required for this route');
    throw new Error('Supplier ID required for this route');
  }

  return auth;
}
