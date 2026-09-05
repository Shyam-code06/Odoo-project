import React from 'react';
import { CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';

export const RequestStatusTimeline = ({ status, createdAt, approvedAt, rejectedReason }) => {
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const isPending = status === 'pending';

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-6">
      <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
        Approval Lifecycle Timeline
      </h4>

      <div className="relative flex items-center justify-between max-w-xl mx-auto px-4">
        {/* Connecting Line */}
        <div className="absolute left-10 right-10 top-4 h-0.5 bg-neutral-200 -z-0"></div>

        {/* Step 1: Created */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-neutral-900 mt-2">Request Submitted</span>
          <span className="text-[11px] text-neutral-500 font-mono mt-0.5">
            {createdAt ? new Date(createdAt).toLocaleDateString() : 'Initial'}
          </span>
        </div>

        {/* Step 2: Pending Review */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-colors ${
              isPending
                ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                : isApproved || isRejected
                ? 'bg-emerald-500 text-white'
                : 'bg-neutral-200 text-neutral-500'
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-neutral-900 mt-2">Manager Review</span>
          <span className="text-[11px] text-neutral-500 mt-0.5">
            {isPending ? 'Under Review' : 'Reviewed'}
          </span>
        </div>

        {/* Step 3: Approved or Rejected */}
        <div className="relative z-10 flex flex-col items-center">
          {isRejected ? (
            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xs ring-4 ring-red-100">
              <XCircle className="w-4 h-4" />
            </div>
          ) : (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs ${
                isApproved
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                  : 'bg-neutral-200 text-neutral-400'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          <span className="text-xs font-semibold text-neutral-900 mt-2">
            {isRejected ? 'Request Refused' : isApproved ? 'Approved' : 'Final Decision'}
          </span>
          <span className="text-[11px] text-neutral-500 font-mono mt-0.5">
            {approvedAt ? new Date(approvedAt).toLocaleDateString() : isPending ? 'Awaiting' : ''}
          </span>
        </div>
      </div>

      {isRejected && rejectedReason && (
        <div className="mt-6 bg-red-50/80 border border-red-200 rounded-lg p-3 text-xs text-red-800">
          <span className="font-semibold">Reason for Refusal: </span>
          {rejectedReason}
        </div>
      )}
    </div>
  );
};
