import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  X,
  Users,
  Building2,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { IconButton } from '../../components/ui/IconButton';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Select } from '../../components/ui/Select';
import { useJobPositions } from '../../hooks/useJobPositions';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { PERMISSIONS } from '../../config/permissions';
import { jobPositionService } from '../../services/jobPositionService';
import { departmentService } from '../../services/departmentService';

export const JobPositionListPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [deletingPos, setDeletingPos] = useState(null);
  const [departmentOptions, setDepartmentOptions] = useState([]);

  const {
    jobPositions,
    totalCount,
    totalPages,
    loading,
    error,
    params,
    updateFilters,
    clearFilters,
    refresh,
  } = useJobPositions();

  const canCreate = hasPermission(PERMISSIONS.JOB_POSITIONS_CREATE);
  const canEdit = hasPermission(PERMISSIONS.JOB_POSITIONS_EDIT);
  const canDelete = hasPermission(PERMISSIONS.JOB_POSITIONS_DELETE);

  useEffect(() => {
    departmentService.getDepartmentOptions().then((opts) => {
      setDepartmentOptions(opts.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })));
    });
  }, []);

  const activeFilterCount = [params.departmentId, params.status].filter(Boolean).length;

  const handleDeleteConfirm = async () => {
    if (!deletingPos) return;
    try {
      await jobPositionService.deleteJobPosition(deletingPos.id);
      toast.success(`Job position "${deletingPos.title}" deleted.`);
      refresh();
    } catch (e) {
      toast.error(e.message || 'Failed to delete job position.');
    } finally {
      setDeletingPos(null);
    }
  };

  const columns = [
    {
      header: 'Job Position',
      key: 'title',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <div
              onClick={() => navigate(`/job-positions/${row.id}`)}
              className="font-semibold text-slate-900 hover:text-orange-600 cursor-pointer transition-colors"
            >
              {row.title}
            </div>
            <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">
              {row.description || 'No description'}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Code',
      key: 'code',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Department',
      key: 'department',
      sortable: true,
      render: (row) =>
        row.department ? (
          <span
            onClick={() => navigate(`/departments/${row.department.id}`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-orange-600 cursor-pointer transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            {row.department.name}
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">Unassigned</span>
        ),
    },
    {
      header: 'Employees',
      key: 'employeeCount',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/employees?job_position_id=${row.id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <Users className="w-3.5 h-3.5" />
          {row.employeeCount} {row.employeeCount === 1 ? 'Employee' : 'Employees'}
        </button>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Eye}
            ariaLabel="View job position"
            size="sm"
            onClick={() => navigate(`/job-positions/${row.id}`)}
          />
          {canEdit && (
            <IconButton
              icon={Edit2}
              ariaLabel="Edit job position"
              size="sm"
              onClick={() => navigate(`/job-positions/${row.id}/edit`)}
            />
          )}
          {canDelete && (
            <IconButton
              icon={Trash2}
              ariaLabel="Delete job position"
              variant="destructive"
              size="sm"
              onClick={() => setDeletingPos(row)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Positions"
        description="Manage job titles, organizational roles, and department allocations."
        action={
          canCreate && (
            <Button
              variant="primary"
              size="md"
              leftIcon={Plus}
              onClick={() => navigate('/job-positions/new')}
            >
              Add Job Position
            </Button>
          )
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          placeholder="Search by title, code, department..."
          value={params.search || ''}
          onChange={(e) => updateFilters({ search: e.target.value })}
          onClear={() => updateFilters({ search: '' })}
          className="max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2.5 justify-end">
          {/* Department Filter */}
          <div className="w-52">
            <Select
              placeholder="All Departments"
              options={[{ value: '', label: 'All Departments' }, ...departmentOptions]}
              value={params.departmentId || ''}
              onChange={(e) => updateFilters({ departmentId: e.target.value })}
            />
          </div>

          {/* Status Filter */}
          <div className="w-36">
            <Select
              placeholder="All Statuses"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
              value={params.status || ''}
              onChange={(e) => updateFilters({ status: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500 font-medium">Active Filters:</span>
          {params.departmentId && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Department Filter
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ departmentId: '' })} />
            </span>
          )}
          {params.status && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Status: {params.status}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ status: '' })} />
            </span>
          )}
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-orange-600 hover:underline font-semibold ml-2 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Table */}
      <div>
        <Table
          columns={columns}
          data={jobPositions}
          isLoading={loading}
          sortColumn={params.sortBy}
          sortDirection={params.sortDirection}
          onSort={(key) =>
            updateFilters({
              sortBy: key,
              sortDirection:
                params.sortBy === key && params.sortDirection === 'asc' ? 'desc' : 'asc',
            })
          }
          emptyTitle="No job positions found"
          emptyDescription="Create a job position to define roles within your organization."
        />
        <Pagination
          currentPage={params.page}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={params.pageSize}
          onPageChange={(page) => updateFilters({ page })}
          onPageSizeChange={(pageSize) => updateFilters({ pageSize, page: 1 })}
        />
      </div>

      {/* Delete Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingPos}
        onClose={() => setDeletingPos(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Job Position "${deletingPos?.title}"?`}
        message={
          deletingPos?.employeeCount > 0
            ? `Warning: This job position is currently assigned to ${deletingPos?.employeeCount} employees. Deleting it may impact employee role assignments.`
            : `Are you sure you want to delete ${deletingPos?.title}? This action cannot be undone.`
        }
        confirmText="Delete Job Position"
        isDanger
      />
    </div>
  );
};
