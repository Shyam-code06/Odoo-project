import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { useSalaryStructures } from '../../../hooks/useSalary';
import salaryService from '../../../services/salaryService';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Table } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../components/ui/Toast';

import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ListOrdered,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  X
} from 'lucide-react';

export default function SalaryStructuresPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const canCreate = hasPermission(PERMISSIONS.SALARY_STRUCTURES_CREATE);
  const canEdit = hasPermission(PERMISSIONS.SALARY_STRUCTURES_EDIT);
  const canDelete = hasPermission(PERMISSIONS.SALARY_STRUCTURES_DELETE);

  const [queryParams, setQueryParams] = useState({
    search: '',
    isActive: '',
    sortBy: 'name',
    sortDirection: 'asc',
    page: 1,
    pageSize: 10,
  });

  const { items, total, page, pageSize, totalPages, metrics = {}, loading, error, refetch } = useSalaryStructures(queryParams);

  // Summary Metrics State (Calculated dynamically)
  const [structureToDelete, setStructureToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute summary metric totals across dataset
  const totalCount = metrics.total ?? total ?? 0;
  const activeCount = metrics.active ?? items.filter((s) => s.isActive).length;
  const inactiveCount = metrics.inactive ?? items.filter((s) => !s.isActive).length;
  const totalRulesCount = metrics.totalRules ?? items.reduce((acc, s) => acc + (s.ruleCount || 0), 0);

  const handleSearchChange = (e) => {
    setQueryParams((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleFilterChange = (key, val) => {
    setQueryParams((prev) => ({ ...prev, [key]: val, page: 1 }));
  };

  const handleClearFilters = () => {
    setQueryParams({
      search: '',
      isActive: '',
      sortBy: 'name',
      sortDirection: 'asc',
      page: 1,
      pageSize: 10,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!structureToDelete) return;
    try {
      setIsDeleting(true);
      const res = await salaryService.deleteSalaryStructure(structureToDelete.id);
      if (res.success) {
        toast.success(res.message || 'Salary structure deactivated/deleted successfully');
        refetch();
      } else {
        toast.error(res.message || 'Failed to delete salary structure');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred while deleting salary structure');
    } finally {
      setIsDeleting(false);
      setStructureToDelete(null);
    }
  };

  const hasActiveFilters = Boolean(queryParams.search || queryParams.isActive !== '');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Salary Structures"
        description="Configure salary structures and the ordered rules used to calculate employee compensation."
        action={
          canCreate && (
            <Button
              variant="primary"
              onClick={() => navigate('/payroll/salary-structures/new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Salary Structure</span>
            </Button>
          )
        }
      />

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Structures</p>
            <h4 className="text-2xl font-bold text-slate-800">{totalCount}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Structures</p>
            <h4 className="text-2xl font-bold text-slate-800">{activeCount}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-100 text-slate-500">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Inactive Structures</p>
            <h4 className="text-2xl font-bold text-slate-800">{inactiveCount}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-50 text-pink-600">
            <ListOrdered className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Salary Rules</p>
            <h4 className="text-2xl font-bold text-slate-800">{totalRulesCount}</h4>
          </div>
        </Card>
      </div>

      {/* Controls Card */}
      <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, code, description..."
              value={queryParams.search}
              onChange={handleSearchChange}
              className="pl-9 text-sm"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="w-40">
              <Select
                value={queryParams.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'true', label: 'Active Only' },
                  { value: 'false', label: 'Inactive Only' },
                ]}
                className="text-sm"
              />
            </div>

            <div className="w-44">
              <Select
                value={queryParams.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                options={[
                  { value: 'name', label: 'Sort by Name' },
                  { value: 'code', label: 'Sort by Code' },
                  { value: 'ruleCount', label: 'Sort by Rules' },
                  { value: 'employeeCount', label: 'Sort by Employees' },
                ]}
                className="text-sm"
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-slate-500 hover:text-orange-600 gap-1 text-xs">
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium">Active Filters:</span>
            {queryParams.search && (
              <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700">
                Query: "{queryParams.search}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('search', '')} />
              </Badge>
            )}
            {queryParams.isActive !== '' && (
              <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700">
                Status: {queryParams.isActive === 'true' ? 'Active' : 'Inactive'}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('isActive', '')} />
              </Badge>
            )}
          </div>
        )}
      </Card>

      {/* Main Table Content */}
      {loading ? (
        <LoadingState message="Loading salary structures..." />
      ) : error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No salary structures found"
          description={hasActiveFilters ? 'No salary structures match your active search filters.' : 'Configure your organization\'s first salary structure to get started.'}
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            ) : canCreate ? (
              <Button variant="primary" size="sm" onClick={() => navigate('/payroll/salary-structures/new')}>
                Create Salary Structure
              </Button>
            ) : null
          }
        />
      ) : (
        <Card className="border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden">
          <Table>
            <Table.Header>
              <Table.Row className="bg-slate-50/80">
                <Table.HeaderCell>Structure</Table.HeaderCell>
                <Table.HeaderCell>Code</Table.HeaderCell>
                <Table.HeaderCell>Rules</Table.HeaderCell>
                <Table.HeaderCell>Employees</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {items.map((structure) => (
                <Table.Row key={structure.id} className="hover:bg-slate-50/60 transition-colors">
                  <Table.Cell>
                    <div>
                      <button
                        onClick={() => navigate(`/payroll/salary-structures/${structure.id}`)}
                        className="font-semibold text-slate-800 hover:text-orange-600 transition-colors text-left block"
                      >
                        {structure.name}
                      </button>
                      {structure.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-md">
                          {structure.description}
                        </p>
                      )}
                    </div>
                  </Table.Cell>

                  <Table.Cell>
                    <Badge variant="outline" className="font-mono text-xs bg-slate-50 text-slate-700">
                      {structure.code}
                    </Badge>
                  </Table.Cell>

                  <Table.Cell>
                    <button
                      onClick={() => navigate(`/payroll/salary-rules?salaryStructureId=${structure.id}`)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-orange-600 font-medium"
                    >
                      <ListOrdered className="w-3.5 h-3.5 text-orange-500" />
                      <span>{structure.ruleCount || 0} Rules</span>
                    </button>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-xs text-slate-600 font-medium">
                      {structure.employeeCount || 0} Employees
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <Badge variant={structure.isActive ? 'success' : 'secondary'}>
                      {structure.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Cell>

                  <Table.Cell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/payroll/salary-structures/${structure.id}`)}
                        title="View Details & Rules"
                        className="p-1.5 h-8 w-8 text-slate-500 hover:text-orange-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/payroll/salary-structures/${structure.id}/edit`)}
                          title="Edit Structure"
                          className="p-1.5 h-8 w-8 text-slate-500 hover:text-orange-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStructureToDelete(structure)}
                          title="Deactivate / Delete"
                          className="p-1.5 h-8 w-8 text-slate-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => setQueryParams((prev) => ({ ...prev, page: newPage }))}
            />
          </div>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(structureToDelete)}
        onClose={() => setStructureToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Deactivate Salary Structure"
        message={`Are you sure you want to deactivate or delete "${structureToDelete?.name}"? Historical payslips referencing this structure will remain preserved.`}
        confirmText="Deactivate Structure"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
