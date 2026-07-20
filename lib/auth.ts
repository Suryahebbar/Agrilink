import { SignJWT, jwtVerify, JWTPayload } from 'jose';

const AUTH_COOKIE_NAME = 'agro_session';

export type AuthTokenPayload = JWTPayload & {
  sub: string; // user id
  role: 'farmer' | 'supplier' | 'supplier';
  email: string;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  const secret = getSecretKey();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  return token;
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify<AuthTokenPayload>(token, secret);
    return payload;
  } catch (e) {
    console.error('Failed to verify auth token', e);
    return null;
  }
}

export function extractTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith(`${AUTH_COOKIE_NAME}=`)) {
      return decodeURIComponent(c.substring(AUTH_COOKIE_NAME.length + 1));
    }
  }
  return null;
}

export async function getUserFromRequest(request: Request): Promise<AuthTokenPayload | null> {
  const token = extractTokenFromRequest(request);
  if (!token) return null;
  return verifyAuthToken(token);
}

export { AUTH_COOKIE_NAME };
