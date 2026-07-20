import { useState, useCallback, useMemo } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialRowsPerPage?: number;
  totalItems?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  rowsPerPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  pageNumbers: number[];
  visiblePages: (number | 'ellipsis')[];
  resetPagination: () => void;
}

export const usePagination = ({
  initialPage = 1,
  initialRowsPerPage = 10,
  totalItems = 0
}: UsePaginationOptions = {}): UsePaginationReturn => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const totalPages = useMemo(() => {
    return totalItems > 0 ? Math.ceil(totalItems / rowsPerPage) : 1;
  }, [totalItems, rowsPerPage]);

  const startIndex = useMemo(() => {
    return totalItems > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  }, [currentPage, rowsPerPage, totalItems]);

  const endIndex = useMemo(() => {
    return totalItems > 0 ? Math.min(currentPage * rowsPerPage, totalItems) : 0;
  }, [currentPage, rowsPerPage, totalItems]);

  const setCurrentPageSafe = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const setRowsPerPageSafe = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  }, []);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const canGoNext = currentPage < totalPages;
  const canGoPrevious = currentPage > 1;

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 7) {
      return pageNumbers;
    }

    const pages: (number | 'ellipsis')[] = [];
    const currentPageIndex = currentPage - 1;

    // Always show first page
    pages.push(1);

    // Show ellipsis if current page is far from start
    if (currentPageIndex > 3) {
      pages.push('ellipsis');
    }

    // Show pages around current page
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    // Show ellipsis if current page is far from end
    if (currentPageIndex < totalPages - 4) {
      pages.push('ellipsis');
    }

    // Always show last page if it's different from first page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages, pageNumbers]);

  const resetPagination = useCallback(() => {
    setCurrentPage(initialPage);
    setRowsPerPage(initialRowsPerPage);
  }, [initialPage, initialRowsPerPage]);

  return {
    currentPage,
    rowsPerPage,
    totalPages,
    startIndex,
    endIndex,
    setCurrentPage: setCurrentPageSafe,
    setRowsPerPage: setRowsPerPageSafe,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    canGoNext,
    canGoPrevious,
    pageNumbers,
    visiblePages,
    resetPagination
  };
};

export default usePagination;
