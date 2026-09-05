import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import salaryService from '../../../services/salaryService';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Switch } from '../../../components/ui/Switch';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useToast } from '../../../components/ui/Toast';
import { ArrowLeft, Save, Layers } from 'lucide-react';

export default function SalaryStructureFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const isEdit = Boolean(id);
  const canManage = hasPermission(isEdit ? PERMISSIONS.SALARY_STRUCTURES_EDIT : PERMISSIONS.SALARY_STRUCTURES_CREATE);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      async function fetchStructure() {
        try {
          setLoading(true);
          const res = await salaryService.getSalaryStructureById(id);
          if (res.success && res.data) {
            setFormData({
              name: res.data.name || '',
              code: res.data.code || '',
              description: res.data.description || '',
              isActive: res.data.isActive ?? true,
            });
          } else {
            toast.error(res.message || 'Structure not found');
            navigate('/payroll/salary-structures');
          }
        } catch (err) {
          toast.error('Failed to load salary structure');
        } finally {
          setLoading(false);
        }
      }
      fetchStructure();
    }
  }, [id, isEdit, navigate, toast]);

  if (!canManage) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-8 text-center text-slate-500">
          You do not have permission to configure salary structures.
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6"><LoadingState message="Loading structure details..." /></div>;
  }

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Structure Name is required';
    if (!formData.code.trim()) newErrors.code = 'Structure Code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        isActive: formData.isActive,
      };

      const res = isEdit
        ? await salaryService.updateSalaryStructure(id, payload)
        : await salaryService.createSalaryStructure(payload);

      if (res.success) {
        toast.success(res.message);
        navigate(`/payroll/salary-structures/${res.data.id}`);
      } else {
        if (res.errors) {
          setErrors(res.errors);
        } else {
          toast.error(res.message || 'Operation failed');
        }
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred while saving structure');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(isEdit ? `/payroll/salary-structures/${id}` : '/payroll/salary-structures')}
          className="p-2 h-9 w-9 text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <PageHeader
          title={isEdit ? `Edit Salary Structure` : 'New Salary Structure'}
          description={isEdit ? 'Update structure properties and code' : 'Configure a new container for salary rules'}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 border border-slate-200 bg-white rounded-xl shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Basic Information</h3>
              <p className="text-xs text-slate-500">Define code identifier and status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Structure Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Regular Salary Structure"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                error={errors.name}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Structure Code <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. REG"
                value={formData.code}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                error={errors.code}
                helperText="Must be unique. Automatically converted to uppercase."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe the purpose and target employee contracts for this salary structure..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 transition-colors"
              />
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Active Status</span>
                <span className="text-xs text-slate-500">Inactive structures cannot be selected for future payruns.</span>
              </div>
              <Switch
                checked={formData.isActive}
                onChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEdit ? `/payroll/salary-structures/${id}` : '/payroll/salary-structures')}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Structure'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
