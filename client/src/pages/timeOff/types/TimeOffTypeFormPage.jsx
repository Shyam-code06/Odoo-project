import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { timeOffService } from '../../../services/timeOffService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Switch } from '../../../components/ui/Switch';

export const TimeOffTypeFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    unit: 'days',
    requiresAllocation: true,
    requiresApproval: true,
    isPaid: true,
    isActive: true,
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      const loadType = async () => {
        try {
          const res = await timeOffService.getTimeOffTypeById(id);
          const t = res.data;
          setFormData({
            name: t.name,
            code: t.code,
            unit: t.unit,
            requiresAllocation: t.requiresAllocation,
            requiresApproval: t.requiresApproval,
            isPaid: t.isPaid,
            isActive: t.isActive,
          });
        } catch (err) {
          setError(err.message || 'Failed to load Time Off Type.');
        } finally {
          setLoading(false);
        }
      };
      loadType();
    }
  }, [id, isEdit]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Time Off Type name is required.';
    }
    if (!formData.code || !formData.code.trim()) {
      errors.code = 'Code is required.';
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
        await timeOffService.updateTimeOffType(id, formData);
      } else {
        await timeOffService.createTimeOffType(formData);
      }
      navigate('/time-off/types');
    } catch (err) {
      setError(err.message || 'Failed to save Time Off Type.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-neutral-500 mt-2">Loading leave policy...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/time-off/types')}
          className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            {isEdit ? 'Edit Time Off Type' : 'New Time Off Type'}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure leave policy properties, measurement unit, and entitlement workflows.
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
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-200 pb-2">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Time Off Type Name"
                placeholder="e.g. Annual Leave, Sick Leave"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={fieldErrors.name}
                required
              />
            </div>

            <div>
              <Input
                label="Code"
                placeholder="e.g. AL, SL, CL"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                error={fieldErrors.code}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Measurement Unit <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-xs text-neutral-800 cursor-pointer">
                <input
                  type="radio"
                  name="unit"
                  value="days"
                  checked={formData.unit === 'days'}
                  onChange={() => handleChange('unit', 'days')}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <span className="font-medium">Days</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-neutral-800 cursor-pointer">
                <input
                  type="radio"
                  name="unit"
                  value="hours"
                  checked={formData.unit === 'hours'}
                  onChange={() => handleChange('unit', 'hours')}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <span className="font-medium">Hours</span>
              </label>
            </div>
          </div>
        </div>

        {/* Policy Configuration */}
        <div className="space-y-4 pt-4 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-200 pb-2">
            Policy & Workflow Configuration
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <div>
                <h4 className="text-xs font-semibold text-neutral-900">Requires Allocation</h4>
                <p className="text-[11px] text-neutral-500">
                  Employees must be granted entitlement allocation before requesting leave.
                </p>
              </div>
              <Switch
                checked={formData.requiresAllocation}
                onChange={(val) => handleChange('requiresAllocation', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <div>
                <h4 className="text-xs font-semibold text-neutral-900">Requires Approval</h4>
                <p className="text-[11px] text-neutral-500">
                  Requests for this leave type require HR or manager approval.
                </p>
              </div>
              <Switch
                checked={formData.requiresApproval}
                onChange={(val) => handleChange('requiresApproval', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <div>
                <h4 className="text-xs font-semibold text-neutral-900">Paid Leave</h4>
                <p className="text-[11px] text-neutral-500">
                  Leave is paid and factored into payroll compensations.
                </p>
              </div>
              <Switch checked={formData.isPaid} onChange={(val) => handleChange('isPaid', val)} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <div>
                <h4 className="text-xs font-semibold text-neutral-900">Active Policy</h4>
                <p className="text-[11px] text-neutral-500">
                  Enable this leave policy for employee selection.
                </p>
              </div>
              <Switch checked={formData.isActive} onChange={(val) => handleChange('isActive', val)} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/time-off/types')}
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
            {saving ? 'Saving...' : isEdit ? 'Update Policy' : 'Create Policy'}
          </Button>
        </div>
      </form>
    </div>
  );
};
