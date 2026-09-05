import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  PieChart,
  ShieldCheck,
  Building,
  Briefcase,
} from 'lucide-react';
import { useAllocation } from '../../../hooks/useTimeOff';
import { timeOffService } from '../../../services/timeOffService';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { Button } from '../../../components/ui/Button';

export const AllocationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.TIME_OFF_EDIT);
  const canApprove = hasPermission(PERMISSIONS.TIME_OFF_APPROVE);

  const { allocation, loading, error, refetch } = useAllocation(id);
  const [toastMessage, setToastMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await timeOffService.approveAllocation(id);
      setToastMessage('Allocation approved successfully.');
      setTimeout(() => setToastMessage(''), 3000);
      refetch();
    } catch (err) {
      alert(err.message || 'Failed to approve allocation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await timeOffService.rejectAllocation(id);
      setToastMessage('Allocation rejected.');
      setTimeout(() => setToastMessage(''), 3000);
      refetch();
    } catch (err) {
      alert(err.message || 'Failed to reject allocation.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-neutral-500 mt-2">Loading allocation details...</p>
      </div>
    );
  }

  if (error || !allocation) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center max-w-lg mx-auto my-8">
        <h3 className="text-lg font-semibold text-neutral-900">Allocation Record Not Found</h3>
        <p className="text-sm text-neutral-500 mt-1">
          {error || 'The requested leave allocation record could not be found.'}
        </p>
        <Button
          onClick={() => navigate('/time-off/allocations')}
          className="mt-4 bg-orange-500 text-white text-xs"
        >
          Back to Allocations
        </Button>
      </div>
    );
  }

  const isPending = allocation.status === 'pending';
  const isApproved = allocation.status === 'approved';
  const isRejected = allocation.status === 'rejected';

  let progressColor = 'bg-orange-500';
  if (allocation.usedPercentage > 85) progressColor = 'bg-red-500';
  else if (allocation.usedPercentage > 50) progressColor = 'bg-amber-500';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-950 text-emerald-100 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 border border-emerald-800 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/time-off/allocations')}
            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                {allocation.employee.name}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 font-semibold">
                {allocation.timeOffType.name}
              </span>
              {isApproved && (
                <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Approved</span>
                </span>
              )}
              {isPending && (
                <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full text-xs font-medium border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Awaiting Approval</span>
                </span>
              )}
              {isRejected && (
                <span className="inline-flex items-center space-x-1 text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-200">
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                  <span>Rejected</span>
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Leave entitlement allocation record & quota status</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isPending && canApprove && (
            <>
              <Button
                leftIcon={CheckCircle2}
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-xs"
              >
                Approve Allocation
              </Button>
              <Button
                leftIcon={XCircle}
                onClick={handleReject}
                disabled={actionLoading}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
              >
                Reject Allocation
              </Button>
            </>
          )}
          {canEdit && (
            <Button
              leftIcon={Edit2}
              onClick={() => navigate(`/time-off/allocations/${allocation.id}/edit`)}
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-xs text-xs"
            >
              Edit Allocation
            </Button>
          )}
        </div>
      </div>

      {/* Allocation Balance Visualization */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center space-x-2">
          <PieChart className="w-4 h-4 text-orange-500" />
          <span>Allocation Balance Consumption</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-neutral-50/80 rounded-xl p-4 border border-neutral-200">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Allocated Quota</span>
            <p className="text-2xl font-bold text-neutral-900 mt-1">
              {allocation.allocatedAmount} {allocation.timeOffType.unit}
            </p>
          </div>

          <div className="bg-neutral-50/80 rounded-xl p-4 border border-neutral-200">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Consumed / Used</span>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {allocation.usedAmount} {allocation.timeOffType.unit}
            </p>
          </div>

          <div className="bg-neutral-50/80 rounded-xl p-4 border border-neutral-200">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Remaining Balance</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {allocation.remainingAmount} {allocation.timeOffType.unit}
            </p>
          </div>
        </div>

        {/* Progress Bar Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-neutral-700">
              {allocation.usedAmount} of {allocation.allocatedAmount} {allocation.timeOffType.unit} used
            </span>
            <span className="font-bold text-neutral-900">{allocation.usedPercentage}%</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${allocation.usedPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee Context */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-200 pb-2 flex items-center space-x-2">
            <User className="w-4 h-4 text-orange-500" />
            <span>Employee Details</span>
          </h3>

          <div className="flex items-center space-x-3">
            {allocation.employee.avatar ? (
              <img
                src={allocation.employee.avatar}
                alt=""
                className="w-12 h-12 rounded-full object-cover border border-neutral-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-base">
                {allocation.employee.name.charAt(0)}
              </div>
            )}
            <div>
              <h4 className="font-bold text-neutral-900 text-base">{allocation.employee.name}</h4>
              <span className="font-mono text-xs text-neutral-500">
                {allocation.employee.code}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-2">
            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Department:</span>
              <span className="font-medium text-neutral-900">{allocation.employee.departmentName || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Job Position:</span>
              <span className="font-medium text-neutral-900">{allocation.employee.jobTitle || '—'}</span>
            </div>
          </div>
        </div>

        {/* Validity & Approval Information */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-200 pb-2 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            <span>Validity & Approval Status</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Time Off Type:</span>
              <span className="font-semibold text-neutral-900">{allocation.timeOffType.name}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Validity Start Date:</span>
              <span className="font-mono text-neutral-900">{allocation.startDate}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Validity End Date:</span>
              <span className="font-mono text-neutral-900">{allocation.endDate}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Approval State:</span>
              <span className="capitalize font-semibold text-neutral-900">{allocation.status}</span>
            </div>

            {isApproved && (
              <>
                <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Approved By:</span>
                  <span className="font-medium text-neutral-900">{allocation.approvedBy || 'HR Admin'}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-neutral-500">Approved At:</span>
                  <span className="font-mono text-neutral-900">
                    {allocation.approvedAt ? new Date(allocation.approvedAt).toLocaleString() : '—'}
                  </span>
                </div>
              </>
            )}

            {isPending && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 font-medium">
                Awaiting approval by HR or Line Manager before entitlement becomes active.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
