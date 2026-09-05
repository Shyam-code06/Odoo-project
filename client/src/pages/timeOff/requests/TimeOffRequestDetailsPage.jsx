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
  ShieldAlert,
  MessageSquare,
} from 'lucide-react';
import { useTimeOffRequest } from '../../../hooks/useTimeOff';
import { timeOffService } from '../../../services/timeOffService';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { RequestStatusTimeline } from '../components/RequestStatusTimeline';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

export const TimeOffRequestDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const isEmployeeRole = user?.role === 'Employee';
  const canEdit = hasPermission(PERMISSIONS.TIME_OFF_EDIT);
  const canApprove = hasPermission(PERMISSIONS.TIME_OFF_APPROVE) && !isEmployeeRole;

  const { request, loading, error, refetch } = useTimeOffRequest(id);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState('');

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await timeOffService.approveTimeOffRequest(id, user);
      setToastMessage('Request approved and balance updated successfully.');
      setTimeout(() => setToastMessage(''), 3000);
      refetch();
    } catch (err) {
      alert(err.message || 'Failed to approve request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is required.');
      return;
    }
    setActionLoading(true);
    setRejectionError('');
    try {
      await timeOffService.rejectTimeOffRequest(id, user, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
      setToastMessage('Time Off request refused.');
      setTimeout(() => setToastMessage(''), 3000);
      refetch();
    } catch (err) {
      setRejectionError(err.message || 'Failed to refuse request.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-neutral-500 mt-2">Loading leave request details...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center max-w-lg mx-auto my-8">
        <h3 className="text-lg font-semibold text-neutral-900">Request Not Found</h3>
        <p className="text-sm text-neutral-500 mt-1">
          {error || 'The requested Time Off application could not be found.'}
        </p>
        <Button
          onClick={() => navigate('/time-off/requests')}
          className="mt-4 bg-orange-500 text-white text-xs"
        >
          Back to Requests
        </Button>
      </div>
    );
  }

  const isPending = request.status === 'pending';
  const isApproved = request.status === 'approved';
  const isRejected = request.status === 'rejected';

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
            onClick={() => navigate('/time-off/requests')}
            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                {request.employee.name}
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-orange-50 text-orange-700 font-semibold border border-orange-200">
                {request.timeOffType.name} ({request.duration} {request.timeOffType.unit})
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
                  <span>Pending</span>
                </span>
              )}
              {isRejected && (
                <span className="inline-flex items-center space-x-1 text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-200">
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                  <span>Refused</span>
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Leave application details & workflow state</p>
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
                Approve Request
              </Button>
              <Button
                leftIcon={XCircle}
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
              >
                Refuse Request
              </Button>
            </>
          )}
          {canEdit && (
            <Button
              leftIcon={Edit2}
              onClick={() => navigate(`/time-off/requests/${request.id}/edit`)}
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-xs text-xs"
            >
              Edit Request
            </Button>
          )}
        </div>
      </div>

      {/* Visual Lifecycle Timeline */}
      <RequestStatusTimeline
        status={request.status}
        createdAt={request.createdAt}
        approvedAt={request.approvedAt}
        rejectedReason={request.rejectedReason}
      />

      {/* Grid Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee Context */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-200 pb-2 flex items-center space-x-2">
            <User className="w-4 h-4 text-orange-500" />
            <span>Applicant Context</span>
          </h3>

          <div className="flex items-center space-x-3">
            {request.employee.avatar ? (
              <img
                src={request.employee.avatar}
                alt=""
                className="w-12 h-12 rounded-full object-cover border border-neutral-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-base">
                {request.employee.name.charAt(0)}
              </div>
            )}
            <div>
              <h4 className="font-bold text-neutral-900 text-base">{request.employee.name}</h4>
              <span className="font-mono text-xs text-neutral-500">
                {request.employee.code}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-2">
            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Department:</span>
              <span className="font-medium text-neutral-900">{request.employee.departmentName || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Job Position:</span>
              <span className="font-medium text-neutral-900">{request.employee.jobTitle || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Direct Manager:</span>
              <span className="font-medium text-neutral-900">{request.employee.managerName || '—'}</span>
            </div>
          </div>
        </div>

        {/* Request Context */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-200 pb-2 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span>Leave Details & Dates</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Time Off Type:</span>
              <span className="font-semibold text-neutral-900">{request.timeOffType.name}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Start Date:</span>
              <span className="font-mono text-neutral-900 font-semibold">{request.startDate}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">End Date:</span>
              <span className="font-mono text-neutral-900 font-semibold">{request.endDate}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Total Duration:</span>
              <span className="font-bold text-orange-600 text-sm">
                {request.duration} {request.timeOffType.unit}
              </span>
            </div>

            <div className="pt-2">
              <span className="text-neutral-500 block mb-1">Reason for Leave:</span>
              <p className="bg-neutral-50 rounded-lg p-3 text-neutral-800 border border-neutral-200 italic">
                "{request.reason || 'No reason provided.'}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation Context if Linked */}
      {request.allocation && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-200 pb-2 flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-orange-500" />
            <span>Linked Entitlement Allocation</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
              <span className="text-neutral-500 uppercase block font-semibold text-[10px]">
                Allocated Quota
              </span>
              <span className="font-bold text-neutral-900 text-base">
                {request.allocation.allocatedAmount} {request.timeOffType.unit}
              </span>
            </div>

            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
              <span className="text-neutral-500 uppercase block font-semibold text-[10px]">
                Used Amount
              </span>
              <span className="font-bold text-amber-600 text-base">
                {request.allocation.usedAmount} {request.timeOffType.unit}
              </span>
            </div>

            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
              <span className="text-neutral-500 uppercase block font-semibold text-[10px]">
                Remaining Balance
              </span>
              <span className="font-bold text-emerald-600 text-base">
                {request.allocation.remainingAmount} {request.timeOffType.unit}
              </span>
            </div>

            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
              <span className="text-neutral-500 uppercase block font-semibold text-[10px]">
                Allocation Validity
              </span>
              <span className="font-mono text-neutral-800 text-xs">
                {request.allocation.startDate} → {request.allocation.endDate}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title="Refuse Leave Request"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-neutral-600">
              Please state the reason for refusing this leave application.
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
                placeholder="State why this leave request cannot be approved..."
                className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-2 focus:ring-orange-500"
              />
              {rejectionError && (
                <p className="text-[11px] text-red-600 mt-1">{rejectionError}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-neutral-200">
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectConfirm}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white text-xs"
              >
                {actionLoading ? 'Refusing...' : 'Confirm Refusal'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
