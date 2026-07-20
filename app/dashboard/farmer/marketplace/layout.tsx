import MarketplaceNav from '@/components/marketplace/MarketplaceNav';
import UserIdHandler from '@/components/marketplace/UserIdHandler';
import { CartWishlistProvider } from '@/contexts/CartWishlistContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <CartWishlistProvider>
      <div className="flex w-full max-w-[2000px] min-h-[calc(100vh-64px)]">
        {/* Marketplace Navigation - Sidebar */}
        <div className="hidden md:flex w-64 flex-shrink-0 border-r border-gray-200 bg-white h-[calc(100vh-64px)] overflow-y-auto sticky top-16 -ml-px">
          <div className="w-full flex flex-col">
            <div className="p-4 border-b">
              <h1 className="text-xl font-bold text-gray-900">Marketplace</h1>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3">
              <MarketplaceNav />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-0 overflow-x-hidden bg-gray-50">
          <div className="w-full h-full">
            <UserIdHandler />
            {children}
          </div>
        </div>
      </div>
      </CartWishlistProvider>
    </NotificationProvider>
  );
}
