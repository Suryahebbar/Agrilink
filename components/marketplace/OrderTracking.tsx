"use client";

import { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, MapPin, Clock, Navigation } from 'lucide-react';

interface TrackingEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'active' | 'pending';
  icon: string;
  location: string;
  trackingNumber?: string;
}

interface OrderTrackingProps {
  orderId: string;
  refreshInterval?: number;
}

export default function OrderTracking({ orderId, refreshInterval = 30000 }: OrderTrackingProps) {
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTracking();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchTracking, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [orderId, refreshInterval]);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marketplace/orders/${orderId}/tracking`);
      const data = await response.json();

      if (response.ok) {
        setTrackingData(data);
      } else {
        setError(data.error || 'Failed to fetch tracking information');
      }
    } catch (error) {
      setError('Failed to fetch tracking information');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'shopping-cart': return Package;
      case 'truck': return Truck;
      case 'check-circle': return CheckCircle;
      case 'navigation': return Navigation;
      default: return Package;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-gray-400 bg-gray-100';
      default: return 'text-gray-400 bg-gray-100';
    }
  };

  if (loading && !trackingData) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
        <button onClick={fetchTracking} className="mt-2 text-blue-600 hover:underline">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tracking Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Order Tracking</h3>
            <p className="text-gray-600">Order #{trackingData?.orderNumber}</p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              trackingData?.status === 'delivered' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {trackingData?.status?.charAt(0).toUpperCase() + trackingData?.status?.slice(1)}
            </span>
          </div>
        </div>

        {trackingData?.trackingNumber && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <Truck className="w-4 h-4 text-gray-600" />
              <span className="font-medium">Tracking Number:</span>
              <span className="font-mono">{trackingData.trackingNumber}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold mb-6">Delivery Progress</h4>
        
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          {/* Tracking Events */}
          <div className="space-y-6">
            {trackingData?.trackingEvents?.map((event: TrackingEvent, index: number) => {
              const Icon = getIcon(event.icon);
              const isLast = index === trackingData.trackingEvents.length - 1;
              
              return (
                <div key={event.id} className="flex items-start gap-4 relative">
                  {/* Event Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                    getStatusColor(event.status)
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h5 className="font-medium">{event.title}</h5>
                      <span className="text-sm text-gray-500 whitespace-nowrap ml-2">
                        {new Date(event.timestamp).toLocaleDateString()} • 
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{event.location}</span>
                    </div>
                    
                    {event.trackingNumber && (
                      <div className="mt-2 text-xs text-blue-600">
                        Tracking: {event.trackingNumber}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Estimated Delivery */}
      {trackingData?.estimatedDelivery && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <h5 className="font-medium text-blue-900">Estimated Delivery</h5>
              <p className="text-blue-700">
                {new Date(trackingData.estimatedDelivery).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchTracking}
          disabled={loading}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {loading ? 'Refreshing...' : 'Refresh Tracking'}
        </button>
      </div>
    </div>
  );
}
