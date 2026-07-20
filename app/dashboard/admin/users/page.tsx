"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdvancedSearch from '@/components/admin/AdvancedSearch';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  farmName?: string;
  companyName?: string;
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [savedSearches, setSavedSearches] = useState<Array<{id: string, name: string, filters: any}>>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAdvancedSearch = (filters: any) => {
    // Convert advanced filters to API parameters
    const params = new URLSearchParams();
    
    if (filters.searchTerm) params.append('search', filters.searchTerm);
    if (filters.dateRange.start) params.append('startDate', filters.dateRange.start);
    if (filters.dateRange.end) params.append('endDate', filters.dateRange.end);
    if (filters.status.length > 0) params.append('status', filters.status.join(','));
    if (filters.category.length > 0) params.append('category', filters.category.join(','));
    
    // Add custom filters
    filters.customFilters.forEach((customFilter: any, index: number) => {
      if (customFilter.field && customFilter.value) {
        params.append(`custom_${index}`, `${customFilter.field}:${customFilter.operator}:${customFilter.value}`);
      }
    });
    
    loadUsersWithParams(params.toString());
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilter('all');
    loadUsers();
  };

  const handleSaveSearch = (name: string, filters: any) => {
    const newSavedSearch = {
      id: Date.now().toString(),
      name,
      filters
    };
    setSavedSearches(prev => [...prev, newSavedSearch]);
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        filter: filter
      });
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadUsersWithParams = async (paramsString: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users?${paramsString}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user._id === userId ? { ...user, status: newStatus as any } : user
        ));
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || user.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage system users and permissions</p>
        </div>
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center justify-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Search & Filter</h3>
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            {showAdvancedSearch ? 'Hide' : 'Show'} Advanced Search
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Search */}
      {showAdvancedSearch && (
        <div className="mt-4">
          <AdvancedSearch
            resourceType="users"
            onSearch={handleAdvancedSearch}
            onClear={handleClearSearch}
            savedSearches={savedSearches}
            onSaveSearch={handleSaveSearch}
          />
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone && <div className="text-sm text-gray-500">{user.phone}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.role === 'admin' && 'Admin'}
                      {user.role === 'supplier' && `Supplier: ${user.companyName || 'N/A'}`}
                      {user.role === 'farmer' && `Farmer: ${user.farmName || 'N/A'}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(user._id, 'active')}
                        disabled={user.status === 'active'}
                        className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                      >
                        Activate
                      </button>
                      <button
                        onClick={() => handleStatusChange(user._id, 'suspended')}
                        disabled={user.status === 'suspended'}
                        className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                      >
                        Suspend
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-600">No users found matching your criteria</div>
        </div>
      )}
    </div>
  );
}
