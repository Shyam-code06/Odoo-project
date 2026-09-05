import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Briefcase, Building2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { jobPositionService } from '../../services/jobPositionService';
import { departmentService } from '../../services/departmentService';

export const JobPositionFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    departmentId: '',
    description: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState([]);

  useEffect(() => {
    // Load department options
    departmentService.getDepartmentOptions().then((opts) => {
      setDepartmentOptions(opts.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })));
    });

    // If edit mode, load existing job position
    if (isEditMode) {
      jobPositionService.getJobPositionById(id).then((pos) => {
        if (pos) {
          setFormData({
            title: pos.title,
            code: pos.code,
            departmentId: pos.departmentId || '',
            description: pos.description || '',
            status: pos.status || 'Active',
          });
        } else {
          toast.error('Job position record not found.');
          navigate('/job-positions');
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
    if (!formData.title || !formData.title.trim()) {
      errs.title = 'Job position title is required.';
    }
    if (!formData.code || !formData.code.trim()) {
      errs.code = 'Position code is required.';
    } else if (formData.code.trim().length < 2) {
      errs.code = 'Code must be at least 2 characters.';
    }
    if (!formData.departmentId) {
      errs.departmentId = 'Department selection is required.';
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
        const res = await jobPositionService.updateJobPosition(id, formData);
        toast.success(`Job position "${res.jobPosition.title}" updated.`);
        navigate(`/job-positions/${id}`);
      } else {
        const res = await jobPositionService.createJobPosition(formData);
        toast.success(`Job position "${res.jobPosition.title}" created.`);
        navigate(`/job-positions/${res.jobPosition.id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save job position.');
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
          onClick={() => navigate('/job-positions')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Job Positions
        </button>
      </div>

      <PageHeader
        title={isEditMode ? `Edit Position: ${formData.title || ''}` : 'Add New Job Position'}
        description={
          isEditMode
            ? 'Update job role details, code, department allocation, and status.'
            : 'Define a specific employment role and assign it to an organizational department.'
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-600" />
            Position Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Position Title */}
            <div className="md:col-span-2">
              <Input
                label="Job Position Title"
                required
                placeholder="e.g. Senior Software Engineer, HR Operations Specialist"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                error={errors.title}
              />
            </div>

            {/* Position Code */}
            <div>
              <Input
                label="Job Position Code"
                required
                placeholder="e.g. SE, SFE, HRM"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                error={errors.code}
                helperText="Short uppercase code (e.g. SFE, BTL)"
              />
            </div>

            {/* Department Selection */}
            <div>
              <Select
                label="Department"
                required
                placeholder="Select Department"
                options={departmentOptions}
                value={formData.departmentId}
                onChange={(e) => handleChange('departmentId', e.target.value)}
                error={errors.departmentId}
                helperText="Department this job position belongs to"
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

            {/* Description */}
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Role Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Describe key responsibilities and expectations for this job position..."
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
            onClick={() => navigate(isEditMode ? `/job-positions/${id}` : '/job-positions')}
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
            {isEditMode ? 'Save Changes' : 'Create Job Position'}
          </Button>
        </div>
      </form>
    </div>
  );
};
