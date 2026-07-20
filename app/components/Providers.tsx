'use client';

import { CartWishlistProvider } from "@/contexts/CartWishlistContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }
  
  return (
    <NotificationProvider>
      <CartWishlistProvider>
        {children}
      </CartWishlistProvider>
    </NotificationProvider>
  );
}
