'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Order, OrderItem, OrderStatus, PaymentStatus, PaymentMethod, Address, OrderFilters, OrderStats } from '@/lib/types/orders';

type OrderContextType = {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  stats: OrderStats | null;
  createOrder: (items: OrderItem[], shippingAddress: Address, paymentMethod: PaymentMethod) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  getOrderById: (orderId: string) => Order | null;
  getUserOrders: (userId: string, filters?: OrderFilters) => Promise<Order[]>;
  getOrderStats: (userId?: string) => Promise<OrderStats>;
  clearCurrentOrder: () => void;
  generateInvoice: (orderId: string) => Promise<string>;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);

  // Load orders from localStorage on mount
  useEffect(() => {
    const loadOrders = () => {
      try {
        const savedOrders = localStorage.getItem('marketplaceOrders');
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);
          if (Array.isArray(parsedOrders)) {
            setOrders(parsedOrders);
          }
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        setError('Failed to load orders');
      }
    };

    loadOrders();
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('marketplaceOrders', JSON.stringify(orders));
    } catch (error) {
      console.error('Error saving orders:', error);
      setError('Failed to save orders');
    }
  }, [orders]);

  const createOrder = useCallback(async (
    items: OrderItem[],
    shippingAddress: Address,
    paymentMethod: PaymentMethod
  ): Promise<Order> => {
    setLoading(true);
    setError(null);

    try {
      const subtotal = items.reduce((total, item) => total + item.total, 0);
      const tax = subtotal * 0.1; // 10% tax
      const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
      const discount = 0; // Can be calculated based on promotions
      const total = subtotal + tax + shipping - discount;

      const newOrder: Order = {
        id: uuidv4(),
        userId: 'current-user', // Should come from auth context
        items,
        subtotal,
        tax,
        shipping,
        discount,
        total,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod,
        shippingAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      };

      setOrders(prev => [newOrder, ...prev]);
      setCurrentOrder(newOrder);

      // Simulate order processing
      setTimeout(() => {
        updateOrderStatus(newOrder.id, OrderStatus.CONFIRMED);
      }, 2000);

      return newOrder;
    } catch (error) {
      const errorMessage = 'Failed to create order';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status, updatedAt: new Date().toISOString() }
          : order
      ));

      if (currentOrder?.id === orderId) {
        setCurrentOrder(prev => prev ? { ...prev, status, updatedAt: new Date().toISOString() } : null);
      }
    } catch (error) {
      const errorMessage = 'Failed to update order status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentOrder]);

  const cancelOrder = useCallback(async (orderId: string, reason?: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await updateOrderStatus(orderId, OrderStatus.CANCELLED);
      
      // Update payment status to refunded if payment was completed
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              paymentStatus: PaymentStatus.REFUNDED,
              notes: reason || 'Order cancelled by user'
            }
          : order
      ));
    } catch (error) {
      const errorMessage = 'Failed to cancel order';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [updateOrderStatus]);

  const getOrderById = useCallback((orderId: string): Order | null => {
    return orders.find(order => order.id === orderId) || null;
  }, [orders]);

  const getUserOrders = useCallback(async (userId: string, filters?: OrderFilters): Promise<Order[]> => {
    setLoading(true);
    setError(null);

    try {
      let filteredOrders = orders.filter(order => order.userId === userId);

      if (filters) {
        if (filters.status && filters.status.length > 0) {
          filteredOrders = filteredOrders.filter(order => 
            filters.status!.includes(order.status)
          );
        }

        if (filters.paymentStatus && filters.paymentStatus.length > 0) {
          filteredOrders = filteredOrders.filter(order => 
            filters.paymentStatus!.includes(order.paymentStatus)
          );
        }

        if (filters.paymentMethod && filters.paymentMethod.length > 0) {
          filteredOrders = filteredOrders.filter(order => 
            filters.paymentMethod!.includes(order.paymentMethod)
          );
        }

        if (filters.dateRange) {
          const startDate = new Date(filters.dateRange.start);
          const endDate = new Date(filters.dateRange.end);
          filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= startDate && orderDate <= endDate;
          });
        }

        if (filters.priceRange) {
          filteredOrders = filteredOrders.filter(order => 
            order.total >= filters.priceRange!.min && 
            order.total <= filters.priceRange!.max
          );
        }
      }

      return filteredOrders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      const errorMessage = 'Failed to fetch user orders';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [orders]);

  const getOrderStats = useCallback(async (userId?: string): Promise<OrderStats> => {
    setLoading(true);
    setError(null);

    try {
      const userOrders = userId ? orders.filter(order => order.userId === userId) : orders;
      
      const totalOrders = userOrders.length;
      const totalRevenue = userOrders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const ordersByStatus = Object.values(OrderStatus).reduce((acc, status) => {
        acc[status] = userOrders.filter(order => order.status === status).length;
        return acc;
      }, {} as Record<OrderStatus, number>);

      // Calculate revenue by month
      const revenueByMonth = userOrders.reduce((acc, order) => {
        const month = new Date(order.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        const existingMonth = acc.find(item => item.month === month);
        if (existingMonth) {
          existingMonth.revenue += order.total;
        } else {
          acc.push({ month, revenue: order.total });
        }
        
        return acc;
      }, [] as Array<{ month: string; revenue: number }>);

      const stats: OrderStats = {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus,
        revenueByMonth: revenueByMonth.sort((a, b) => a.month.localeCompare(b.month))
      };

      setStats(stats);
      return stats;
    } catch (error) {
      const errorMessage = 'Failed to calculate order stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [orders]);

  const clearCurrentOrder = useCallback(() => {
    setCurrentOrder(null);
  }, []);

  const generateInvoice = useCallback(async (orderId: string): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const order = getOrderById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Generate a simple invoice HTML
      const invoiceHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .order-info { margin-bottom: 30px; }
            .items { margin-bottom: 30px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Invoice #${order.id}</h1>
            <p>Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          
          <div class="order-info">
            <h3>Shipping Address</h3>
            <p>${order.shippingAddress.street}</p>
            <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
            <p>${order.shippingAddress.country}</p>
          </div>
          
          <div class="items">
            <h3>Order Items</h3>
            ${order.items.map(item => `
              <div class="item">
                <span>${item.productName} x ${item.quantity}</span>
                <span>$${item.total.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="total">
            <div>Subtotal: $${order.subtotal.toFixed(2)}</div>
            <div>Tax: $${order.tax.toFixed(2)}</div>
            <div>Shipping: $${order.shipping.toFixed(2)}</div>
            <div>Total: $${order.total.toFixed(2)}</div>
          </div>
        </body>
        </html>
      `;

      return invoiceHtml;
    } catch (error) {
      const errorMessage = 'Failed to generate invoice';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getOrderById]);

  const value: OrderContextType = {
    orders,
    currentOrder,
    loading,
    error,
    stats,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getOrderById,
    getUserOrders,
    getOrderStats,
    clearCurrentOrder,
    generateInvoice,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export default OrderContext;
