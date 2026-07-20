import React, { useState, useCallback } from 'react';
import './pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  variant?: 'basic' | 'ellipsis' | 'compact' | 'table-footer' | 'arrows-only' | 'responsive';
  size?: 'sm' | 'md' | 'lg';
  showRowsPerPage?: boolean;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rows: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  centered?: boolean;
  end?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  variant = 'basic',
  size = 'md',
  showRowsPerPage = false,
  rowsPerPage = 10,
  onRowsPerPageChange,
  totalItems,
  itemsPerPage = rowsPerPage,
  disabled = false,
  loading = false,
  className = '',
  centered = false,
  end = false
}) => {
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(rowsPerPage);

  const handlePageChange = useCallback((page: number) => {
    if (!disabled && !loading && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  }, [disabled, loading, onPageChange, totalPages]);

  const handleRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRowsPerPage = parseInt(e.target.value);
    setInternalRowsPerPage(newRowsPerPage);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newRowsPerPage);
    }
  }, [onRowsPerPageChange]);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;

    if (variant === 'ellipsis' && totalPages > maxVisiblePages) {
      // Show first page
      if (currentPage > 3) {
        pages.push(1);
        if (currentPage > 4) {
          pages.push('ellipsis');
        }
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Show ellipsis and last page
      if (currentPage < totalPages - 2) {
        if (currentPage < totalPages - 3) {
          pages.push('ellipsis');
        }
        pages.push(totalPages);
      }
    } else {
      // Basic pagination - show all pages or limited range
      const startPage = Math.max(1, currentPage - 3);
      const endPage = Math.min(totalPages, currentPage + 3);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages.map((page, index) => {
      if (page === 'ellipsis') {
        return (
          <span key={`ellipsis-${index}`} className="pagination-ellipsis">
            ...
          </span>
        );
      }

      return (
        <button
          key={page}
          className={`pagination-btn ${page === currentPage ? 'active' : ''} ${loading ? 'loading' : ''}`}
          onClick={() => handlePageChange(page as number)}
          disabled={disabled || loading}
          aria-current={page === currentPage ? 'page' : undefined}
          aria-label={`Go to page ${page}`}
        >
          {loading && page === currentPage ? '' : page}
        </button>
      );
    });
  };

  const getContainerClasses = () => {
    const classes = ['pagination-container'];
    
    if (size !== 'md') classes.push(`pagination-${size}`);
    if (centered) classes.push('pagination-container-center');
    if (end) classes.push('pagination-container-end');
    if (variant === 'compact') classes.push('pagination-compact');
    if (className) classes.push(className);

    return classes.join(' ');
  };

  const renderBasicPagination = () => (
    <nav className={getContainerClasses()} aria-label="Pagination">
      <button
        className={`pagination-btn pagination-btn-arrow ${loading ? 'loading' : ''}`}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={disabled || loading || currentPage === 1}
        aria-label="Previous page"
      >
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {renderPageNumbers()}

      <button
        className={`pagination-btn pagination-btn-arrow ${loading ? 'loading' : ''}`}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={disabled || loading || currentPage === totalPages}
        aria-label="Next page"
      >
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </nav>
  );

  const renderCompactPagination = () => (
    <nav className={`${getContainerClasses()} pagination-compact`} aria-label="Pagination">
      <button
        className={`pagination-btn pagination-btn-arrow ${loading ? 'loading' : ''}`}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={disabled || loading || currentPage === 1}
        aria-label="Previous page"
      >
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <span className="pagination-ellipsis pagination-compact-text">
        Page {currentPage} of {totalPages}
      </span>

      <button
        className={`pagination-btn pagination-btn-arrow ${loading ? 'loading' : ''}`}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={disabled || loading || currentPage === totalPages}
        aria-label="Next page"
      >
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </nav>
  );

  const renderTableFooterPagination = () => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems || 0);

    return (
      <div className="pagination-table-footer">
        {showRowsPerPage && (
          <div className="rows-per-page">
            <span>Rows per page:</span>
            <select
              value={internalRowsPerPage}
              onChange={handleRowsPerPageChange}
              disabled={disabled || loading}
              aria-label="Rows per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}

        <div className="pagination-info">
          {totalItems && (
            <span>
              {startItem}-{endItem} of {totalItems}
            </span>
          )}

          <div className="pagination-container">
            <button
              className={`pagination-btn pagination-btn-arrow ${loading ? 'loading' : ''}`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={disabled || loading || currentPage === 1}
              aria-label="Previous page"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <button
              className={`pagination-btn pagination-btn-arrow ${loading ? 'loading' : ''}`}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={disabled || loading || currentPage === totalPages}
              aria-label="Next page"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderArrowsOnlyPagination = () => (
    <nav className={getContainerClasses()} aria-label="Pagination">
      <button
        className={`pagination-btn pagination-btn-arrow ${loading ? 'loading' : ''}`}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={disabled || loading || currentPage === 1}
        aria-label="Previous page"
      >
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        className={`pagination-btn pagination-btn-arrow ${loading ? 'loading' : ''}`}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={disabled || loading || currentPage === totalPages}
        aria-label="Next page"
      >
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </nav>
  );

  const renderResponsivePagination = () => (
    <>
      {/* Desktop version */}
      <div className="pagination-desktop-only">
        {renderBasicPagination()}
      </div>
      
      {/* Mobile version */}
      <div className="pagination-mobile-only">
        {renderCompactPagination()}
      </div>
    </>
  );

  // Render based on variant
  switch (variant) {
    case 'ellipsis':
      return renderBasicPagination();
    case 'compact':
      return renderCompactPagination();
    case 'table-footer':
      return renderTableFooterPagination();
    case 'arrows-only':
      return renderArrowsOnlyPagination();
    case 'responsive':
      return renderResponsivePagination();
    default:
      return renderBasicPagination();
  }
};

export default Pagination;
