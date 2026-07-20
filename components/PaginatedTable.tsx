import React from 'react';
import Pagination from './Pagination';
import usePagination from '../hooks/usePagination';

interface Column<T extends Record<string, unknown>> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T, index: number) => React.ReactNode;
  className?: string;
}

interface PaginatedTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  itemsPerPage?: number;
  showRowsPerPage?: boolean;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  variant?: 'basic' | 'ellipsis' | 'compact' | 'table-footer';
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
}

function PaginatedTable<T extends Record<string, unknown>>({
  data,
  columns,
  itemsPerPage = 10,
  showRowsPerPage = true,
  className = '',
  emptyMessage = 'No data available',
  loading = false,
  variant = 'table-footer',
  onRowClick,
  rowClassName
}: PaginatedTableProps<T>) {
  const pagination = usePagination({
    initialRowsPerPage: itemsPerPage,
    totalItems: data.length
  });

  const currentData = data.slice(
    pagination.startIndex - 1,
    pagination.endIndex
  );

  return (
    <div className={`paginated-table ${className}`}>
      {/* Table */}
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
            ) : currentData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentData.map((item, index) => {
                const globalIndex = pagination.startIndex - 1 + index;
                return (
                  <tr
                    key={globalIndex}
                    className={`hover:bg-gray-50 ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${rowClassName ? rowClassName(item, globalIndex) : ''}`}
                    onClick={() => onRowClick?.(item, globalIndex)}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key as string}
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                          column.className || ''
                        }`}
                      >
                        {column.render
                          ? column.render(item[column.key], item, globalIndex)
                          : String(item[column.key])}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setCurrentPage}
          variant={variant}
          showRowsPerPage={showRowsPerPage}
          rowsPerPage={pagination.rowsPerPage}
          onRowsPerPageChange={pagination.setRowsPerPage}
          totalItems={data.length}
          itemsPerPage={pagination.rowsPerPage}
          disabled={loading}
        />
      )}
    </div>
  );
}

export default PaginatedTable;
