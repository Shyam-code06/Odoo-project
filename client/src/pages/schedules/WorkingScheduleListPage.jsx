import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  X,
  Users,
  CheckCircle2,
  XCircle,
  Globe,
  Power,
  FileText,
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
import { Card } from '../../components/ui/Card';
import { useWorkingSchedules } from '../../hooks/useWorkingSchedules';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { PERMISSIONS } from '../../config/permissions';
import { workingScheduleService } from '../../services/workingScheduleService';

export const WorkingScheduleListPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [togglingSchedule, setTogglingSchedule] = useState(null);

  const {
    schedules,
    summary,
    totalCount,
    totalPages,
    loading,
    error,
    params,
    updateFilters,
    clearFilters,
    refresh,
  } = useWorkingSchedules();

  const canCreate = hasPermission(PERMISSIONS.SCHEDULES_CREATE);
  const canEdit = hasPermission(PERMISSIONS.SCHEDULES_EDIT);
  const canDelete = hasPermission(PERMISSIONS.SCHEDULES_DELETE);

  const activeFilterCount = [params.status, params.timezone].filter(Boolean).length;

  const handleDeleteConfirm = async () => {
    if (!deletingSchedule) return;
    try {
      await workingScheduleService.deleteWorkingSchedule(deletingSchedule.id);
      toast.success(`Working schedule "${deletingSchedule.name}" deleted.`);
      refresh();
    } catch (e) {
      toast.error(e.message || 'Failed to delete working schedule.');
    } finally {
      setDeletingSchedule(null);
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!togglingSchedule) return;
    try {
      const res = await workingScheduleService.toggleScheduleStatus(togglingSchedule.id);
      toast.success(
        `Schedule "${res.schedule.name}" is now ${res.schedule.status.toLowerCase()}.`
      );
      refresh();
    } catch (e) {
      toast.error(e.message || 'Failed to update schedule status.');
    } finally {
      setTogglingSchedule(null);
    }
  };

  const columns = [
    {
      header: 'Schedule',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <div
              onClick={() => navigate(`/working-schedules/${row.id}`)}
              className="font-semibold text-slate-900 hover:text-orange-600 cursor-pointer transition-colors"
            >
              {row.name}
            </div>
            <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">
              {row.description || 'No description provided.'}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Timezone',
      key: 'timezone',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
          <Globe className="w-3 h-3 text-slate-400" />
          {row.timezone}
        </span>
      ),
    },
    {
      header: 'Weekly Hours',
      key: 'totalWeeklyMinutes',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-900 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-200">
            {row.totalWeeklyFormatted}
          </span>
          <span className="text-[11px] text-slate-500">
            ({row.workingDaysCount} days)
          </span>
        </div>
      ),
    },
    {
      header: 'Employees',
      key: 'employeeCount',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/employees?working_schedule_id=${row.id}`)}
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
            ariaLabel="View schedule details"
            size="sm"
            onClick={() => navigate(`/working-schedules/${row.id}`)}
          />
          {canEdit && (
            <>
              <IconButton
                icon={Edit2}
                ariaLabel="Edit working schedule"
                size="sm"
                onClick={() => navigate(`/working-schedules/${row.id}/edit`)}
              />
              <IconButton
                icon={Power}
                ariaLabel={row.status === 'Active' ? 'Deactivate schedule' : 'Activate schedule'}
                size="sm"
                variant={row.status === 'Active' ? 'outline' : 'ghost'}
                onClick={() => setTogglingSchedule(row)}
              />
            </>
          )}
          {canDelete && (
            <IconButton
              icon={Trash2}
              ariaLabel="Delete schedule"
              variant="destructive"
              size="sm"
              onClick={() => setDeletingSchedule(row)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Working Schedules"
        description="Define working patterns, hours, and attendance expectations for your organization."
        action={
          canCreate && (
            <Button
              variant="primary"
              size="md"
              leftIcon={Plus}
              onClick={() => navigate('/working-schedules/new')}
            >
              Add Working Schedule
            </Button>
          )
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 block leading-none">
              {summary.totalSchedules}
            </span>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">
              Total Schedules
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 block leading-none">
              {summary.activeSchedules}
            </span>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">
              Active Schedules
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 block leading-none">
              {summary.inactiveSchedules}
            </span>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">
              Inactive Schedules
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 block leading-none">
              {summary.totalAssignedEmployees}
            </span>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">
              Assigned Workforce
            </span>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          placeholder="Search by schedule name, description, timezone..."
          value={params.search || ''}
          onChange={(e) => updateFilters({ search: e.target.value })}
          onClear={() => updateFilters({ search: '' })}
          className="max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2.5 justify-end">
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

          {/* Timezone Filter */}
          <div className="w-44">
            <Select
              placeholder="All Timezones"
              options={[
                { value: '', label: 'All Timezones' },
                { value: 'Asia/Kolkata', label: 'Asia/Kolkata' },
                { value: 'Asia/Dubai', label: 'Asia/Dubai' },
                { value: 'Europe/London', label: 'Europe/London' },
                { value: 'America/New_York', label: 'America/New_York' },
              ]}
              value={params.timezone || ''}
              onChange={(e) => updateFilters({ timezone: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500 font-medium">Active Filters:</span>
          {params.status && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Status: {params.status}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ status: '' })} />
            </span>
          )}
          {params.timezone && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Timezone: {params.timezone}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ timezone: '' })} />
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
          data={schedules}
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
          emptyTitle="No working schedules found"
          emptyDescription="Create a working schedule to define your organization's working-time patterns."
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

      {/* Status Toggle Modal */}
      <ConfirmationDialog
        isOpen={!!togglingSchedule}
        onClose={() => setTogglingSchedule(null)}
        onConfirm={handleToggleStatusConfirm}
        title={`${togglingSchedule?.status === 'Active' ? 'Deactivate' : 'Activate'} Schedule "${togglingSchedule?.name}"?`}
        message={
          togglingSchedule?.status === 'Active' && togglingSchedule?.employeeCount > 0
            ? `Deactivating this schedule will not automatically remove existing assignments from ${togglingSchedule?.employeeCount} employees, but it will prevent new employee schedule assignments.`
            : `Are you sure you want to change status of "${togglingSchedule?.name}" to ${togglingSchedule?.status === 'Active' ? 'Inactive' : 'Active'}?`
        }
        confirmText={togglingSchedule?.status === 'Active' ? 'Deactivate' : 'Activate'}
        isDanger={togglingSchedule?.status === 'Active'}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={!!deletingSchedule}
        onClose={() => setDeletingSchedule(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Schedule "${deletingSchedule?.name}"?`}
        message={
          deletingSchedule?.employeeCount > 0
            ? `Warning: This schedule is currently assigned to ${deletingSchedule?.employeeCount} employees. Deleting it may cause attendance calculation inconsistencies.`
            : `Are you sure you want to delete ${deletingSchedule?.name}? This action cannot be undone.`
        }
        confirmText="Delete Schedule"
        isDanger
      />
    </div>
  );
};
