'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { Product } from '@/lib/types';

// Database-based CartItem interface
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  seller?: string;
}

// Define the shape of the context
type CartWishlistContextType = {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  cartItemCount: number;
  cartTotal: number;
  loading: boolean;
  error: string | null;
};

const CartWishlistContext = createContext<CartWishlistContextType | undefined>(undefined);

export function CartWishlistProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get userId from auth/session
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUserId(data.user?.id || data.user?._id);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getUserId();
  }, []);

  // Load cart from database
  useEffect(() => {
    if (!userId) return;
    
    const loadCart = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/farmer/cart?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setCart(data.items || []);
        }
        setError(null);
      } catch (error) {
        console.error('Error loading cart:', error);
        setError('Failed to load cart data');
      } finally {
        setLoading(false);
      }
    };
    
    loadCart();
  }, [userId]);

  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    if (quantity <= 0 || !userId) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/farmer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.images?.[0]?.url,
          sellerId: product.seller?._id,
          sellerName: product.seller?.companyName
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.cart.items);
        setError(null);
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const removeFromCart = useCallback(async (productId: string) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/farmer/cart?userId=${userId}&productId=${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.cart.items);
        setError(null);
      } else {
        throw new Error('Failed to remove from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      setError('Failed to remove item from cart');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateCartItemQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    if (!userId) return;
    
    try {
      setLoading(true);
      const updatedCart = cart.map(item =>
        item.productId === productId 
          ? { ...item, quantity }
          : item
      );

      const response = await fetch('/api/farmer/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          items: updatedCart
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.cart.items);
        setError(null);
      } else {
        throw new Error('Failed to update cart');
      }
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      setError('Failed to update item quantity');
    } finally {
      setLoading(false);
    }
  }, [userId, cart, removeFromCart]);

  const clearCart = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/farmer/cart?userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCart([]);
        setError(null);
      } else {
        throw new Error('Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const toggleWishlist = useCallback((productId: string) => {
    // Wishlist functionality can be implemented similarly later
    setWishlist(prev => {
      try {
        return prev.includes(productId)
          ? prev.filter(id => id !== productId)
          : [...prev, productId];
      } catch (error) {
        console.error('Error toggling wishlist:', error);
        setError('Failed to update wishlist');
        return prev;
      }
    });
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    try {
      return wishlist.includes(productId);
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return false;
    }
  }, [wishlist]);

  const cartItemCount = useCallback(() => {
    try {
      return cart.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      console.error('Error calculating cart item count:', error);
      return 0;
    }
  }, [cart]);
  
  const cartTotal = useCallback(() => {
    try {
      return cart.reduce(
        (total, item) => total + (item.price * item.quantity),
        0
      );
    } catch (error) {
      console.error('Error calculating cart total:', error);
      return 0;
    }
  }, [cart]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    cart,
    wishlist,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    toggleWishlist,
    isInWishlist,
    cartItemCount: cartItemCount(),
    cartTotal: cartTotal(),
    loading,
    error
  }), [
    cart, 
    wishlist, 
    loading, 
    error, 
    addToCart, 
    removeFromCart, 
    updateCartItemQuantity, 
    clearCart, 
    toggleWishlist, 
    isInWishlist,
    cartItemCount,
    cartTotal
  ]);

  return (
    <CartWishlistContext.Provider value={contextValue}>
      {children}
    </CartWishlistContext.Provider>
  );
}

export const useCartWishlist = () => {
  const context = useContext(CartWishlistContext);
  if (context === undefined) {
    throw new Error('useCartWishlist must be used within a CartWishlistProvider');
  }
  return context;
};

// Export the context for testing purposes
export { CartWishlistContext };

export default CartWishlistContext;
