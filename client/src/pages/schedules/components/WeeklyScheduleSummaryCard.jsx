import React from 'react';
import { CalendarClock, CalendarDays, Calculator, AlertTriangle } from 'lucide-react';
import { calculateWeeklySummary } from '../../../utils/scheduleCalculator';

export const WeeklyScheduleSummaryCard = ({ days = [] }) => {
  const summary = calculateWeeklySummary(days);

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-5 text-white shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-orange-200" />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-100">
              Automatic Weekly Hours Calculation
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <h3 className="text-3xl font-black tracking-tight">{summary.totalWeeklyFormatted}</h3>
            <span className="text-xs font-medium text-orange-100 bg-orange-600/50 px-2.5 py-0.5 rounded-full border border-orange-400/40">
              Total Weekly Hours
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/20 text-center min-w-[110px]">
            <span className="text-[10px] font-bold text-orange-100 uppercase block">Working Days</span>
            <span className="text-lg font-black">{summary.workingDaysCount} Days</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/20 text-center min-w-[110px]">
            <span className="text-[10px] font-bold text-orange-100 uppercase block">Avg Daily Hours</span>
            <span className="text-lg font-black">{summary.averageDailyFormatted} / day</span>
          </div>
        </div>
      </div>

      {summary.totalWeeklyMinutes === 0 && (
        <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2 text-xs text-amber-100">
          <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
          <span>No active working days configured yet. Enable working days above to calculate schedule hours.</span>
        </div>
      )}
    </div>
  );
};
