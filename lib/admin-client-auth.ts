// Client-side admin authentication helpers

export function getAdminAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Token is stored as HTTP-only cookie, so we don't need to set Authorization header
  // The server will read it from the cookie
  
  return headers;
}

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAdminAuthHeaders(),
    ...options.headers,
  };
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for admin-token
  });
}

export function withAdminAuth() {
  // Since token is HTTP-only cookie, we can't read it directly
  // We'll rely on server-side validation
  return true; // This will be validated server-side
}
