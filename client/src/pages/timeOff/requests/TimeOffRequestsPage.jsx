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
  Calendar,
  X,
  UserCheck,
  UserX,
  MessageSquare,
} from 'lucide-react';
import { useTimeOffRequests, useEmployeeLeaveBalances, useTimeOffTypes } from '../../../hooks/useTimeOff';
import { timeOffService } from '../../../services/timeOffService';
import { employeeService } from '../../../services/employeeService';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { LeaveBalanceGrid } from '../components/LeaveBalanceCard';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Modal } from '../../../components/ui/Modal';

export const TimeOffRequestsPage = ({ isSelfService = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeIdQuery = searchParams.get('employeeId') || '';

  const { user, hasPermission } = useAuth();

  const isEmployeeRole = user?.role === 'Employee' || isSelfService;
  const currentEmpId = isEmployeeRole ? (user?.employee_id || user?.id || '') : employeeIdQuery;

  // Only employees on their personal self-service page submit requests; hidden from admin/workforce view
  const canCreate = isSelfService;
  const canEdit = hasPermission(PERMISSIONS.TIME_OFF_EDIT);
  const canApprove = hasPermission(PERMISSIONS.TIME_OFF_APPROVE) && !isEmployeeRole;
  const canDelete = hasPermission(PERMISSIONS.EMPLOYEES_DELETE);

  const [params, setParams] = useState({
    search: '',
    employeeId: currentEmpId,
    isSelfService: isEmployeeRole,
    timeOffTypeId: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });

  useEffect(() => {
    if (currentEmpId) {
      setParams((prev) => ({ ...prev, employeeId: currentEmpId }));
    }
  }, [currentEmpId]);

  const { data, metrics, pagination, loading, error, refetch } = useTimeOffRequests(params);
  const { balances, loading: balancesLoading } = useEmployeeLeaveBalances(currentEmpId || 'emp-001');
  const { data: rawTimeOffTypes } = useTimeOffTypes({ pageSize: 100 });
  const timeOffTypes = Array.isArray(rawTimeOffTypes) ? rawTimeOffTypes : [];
  const safeData = Array.isArray(data) ? data : [];
  const safeMetrics = metrics || {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    approvedDays: 0,
    approvedHours: 0,
  };
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (!isEmployeeRole) {
      const fetchEmployees = async () => {
        try {
          const res = await employeeService.getEmployees({ pageSize: 100 });
          setEmployees(res.data || []);
        } catch (err) {
          console.error(err);
        }
      };
      fetchEmployees();
    }
  }, [isEmployeeRole]);

  // Rejection modal state
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Deletion state
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [toastMessage, setToastMessage] = useState('');

  const handleSearch = (val) => {
    setParams((prev) => ({ ...prev, search: val, page: 1 }));
  };

  const handleFilterChange = (key, val) => {
    setParams((prev) => ({ ...prev, [key]: val, page: 1 }));
  };

  const handleClearFilters = () => {
    setParams({
      search: '',
      employeeId: isEmployeeRole ? currentEmpId : '',
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
      navigate('/time-off/requests');
    }
  };

  const handleApprove = async (id) => {
    try {
      await timeOffService.approveTimeOffRequest(id, user);
      setToastMessage('Time Off request approved and balance updated.');
      setTimeout(() => setToastMessage(''), 3000);
      refetch();
    } catch (err) {
      alert(err.message || 'Failed to approve request.');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is required.');
      return;
    }
    setIsRejecting(true);
    setRejectionError('');
    try {
      await timeOffService.rejectTimeOffRequest(rejectingId, user, rejectionReason);
      setRejectingId(null);
      setRejectionReason('');
      setToastMessage('Time Off request rejected.');
      setTimeout(() => setToastMessage(''), 3000);
      refetch();
    } catch (err) {
      setRejectionError(err.message || 'Failed to reject request.');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await timeOffService.deleteTimeOffRequest(deleteId);
      setDeleteId(null);
      setToastMessage('Time Off request deleted.');
      setTimeout(() => setToastMessage(''), 3000);
      refetch();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete request.');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeFilterCount =
    (!isEmployeeRole && params.employeeId ? 1 : 0) +
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
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            {isEmployeeRole ? 'My Time Off Requests' : 'Time Off Requests'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {isEmployeeRole
              ? 'View your leave balances and submit time off applications.'
              : 'Manage employee leave applications, approval workflow and entitlement balance updates.'}
          </p>
        </div>
        {canCreate && (
          <Button
            leftIcon={Plus}
            onClick={() => navigate('/time-off/requests/new')}
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-xs"
          >
            New Time Off Request
          </Button>
        )}
      </div>

      {/* Employee Entitlement Balances Overview */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          {isEmployeeRole ? 'Your Active Leave Entitlements' : 'Leave Entitlements Overview'}
        </h3>
        <LeaveBalanceGrid balances={balances} loading={balancesLoading} />
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Requests
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{safeMetrics.total}</p>
          <span className="text-xs text-neutral-500 mt-1 block">Submitted requests</span>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Pending
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{safeMetrics.pending}</p>
          <span className="text-xs text-amber-600 font-medium mt-1 block">Awaiting review</span>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Approved
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{safeMetrics.approved}</p>
          <span className="text-xs text-emerald-600 font-medium mt-1 block">
            {safeMetrics.approvedDays} Days / {safeMetrics.approvedHours} Hours approved
          </span>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Rejected
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{safeMetrics.rejected}</p>
          <span className="text-xs text-neutral-500 mt-1 block">Refused requests</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:w-80">
            <SearchInput
              value={params.search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search employee, leave type, reason..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isEmployeeRole && (
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
            )}

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
            <p className="text-xs text-neutral-500 mt-2">Loading leave requests...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">{error}</div>
        ) : safeData.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-800">No time off requests found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              {params.search || activeFilterCount > 0
                ? 'No requests match your current search or filter criteria. Try clearing filters.'
                : 'Submit a new leave application to get started.'}
            </p>
            {canCreate && (
              <Button
                onClick={() => navigate('/time-off/requests/new')}
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white text-xs"
              >
                New Time Off Request
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
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs">
                {safeData.map((req) => (
                  <tr key={req.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        {req.employee?.avatar ? (
                          <img
                            src={req.employee.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-semibold text-xs">
                            {(req.employee?.name || 'E').charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-neutral-900">{req.employee?.name || 'Employee'}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            {req.employee?.code || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-900">{req.timeOffType?.name || 'Leave'}</div>
                      <div className="text-[11px] text-neutral-500 font-mono capitalize">
                        {req.timeOffType?.unit || 'days'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">
                      {req.startDate} → {req.endDate}
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-900">
                      {req.duration} {req.timeOffType?.unit || 'days'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-neutral-600">
                      {req.reason || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {req.status === 'approved' && (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Approved</span>
                        </span>
                      )}
                      {req.status === 'pending' && (
                        <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Pending</span>
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-flex items-center space-x-1 text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-red-200">
                          <XCircle className="w-3 h-3 text-red-500" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {req.status === 'pending' && canApprove && (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Approve Request"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(req.id);
                              setRejectionReason('');
                              setRejectionError('');
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject Request"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => navigate(`/time-off/requests/${req.id}`)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => navigate(`/time-off/requests/${req.id}/edit`)}
                          className="p-1.5 text-neutral-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit Request"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => {
                            setDeleteId(req.id);
                            setDeleteError('');
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Request"
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

      {/* Mandatory Rejection Modal */}
      {rejectingId && (
        <Modal
          isOpen={Boolean(rejectingId)}
          onClose={() => setRejectingId(null)}
          title="Refuse Time Off Request"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-neutral-600">
              Please provide a clear mandatory rejection reason for this employee leave request.
            </p>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectionError) setRejectionError('');
                }}
                placeholder="Explain why this request is refused..."
                className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-2 focus:ring-orange-500"
              />
              {rejectionError && (
                <p className="text-[11px] text-red-600 mt-1">{rejectionError}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-neutral-200">
              <Button
                variant="outline"
                onClick={() => setRejectingId(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectConfirm}
                disabled={isRejecting}
                className="bg-red-600 hover:bg-red-700 text-white text-xs"
              >
                {isRejecting ? 'Refusing...' : 'Confirm Refusal'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <ConfirmationDialog
          isOpen={Boolean(deleteId)}
          onClose={() => {
            setDeleteId(null);
            setDeleteError('');
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Time Off Request"
          message="Are you sure you want to delete this leave request? If approved, balance will be restored."
          confirmText={isDeleting ? 'Deleting...' : 'Delete'}
          type="danger"
          error={deleteError}
        />
      )}
    </div>
  );
};
