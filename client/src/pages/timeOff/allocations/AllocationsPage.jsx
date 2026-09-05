import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  PieChart,
  X,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useAllocations, useTimeOffTypes } from '../../../hooks/useTimeOff';
import { timeOffService } from '../../../services/timeOffService';
import { employeeService } from '../../../services/employeeService';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';

export const AllocationsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeIdQuery = searchParams.get('employeeId') || '';

  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.TIME_OFF_CREATE);
  const canEdit = hasPermission(PERMISSIONS.TIME_OFF_EDIT);
  const canApprove = hasPermission(PERMISSIONS.TIME_OFF_APPROVE);
  const canDelete = hasPermission(PERMISSIONS.EMPLOYEES_DELETE);

  const [params, setParams] = useState({
    search: '',
    employeeId: employeeIdQuery,
    timeOffTypeId: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });

  // Keep employeeId query parameter updated in params
  useEffect(() => {
    if (employeeIdQuery) {
      setParams((prev) => ({ ...prev, employeeId: employeeIdQuery }));
    }
  }, [employeeIdQuery]);

  const { data, metrics, pagination, loading, error, refetch } = useAllocations(params);
  const { data: timeOffTypes } = useTimeOffTypes({ pageSize: 100 });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await employeeService.getEmployees({ pageSize: 100 });
        setEmployees(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEmployees();
  }, []);

  // Action states
  const [toastMessage, setToastMessage] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = (val) => {
    setParams((prev) => ({ ...prev, search: val, page: 1 }));
  };

  const handleFilterChange = (key, val) => {
    setParams((prev) => ({ ...prev, [key]: val, page: 1 }));
  };

  const handleClearFilters = () => {
    setParams({
      search: '',
      employeeId: '',
      timeOffTypeId: '',
      status: '',
      startDate: '',
      endDate: '',
      page: 1,
      pageSize: 10,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });
    if (employeeIdQuery) {
      navigate('/time-off/allocations');
    }
  };

  const handleApprove = async (id) => {
    try {
      await timeOffService.approveAllocation(id);
      setToastMessage('Allocation approved successfully.');
      setTimeout(() => setToastMessage(''), 3000);
      refetch();
    } catch (err) {
      alert(err.message || 'Failed to approve allocation.');
    }
  };

  const handleReject = async (id) => {
    try {
      await timeOffService.rejectAllocation(id);
      setToastMessage('Allocation rejected.');
      setTimeout(() => setToastMessage(''), 3000);
      refetch();
    } catch (err) {
      alert(err.message || 'Failed to reject allocation.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await timeOffService.deleteAllocation(deleteId);
      setDeleteId(null);
      setToastMessage('Allocation record deleted.');
      setTimeout(() => setToastMessage(''), 3000);
      refetch();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete allocation.');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeFilterCount =
    (params.employeeId ? 1 : 0) +
    (params.timeOffTypeId ? 1 : 0) +
    (params.status ? 1 : 0) +
    (params.startDate ? 1 : 0) +
    (params.endDate ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-950 text-emerald-100 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 border border-emerald-800 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Leave Allocations</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage employee leave entitlements, validity periods and balance quotas.
          </p>
        </div>
        {canCreate && (
          <Button
            leftIcon={Plus}
            onClick={() => navigate('/time-off/allocations/new')}
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-xs"
          >
            New Allocation
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Allocations
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{metrics.total}</p>
          <span className="text-xs text-neutral-500 mt-1 block">Recorded entitlements</span>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Pending Approval
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{metrics.pending}</p>
          <span className="text-xs text-amber-600 font-medium mt-1 block">Awaiting review</span>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Approved Allocations
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{metrics.approved}</p>
          <span className="text-xs text-emerald-600 font-medium mt-1 block">Active entitlements</span>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Remaining Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{metrics.totalRemaining}</p>
          <span className="text-xs text-neutral-500 mt-1 block">Available pool across employees</span>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:w-80">
            <SearchInput
              value={params.search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search employee, leave type..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Employee Filter */}
            <select
              value={params.employeeId}
              onChange={(e) => handleFilterChange('employeeId', e.target.value)}
              className="text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName || `${emp.first_name} ${emp.last_name}`} ({emp.employee_code})
                </option>
              ))}
            </select>

            {/* Leave Type Filter */}
            <select
              value={params.timeOffTypeId}
              onChange={(e) => handleFilterChange('timeOffTypeId', e.target.value)}
              className="text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Leave Types</option>
              {timeOffTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={params.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium px-2 py-1 rounded hover:bg-orange-50 flex items-center space-x-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-neutral-500 mt-2">Loading leave allocations...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">{error}</div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <PieChart className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-800">No leave allocations found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              {params.search || activeFilterCount > 0
                ? 'No allocations match your current filter parameters. Try clearing filters.'
                : 'Grant leave entitlement allocations to employees to enable leave requests.'}
            </p>
            {canCreate && (
              <Button
                onClick={() => navigate('/time-off/allocations/new')}
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white text-xs"
              >
                Create Allocation
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/70 border-b border-neutral-200 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Time Off Type</th>
                  <th className="py-3 px-4">Validity Period</th>
                  <th className="py-3 px-4">Allocated</th>
                  <th className="py-3 px-4">Used</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs">
                {data.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        {alloc.employee.avatar ? (
                          <img
                            src={alloc.employee.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-semibold text-xs">
                            {alloc.employee.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-neutral-900">{alloc.employee.name}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            {alloc.employee.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-900">{alloc.timeOffType.name}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {alloc.timeOffType.code}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">
                      {alloc.startDate} → {alloc.endDate}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      {alloc.allocatedAmount} {alloc.timeOffType.unit}
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {alloc.usedAmount} {alloc.timeOffType.unit}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      {alloc.remainingAmount} {alloc.timeOffType.unit}
                    </td>
                    <td className="py-3 px-4">
                      {alloc.status === 'approved' && (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Approved</span>
                        </span>
                      )}
                      {alloc.status === 'pending' && (
                        <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Pending</span>
                        </span>
                      )}
                      {alloc.status === 'rejected' && (
                        <span className="inline-flex items-center space-x-1 text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-red-200">
                          <XCircle className="w-3 h-3 text-red-500" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {/* Approve / Reject inline controls for Pending */}
                      {alloc.status === 'pending' && canApprove && (
                        <>
                          <button
                            onClick={() => handleApprove(alloc.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Approve Allocation"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(alloc.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject Allocation"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => navigate(`/time-off/allocations/${alloc.id}`)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => navigate(`/time-off/allocations/${alloc.id}/edit`)}
                          className="p-1.5 text-neutral-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit Allocation"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => {
                            setDeleteId(alloc.id);
                            setDeleteError('');
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Allocation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-neutral-200">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <ConfirmationDialog
          isOpen={Boolean(deleteId)}
          onClose={() => {
            setDeleteId(null);
            setDeleteError('');
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Leave Allocation"
          message="Are you sure you want to delete this allocation? Linked leave requests may prevent deletion."
          confirmText={isDeleting ? 'Deleting...' : 'Delete'}
          type="danger"
          error={deleteError}
        />
      )}
    </div>
  );
};
