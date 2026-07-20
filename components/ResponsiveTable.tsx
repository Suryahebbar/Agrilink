"use client";

import React from 'react';

interface Column<T extends Record<string, unknown>> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T, index: number) => React.ReactNode;
  className?: string;
}

interface ResponsiveTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
}

function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  className = '',
  emptyMessage = 'No data available',
  loading = false,
  onRowClick,
  rowClassName
}: ResponsiveTableProps<T>) {
  const renderMobileCard = (item: T, index: number) => {
    return (
      <div
        key={index}
        className={`bg-white border border-gray-200 rounded-lg p-4 space-y-3 ${
          onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
        } ${rowClassName ? rowClassName(item, index) : ''}`}
        onClick={() => onRowClick?.(item, index)}
      >
        {columns.map((column) => (
          <div key={column.key as string} className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500 min-w-0 flex-shrink-0">
              {column.label}:
            </span>
            <span className={`text-sm text-gray-900 text-right ml-4 ${
              column.className || ''
            }`}>
              {column.render
                ? column.render(item[column.key], item, index)
                : String(item[column.key])}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderDesktopTable = () => (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key as string}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.className || ''
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500"
              >
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <span className="ml-2">Loading...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={index}
                className={`hover:bg-gray-50 ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${rowClassName ? rowClassName(item, index) : ''}`}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key as string}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                      column.className || ''
                    }`}
                  >
                    {column.render
                      ? column.render(item[column.key], item, index)
                      : String(item[column.key])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={`responsive-table ${className}`}>
      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          data.map((item, index) => renderMobileCard(item, index))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block">
        {renderDesktopTable()}
      </div>
    </div>
  );
}

export default ResponsiveTable;
