import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { timeOffService } from '../../../services/timeOffService';
import { employeeService } from '../../../services/employeeService';
import { useTimeOffTypes, useAllocations } from '../../../hooks/useTimeOff';
import { useAuth } from '../../../contexts/AuthContext';
import {
  calculateRequestDuration,
  getEligibleAllocations,
  calculateRemainingBalance,
} from '../../../utils/timeOffCalculator';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export const TimeOffRequestFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const isEmployeeRole = user?.role === 'Employee';
  const defaultEmpId = isEmployeeRole ? (user?.employeeId || 'emp-001') : '';

  const [formData, setFormData] = useState({
    employeeId: defaultEmpId,
    timeOffTypeId: '',
    allocationId: '',
    startDate: '',
    endDate: '',
    customHours: '',
    reason: '',
  });

  const [employees, setEmployees] = useState([]);
  const { data: timeOffTypes } = useTimeOffTypes({ isActive: true, pageSize: 100 });
  const { data: allAllocations } = useAllocations({ status: 'approved', pageSize: 200 });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEmployeeRole) {
      const loadEmployees = async () => {
        try {
          const res = await employeeService.getEmployees({ pageSize: 100 });
          setEmployees(res.data || []);
        } catch (err) {
          console.error(err);
        }
      };
      loadEmployees();
    }

    if (isEdit) {
      const loadRequest = async () => {
        try {
          const res = await timeOffService.getTimeOffRequestById(id);
          const r = res.data;
          setFormData({
            employeeId: r.employeeId,
            timeOffTypeId: r.timeOffTypeId,
            allocationId: r.allocationId || '',
            startDate: r.startDate,
            endDate: r.endDate,
            customHours: r.timeOffType.unit === 'hours' ? r.duration : '',
            reason: r.reason,
          });
        } catch (err) {
          setError(err.message || 'Failed to load Request.');
        } finally {
          setLoading(false);
        }
      };
      loadRequest();
    }
  }, [id, isEdit, isEmployeeRole]);

  // Derived selected type & duration
  const selectedType = timeOffTypes.find((t) => t.id === formData.timeOffTypeId);
  const unitLabel = selectedType ? selectedType.unit : 'days';

  const duration = calculateRequestDuration(
    formData.startDate,
    formData.endDate,
    unitLabel,
    formData.customHours ? Number(formData.customHours) : null
  );

  // Eligible allocations calculation
  const eligibleAllocations = getEligibleAllocations(
    formData.employeeId,
    formData.timeOffTypeId,
    formData.startDate,
    formData.endDate,
    allAllocations
  );

  // Auto-select first eligible allocation when type or dates change
  useEffect(() => {
    if (selectedType?.requiresAllocation && eligibleAllocations.length > 0 && !formData.allocationId) {
      setFormData((prev) => ({ ...prev, allocationId: eligibleAllocations[0].id }));
    }
  }, [selectedType, eligibleAllocations.length, formData.allocationId]);

  const selectedAllocation = allAllocations.find((a) => a.id === formData.allocationId);
  const remainingBalance = selectedAllocation ? selectedAllocation.remainingAmount : 0;
  const isInsufficient = selectedType?.requiresAllocation && duration > remainingBalance;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.employeeId) {
      errors.employeeId = 'Please select an employee.';
    }
    if (!formData.timeOffTypeId) {
      errors.timeOffTypeId = 'Please select a Time Off Type.';
    }
    if (!formData.startDate) {
      errors.startDate = 'Start Date is required.';
    }
    if (!formData.endDate) {
      errors.endDate = 'End Date is required.';
    }
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      errors.endDate = 'End Date cannot be earlier than Start Date.';
    }
    if (duration <= 0) {
      errors.startDate = 'Invalid date range duration.';
    }
    if (selectedType?.requiresAllocation) {
      if (!formData.allocationId) {
        errors.allocationId = 'An active approved allocation is required for this leave type.';
      } else if (isInsufficient) {
        errors.allocationId = `Insufficient leave balance for this request. Requested: ${duration} ${unitLabel}, Remaining: ${remainingBalance} ${unitLabel}`;
      }
    }
    if (!formData.reason || !formData.reason.trim()) {
      errors.reason = 'Please state a reason for this leave request.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await timeOffService.updateTimeOffRequest(id, formData);
      } else {
        await timeOffService.createTimeOffRequest(formData);
      }
      navigate('/time-off/requests');
    } catch (err) {
      setError(err.message || 'Failed to submit Time Off request.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-neutral-500 mt-2">Loading leave request...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/time-off/requests')}
          className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            {isEdit ? 'Edit Time Off Request' : 'New Time Off Request'}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Submit a leave application with entitlement balance validation.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-200 pb-2">
            Leave Application Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Employee <span className="text-red-500">*</span>
              </label>
              {isEmployeeRole ? (
                <div className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50 text-neutral-900 font-semibold">
                  {user?.name || 'Authenticated Employee'} ({user?.employeeCode || 'EMP'})
                </div>
              ) : (
                <select
                  value={formData.employeeId}
                  onChange={(e) => handleChange('employeeId', e.target.value)}
                  disabled={isEdit}
                  className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName || `${emp.first_name} ${emp.last_name}`} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              )}
              {fieldErrors.employeeId && (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.employeeId}</p>
              )}
            </div>

            {/* Time Off Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Time Off Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.timeOffTypeId}
                onChange={(e) => {
                  handleChange('timeOffTypeId', e.target.value);
                  handleChange('allocationId', '');
                }}
                disabled={isEdit}
                className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-2 focus:ring-orange-500"
              >
                <option value="">-- Select Leave Type --</option>
                {timeOffTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code}) — [{t.unit}]
                  </option>
                ))}
              </select>
              {fieldErrors.timeOffTypeId && (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.timeOffTypeId}</p>
              )}
            </div>
          </div>

          {/* Dates & Calculated Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                error={fieldErrors.startDate}
                required
              />
            </div>

            <div>
              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                error={fieldErrors.endDate}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Calculated Duration
              </label>
              <div className="w-full border border-orange-200 rounded-lg p-2.5 bg-orange-50/70 text-orange-900 font-bold text-xs flex items-center justify-between">
                <span>{duration}</span>
                <span className="uppercase text-[10px] bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded">
                  {unitLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Allocation Selection & Balance Validation Box */}
          {selectedType?.requiresAllocation && (
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-neutral-700">
                Linked Entitlement Allocation <span className="text-red-500">*</span>
              </label>

              {eligibleAllocations.length === 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">No valid allocation found! </span>
                    You do not have an approved, non-expired entitlement allocation with available balance for this leave type. Please request an allocation first.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={formData.allocationId}
                    onChange={(e) => handleChange('allocationId', e.target.value)}
                    className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-2 focus:ring-orange-500"
                  >
                    {eligibleAllocations.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.timeOffType.name} — ({a.remainingAmount} {a.timeOffType.unit} remaining, Valid: {a.startDate} to {a.endDate})
                      </option>
                    ))}
                  </select>

                  {selectedAllocation && (
                    <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-neutral-900 block">
                          Allocation Quota: {selectedAllocation.allocatedAmount} {unitLabel}
                        </span>
                        <span className="text-neutral-500">
                          {selectedAllocation.usedAmount} used · {selectedAllocation.remainingAmount} remaining
                        </span>
                      </div>
                      <span className="font-mono text-neutral-500 text-[11px]">
                        Valid till {selectedAllocation.endDate}
                      </span>
                    </div>
                  )}

                  {isInsufficient && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>
                        Insufficient leave balance for this request. Requested: {duration} {unitLabel}, Remaining: {remainingBalance} {unitLabel}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {fieldErrors.allocationId && (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.allocationId}</p>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Reason for Leave <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              placeholder="State the purpose of your leave request..."
              className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-2 focus:ring-orange-500"
            />
            {fieldErrors.reason && (
              <p className="text-[11px] text-red-600 mt-1">{fieldErrors.reason}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/time-off/requests')}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            leftIcon={Save}
            disabled={saving || (selectedType?.requiresAllocation && isInsufficient)}
            responsive={false}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
          >
            {saving ? 'Submitting...' : isEdit ? 'Update Request' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  );
};
