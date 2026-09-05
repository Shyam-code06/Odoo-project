import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building2, UserCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { departmentService } from '../../services/departmentService';
import { employeeService } from '../../services/employeeService';

export const DepartmentFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    managerId: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [managerOptions, setManagerOptions] = useState([]);

  useEffect(() => {
    // Load manager options
    employeeService.getManagerOptions().then((opts) => {
      setManagerOptions(opts.map((m) => ({ value: m.id, label: m.name })));
    });

    // If edit mode, load existing department data
    if (isEditMode) {
      departmentService.getDepartmentById(id).then((dept) => {
        if (dept) {
          setFormData({
            name: dept.name,
            code: dept.code,
            description: dept.description || '',
            managerId: dept.managerId || '',
            status: dept.status || 'Active',
          });
        } else {
          toast.error('Department record not found.');
          navigate('/departments');
        }
        setLoading(false);
      });
    }
  }, [id, isEditMode, navigate, toast]);

  const handleChange = (field, value) => {
    let finalVal = value;
    if (field === 'code') {
      finalVal = value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    }
    setFormData((prev) => ({ ...prev, [field]: finalVal }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Department name is required.';
    }
    if (!formData.code || !formData.code.trim()) {
      errs.code = 'Department code is required.';
    } else if (formData.code.trim().length < 2) {
      errs.code = 'Code must be at least 2 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      if (isEditMode) {
        const res = await departmentService.updateDepartment(id, formData);
        toast.success(`Department "${res.department.name}" updated successfully.`);
        navigate(`/departments/${id}`);
      } else {
        const res = await departmentService.createDepartment(formData);
        toast.success(`Department "${res.department.name}" created successfully.`);
        navigate(`/departments/${res.department.id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save department.');
      if (err.message && err.message.toLowerCase().includes('code')) {
        setErrors((prev) => ({ ...prev, code: err.message }));
      }
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Navigation */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/departments')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Departments
        </button>
      </div>

      <PageHeader
        title={isEditMode ? `Edit Department: ${formData.name || ''}` : 'Add New Department'}
        description={
          isEditMode
            ? 'Update department details, reporting manager, and status.'
            : 'Create an organizational unit to group job positions and workforce members.'
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-600" />
            Department Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department Name */}
            <div className="md:col-span-2">
              <Input
                label="Department Name"
                required
                placeholder="e.g. Human Resources, Engineering, Operations"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
              />
            </div>

            {/* Department Code */}
            <div>
              <Input
                label="Department Code"
                required
                placeholder="e.g. HR, ENG, OPS"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                error={errors.code}
                helperText="Short uppercase identifier (e.g. HR, ENG)"
              />
            </div>

            {/* Status */}
            <div>
              <Select
                label="Status"
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              />
            </div>

            {/* Department Manager */}
            <div className="md:col-span-2">
              <Select
                label="Department Manager"
                placeholder="Select Reporting Manager"
                options={[{ value: '', label: 'None (Unassigned)' }, ...managerOptions]}
                value={formData.managerId}
                onChange={(e) => handleChange('managerId', e.target.value)}
                helperText="Employee who leads this department"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Briefly describe the function and operational scope of this department..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
              />
            </div>
          </div>
        </Card>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate(isEditMode ? `/departments/${id}` : '/departments')}
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
            {isEditMode ? 'Save Changes' : 'Create Department'}
          </Button>
        </div>
      </form>
    </div>
  );
};
