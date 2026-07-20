import React, { useState } from 'react';
import Pagination from './Pagination';
import PaginatedTable from './PaginatedTable';
import usePagination from '../hooks/usePagination';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Pending';
}

const PaginationDemo: React.FC = () => {
  // Sample data
  const sampleUsers: User[] = Array.from({ length: 127 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: ['Admin', 'User', 'Manager'][i % 3],
    status: ['Active', 'Inactive', 'Pending'][i % 3] as 'Active' | 'Inactive' | 'Pending'
  }));

  const columns = [
    {
      key: 'id' as keyof User,
      label: 'ID',
      className: 'w-16'
    },
    {
      key: 'name' as keyof User,
      label: 'Name'
    },
    {
      key: 'email' as keyof User,
      label: 'Email'
    },
    {
      key: 'role' as keyof User,
      label: 'Role'
    },
    {
      key: 'status' as keyof User,
      label: 'Status',
      render: (status: unknown) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            status === 'Active'
              ? 'bg-green-100 text-green-800'
              : status === 'Inactive'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {String(status)}
        </span>
      )
    }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Pagination Usage Examples</h1>
          
          {/* Standalone Pagination with Hook */}
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Standalone Pagination with Hook</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <pre className="text-sm text-gray-700 overflow-x-auto">
{`const pagination = usePagination({
  initialPage: 1,
  initialRowsPerPage: 10,
  totalItems: data.length
});

<Pagination
  currentPage={pagination.currentPage}
  totalPages={pagination.totalPages}
  onPageChange={pagination.setCurrentPage}
  variant="basic"
/>`}
              </pre>
            </div>
            
            <StandalonePaginationExample />
          </section>

          {/* Paginated Table */}
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Paginated Table Component</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <pre className="text-sm text-gray-700 overflow-x-auto">
{`<PaginatedTable
  data={users}
  columns={columns}
  itemsPerPage={10}
  showRowsPerPage={true}
  variant="table-footer"
/>`}
              </pre>
            </div>
            
            <PaginatedTable
              data={sampleUsers as unknown as Record<string, unknown>[]}
              columns={columns}
              itemsPerPage={10}
              showRowsPerPage={true}
              variant="table-footer"
              emptyMessage="No users found"
            />
          </section>

          {/* Different Variants */}
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">All Pagination Variants</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VariantExample
                title="Basic"
                description="Standard pagination with page numbers"
                variant="basic"
              />
              
              <VariantExample
                title="Ellipsis"
                description="For large datasets with many pages"
                variant="ellipsis"
              />
              
              <VariantExample
                title="Compact"
                description="Mobile-friendly summary format"
                variant="compact"
              />
              
              <VariantExample
                title="Arrows Only"
                description="Minimal navigation controls"
                variant="arrows-only"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// Helper component for variant examples
interface VariantExampleProps {
  title: string;
  description: string;
  variant: 'basic' | 'ellipsis' | 'compact' | 'arrows-only';
}

const VariantExample: React.FC<VariantExampleProps> = ({ title, description, variant }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = variant === 'ellipsis' ? 50 : 10;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        variant={variant}
      />
    </div>
  );
};

// Standalone pagination example with hook
const StandalonePaginationExample: React.FC = () => {
  const pagination = usePagination({
    initialPage: 1,
    initialRowsPerPage: 10,
    totalItems: 127
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Showing {pagination.startIndex}-{pagination.endIndex} of 127 items
        </div>
        <div className="text-sm text-gray-600">
          Page {pagination.currentPage} of {pagination.totalPages}
        </div>
      </div>
      
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setCurrentPage}
        variant="basic"
        centered
      />
    </div>
  );
};

export default PaginationDemo;
