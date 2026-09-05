import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CalendarClock, Globe } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { WeeklyScheduleBuilder } from './components/WeeklyScheduleBuilder';
import { WeeklyScheduleSummaryCard } from './components/WeeklyScheduleSummaryCard';
import { workingScheduleService } from '../../services/workingScheduleService';
import { DEFAULT_WEEKDAYS, validateDaySchedule } from '../../utils/scheduleCalculator';

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8:00)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

export const WorkingScheduleFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    timezone: 'Asia/Kolkata',
    status: 'Active',
    days: DEFAULT_WEEKDAYS,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      workingScheduleService.getWorkingScheduleById(id).then((sched) => {
        if (sched) {
          setFormData({
            name: sched.name,
            description: sched.description || '',
            timezone: sched.timezone || 'Asia/Kolkata',
            status: sched.status || 'Active',
            days: Array.isArray(sched.days) && sched.days.length > 0 ? sched.days : DEFAULT_WEEKDAYS,
          });
        } else {
          toast.error('Working schedule record not found.');
          navigate('/working-schedules');
        }
        setLoading(false);
      });
    }
  }, [id, isEditMode, navigate, toast]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Schedule name is required.';
    }
    if (!formData.timezone) {
      errs.timezone = 'Timezone is required.';
    }

    // Validate individual day schedules
    for (const day of formData.days) {
      const dayErr = validateDaySchedule(day.startTime, day.endTime, day.breakMinutes, day.isWorkingDay);
      if (dayErr) {
        errs.days = `${day.dayOfWeek}: ${dayErr}`;
        break;
      }
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
        const res = await workingScheduleService.updateWorkingSchedule(id, formData);
        toast.success(`Schedule "${res.schedule.name}" updated successfully.`);
        navigate(`/working-schedules/${id}`);
      } else {
        const res = await workingScheduleService.createWorkingSchedule(formData);
        toast.success(`Schedule "${res.schedule.name}" created successfully.`);
        navigate(`/working-schedules/${res.schedule.id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save working schedule.');
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

      <PageHeader
        title={isEditMode ? `Edit Schedule: ${formData.name || ''}` : 'Add New Working Schedule'}
        description={
          isEditMode
            ? 'Update schedule name, timezone, working-day shifts, and break times.'
            : 'Configure a working-time pattern to standardize attendance and payroll expectations.'
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Live Hours Summary Header Card */}
        <WeeklyScheduleSummaryCard days={formData.days} />

        {/* General Schedule Information Card */}
        <Card className="p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-orange-600" />
            General Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Schedule Name */}
            <div className="md:col-span-2">
              <Input
                label="Schedule Name"
                required
                placeholder="e.g. Standard Full Time (Mon-Fri 09:30 - 18:30)"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
              />
            </div>

            {/* Timezone Selection */}
            <div>
              <Select
                label="Timezone"
                required
                options={TIMEZONE_OPTIONS}
                value={formData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                error={errors.timezone}
                helperText="Primary timezone for shift calculations"
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
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Briefly describe the shift pattern, eligible departments, or working conditions..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
              />
            </div>
          </div>
        </Card>

        {/* 7-Day Pattern Builder */}
        <Card className="p-6">
          <WeeklyScheduleBuilder
            days={formData.days}
            onChange={(updatedDays) => handleChange('days', updatedDays)}
          />

          {errors.days && (
            <p className="text-xs text-rose-600 font-semibold mt-3 p-2 bg-rose-50 rounded-lg border border-rose-200">
              {errors.days}
            </p>
          )}
        </Card>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate(isEditMode ? `/working-schedules/${id}` : '/working-schedules')}
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
            {isEditMode ? 'Save Schedule Changes' : 'Create Working Schedule'}
          </Button>
        </div>
      </form>
    </div>
  );
};
