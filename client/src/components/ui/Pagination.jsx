import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { IconButton } from './IconButton';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-white border border-t-0 border-slate-200 rounded-b-lg text-xs text-slate-600 ${className}`}
    >
      <div className="flex items-center gap-4">
        <span>
          Showing <strong className="font-semibold text-slate-900">{startItem}</strong> to{' '}
          <strong className="font-semibold text-slate-900">{endItem}</strong> of{' '}
          <strong className="font-semibold text-slate-900">{totalItems}</strong> entries
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:ring-1 focus:ring-orange-500 focus:outline-none"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <IconButton
          icon={ChevronsLeft}
          ariaLabel="First page"
          size="sm"
          isDisabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
        />
        <IconButton
          icon={ChevronLeft}
          ariaLabel="Previous page"
          size="sm"
          isDisabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        />
        <span className="px-3 font-medium text-slate-700">
          Page {currentPage} of {totalPages}
        </span>
        <IconButton
          icon={ChevronRight}
          ariaLabel="Next page"
          size="sm"
          isDisabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        />
        <IconButton
          icon={ChevronsRight}
          ariaLabel="Last page"
          size="sm"
          isDisabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
        />
      </div>
    </div>
  );
};
