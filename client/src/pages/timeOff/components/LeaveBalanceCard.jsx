import React from 'react';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

export const LeaveBalanceCard = ({ balance }) => {
  if (!balance) return null;

  const { timeOffTypeName, code, unit, allocated, used, remaining } = balance;
  const isHours = unit === 'hours';

  const usedPercentage = allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 0;

  // Determine progress bar color based on remaining balance
  let progressColor = 'bg-orange-500';
  if (usedPercentage > 85) progressColor = 'bg-red-500';
  else if (usedPercentage > 50) progressColor = 'bg-amber-500';

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs hover:border-orange-200 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
            {isHours ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900 text-sm leading-tight">{timeOffTypeName}</h4>
            <span className="text-xs text-neutral-500 font-mono">{code}</span>
          </div>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 capitalize">
          {unit}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-neutral-900">{remaining}</span>
          <span className="text-xs font-medium text-neutral-500 uppercase">{unit} remaining</span>
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">
          Out of <span className="font-medium text-neutral-700">{allocated} {unit}</span> allocated
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${usedPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>{used} {unit} used</span>
          <span className="font-medium">{usedPercentage}%</span>
        </div>
      </div>
    </div>
  );
};

export const LeaveBalanceGrid = ({ balances = [], loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 animate-pulse">
            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-3"></div>
            <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4"></div>
            <div className="h-2 bg-neutral-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <div className="bg-orange-50/60 rounded-xl border border-orange-100 p-4 text-center mb-6">
        <p className="text-xs font-medium text-orange-800">
          No approved leave entitlements found. Submit an allocation request or contact your HR manager.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {balances.map((b) => (
        <LeaveBalanceCard key={b.timeOffTypeId} balance={b} />
      ))}
    </div>
  );
};
