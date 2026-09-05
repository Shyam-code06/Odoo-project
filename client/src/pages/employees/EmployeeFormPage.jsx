import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, UserPlus, UserCheck, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { LoadingState } from '../../components/ui/LoadingState';
import { useToast } from '../../components/ui/Toast';
import { employeeService } from '../../services/employeeService';

export const EmployeeFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const isEditMode = Boolean(id);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    employee_code: '',
    department_id: '',
    job_position_id: '',
    manager_id: '',
    joining_date: new Date().toISOString().split('T')[0],
    employment_status: 'Active',
    working_schedule_id: 'sched-001',
    avatar: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  // Dropdown Lookups
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    // Load lookup options
    employeeService.getDepartmentOptions().then(setDepartments);
    employeeService.getManagerOptions(id).then(setManagers);
    employeeService.getScheduleOptions().then(setSchedules);

    if (isEditMode) {
      employeeService.getEmployeeById(id).then((emp) => {
        if (emp) {
          setFormData({
            first_name: emp.first_name || '',
            last_name: emp.last_name || '',
            email: emp.email || '',
            phone: emp.phone || '',
            date_of_birth: emp.date_of_birth || '',
            address: emp.address || '',
            employee_code: emp.employee_code || '',
            department_id: emp.department_id || '',
            job_position_id: emp.job_position_id || '',
            manager_id: emp.manager_id || '',
            joining_date: emp.joining_date || '',
            employment_status: emp.employment_status || 'Active',
            working_schedule_id: emp.working_schedule_id || 'sched-001',
            avatar: emp.avatar || '',
          });
        } else {
          setServerError('Employee record not found.');
        }
        setLoading(false);
      });
    }
  }, [id, isEditMode]);

  // Cascading Job Positions based on Department selection
  useEffect(() => {
    employeeService
      .getJobPositionOptions(formData.department_id || null)
      .then(setPositions);
  }, [formData.department_id]);

  const handleChange = (key, value) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      // Reset position if department changes
      if (key === 'department_id') {
        next.job_position_id = '';
      }
      return next;
    });
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required.';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required.';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Work email is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Enter a valid email address.';
      }
    }

    if (!formData.employee_code.trim()) newErrors.employee_code = 'Employee code is required.';
    if (!formData.department_id) newErrors.department_id = 'Department selection is required.';
    if (!formData.job_position_id) newErrors.job_position_id = 'Job position selection is required.';
    if (!formData.joining_date) newErrors.joining_date = 'Joining date is required.';
    if (!formData.employment_status) newErrors.employment_status = 'Employment status is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setServerError('');

    try {
      if (isEditMode) {
        const res = await employeeService.updateEmployee(id, formData);
        if (res.success) {
          toast.success(`Updated profile for ${res.employee.fullName}`);
          navigate(`/employees/${id}`);
        } else {
          setServerError(res.error || 'Failed to update employee record.');
        }
      } else {
        const res = await employeeService.createEmployee(formData);
        if (res.success) {
          toast.success(`Created new employee record for ${res.employee.fullName}`);
          navigate(`/employees/${res.employee.id}`);
        } else {
          setServerError(res.error || 'Failed to create employee record.');
        }
      }
    } catch (err) {
      setServerError('An unexpected error occurred while saving the employee record.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Employee Form" description="Loading employee data..." />
        <LoadingState variant="form" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? `Edit Employee: ${formData.first_name} ${formData.last_name}` : 'Add New Employee'}
        description={isEditMode ? 'Update work information, department roles, and status.' : 'Register a new employee profile in the master database.'}
        secondaryActions={
          <Button variant="outline" size="md" leftIcon={ArrowLeft} onClick={() => navigate('/employees')}>
            Cancel
          </Button>
        }
      />

      {serverError && (
        <Alert variant="error" title="Form Error" isDismissible>
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              error={errors.first_name}
              isRequired
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              error={errors.last_name}
              isRequired
            />
            <Input
              label="Work Email"
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
              isRequired
            />
            <Input
              label="Phone Number"
              placeholder="+91 90000 00000"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleChange('date_of_birth', e.target.value)}
            />
            <Input
              label="Residential Address"
              placeholder="Full Street Address, City, State"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="sm:col-span-2"
            />
          </CardBody>
        </Card>

        {/* Work & Relationship Information */}
        <Card>
          <CardHeader>
            <CardTitle>Work Information & Relationships</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <Input
              label="Employee Code"
              placeholder="EMP-2026-009"
              value={formData.employee_code}
              onChange={(e) => handleChange('employee_code', e.target.value)}
              error={errors.employee_code}
              isRequired
            />

            <Input
              label="Joining Date"
              type="date"
              value={formData.joining_date}
              onChange={(e) => handleChange('joining_date', e.target.value)}
              error={errors.joining_date}
              isRequired
            />

            <Select
              label="Department"
              value={formData.department_id}
              onChange={(e) => handleChange('department_id', e.target.value)}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="Select Department..."
              error={errors.department_id}
              isRequired
            />

            <Select
              label="Job Position"
              value={formData.job_position_id}
              onChange={(e) => handleChange('job_position_id', e.target.value)}
              options={positions.map((p) => ({ value: p.id, label: p.title }))}
              placeholder={formData.department_id ? "Select Job Position..." : "Select Department first"}
              error={errors.job_position_id}
              isDisabled={!formData.department_id}
              isRequired
            />

            <Select
              label="Reporting Manager"
              value={formData.manager_id || ''}
              onChange={(e) => handleChange('manager_id', e.target.value)}
              options={managers.map((m) => ({ value: m.id, label: m.name }))}
              placeholder="None (Top Level Executive)"
            />

            <Select
              label="Working Schedule"
              value={formData.working_schedule_id}
              onChange={(e) => handleChange('working_schedule_id', e.target.value)}
              options={schedules.map((s) => ({ value: s.id, label: s.name }))}
            />

            <Select
              label="Employment Status"
              value={formData.employment_status}
              onChange={(e) => handleChange('employment_status', e.target.value)}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Terminated', label: 'Terminated' },
              ]}
              error={errors.employment_status}
              isRequired
            />

            <Input
              label="Avatar Image URL (Optional)"
              placeholder="https://..."
              value={formData.avatar}
              onChange={(e) => handleChange('avatar', e.target.value)}
            />
          </CardBody>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(isEditMode ? `/employees/${id}` : '/employees')}
            isDisabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={saving}
            leftIcon={Save}
          >
            {isEditMode ? 'Save Employee Changes' : 'Create Employee Record'}
          </Button>
        </div>
      </form>
    </div>
  );
};
