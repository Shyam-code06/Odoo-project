import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useTimeOffTypes } from '../../../hooks/useTimeOff';
import { timeOffService } from '../../../services/timeOffService';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Select } from '../../../components/ui/Select';
import { Pagination } from '../../../components/ui/Pagination';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';

export const TimeOffTypesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission(PERMISSIONS.TIME_OFF_CREATE);
  const canEdit = hasPermission(PERMISSIONS.TIME_OFF_EDIT);
  const canDelete = hasPermission(PERMISSIONS.EMPLOYEES_DELETE);

  const [params, setParams] = useState({
    search: '',
    unit: '',
    requiresAllocation: '',
    requiresApproval: '',
    isPaid: '',
    isActive: '',
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sortDirection: 'asc',
  });

  const { data, metrics, pagination, loading, error, refetch } = useTimeOffTypes(params);

  // Deletion modal state
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
      unit: '',
      requiresAllocation: '',
      requiresApproval: '',
      isPaid: '',
      isActive: '',
      page: 1,
      pageSize: 10,
      sortBy: 'name',
      sortDirection: 'asc',
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await timeOffService.deleteTimeOffType(deleteId);
      setDeleteId(null);
      setToastMessage('Time Off Type deleted successfully.');
      setTimeout(() => setToastMessage(''), 3000);
      refetch();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete Time Off Type.');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeFilterCount =
    (params.unit ? 1 : 0) +
    (params.requiresAllocation ? 1 : 0) +
    (params.requiresApproval ? 1 : 0) +
    (params.isPaid ? 1 : 0) +
    (params.isActive ? 1 : 0);

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
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Time Off Types</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Configure leave policies, entitlement requirements and approval behavior.
          </p>
        </div>
        {canCreate && (
          <Button
            leftIcon={Plus}
            onClick={() => navigate('/time-off/types/new')}
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-xs"
          >
            New Time Off Type
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Types
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{metrics.total}</p>
          <span className="text-xs text-neutral-500 mt-1 block">Configured leave policies</span>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Active Types
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{metrics.active}</p>
          <span className="text-xs text-emerald-600 font-medium mt-1 block">Available for request</span>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Allocation Required
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{metrics.allocationRequired}</p>
          <span className="text-xs text-neutral-500 mt-1 block">Requires entitlement allocation</span>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Paid Leave Types
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{metrics.paidCount}</p>
          <span className="text-xs text-neutral-500 mt-1 block">Paid employee leave</span>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:w-80">
            <SearchInput
              value={params.search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or code..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Unit */}
            <select
              value={params.unit}
              onChange={(e) => handleFilterChange('unit', e.target.value)}
              className="text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Units</option>
              <option value="days">Days</option>
              <option value="hours">Hours</option>
            </select>

            {/* Filter by Allocation Requirement */}
            <select
              value={params.requiresAllocation}
              onChange={(e) => handleFilterChange('requiresAllocation', e.target.value)}
              className="text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Allocation: All</option>
              <option value="true">Required</option>
              <option value="false">Not Required</option>
            </select>

            {/* Filter by Approval Requirement */}
            <select
              value={params.requiresApproval}
              onChange={(e) => handleFilterChange('requiresApproval', e.target.value)}
              className="text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Approval: All</option>
              <option value="true">Required</option>
              <option value="false">Not Required</option>
            </select>

            {/* Filter by Paid */}
            <select
              value={params.isPaid}
              onChange={(e) => handleFilterChange('isPaid', e.target.value)}
              className="text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Pay Policy: All</option>
              <option value="true">Paid</option>
              <option value="false">Unpaid</option>
            </select>

            {/* Filter by Status */}
            <select
              value={params.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Status: All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
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

        {/* Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-100">
            <span className="text-[11px] font-medium text-neutral-500 mr-1">Active filters:</span>
            {params.unit && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                Unit: {params.unit}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleFilterChange('unit', '')}
                />
              </span>
            )}
            {params.requiresAllocation && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                Allocation: {params.requiresAllocation === 'true' ? 'Required' : 'Not Required'}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleFilterChange('requiresAllocation', '')}
                />
              </span>
            )}
            {params.requiresApproval && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                Approval: {params.requiresApproval === 'true' ? 'Required' : 'Not Required'}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleFilterChange('requiresApproval', '')}
                />
              </span>
            )}
            {params.isPaid && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                Pay: {params.isPaid === 'true' ? 'Paid' : 'Unpaid'}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleFilterChange('isPaid', '')}
                />
              </span>
            )}
            {params.isActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                Status: {params.isActive === 'true' ? 'Active' : 'Inactive'}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleFilterChange('isActive', '')}
                />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-neutral-500 mt-2">Loading time off types...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">{error}</div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-800">No time off types found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              {params.search || activeFilterCount > 0
                ? 'No leave types match your filter criteria. Try clearing filters.'
                : 'Get started by creating your first Time Off Type configuration.'}
            </p>
            {canCreate && (
              <Button
                onClick={() => navigate('/time-off/types/new')}
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white text-xs"
              >
                Create Time Off Type
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/70 border-b border-neutral-200 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Time Off Type</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Allocation</th>
                  <th className="py-3 px-4">Approval</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs">
                {data.map((type) => (
                  <tr key={type.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-neutral-900">{type.name}</td>
                    <td className="py-3 px-4 font-mono text-neutral-600">{type.code}</td>
                    <td className="py-3 px-4 capitalize text-neutral-700">{type.unit}</td>
                    <td className="py-3 px-4">
                      {type.requiresAllocation ? (
                        <span className="inline-flex items-center text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-medium border border-blue-200">
                          Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                          Not Required
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {type.requiresApproval ? (
                        <span className="inline-flex items-center text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] font-medium border border-purple-200">
                          Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                          Not Required
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {type.isPaid ? (
                        <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {type.isActive ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-medium border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full text-[11px] font-medium border border-neutral-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => navigate(`/time-off/types/${type.id}`)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => navigate(`/time-off/types/${type.id}/edit`)}
                          className="p-1.5 text-neutral-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit Type"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => {
                            setDeleteId(type.id);
                            setDeleteError('');
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Type"
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
          title="Delete Time Off Type"
          message="Are you sure you want to delete this Time Off Type? If it is referenced by existing leave allocations or requests, it cannot be deleted."
          confirmText={isDeleting ? 'Deleting...' : 'Delete'}
          type="danger"
          error={deleteError}
        />
      )}
    </div>
  );
};
