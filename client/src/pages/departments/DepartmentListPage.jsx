import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  LayoutList,
  LayoutGrid,
  Eye,
  Edit2,
  Trash2,
  X,
  Users,
  Briefcase,
  UserCheck,
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
import { Select } from '../../components/ui/Select';
import { useDepartments } from '../../hooks/useDepartments';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { PERMISSIONS } from '../../config/permissions';
import { departmentService } from '../../services/departmentService';
import { employeeService } from '../../services/employeeService';

export const DepartmentListPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [deletingDept, setDeletingDept] = useState(null);
  const [managerOptions, setManagerOptions] = useState([]);

  const {
    departments,
    totalCount,
    totalPages,
    loading,
    error,
    params,
    updateFilters,
    clearFilters,
    refresh,
  } = useDepartments();

  const canCreate = hasPermission(PERMISSIONS.DEPARTMENTS_CREATE);
  const canEdit = hasPermission(PERMISSIONS.DEPARTMENTS_EDIT);
  const canDelete = hasPermission(PERMISSIONS.DEPARTMENTS_DELETE);

  useEffect(() => {
    employeeService.getManagerOptions().then((opts) => {
      setManagerOptions(opts.map((m) => ({ value: m.id, label: m.name })));
    });
  }, []);

  const activeFilterCount = [params.managerId, params.status].filter(Boolean).length;

  const handleDeleteConfirm = async () => {
    if (!deletingDept) return;
    try {
      await departmentService.deleteDepartment(deletingDept.id);
      toast.success(`Department "${deletingDept.name}" deleted successfully.`);
      refresh();
    } catch (e) {
      toast.error(e.message || 'Failed to delete department.');
    } finally {
      setDeletingDept(null);
    }
  };

  const columns = [
    {
      header: 'Department',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
            {row.code.slice(0, 3)}
          </div>
          <div>
            <div
              onClick={() => navigate(`/departments/${row.id}`)}
              className="font-semibold text-slate-900 hover:text-orange-600 cursor-pointer transition-colors"
            >
              {row.name}
            </div>
            <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">
              {row.description || 'No description provided'}
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
        <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Manager',
      key: 'manager',
      sortable: true,
      render: (row) =>
        row.manager ? (
          <div className="flex items-center gap-2">
            <Avatar src={row.manager.avatar} name={row.manager.name} size="xs" />
            <span className="text-sm font-medium text-slate-800">{row.manager.name}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">No manager assigned</span>
        ),
    },
    {
      header: 'Employees',
      key: 'employeeCount',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/employees?department_id=${row.id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <Users className="w-3.5 h-3.5" />
          {row.employeeCount} {row.employeeCount === 1 ? 'Employee' : 'Employees'}
        </button>
      ),
    },
    {
      header: 'Job Positions',
      key: 'jobPositionCount',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/job-positions?department_id=${row.id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
        >
          <Briefcase className="w-3.5 h-3.5" />
          {row.jobPositionCount} {row.jobPositionCount === 1 ? 'Position' : 'Positions'}
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
            ariaLabel="View department details"
            size="sm"
            onClick={() => navigate(`/departments/${row.id}`)}
          />
          {canEdit && (
            <IconButton
              icon={Edit2}
              ariaLabel="Edit department"
              size="sm"
              onClick={() => navigate(`/departments/${row.id}/edit`)}
            />
          )}
          {canDelete && (
            <IconButton
              icon={Trash2}
              ariaLabel="Delete department"
              variant="destructive"
              size="sm"
              onClick={() => setDeletingDept(row)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage your organization's departments, operational hierarchy, and reporting structures."
        action={
          canCreate && (
            <Button
              variant="primary"
              size="md"
              leftIcon={Plus}
              onClick={() => navigate('/departments/new')}
            >
              Add Department
            </Button>
          )
        }
      />

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          placeholder="Search by department name, code, manager..."
          value={params.search || ''}
          onChange={(e) => updateFilters({ search: e.target.value })}
          onClear={() => updateFilters({ search: '' })}
          className="max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2.5 justify-end">
          {/* Manager Filter */}
          <div className="w-44">
            <Select
              placeholder="All Managers"
              options={[{ value: '', label: 'All Managers' }, ...managerOptions]}
              value={params.managerId || ''}
              onChange={(e) => updateFilters({ managerId: e.target.value })}
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
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500 font-medium">Active Filters:</span>
          {params.managerId && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Manager Filter
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ managerId: '' })} />
            </span>
          )}
          {params.status && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
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

      {/* Main View Area */}
      {viewMode === 'list' ? (
        <div>
          <Table
            columns={columns}
            data={departments}
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
            emptyTitle="No departments found"
            emptyDescription="Create your first department to start building your organization structure."
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
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : departments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No departments found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                Create your first department to start building your organization structure.
              </p>
              {canCreate && (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/departments/new')}
                >
                  Create Department
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {dept.code}
                        </div>
                        <div>
                          <h4
                            onClick={() => navigate(`/departments/${dept.id}`)}
                            className="font-bold text-slate-900 hover:text-orange-600 cursor-pointer transition-colors"
                          >
                            {dept.name}
                          </h4>
                          <span className="font-mono text-[10px] font-semibold text-slate-500">
                            {dept.code}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={dept.status} />
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                      {dept.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        Manager
                      </span>
                      {dept.manager ? (
                        <span className="font-medium text-slate-800">{dept.manager.name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/employees?department_id=${dept.id}`)}
                        className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {dept.employeeCount} Employees
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/job-positions?department_id=${dept.id}`)}
                        className="flex-1 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        {dept.jobPositionCount} Roles
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-1 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/departments/${dept.id}`)}
                      >
                        Details
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/departments/${dept.id}/edit`)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination
            currentPage={params.page}
            totalPages={totalPages}
            totalItems={totalCount}
            pageSize={params.pageSize}
            onPageChange={(page) => updateFilters({ page })}
            onPageSizeChange={(pageSize) => updateFilters({ pageSize, page: 1 })}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingDept}
        onClose={() => setDeletingDept(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Department "${deletingDept?.name}"?`}
        message={
          deletingDept?.employeeCount > 0 || deletingDept?.jobPositionCount > 0
            ? `Warning: This department currently has ${deletingDept?.employeeCount} employees and ${deletingDept?.jobPositionCount} job positions assigned. Deleting it may impact relational reporting.`
            : `Are you sure you want to delete ${deletingDept?.name}? This action cannot be undone.`
        }
        confirmText="Delete Department"
        isDanger
      />
    </div>
  );
};
