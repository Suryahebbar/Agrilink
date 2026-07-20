"use client";

import { useState, useEffect } from 'react';

interface SearchFilters {
  searchTerm: string;
  dateRange: {
    start: string;
    end: string;
  };
  status: string[];
  category: string[];
  priority: string[];
  customFilters: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
}

interface AdvancedSearchProps {
  resourceType: 'users' | 'orders' | 'documents' | 'suppliers' | 'auditLogs';
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  savedSearches?: Array<{
    id: string;
    name: string;
    filters: SearchFilters;
  }>;
  onSaveSearch?: (name: string, filters: SearchFilters) => void;
}

export default function AdvancedSearch({ 
  resourceType, 
  onSearch, 
  onClear, 
  savedSearches = [],
  onSaveSearch 
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    dateRange: { start: '', end: '' },
    status: [],
    category: [],
    priority: [],
    customFilters: []
  });
  
  const [showCustomFilters, setShowCustomFilters] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [searchName, setSearchName] = useState('');

  const statusOptions = {
    users: ['active', 'inactive', 'pending', 'suspended'],
    orders: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    documents: ['pending', 'approved', 'rejected'],
    suppliers: ['active', 'inactive', 'pending', 'suspended'],
    auditLogs: ['success', 'failed']
  };

  const categoryOptions = {
    users: ['supplier', 'farmer'],
    documents: ['businessLicense', 'gstCertificate', 'bankDetails', 'ownerIdProof'],
    auditLogs: ['user', 'document', 'order', 'system', 'security'],
    orders: ['supplier', 'farmer'],
    suppliers: ['electronics', 'agriculture', 'machinery', 'other']
  };

  const priorityOptions = ['low', 'medium', 'high', 'urgent'];

  const fieldOptions = {
    users: ['name', 'email', 'phone', 'companyName', 'farmName'],
    orders: ['orderNumber', 'customerName', 'totalAmount', 'status'],
    documents: ['fileName', 'documentType', 'status'],
    suppliers: ['name', 'email', 'companyName', 'productsCount'],
    auditLogs: ['action', 'resourceType', 'adminName', 'ipAddress']
  };

  const operatorOptions = ['equals', 'contains', 'startsWith', 'endsWith', 'greaterThan', 'lessThan'];

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category]
    }));
  };

  const handlePriorityChange = (priority: string) => {
    setFilters(prev => ({
      ...prev,
      priority: prev.priority.includes(priority)
        ? prev.priority.filter(p => p !== priority)
        : [...prev.priority, priority]
    }));
  };

  const addCustomFilter = () => {
    setFilters(prev => ({
      ...prev,
      customFilters: [...prev.customFilters, { field: '', operator: 'equals', value: '' }]
    }));
  };

  const updateCustomFilter = (index: number, field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      customFilters: prev.customFilters.map((filter, i) =>
        i === index ? { ...filter, [field]: value } : filter
      )
    }));
  };

  const removeCustomFilter = (index: number) => {
    setFilters(prev => ({
      ...prev,
      customFilters: prev.customFilters.filter((_, i) => i !== index)
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      searchTerm: '',
      dateRange: { start: '', end: '' },
      status: [],
      category: [],
      priority: [],
      customFilters: []
    });
    onClear();
  };

  const handleSaveSearch = () => {
    if (searchName.trim() && onSaveSearch) {
      onSaveSearch(searchName.trim(), filters);
      setSearchName('');
    }
  };

  const loadSavedSearch = (savedSearch: typeof savedSearches[0]) => {
    setFilters(savedSearch.filters);
    setShowSavedSearches(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Search</h3>
        <div className="flex space-x-2">
          {savedSearches.length > 0 && (
            <button
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Saved Searches ({savedSearches.length})
            </button>
          )}
          <button
            onClick={handleClear}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Saved Searches */}
      {showSavedSearches && savedSearches.length > 0 && (
        <div className="border border-gray-200 rounded p-4 space-y-2">
          <h4 className="font-medium text-gray-900">Load Saved Search</h4>
          {savedSearches.map(saved => (
            <div
              key={saved.id}
              onClick={() => loadSavedSearch(saved)}
              className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
            >
              <div className="font-medium text-gray-900">{saved.name}</div>
              <div className="text-xs text-gray-500">
                {Object.entries(saved.filters).filter(([key, value]) => {
                  if (key === 'dateRange') return value.start || value.end;
                  if (Array.isArray(value)) return value.length > 0;
                  return value;
                }).length} filters applied
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Basic Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Search Term</label>
        <input
          type="text"
          value={filters.searchTerm}
          onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
          placeholder="Search across all fields..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Date Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, start: e.target.value }
            }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, end: e.target.value }
            }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Status Filters */}
      {statusOptions[resourceType] && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            {statusOptions[resourceType].map(status => (
              <label key={status} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.status.includes(status)}
                  onChange={() => handleStatusChange(status)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                />
                <span className="text-sm text-gray-700 capitalize">{status}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Category Filters */}
      {categoryOptions[resourceType] && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {categoryOptions[resourceType].map(category => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.category.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                />
                <span className="text-sm text-gray-700 capitalize">{category}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Priority Filters */}
      {resourceType === 'auditLogs' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <div className="flex flex-wrap gap-2">
            {priorityOptions.map(priority => (
              <label key={priority} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.priority.includes(priority)}
                  onChange={() => handlePriorityChange(priority)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                />
                <span className="text-sm text-gray-700 capitalize">{priority}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Custom Filters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Custom Filters</label>
          <button
            onClick={() => setShowCustomFilters(!showCustomFilters)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showCustomFilters ? 'Hide' : 'Show'} Custom Filters
          </button>
        </div>

        {showCustomFilters && (
          <div className="space-y-3">
            {filters.customFilters.map((filter, index) => (
              <div key={index} className="flex items-center space-x-2">
                <select
                  value={filter.field}
                  onChange={(e) => updateCustomFilter(index, 'field', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select field...</option>
                  {fieldOptions[resourceType]?.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
                
                <select
                  value={filter.operator}
                  onChange={(e) => updateCustomFilter(index, 'operator', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
                >
                  {operatorOptions.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                
                <input
                  type="text"
                  value={filter.value}
                  onChange={(e) => updateCustomFilter(index, 'value', e.target.value)}
                  placeholder="Value..."
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
                />
                
                <button
                  onClick={() => removeCustomFilter(index)}
                  className="px-2 py-1 text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
            
            <button
              onClick={addCustomFilter}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Add Custom Filter
            </button>
          </div>
        )}
      </div>

      {/* Save Search */}
      {onSaveSearch && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Save This Search</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Enter search name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSaveSearch}
              disabled={!searchName.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Save Search
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-4 border-t border-gray-200">
        <button
          onClick={handleSearch}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Apply Filters
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
