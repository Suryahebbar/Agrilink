'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ShoppingCart, Heart, Package, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MarketplaceNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const withUserId = (href: string) => {
    // Require userId for all marketplace navigation
    if (!userId) return '/login';
    const url = new URL(href, 'http://dummy');
    url.searchParams.set('userId', userId);
    return url.pathname + '?' + url.searchParams.toString();
  };
  
  const navItems = [
    { name: 'Home', href: withUserId('/dashboard/farmer/marketplace'), icon: Home },
    { name: 'Products', href: withUserId('/dashboard/farmer/marketplace/products'), icon: Package },
    { name: 'Cart', href: withUserId('/dashboard/farmer/marketplace/cart'), icon: ShoppingCart },
    { name: 'Orders', href: withUserId('/dashboard/farmer/marketplace/orders'), icon: ShoppingCart },
    { name: 'Wishlist', href: withUserId('/dashboard/farmer/marketplace/wishlist'), icon: Heart, badge: true },
  ];

  return (
    <nav className="flex flex-col space-y-1">
      {navItems.map((item) => {
        const targetPath = new URL(item.href, 'http://dummy').pathname;
        const isActive = pathname === targetPath;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
              isActive 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="w-5 h-5 mr-3" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
