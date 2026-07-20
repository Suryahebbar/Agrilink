export function logoutSupplier() {
  if (typeof window !== 'undefined') {
    void fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).catch((err) => {
      console.error('Failed to logout supplier session:', err);
    });
  }
}

export function withSupplierAuth(options: RequestInit = {}): RequestInit {
  const headers = new Headers(options.headers as HeadersInit | undefined);

  return {
    ...options,
    credentials: 'include',
    headers
  };
}
