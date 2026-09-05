import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  X,
  Building2,
  CalendarClock,
  UserCheck,
  Calendar,
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
import { Input } from '../../components/ui/Input';
import { AttendanceSummaryCards } from './components/AttendanceSummaryCards';
import { AttendanceExceptionBadge } from './components/AttendanceExceptionBadge';
import { useAttendance } from '../../hooks/useAttendance';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { PERMISSIONS, ROLES, normalizeRole } from '../../config/permissions';
import { attendanceService } from '../../services/attendanceService';
import { employeeService } from '../../services/employeeService';
import { departmentService } from '../../services/departmentService';
import { workingScheduleService } from '../../services/workingScheduleService';

export const AttendanceListPage = ({ isSelfService = false }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentRole, hasPermission } = useAuth();
  const [deletingRecord, setDeletingRecord] = useState(null);

  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [scheduleOptions, setScheduleOptions] = useState([]);

  const {
    records,
    summary,
    totalCount,
    totalPages,
    loading,
    error,
    params,
    isEmployeeRole,
    updateFilters,
    clearFilters,
    refresh,
  } = useAttendance({ isSelfService });

  const isAdmin = normalizeRole(currentRole) === ROLES.ADMIN;

  // Add Attendance is strictly restricted to Admin only, and never allowed on personal My Attendance
  const canCreate = isAdmin && !isSelfService && !isEmployeeRole;
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  useEffect(() => {
    if (typeof employeeService?.getManagerOptions === 'function') {
      employeeService
        .getManagerOptions()
        .then((opts) => {
          if (Array.isArray(opts)) {
            setEmployeeOptions(opts.map((e) => ({ value: e.id, label: e.name })));
          }
        })
        .catch(() => {});
    }
    if (typeof departmentService?.getDepartmentOptions === 'function') {
      departmentService
        .getDepartmentOptions()
        .then((opts) => {
          if (Array.isArray(opts)) {
            setDepartmentOptions(opts.map((d) => ({ value: d.id, label: d.name })));
          }
        })
        .catch(() => {});
    }
    if (typeof workingScheduleService?.getScheduleOptions === 'function') {
      workingScheduleService
        .getScheduleOptions()
        .then((opts) => {
          if (Array.isArray(opts)) {
            setScheduleOptions(opts.map((s) => ({ value: s.id, label: s.name })));
          }
        })
        .catch(() => {});
    }
  }, []);

  const activeFilterCount = [
    params.employeeId,
    params.departmentId,
    params.workingScheduleId,
    params.status,
    params.date,
  ].filter(Boolean).length;

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    try {
      await attendanceService.deleteAttendance(deletingRecord.id);
      toast.success('Attendance record deleted successfully.');
      refresh();
    } catch (e) {
      toast.error('Failed to delete attendance record.');
    } finally {
      setDeletingRecord(null);
    }
  };

  const columns = [
    {
      header: 'Employee',
      key: 'employeeName',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={row.employee?.avatar}
            name={row.employee?.name || 'Employee'}
            size="md"
          />
          <div>
            <div
              onClick={() => navigate(`/employees/${row.employeeId}`)}
              className="font-semibold text-slate-900 hover:text-orange-600 cursor-pointer transition-colors"
            >
              {row.employee?.name || 'Unassigned'}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {row.employee?.code} • {row.employee?.departmentName}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Date',
      key: 'attendanceDate',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {row.attendanceDateFormatted}
        </div>
      ),
    },
    {
      header: 'Check In',
      key: 'checkIn',
      sortable: true,
      render: (row) => (
        <span
          className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
            row.checkIn ? 'bg-slate-100 text-slate-800' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {row.checkInFormatted}
        </span>
      ),
    },
    {
      header: 'Check Out',
      key: 'checkOut',
      sortable: true,
      render: (row) => (
        <span
          className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
            row.checkOut
              ? 'bg-slate-100 text-slate-800'
              : 'bg-purple-50 text-purple-700 border border-purple-200'
          }`}
        >
          {row.checkOutFormatted}
        </span>
      ),
    },
    {
      header: 'Worked Hours',
      key: 'workedMinutes',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-xs text-slate-900 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-200">
          {row.workedHoursFormatted}
        </span>
      ),
    },
    {
      header: 'Status & Exception',
      key: 'status',
      sortable: true,
      render: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} />
          <AttendanceExceptionBadge
            exceptions={row.exceptions}
            isCorrected={row.isCorrected}
            correctedBy={row.correctedBy}
          />
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Eye}
            ariaLabel="View attendance detail"
            size="sm"
            onClick={() => navigate(`/attendance/${row.id}`)}
          />
          {canEdit && !isEmployeeRole && (
            <IconButton
              icon={Edit2}
              ariaLabel="Correct attendance"
              size="sm"
              onClick={() => navigate(`/attendance/${row.id}/edit`)}
            />
          )}
          {canDelete && !isEmployeeRole && (
            <IconButton
              icon={Trash2}
              ariaLabel="Delete record"
              variant="destructive"
              size="sm"
              onClick={() => setDeletingRecord(row)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployeeRole ? 'My Attendance History' : 'Attendance Management'}
        description={
          isEmployeeRole
            ? 'View your personal daily check-in, check-out logs and working hours.'
            : 'Track workforce presence, working hours, and auditable manual attendance corrections.'
        }
        action={
          canCreate && (
            <Button
              variant="primary"
              size="md"
              leftIcon={Plus}
              onClick={() => navigate('/attendance/new')}
            >
              Add Attendance
            </Button>
          )
        }
      />

      {/* Summary Cards Widget */}
      <AttendanceSummaryCards summary={summary || {}} />

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          placeholder="Search by employee name or code..."
          value={params.search || ''}
          onChange={(e) => updateFilters({ search: e.target.value })}
          onClear={() => updateFilters({ search: '' })}
          className="max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2.5 justify-end">
          {/* Employee Filter (Admin/HR only) */}
          {!isEmployeeRole && (
            <div className="w-44">
              <Select
                placeholder="All Employees"
                options={[{ value: '', label: 'All Employees' }, ...employeeOptions]}
                value={params.employeeId || ''}
                onChange={(e) => updateFilters({ employeeId: e.target.value })}
              />
            </div>
          )}

          {/* Department Filter */}
          <div className="w-40">
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
                { value: 'Present', label: 'Present' },
                { value: 'Late', label: 'Late' },
                { value: 'Absent', label: 'Absent' },
              ]}
              value={params.status || ''}
              onChange={(e) => updateFilters({ status: e.target.value })}
            />
          </div>

          {/* Specific Date Filter */}
          <div className="w-36">
            <input
              type="date"
              value={params.date || ''}
              onChange={(e) => updateFilters({ date: e.target.value })}
              className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500 font-medium">Active Filters:</span>
          {params.employeeId && !isEmployeeRole && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Employee Filter
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ employeeId: '' })} />
            </span>
          )}
          {params.departmentId && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Department Filter
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ departmentId: '' })} />
            </span>
          )}
          {params.status && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Status: {params.status}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ status: '' })} />
            </span>
          )}
          {params.date && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Date: {params.date}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ date: '' })} />
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

      {/* Primary Table */}
      <div>
        <Table
          columns={columns}
          data={records || []}
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
          emptyTitle="No attendance records found"
          emptyDescription="Attendance records will appear here once employee check-in or daily logs are submitted."
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

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingRecord}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Attendance Record?"
        message={`Are you sure you want to delete the attendance log for ${deletingRecord?.employee?.name} on ${deletingRecord?.attendanceDateFormatted}?`}
        confirmText="Delete Record"
        isDanger
      />
    </div>
  );
};
