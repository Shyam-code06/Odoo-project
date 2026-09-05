import React from 'react';
import { Clock, Coffee, AlertCircle, CheckCircle2, Moon } from 'lucide-react';
import {
  calculateDailyMinutes,
  formatMinutesToHours,
  validateDaySchedule,
} from '../../../utils/scheduleCalculator';

export const WeeklyScheduleBuilder = ({ days, onChange }) => {
  const handleToggleWorkingDay = (index, isWorkingDay) => {
    const updated = [...days];
    updated[index] = {
      ...updated[index],
      isWorkingDay,
    };
    onChange(updated);
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...days];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            Weekly Schedule Configuration
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure working hours, start/end times, and break durations for each day of the week.
          </p>
        </div>
      </div>

      {/* Days Table Container */}
      <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-100 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
          <div className="col-span-3">Day of Week</div>
          <div className="col-span-2">Start Time</div>
          <div className="col-span-2">End Time</div>
          <div className="col-span-3">Break (Minutes)</div>
          <div className="col-span-2 text-right">Daily Hours</div>
        </div>

        {/* Day Rows */}
        <div className="divide-y divide-slate-200/80">
          {days.map((day, idx) => {
            const dailyMins = calculateDailyMinutes(
              day.startTime,
              day.endTime,
              day.breakMinutes,
              day.isWorkingDay
            );
            const validationError = validateDaySchedule(
              day.startTime,
              day.endTime,
              day.breakMinutes,
              day.isWorkingDay
            );

            return (
              <div
                key={day.dayOfWeek}
                className={`p-4 md:px-4 md:py-3 transition-colors ${
                  day.isWorkingDay ? 'bg-white' : 'bg-slate-50/80'
                }`}
              >
                {/* Mobile & Desktop Flexible Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Day Name & Toggle */}
                  <div className="md:col-span-3 flex items-center justify-between md:justify-start gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(day.isWorkingDay)}
                        onChange={(e) => handleToggleWorkingDay(idx, e.target.checked)}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                      />
                      <span
                        className={`text-sm font-bold ${
                          day.isWorkingDay ? 'text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        {day.dayOfWeek}
                      </span>
                    </label>

                    {!day.isWorkingDay && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 flex items-center gap-1 md:hidden">
                        <Moon className="w-3 h-3" /> Off Day
                      </span>
                    )}
                  </div>

                  {/* Config Inputs if Working Day */}
                  {day.isWorkingDay ? (
                    <>
                      {/* Start Time */}
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 md:hidden mb-1 uppercase">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={day.startTime || '09:00'}
                          onChange={(e) => handleFieldChange(idx, 'startTime', e.target.value)}
                          className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>

                      {/* End Time */}
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 md:hidden mb-1 uppercase">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={day.endTime || '18:00'}
                          onChange={(e) => handleFieldChange(idx, 'endTime', e.target.value)}
                          className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>

                      {/* Break Minutes */}
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 md:hidden mb-1 uppercase">
                          Break (Mins)
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min="0"
                            max="240"
                            step="5"
                            value={day.breakMinutes !== undefined ? day.breakMinutes : 60}
                            onChange={(e) =>
                              handleFieldChange(idx, 'breakMinutes', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg pl-2.5 pr-14 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          />
                          <span className="absolute right-2 text-[10px] font-semibold text-slate-400 pointer-events-none">
                            mins
                          </span>
                        </div>
                      </div>

                      {/* Calculated Daily Hours Badge */}
                      <div className="md:col-span-2 text-left md:text-right flex items-center justify-between md:justify-end">
                        <span className="text-[10px] font-bold text-slate-500 md:hidden uppercase">
                          Daily Hours
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                            validationError
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {validationError ? (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          {validationError ? 'Invalid' : formatMinutesToHours(dailyMins)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="hidden md:col-span-9 md:flex items-center justify-between text-xs text-slate-400 font-medium italic">
                      <span className="flex items-center gap-1.5">
                        <Moon className="w-4 h-4 text-slate-300" />
                        Off day (No working hours scheduled)
                      </span>
                      <span className="font-mono text-slate-400">0h 00m</span>
                    </div>
                  )}
                </div>

                {/* Validation Error Message Row */}
                {validationError && (
                  <div className="mt-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
