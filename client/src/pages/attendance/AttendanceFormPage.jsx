import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Clock, AlertTriangle, CheckSquare } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { attendanceService } from '../../services/attendanceService';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, normalizeRole } from '../../config/permissions';
import { calculateWorkedMinutes, formatMinutesToHours } from '../../utils/attendanceCalculator';

export const AttendanceFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentRole, currentUser } = useAuth();
  const isEditMode = Boolean(id);

  const isAdmin = normalizeRole(currentRole) === ROLES.ADMIN;

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Manual attendance record creation is restricted to Admin only.');
      navigate('/attendance', { replace: true });
    }
  }, [isAdmin, navigate, toast]);

  const [formData, setFormData] = useState({
    employeeId: '',
    attendanceDate: new Date().toISOString().split('T')[0],
    checkInDate: new Date().toISOString().split('T')[0],
    checkInTime: '09:30',
    checkOutDate: new Date().toISOString().split('T')[0],
    checkOutTime: '18:30',
    hasCheckOut: true,
    status: 'Present',
    correctionReason: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    // Load employee options
    employeeService.getManagerOptions().then((opts) => {
      setEmployeeOptions(opts.map((e) => ({ value: e.id, label: e.name })));
    });

    // If edit mode, load existing record
    if (isEditMode) {
      attendanceService.getAttendanceById(id).then((rec) => {
        if (rec) {
          let inDate = rec.attendanceDate;
          let inTime = '09:30';
          if (rec.checkIn) {
            const d = new Date(rec.checkIn);
            if (!isNaN(d.getTime())) {
              inDate = d.toISOString().split('T')[0];
              inTime = d.toTimeString().slice(0, 5);
            }
          }

          let outDate = rec.attendanceDate;
          let outTime = '18:30';
          let hasOut = Boolean(rec.checkOut);
          if (rec.checkOut) {
            const d = new Date(rec.checkOut);
            if (!isNaN(d.getTime())) {
              outDate = d.toISOString().split('T')[0];
              outTime = d.toTimeString().slice(0, 5);
            }
          }

          setFormData({
            employeeId: rec.employeeId,
            attendanceDate: rec.attendanceDate,
            checkInDate: inDate,
            checkInTime: inTime,
            checkOutDate: outDate,
            checkOutTime: outTime,
            hasCheckOut: hasOut,
            status: rec.status || 'Present',
            correctionReason: rec.correctionReason || '',
          });
        } else {
          toast.error('Attendance record not found.');
          navigate('/attendance');
        }
        setLoading(false);
      });
    }
  }, [id, isEditMode, navigate, toast]);

  // Check duplicate attendance when employee or date changes
  useEffect(() => {
    if (formData.employeeId && formData.attendanceDate) {
      const isDup = attendanceService.checkDuplicateAttendance(
        formData.employeeId,
        formData.attendanceDate,
        id
      );
      if (isDup) {
        setDuplicateWarning(
          `An attendance record already exists for this employee on ${formData.attendanceDate}.`
        );
      } else {
        setDuplicateWarning(null);
      }
    }
  }, [formData.employeeId, formData.attendanceDate, id]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Combine date and time strings into ISO format
  const getFullCheckInISO = () => {
    if (!formData.checkInDate || !formData.checkInTime) return null;
    return new Date(`${formData.checkInDate}T${formData.checkInTime}:00`).toISOString();
  };

  const getFullCheckOutISO = () => {
    if (!formData.hasCheckOut || !formData.checkOutDate || !formData.checkOutTime) return null;
    return new Date(`${formData.checkOutDate}T${formData.checkOutTime}:00`).toISOString();
  };

  const workedMinutes = calculateWorkedMinutes(getFullCheckInISO(), getFullCheckOutISO());
  const workedHoursDisplay = formatMinutesToHours(workedMinutes);

  const validate = () => {
    const errs = {};
    if (!formData.employeeId) {
      errs.employeeId = 'Selecting an employee is required.';
    }
    if (!formData.attendanceDate) {
      errs.attendanceDate = 'Attendance date is required.';
    }
    if (!formData.checkInTime) {
      errs.checkInTime = 'Check-in time is required.';
    }

    if (formData.hasCheckOut && formData.checkInDate && formData.checkOutDate) {
      const start = new Date(`${formData.checkInDate}T${formData.checkInTime}:00`).getTime();
      const end = new Date(`${formData.checkOutDate}T${formData.checkOutTime}:00`).getTime();
      if (end <= start) {
        errs.checkOutTime = 'Check-out time must be later than check-in time.';
      }
    }

    // In Edit / Correction mode, Correction Reason is MANDATORY
    if (isEditMode && (!formData.correctionReason || !formData.correctionReason.trim())) {
      errs.correctionReason = 'Correction reason is required for manual edits.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      const checkInISO = getFullCheckInISO();
      const checkOutISO = getFullCheckOutISO();

      const payload = {
        employeeId: formData.employeeId,
        attendanceDate: formData.attendanceDate,
        checkIn: checkInISO,
        checkOut: checkOutISO,
        workedMinutes,
        status: formData.status,
        correctionReason: formData.correctionReason,
      };

      if (isEditMode) {
        const correctedBy = currentUser?.name || 'HR Manager';
        const res = await attendanceService.correctAttendance(id, payload, correctedBy);
        toast.success('Attendance record corrected successfully.');
        navigate(`/attendance/${res.record.id}`);
      } else {
        const res = await attendanceService.createAttendance(payload);
        toast.success('Attendance record logged successfully.');
        navigate(`/attendance/${res.record.id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save attendance record.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 w-48 rounded-md" />
        <div className="h-96 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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

      <PageHeader
        title={isEditMode ? 'Manual Attendance Correction' : 'Log New Attendance Entry'}
        description={
          isEditMode
            ? 'Correct attendance timestamps and status. Manual edits require an auditable correction reason.'
            : 'Record daily employee presence, check-in, and check-out timestamps.'
        }
      />

      {/* Duplicate Warning Alert */}
      {duplicateWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1 font-medium">{duplicateWarning}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            Attendance Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Selector */}
            <div>
              <Select
                label="Employee"
                required
                disabled={isEditMode}
                placeholder="Select Employee"
                options={employeeOptions}
                value={formData.employeeId}
                onChange={(e) => handleChange('employeeId', e.target.value)}
                error={errors.employeeId}
              />
            </div>

            {/* Attendance Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attendance Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={isEditMode}
                value={formData.attendanceDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    attendanceDate: val,
                    checkInDate: val,
                    checkOutDate: val,
                  }));
                }}
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Check-In Timestamp */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Check-In Time <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e) => handleChange('checkInDate', e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <input
                  type="time"
                  value={formData.checkInTime}
                  onChange={(e) => handleChange('checkInTime', e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              {errors.checkInTime && <p className="text-[11px] text-rose-600">{errors.checkInTime}</p>}
            </div>

            {/* Check-Out Timestamp */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">Check-Out Time</label>
                <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasCheckOut}
                    onChange={(e) => handleChange('hasCheckOut', e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
                  />
                  Recorded
                </label>
              </div>

              {formData.hasCheckOut ? (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formData.checkOutDate}
                    onChange={(e) => handleChange('checkOutDate', e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <input
                    type="time"
                    value={formData.checkOutTime}
                    onChange={(e) => handleChange('checkOutTime', e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              ) : (
                <div className="p-2 text-xs text-purple-700 bg-purple-50 rounded-lg border border-purple-200 italic font-medium">
                  Check-out not recorded (Flagged as Missing Check-out exception)
                </div>
              )}
              {errors.checkOutTime && <p className="text-[11px] text-rose-600">{errors.checkOutTime}</p>}
            </div>

            {/* Calculated Worked Hours Display */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1">
                Calculated Worked Time
              </span>
              <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 font-bold text-sm">
                {workedHoursDisplay}
              </div>
            </div>

            {/* Attendance Status */}
            <div>
              <Select
                label="Attendance Status"
                options={[
                  { value: 'Present', label: 'Present' },
                  { value: 'Late', label: 'Late' },
                  { value: 'Absent', label: 'Absent' },
                ]}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Correction Audit Section (Required when editing / correcting) */}
        <Card className={`p-6 space-y-4 ${isEditMode ? 'border-blue-200 bg-blue-50/30' : ''}`}>
          <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            {isEditMode ? 'Mandatory Correction Audit' : 'Audit Information'}
          </h3>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Correction Reason {isEditMode && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              rows={3}
              placeholder={
                isEditMode
                  ? 'Describe why this attendance record is being manually modified (e.g. Employee forgot to check out, system latency override)...'
                  : 'Optional note explaining manual attendance entry...'
              }
              value={formData.correctionReason}
              onChange={(e) => handleChange('correctionReason', e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
            />
            {errors.correctionReason && (
              <p className="text-xs text-rose-600 font-medium">{errors.correctionReason}</p>
            )}
          </div>
        </Card>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate(isEditMode ? `/attendance/${id}` : '/attendance')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={Save}
            isLoading={submitting}
            disabled={submitting}
          >
            {isEditMode ? 'Save Correction' : 'Save Attendance'}
          </Button>
        </div>
      </form>
    </div>
  );
};
