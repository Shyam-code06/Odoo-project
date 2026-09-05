import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { Checkbox } from './Checkbox';

export const Table = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'No data found',
  emptyDescription = 'There are no items matching your request.',
  sortColumn,
  sortDirection = 'asc',
  onSort,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  className = '',
  children,
  ...props
}) => {
  if (children) {
    return (
      <div className={`w-full overflow-x-auto rounded-lg border border-slate-200 bg-white ${className}`}>
        <table className="w-full text-left text-sm border-collapse" {...props}>
          {children}
        </table>
      </div>
    );
  }

  const isAllSelected =
    data.length > 0 && selectedRows.length === data.length;

  return (
    <div className={`w-full overflow-x-auto rounded-lg border border-slate-200 bg-white ${className}`}>
      <table className="w-full text-left text-sm border-collapse" {...props}>
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
          <tr>
            {onSelectAll && (
              <th className="p-3 w-10 text-center">
                <Checkbox
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key || col.header}
                onClick={() => col.sortable && onSort && onSort(col.key)}
                className={`p-3 select-none ${col.className || ''} ${
                  col.sortable ? 'cursor-pointer hover:bg-slate-100' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{col.header}</span>
                  {col.sortable && (
                    <span className="text-slate-400">
                      {sortColumn === col.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5 text-orange-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-orange-500" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length + (onSelectAll ? 1 : 0)} className="p-8">
                <LoadingState variant="table" rows={4} />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onSelectAll ? 1 : 0)} className="p-8">
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const rowId = row.id || rowIndex;
              const isSelected = selectedRows.includes(rowId);

              return (
                <tr
                  key={rowId}
                  className={`transition-colors hover:bg-orange-50/40 ${
                    isSelected ? 'bg-orange-50/70 font-medium' : ''
                  }`}
                >
                  {onSelectRow && (
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onSelectRow(rowId)}
                        aria-label={`Select row ${rowIndex + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key || col.header} className={`p-3 ${col.className || ''}`}>
                      {col.render ? col.render(row, rowIndex) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

Table.Header = ({ children, className = '', ...props }) => (
  <thead className={`bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200 ${className}`} {...props}>
    {children}
  </thead>
);

Table.Body = ({ children, className = '', ...props }) => (
  <tbody className={`divide-y divide-slate-100 text-slate-700 ${className}`} {...props}>
    {children}
  </tbody>
);

Table.Row = ({ children, className = '', ...props }) => (
  <tr className={`transition-colors ${className}`} {...props}>
    {children}
  </tr>
);

Table.HeaderCell = ({ children, className = '', ...props }) => (
  <th className={`p-3 text-left font-semibold select-none ${className}`} {...props}>
    {children}
  </th>
);

Table.Cell = ({ children, className = '', ...props }) => (
  <td className={`p-3 ${className}`} {...props}>
    {children}
  </td>
);

export default Table;

