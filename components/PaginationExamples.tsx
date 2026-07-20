import React, { useState } from 'react';
import Pagination from './Pagination';

const PaginationExamples: React.FC = () => {
  const [currentPage1, setCurrentPage1] = useState(2);
  const [currentPage2, setCurrentPage2] = useState(12);
  const [currentPage3, setCurrentPage3] = useState(4);
  const [currentPage4, setCurrentPage4] = useState(1);
  const [currentPage5, setCurrentPage5] = useState(5);
  const [currentPage6, setCurrentPage6] = useState(3);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  return (
    <div className="p-8 space-y-12 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pagination Components</h1>

        {/* Basic Pagination */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Basic Pagination (Amazon-style)</h2>
          <p className="text-gray-600 mb-6">Compact, soft borders with teal active state</p>
          
          <Pagination
            currentPage={currentPage1}
            totalPages={30}
            onPageChange={setCurrentPage1}
            variant="basic"
          />
        </section>

        {/* Pagination with Ellipsis */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Pagination with … Ellipsis</h2>
          <p className="text-gray-600 mb-6">Ideal for large datasets - shows beginning + current + end pages</p>
          
          <Pagination
            currentPage={currentPage2}
            totalPages={30}
            onPageChange={setCurrentPage2}
            variant="ellipsis"
          />
        </section>

        {/* Compact Pagination */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Compact Pagination (For Mobile)</h2>
          <p className="text-gray-600 mb-6">Summarized format - ideal for mobile dashboards</p>
          
          <Pagination
            currentPage={currentPage3}
            totalPages={12}
            onPageChange={setCurrentPage3}
            variant="compact"
          />
        </section>

        {/* Table Footer Pagination */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Pagination with &ldquo;Rows per page&rdquo; (Table Footers)</h2>
          <p className="text-gray-600 mb-6">Matches Amazon &ldquo;Manage Orders&rdquo; and &ldquo;Inventory&rdquo; tables</p>
          
          <Pagination
            currentPage={currentPage4}
            totalPages={14}
            onPageChange={setCurrentPage4}
            variant="table-footer"
            showRowsPerPage={true}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
            totalItems={132}
            itemsPerPage={rowsPerPage}
          />
        </section>

        {/* Arrow Only Pagination */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Arrow Icon Pagination (Minimal)</h2>
          <p className="text-gray-600 mb-6">Clean SVG icons with disabled state clearly marked</p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Normal state:</span>
              <Pagination
                currentPage={currentPage5}
                totalPages={10}
                onPageChange={setCurrentPage5}
                variant="arrows-only"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Disabled previous:</span>
              <Pagination
                currentPage={1}
                totalPages={10}
                onPageChange={() => {}}
                variant="arrows-only"
              />
            </div>
          </div>
        </section>

        {/* Size Variants */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Size Variants</h2>
          <p className="text-gray-600 mb-6">Different sizes for different contexts</p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-20">Small:</span>
              <Pagination
                currentPage={currentPage6}
                totalPages={10}
                onPageChange={setCurrentPage6}
                size="sm"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-20">Medium:</span>
              <Pagination
                currentPage={currentPage6}
                totalPages={10}
                onPageChange={setCurrentPage6}
                size="md"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-20">Large:</span>
              <Pagination
                currentPage={currentPage6}
                totalPages={10}
                onPageChange={setCurrentPage6}
                size="lg"
              />
            </div>
          </div>
        </section>

        {/* Alignment Options */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Alignment Options</h2>
          <p className="text-gray-600 mb-6">Start, center, and end alignment</p>
          
          <div className="space-y-6">
            <div>
              <span className="text-sm text-gray-600 block mb-2">Start (default):</span>
              <Pagination
                currentPage={1}
                totalPages={10}
                onPageChange={() => {}}
              />
            </div>
            
            <div>
              <span className="text-sm text-gray-600 block mb-2">Center:</span>
              <Pagination
                currentPage={1}
                totalPages={10}
                onPageChange={() => {}}
                centered
              />
            </div>
            
            <div>
              <span className="text-sm text-gray-600 block mb-2">End:</span>
              <Pagination
                currentPage={1}
                totalPages={10}
                onPageChange={() => {}}
                end
              />
            </div>
          </div>
        </section>

        {/* States */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Button States</h2>
          <p className="text-gray-600 mb-6">Default, hover, active, and disabled states</p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Normal:</span>
              <Pagination
                currentPage={3}
                totalPages={10}
                onPageChange={() => {}}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Disabled:</span>
              <Pagination
                currentPage={1}
                totalPages={10}
                onPageChange={() => {}}
                disabled
              />
            </div>
          </div>
        </section>

        {/* Responsive Demo */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">9. Responsive Behavior</h2>
          <p className="text-gray-600 mb-6">Switches to compact format on mobile</p>
          <p className="text-sm text-gray-500 mb-4">Resize your browser to see the responsive behavior</p>
          
          <Pagination
            currentPage={2}
            totalPages={15}
            onPageChange={() => {}}
            variant="responsive"
          />
        </section>
      </div>
    </div>
  );
};

export default PaginationExamples;
