import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Clock, CheckCircle2, AlertTriangle, XCircle, LogOut } from 'lucide-react';

export const AttendanceSummaryCards = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <Card className="p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xl font-black text-slate-900 block leading-none">
            {summary.totalRecords}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
            Total Records
          </span>
        </div>
      </Card>

      <Card className="p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xl font-black text-slate-900 block leading-none">
            {summary.presentCount}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
            Present
          </span>
        </div>
      </Card>

      <Card className="p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xl font-black text-slate-900 block leading-none">
            {summary.lateCount}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
            Late Arrivals
          </span>
        </div>
      </Card>

      <Card className="p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
          <XCircle className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xl font-black text-slate-900 block leading-none">
            {summary.absentCount}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
            Absent
          </span>
        </div>
      </Card>

      <Card className="p-3.5 flex items-center gap-3 col-span-2 sm:col-span-1">
        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
          <LogOut className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xl font-black text-slate-900 block leading-none">
            {summary.missingCheckOutCount}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
            Missing Check-out
          </span>
        </div>
      </Card>
    </div>
  );
};
