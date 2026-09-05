import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  Edit2,
  Trash2,
  ArrowLeft,
  Users,
  Globe,
  Info,
  ChevronRight,
  Power,
  FileText,
  Clock,
  Moon,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Card } from '../../components/ui/Card';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { useWorkingScheduleDetail } from '../../hooks/useWorkingSchedules';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { PERMISSIONS } from '../../config/permissions';
import { workingScheduleService } from '../../services/workingScheduleService';
import { calculateDailyMinutes, formatMinutesToHours } from '../../utils/scheduleCalculator';

export const WorkingScheduleDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const { schedule, loading, error, refresh } = useWorkingScheduleDetail(id);

  const canEdit = hasPermission(PERMISSIONS.SCHEDULES_EDIT);
  const canDelete = hasPermission(PERMISSIONS.SCHEDULES_DELETE);

  const handleDeleteConfirm = async () => {
    try {
      await workingScheduleService.deleteWorkingSchedule(id);
      toast.success(`Schedule "${schedule.name}" deleted.`);
      navigate('/working-schedules');
    } catch (e) {
      toast.error('Failed to delete schedule.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const res = await workingScheduleService.toggleScheduleStatus(id);
      toast.success(`Schedule is now ${res.schedule.status.toLowerCase()}.`);
      refresh();
    } catch (e) {
      toast.error('Failed to update status.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 w-48 rounded-md" />
        <div className="h-44 bg-white rounded-xl border border-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white rounded-xl border border-slate-200" />
          <div className="h-64 bg-white rounded-xl border border-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center my-8">
        <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Working Schedule Not Found</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
          The requested schedule record does not exist or was removed.
        </p>
        <Button variant="outline" leftIcon={ArrowLeft} onClick={() => navigate('/working-schedules')}>
          Back to Working Schedules
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/working-schedules')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Working Schedules
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border-2 border-orange-200 text-orange-600 flex items-center justify-center shadow-2xs shrink-0">
              <CalendarClock className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{schedule.name}</h1>
                <StatusBadge status={schedule.status} />
              </div>
              <p className="text-xs font-mono text-slate-500 font-semibold flex items-center gap-1.5 mt-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Timezone: {schedule.timezone}
              </p>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                {schedule.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={Edit2}
                  onClick={() => navigate(`/working-schedules/${schedule.id}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  leftIcon={Power}
                  onClick={handleToggleStatus}
                >
                  {schedule.status === 'Active' ? 'Deactivate' : 'Activate'}
                </Button>
              </>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                size="md"
                leftIcon={Trash2}
                onClick={() => setIsDeleting(true)}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Info className="w-4 h-4 text-orange-600" />
              Schedule Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Schedule Name</span>
                <span className="font-semibold text-slate-800">{schedule.name}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Timezone</span>
                <span className="font-mono font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                  {schedule.timezone}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Status</span>
                <StatusBadge status={schedule.status} />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Created Date</span>
                <span className="text-slate-700">
                  {new Date(schedule.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Description</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed text-xs">
                  {schedule.description || 'No detailed description recorded for this schedule.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Weekly Schedule Visualization Table */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-orange-600" />
              Weekly Pattern Breakdown
            </h3>

            <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
              {/* Desktop Header */}
              <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-100 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                <div className="col-span-3">Day</div>
                <div className="col-span-2">Start</div>
                <div className="col-span-2">End</div>
                <div className="col-span-3">Break</div>
                <div className="col-span-2 text-right">Worked</div>
              </div>

              <div className="divide-y divide-slate-200/80">
                {schedule.days.map((day) => {
                  const dailyMins = calculateDailyMinutes(
                    day.startTime,
                    day.endTime,
                    day.breakMinutes,
                    day.isWorkingDay
                  );

                  return (
                    <div
                      key={day.dayOfWeek}
                      className={`p-3.5 sm:px-4 sm:py-3 text-xs flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 items-start sm:items-center ${
                        day.isWorkingDay ? 'bg-white' : 'bg-slate-50/70'
                      }`}
                    >
                      <div className="sm:col-span-3 font-bold text-slate-900 flex items-center justify-between sm:justify-start w-full">
                        <span>{day.dayOfWeek}</span>
                        {!day.isWorkingDay && (
                          <span className="sm:hidden text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                            Off Day
                          </span>
                        )}
                      </div>

                      {day.isWorkingDay ? (
                        <>
                          <div className="sm:col-span-2 font-mono text-slate-800">
                            <span className="sm:hidden text-[10px] text-slate-400 font-sans mr-1">Start:</span>
                            {day.startTime}
                          </div>
                          <div className="sm:col-span-2 font-mono text-slate-800">
                            <span className="sm:hidden text-[10px] text-slate-400 font-sans mr-1">End:</span>
                            {day.endTime}
                          </div>
                          <div className="sm:col-span-3 text-slate-600">
                            <span className="sm:hidden text-[10px] text-slate-400 font-sans mr-1">Break:</span>
                            {day.breakMinutes || 0} mins
                          </div>
                          <div className="sm:col-span-2 font-bold text-emerald-700 sm:text-right w-full flex justify-between sm:block border-t sm:border-t-0 pt-1 sm:pt-0 mt-1 sm:mt-0">
                            <span className="sm:hidden text-[10px] text-slate-400 font-sans">Total Hours:</span>
                            {formatMinutesToHours(dailyMins)}
                          </div>
                        </>
                      ) : (
                        <div className="hidden sm:col-span-9 sm:flex items-center justify-between text-slate-400 italic">
                          <span className="flex items-center gap-1.5">
                            <Moon className="w-3.5 h-3.5 text-slate-300" /> Off Day
                          </span>
                          <span className="font-mono">0h 00m</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Workforce Usage & Smart Buttons */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Workforce & Usage
            </h3>

            {/* Total Weekly Hours Badge */}
            <div className="p-4 bg-orange-500 rounded-xl text-white shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-100 block">
                Calculated Weekly Hours
              </span>
              <span className="text-3xl font-black block mt-0.5">
                {schedule.totalWeeklyFormatted}
              </span>
              <span className="text-xs text-orange-100 mt-1 block">
                {schedule.workingDaysCount} active working days ({schedule.averageDailyFormatted} / day)
              </span>
            </div>

            {/* Smart Assigned Employees Button */}
            <div
              onClick={() => navigate(`/employees?working_schedule_id=${schedule.id}`)}
              className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border border-blue-200/80 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 block leading-none">
                      {schedule.employeeCount}
                    </span>
                    <span className="text-xs font-semibold text-blue-900 mt-1 block">
                      Assigned Employees
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-blue-700 mt-3 pt-2 border-t border-blue-200/60 font-medium">
                Click to view assigned workforce directory &rarr;
              </p>
            </div>

            {/* Assigned Contracts Button */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 block leading-none">
                      {schedule.contractCount}
                    </span>
                    <span className="text-xs font-semibold text-purple-900 mt-1 block">
                      Active Contracts
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-purple-700 mt-3 pt-2 border-t border-purple-200/60 font-medium">
                Linked to employment contracts (Part 06 integration ready)
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Schedule "${schedule.name}"?`}
        message={
          schedule.employeeCount > 0
            ? `Warning: This schedule is assigned to ${schedule.employeeCount} active employees. Deleting this schedule may impact attendance tracking.`
            : `Are you sure you want to delete ${schedule.name}? This action cannot be undone.`
        }
        confirmText="Delete Schedule"
        isDanger
      />
    </div>
  );
};
