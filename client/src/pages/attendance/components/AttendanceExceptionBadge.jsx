import React from 'react';
import { AlertCircle, Clock, CheckSquare, AlertTriangle } from 'lucide-react';

export const AttendanceExceptionBadge = ({ exceptions, isCorrected, correctedBy }) => {
  if (!exceptions && !isCorrected) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {exceptions?.isMissingCheckOut && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
          <AlertCircle className="w-3 h-3 text-purple-600" />
          Missing Check-out
        </span>
      )}

      {exceptions?.isLate && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Late Arrival {exceptions.lateMinutes > 0 ? `(+${exceptions.lateMinutes}m)` : ''}
        </span>
      )}

      {exceptions?.isShortDuration && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          Short Shift
        </span>
      )}

      {isCorrected && (
        <span
          title={correctedBy ? `Corrected by ${correctedBy}` : 'Manually corrected'}
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200"
        >
          <CheckSquare className="w-3 h-3 text-blue-600" />
          Corrected
        </span>
      )}
    </div>
  );
};
