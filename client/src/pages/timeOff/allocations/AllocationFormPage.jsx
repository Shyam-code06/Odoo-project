import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { timeOffService } from '../../../services/timeOffService';
import { employeeService } from '../../../services/employeeService';
import { useTimeOffTypes } from '../../../hooks/useTimeOff';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export const AllocationFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    employeeId: '',
    timeOffTypeId: '',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    allocatedAmount: 20,
    status: 'pending',
  });

  const [employees, setEmployees] = useState([]);
  const { data: timeOffTypes } = useTimeOffTypes({ isActive: true, pageSize: 100 });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await employeeService.getEmployees({ pageSize: 100 });
        setEmployees(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadEmployees();

    if (isEdit) {
      const loadAllocation = async () => {
        try {
          const res = await timeOffService.getAllocationById(id);
          const a = res.data;
          setFormData({
            employeeId: a.employeeId,
            timeOffTypeId: a.timeOffTypeId,
            startDate: a.startDate,
            endDate: a.endDate,
            allocatedAmount: a.allocatedAmount,
            status: a.status,
          });
        } catch (err) {
          setError(err.message || 'Failed to load Allocation.');
        } finally {
          setLoading(false);
        }
      };
      loadAllocation();
    }
  }, [id, isEdit]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const selectedType = timeOffTypes.find((t) => t.id === formData.timeOffTypeId);
  const unitLabel = selectedType ? selectedType.unit : 'days';

  const validateForm = () => {
    const errors = {};
    if (!formData.employeeId) {
      errors.employeeId = 'Please select an employee.';
    }
    if (!formData.timeOffTypeId) {
      errors.timeOffTypeId = 'Please select a Time Off Type.';
    }
    if (!formData.startDate) {
      errors.startDate = 'Start date is required.';
    }
    if (!formData.endDate) {
      errors.endDate = 'End date is required.';
    }
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      errors.endDate = 'End date cannot be earlier than start date.';
    }
    if (!formData.allocatedAmount || Number(formData.allocatedAmount) <= 0) {
      errors.allocatedAmount = 'Allocated amount must be greater than zero.';
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
        await timeOffService.updateAllocation(id, formData);
      } else {
        await timeOffService.createAllocation(formData);
      }
      navigate('/time-off/allocations');
    } catch (err) {
      setError(err.message || 'Failed to save allocation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-neutral-500 mt-2">Loading allocation record...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/time-off/allocations')}
          className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            {isEdit ? 'Edit Leave Allocation' : 'New Leave Allocation'}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Assign leave quota entitlements and validity periods to employees.
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
            Allocation Assignment
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Employee <span className="text-red-500">*</span>
              </label>
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
                onChange={(e) => handleChange('timeOffTypeId', e.target.value)}
                disabled={isEdit}
                className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-2 focus:ring-orange-500"
              >
                <option value="">-- Select Time Off Type --</option>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Validity Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                error={fieldErrors.startDate}
                required
              />
            </div>

            <div>
              <Input
                label="Validity End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                error={fieldErrors.endDate}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label={`Allocated Amount (${unitLabel.toUpperCase()})`}
                type="number"
                min="1"
                step="0.5"
                value={formData.allocatedAmount}
                onChange={(e) => handleChange('allocatedAmount', e.target.value)}
                error={fieldErrors.allocatedAmount}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-2 focus:ring-orange-500 capitalize"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/time-off/allocations')}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            leftIcon={Save}
            disabled={saving}
            responsive={false}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Allocation' : 'Create Allocation'}
          </Button>
        </div>
      </form>
    </div>
  );
};
