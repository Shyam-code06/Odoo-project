import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  Edit2,
  Trash2,
  ArrowLeft,
  Calendar,
  Building2,
  CalendarClock,
  AlertTriangle,
  CheckSquare,
  UserCheck,
  Hash,
  Mail,
  Info,
  LogOut,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { AttendanceExceptionBadge } from './components/AttendanceExceptionBadge';
import { useAttendanceRecord } from '../../hooks/useAttendance';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { PERMISSIONS, ROLES } from '../../config/permissions';
import { attendanceService } from '../../services/attendanceService';

export const AttendanceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentRole, hasPermission } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const { record, loading, error } = useAttendanceRecord(id);

  const isEmployeeRole = currentRole === ROLES.EMPLOYEE;
  const canEdit = hasPermission(PERMISSIONS.ATTENDANCE_EDIT) && !isEmployeeRole;
  const canDelete = hasPermission(PERMISSIONS.EMPLOYEES_DELETE) && !isEmployeeRole;

  const handleDeleteConfirm = async () => {
    try {
      await attendanceService.deleteAttendance(id);
      toast.success('Attendance record deleted.');
      navigate('/attendance');
    } catch (e) {
      toast.error('Failed to delete attendance record.');
    } finally {
      setIsDeleting(false);
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

  if (error || !record) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center my-8">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Attendance Record Not Found</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
          The requested attendance entry does not exist or was removed.
        </p>
        <Button variant="outline" leftIcon={ArrowLeft} onClick={() => navigate('/attendance')}>
          Back to Attendance
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
          onClick={() => navigate('/attendance')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Attendance
        </button>
      </div>

      {/* Main Profile Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={record.employee?.avatar}
              name={record.employee?.name || 'Employee'}
              size="xl"
            />
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">
                  {record.employee?.name || 'Employee Attendance'}
                </h1>
                <StatusBadge status={record.status} />
              </div>
              <p className="text-xs font-mono text-slate-500 font-semibold mt-0.5">
                {record.employee?.code} • {record.employee?.departmentName} • {record.employee?.jobPositionTitle}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Date: {record.attendanceDateFormatted}
                </span>
                <AttendanceExceptionBadge
                  exceptions={record.exceptions}
                  isCorrected={record.isCorrected}
                  correctedBy={record.correctedBy}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            {canEdit && (
              <Button
                variant="outline"
                size="md"
                leftIcon={Edit2}
                onClick={() => navigate(`/attendance/${record.id}/edit`)}
              >
                Correct Record
              </Button>
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

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Attendance Information & Exception Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance Information */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Info className="w-4 h-4 text-orange-600" />
              Attendance Record Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Employee</span>
                <span
                  onClick={() => navigate(`/employees/${record.employeeId}`)}
                  className="font-semibold text-slate-900 hover:text-orange-600 cursor-pointer transition-colors"
                >
                  {record.employee?.name}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Attendance Date</span>
                <span className="font-semibold text-slate-800">{record.attendanceDateFormatted}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Check-In Time</span>
                <span className="font-mono font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                  {record.checkInFormatted}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Check-Out Time</span>
                <span className="font-mono font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                  {record.checkOutFormatted}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Calculated Worked Time</span>
                <span className="font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                  {record.workedHoursFormatted}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Attendance Status</span>
                <StatusBadge status={record.status} />
              </div>
            </div>
          </Card>

          {/* Exception Panel */}
          {(record.exceptions?.isMissingCheckOut || record.exceptions?.isLate || record.exceptions?.isShortDuration) && (
            <Card className="p-6 border-amber-200 bg-amber-50/50 space-y-3">
              <h3 className="text-base font-bold text-amber-900 flex items-center gap-2 pb-2 border-b border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Attendance Exceptions Detected
              </h3>

              <ul className="space-y-2 text-xs text-amber-800">
                {record.exceptions?.isMissingCheckOut && (
                  <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-amber-200">
                    <LogOut className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Missing Check-out Timestamp</span>
                      <span>The employee checked in but no check-out time was recorded. Authorized manual correction may be required.</span>
                    </div>
                  </li>
                )}
                {record.exceptions?.isLate && (
                  <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-amber-200">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Late Arrival</span>
                      <span>
                        Check-in time ({record.checkInFormatted}) was {record.exceptions.lateMinutes} minutes past scheduled shift start.
                      </span>
                    </div>
                  </li>
                )}
                {record.exceptions?.isShortDuration && (
                  <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Short Shift Duration</span>
                      <span>Recorded worked duration ({record.workedHoursFormatted}) is below 4 hours.</span>
                    </div>
                  </li>
                )}
              </ul>
            </Card>
          )}

          {/* Correction History & Audit */}
          {record.isCorrected && (
            <Card className="p-6 border-blue-200 bg-blue-50/50 space-y-3">
              <h3 className="text-base font-bold text-blue-900 flex items-center gap-2 pb-2 border-b border-blue-200">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                Manual Correction Audit History
              </h3>

              <div className="space-y-2 text-xs text-blue-900">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/80 p-3 rounded-lg border border-blue-200">
                  <div>
                    <span className="text-slate-400 block font-medium">Corrected By</span>
                    <span className="font-bold text-slate-800">{record.correctedBy || 'Authorized HR User'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Corrected On</span>
                    <span className="text-slate-800">
                      {new Date(record.correctedAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block font-medium mb-0.5">Correction Reason</span>
                    <p className="text-slate-800 font-medium italic bg-slate-50 p-2.5 rounded border border-slate-200">
                      "{record.correctionReason}"
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Schedule & Employee Context */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Workplace Context
            </h3>

            {/* Working Schedule Info */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">Assigned Schedule</span>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <CalendarClock className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="font-bold text-slate-800 text-xs">
                    {record.employee?.workingScheduleName || 'Standard Full Time'}
                  </span>
                </div>
                {record.employee?.workingScheduleId && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="mt-2 text-orange-600"
                    onClick={() => navigate(`/working-schedules/${record.employee.workingScheduleId}`)}
                  >
                    View Schedule Details &rarr;
                  </Button>
                )}
              </div>
            </div>

            {/* Department Info */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-400 block">Department & Role</span>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {record.employee?.departmentName}
                </div>
                <div className="text-slate-500">Role: {record.employee?.jobPositionTitle}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Attendance Record?"
        message={`Are you sure you want to delete this attendance record for ${record.employee?.name} on ${record.attendanceDateFormatted}?`}
        confirmText="Delete Record"
        isDanger
      />
    </div>
  );
};
