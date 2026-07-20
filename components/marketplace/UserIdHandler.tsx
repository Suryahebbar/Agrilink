'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function UserIdHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUserId = searchParams.get('userId');
    
    // If we're in marketplace pages and don't have userId, redirect to login
    if (pathname.includes('/dashboard/farmer/marketplace') && !currentUserId) {
      const getUserId = async () => {
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const data = await response.json();
            const userId = data.user?.id || data.user?._id;
            if (userId) {
              // Redirect to same page with userId
              const url = new URL(window.location.href);
              url.searchParams.set('userId', userId);
              router.replace(url.pathname + url.search);
            } else {
              // Not authenticated, redirect to login
              router.push('/login');
            }
          } else {
            // Not authenticated, redirect to login
            router.push('/login');
          }
        } catch (error) {
          console.error('Error getting user ID:', error);
          router.push('/login');
        } finally {
          setIsLoading(false);
        }
      };
      getUserId();
    } else {
      setIsLoading(false);
    }
  }, [pathname, searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return null; // This component doesn't render anything when not loading
}
