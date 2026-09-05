import React from 'react';
import { Card } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Search, X } from 'lucide-react';

export function PayslipFilters({
  queryParams,
  setQueryParams,
  structures = [],
  payruns = [],
  departments = [],
  hasActiveFilters,
  onClearFilters,
}) {
  const handleSearchChange = (e) => {
    setQueryParams((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleFilterChange = (key, val) => {
    setQueryParams((prev) => ({ ...prev, [key]: val, page: 1 }));
  };

  return (
    <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Search Input */}
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search employee, code, payslip ID..."
            value={queryParams.search || ''}
            onChange={handleSearchChange}
            className="pl-9 text-sm"
          />
        </div>

        {/* Status Filter */}
        <div>
          <Select
            value={queryParams.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'generated', label: 'Generated' },
              { value: 'paid', label: 'Paid' },
            ]}
            className="text-sm"
          />
        </div>

        {/* Structure Filter */}
        <div>
          <Select
            value={queryParams.salaryStructureId || ''}
            onChange={(e) => handleFilterChange('salaryStructureId', e.target.value)}
            options={[
              { value: '', label: 'All Structures' },
              ...(structures || []).map((s) => ({ value: s.id, label: s.name })),
            ]}
            className="text-sm"
          />
        </div>

        {/* Department Filter */}
        <div>
          <Select
            value={queryParams.departmentId || ''}
            onChange={(e) => handleFilterChange('departmentId', e.target.value)}
            options={[
              { value: '', label: 'All Departments' },
              ...(departments || []).map((d) => ({ value: d.id, label: d.name })),
            ]}
            className="text-sm"
          />
        </div>

        {/* Email Status Filter */}
        <div>
          <Select
            value={queryParams.emailStatus || ''}
            onChange={(e) => handleFilterChange('emailStatus', e.target.value)}
            options={[
              { value: '', label: 'All Email Status' },
              { value: 'sent', label: 'Sent' },
              { value: 'not_sent', label: 'Not Sent' },
            ]}
            className="text-sm"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium">Active Filters:</span>
            {queryParams.status && (
              <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700 capitalize">
                Status: {queryParams.status}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('status', '')} />
              </Badge>
            )}
            {queryParams.salaryStructureId && (
              <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700">
                Structure: {structures.find((s) => s.id === queryParams.salaryStructureId)?.name || queryParams.salaryStructureId}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('salaryStructureId', '')} />
              </Badge>
            )}
            {queryParams.departmentId && (
              <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700">
                Department: {departments.find((d) => d.id === queryParams.departmentId)?.name || queryParams.departmentId}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('departmentId', '')} />
              </Badge>
            )}
            {queryParams.emailStatus && (
              <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700 capitalize">
                Email: {queryParams.emailStatus.replace('_', ' ')}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('emailStatus', '')} />
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-slate-500 hover:text-orange-600 gap-1 text-xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </Button>
        </div>
      )}
    </Card>
  );
}

export default PayslipFilters;
