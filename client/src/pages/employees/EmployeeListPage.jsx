import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Filter,
  LayoutList,
  Kanban,
  Eye,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { IconButton } from '../../components/ui/IconButton';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { useEmployees } from '../../hooks/useEmployees';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { EmployeeKanbanView } from './components/EmployeeKanbanView';
import { EmployeeFilterDrawer } from './components/EmployeeFilterDrawer';
import { PERMISSIONS } from '../../config/permissions';
import { employeeService } from '../../services/employeeService';

export const EmployeeListPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentRole, hasPermission } = useAuth();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState('');

  const {
    employees,
    totalCount,
    totalPages,
    loading,
    error,
    params,
    updateFilters,
    clearFilters,
    refresh,
  } = useEmployees();

  const canCreate = hasPermission(PERMISSIONS.EMPLOYEES_CREATE);
  const canEdit = hasPermission(PERMISSIONS.EMPLOYEES_EDIT);
  const canDelete = hasPermission(PERMISSIONS.EMPLOYEES_DELETE);

  const activeFilterCount = [
    params.department_id,
    params.job_position_id,
    params.employment_status,
    params.working_schedule_id,
  ].filter(Boolean).length;

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await employeeService.deleteEmployee(deletingId);
      toast.success(`Deleted employee record for ${deletingName}`);
      refresh();
    } catch (e) {
      toast.error('Failed to delete employee record.');
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      header: 'Employee',
      key: 'fullName',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.avatar} name={row.fullName} size="md" />
          <div>
            <div
              onClick={() => navigate(`/employees/${row.id}`)}
              className="font-semibold text-slate-900 hover:text-orange-600 cursor-pointer transition-colors"
            >
              {row.fullName}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {row.employee_code} • {row.email}
            </div>
          </div>
        </div>
      ),
    },
    { header: 'Department', key: 'departmentName', sortable: true },
    { header: 'Job Position', key: 'jobPositionTitle', sortable: true },
    {
      header: 'Status',
      key: 'employment_status',
      sortable: true,
      render: (row) => <StatusBadge status={row.employment_status} />,
    },
    { header: 'Joined Date', key: 'joining_date', sortable: true },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Eye}
            ariaLabel="View profile"
            size="sm"
            onClick={() => navigate(`/employees/${row.id}`)}
          />
          {canEdit && (
            <IconButton
              icon={Edit2}
              ariaLabel="Edit employee"
              size="sm"
              onClick={() => navigate(`/employees/${row.id}/edit`)}
            />
          )}
          {canDelete && (
            <IconButton
              icon={Trash2}
              ariaLabel="Delete employee"
              variant="destructive"
              size="sm"
              onClick={() => {
                setDeletingId(row.id);
                setDeletingName(row.fullName);
              }}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Master Management"
        description="Central workforce directory, employee profiles, department roles, and employment records."
        secondaryActions={
          <Button
            variant="outline"
            size="md"
            leftIcon={FileSpreadsheet}
            onClick={() => alert('Import CSV feature placeholder')}
          >
            Import
          </Button>
        }
        action={
          canCreate && (
            <Button
              variant="primary"
              size="md"
              leftIcon={UserPlus}
              onClick={() => navigate('/employees/new')}
            >
              Add Employee
            </Button>
          )
        }
      />

      {/* Control Bar (Search, Filters, View Switcher) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          placeholder="Search by name, employee code, email..."
          value={params.search || ''}
          onChange={(e) => updateFilters({ search: e.target.value })}
          onClear={() => updateFilters({ search: '' })}
          className="max-w-md"
        />

        <div className="flex items-center gap-2.5 justify-end">
          {/* Filter Drawer Toggle */}
          <Button
            variant={activeFilterCount > 0 ? 'pink' : 'outline'}
            size="sm"
            leftIcon={Filter}
            onClick={() => setIsFilterOpen(true)}
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-orange-500 text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* View Switcher Button Group */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500 font-medium">Active Filters:</span>
          {params.department_id && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Department Filter
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => updateFilters({ department_id: '' })}
              />
            </span>
          )}
          {params.employment_status && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Status: {params.employment_status}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => updateFilters({ employment_status: '' })}
              />
            </span>
          )}
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-orange-600 hover:underline font-semibold ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main View Area */}
      {viewMode === 'list' ? (
        <div>
          <Table
            columns={columns}
            data={employees}
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
            emptyTitle="No employees found"
            emptyDescription="There are no employee records matching your current search or filters."
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
      ) : (
        <EmployeeKanbanView employees={employees} />
      )}

      {/* Filter Drawer Dialog */}
      <EmployeeFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={params}
        onApply={(newFilters) => updateFilters(newFilters)}
        onReset={clearFilters}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee Record"
        message={`Are you sure you want to delete ${deletingName}? Historical contracts and attendance logs will remain archived.`}
        confirmText="Delete Employee"
        isDanger
      />
    </div>
  );
};
