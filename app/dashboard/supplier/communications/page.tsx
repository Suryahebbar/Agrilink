"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { withSupplierAuth } from '@/lib/supplier-auth';

interface Message {
  _id: string;
  orderId?: string;
  productId?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  subject: string;
  message: string;
  type: 'inquiry' | 'complaint' | 'feedback' | 'order_update' | 'product_question';
  status: 'unread' | 'read' | 'replied' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  supplierResponse?: {
    message: string;
    respondedAt: string;
    respondedBy: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
}

export default function CommunicationsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');
  
  // Message composition state
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    void loadCommunications();
    void loadOrders();
    void loadProducts();
  }, []);

  const loadCommunications = async () => {
    try {
      setLoading(true);
      
      // Get supplierId if not already set
      let currentSupplierId = supplierId;
      if (!currentSupplierId) {
        const profileResponse = await fetch('/api/supplier', withSupplierAuth());
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          currentSupplierId = profileData.seller?._id || 'temp';
          setSupplierId(currentSupplierId);
        } else {
          throw new Error('Failed to get supplier profile');
        }
      }

      const params = new URLSearchParams({
        status: statusFilter === 'all' ? '' : statusFilter,
        type: typeFilter === 'all' ? '' : typeFilter,
        priority: priorityFilter === 'all' ? '' : priorityFilter,
        search: searchTerm
      });

      const response = await fetch(`/api/supplier/${currentSupplierId}/communications?${params}`, withSupplierAuth());

      if (!response.ok) {
        throw new Error('Failed to load communications');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading communications:', error);
      setError('Failed to load communications');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      let currentSupplierId = supplierId;
      if (!currentSupplierId) {
        const profileResponse = await fetch('/api/supplier', withSupplierAuth());
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          currentSupplierId = profileData.seller?._id || 'temp';
        }
      }

      const response = await fetch(`/api/supplier/${currentSupplierId}/orders?limit=50`, withSupplierAuth());
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadProducts = async () => {
    try {
      let currentSupplierId = supplierId;
      if (!currentSupplierId) {
        const profileResponse = await fetch('/api/supplier', withSupplierAuth());
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          currentSupplierId = profileData.seller?._id || 'temp';
        }
      }

      const response = await fetch(`/api/supplier/${currentSupplierId}/products?limit=50`, withSupplierAuth());
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleReply = async (messageId: string) => {
    if (!replyText.trim()) {
      setError('Please enter a reply message');
      return;
    }

    try {
      setReplying(true);
      setError('');
      setSuccess('');

      const currentSupplierId = supplierId || 'temp';
      const response = await fetch(`/api/supplier/${currentSupplierId}/communications/${messageId}/reply`, withSupplierAuth({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: replyText })
      }));

      const data = await response.json();

      if (response.ok) {
        setSuccess('Reply sent successfully!');
        setReplyText('');
        setSelectedMessage(null);
        await loadCommunications();
      } else {
        setError(data.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      setError('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const currentSupplierId = supplierId || 'temp';
      const response = await fetch(`/api/supplier/${currentSupplierId}/communications/${messageId}/read`, withSupplierAuth({
        method: 'PATCH'
      }));

      if (response.ok) {
        await loadCommunications();
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-gray-100 text-gray-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'resolved': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inquiry': return 'bg-blue-50 text-blue-700';
      case 'complaint': return 'bg-red-50 text-red-700';
      case 'feedback': return 'bg-green-50 text-green-700';
      case 'order_update': return 'bg-purple-50 text-purple-700';
      case 'product_question': return 'bg-orange-50 text-orange-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    const matchesType = typeFilter === 'all' || message.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || message.priority === priorityFilter;
    const matchesSearch = !searchTerm || 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesPriority && matchesSearch;
  });

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading communications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customer Communications</h1>
          <p className="text-sm text-gray-600 mt-1">Manage customer inquiries, feedback, and support requests.</p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Message
        </button>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="inquiry">Inquiry</option>
              <option value="complaint">Complaint</option>
              <option value="feedback">Feedback</option>
              <option value="order_update">Order Update</option>
              <option value="product_question">Product Question</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No communications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMessages.map((message) => (
              <div key={message._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(message.status)}`}>
                        {message.status}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(message.type)}`}>
                        {message.type.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(message.priority)}`}>
                        {message.priority}
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{message.subject}</h3>
                    <p className="text-sm text-gray-600 mb-2">{message.customerName}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">{message.message}</p>
                    
                    <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                      <span>{new Date(message.createdAt).toLocaleDateString()}</span>
                      {message.orderId && (
                        <span>Order: {message.orderId}</span>
                      )}
                      {message.productId && (
                        <span>Product: {message.productId}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {message.status === 'unread' && (
                      <button
                        onClick={() => handleMarkAsRead(message._id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedMessage(message)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Message Details</h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedMessage.status)}`}>
                    {selectedMessage.status}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(selectedMessage.type)}`}>
                    {selectedMessage.type.replace('_', ' ')}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedMessage.priority)}`}>
                    {selectedMessage.priority}
                  </span>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{selectedMessage.subject}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>From: {selectedMessage.customerName}</p>
                    {selectedMessage.customerEmail && <p>Email: {selectedMessage.customerEmail}</p>}
                    {selectedMessage.customerPhone && <p>Phone: {selectedMessage.customerPhone}</p>}
                    <p>Date: {new Date(selectedMessage.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Message:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
                
                {selectedMessage.supplierResponse && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Your Response:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedMessage.supplierResponse.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Sent on {new Date(selectedMessage.supplierResponse.respondedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                
                {selectedMessage.status !== 'resolved' && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Reply:</h4>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReply(selectedMessage._id)}
                        disabled={replying || !replyText.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {replying ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
