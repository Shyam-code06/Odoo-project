import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, FileText, User, Building2, Briefcase, Calendar, DollarSign, Clock } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { contractService } from '../../services/contractService';
import { employeeService } from '../../services/employeeService';
import { departmentService } from '../../services/departmentService';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, normalizeRole } from '../../config/permissions';

export const ContractFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentRole } = useAuth();
  const isEdit = Boolean(id);

  const isHRPayrollManager = normalizeRole(currentRole) === ROLES.HR_PAYROLL_MANAGER;

  useEffect(() => {
    if (!isHRPayrollManager) {
      toast.error('Only HR Payroll Manager is authorized to create or edit contracts.');
      navigate('/contracts', { replace: true });
    }
  }, [isHRPayrollManager, navigate, toast]);

  const [formData, setFormData] = useState({
    employee_id: '',
    contract_number: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    wage: '',
    employment_type: 'full_time',
    status: 'active',
    department_id: '',
    job_position_id: '',
    working_schedule_id: '',
    salary_structure_id: '',
  });

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    // 1. Load Employees
    employeeService.getEmployees({ pageSize: 150 }).then((res) => {
      if (res?.data) {
        setEmployees(
          res.data.map((e) => ({
            value: e.id,
            label: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name || `Employee #${e.id}`,
            code: e.employee_code,
            departmentId: e.department_id,
            jobPositionId: e.job_position_id,
            workingScheduleId: e.working_schedule_id,
          }))
        );
      }
    }).catch(() => {});

    // 2. Load Departments
    departmentService.getDepartmentOptions().then((res) => {
      if (Array.isArray(res)) {
        setDepartments(res.map((d) => ({ value: d.id, label: d.name })));
      }
    }).catch(() => {});

    // 3. Load Job Positions
    apiClient.get('/job-positions', { limit: 100 }).then((res) => {
      const list = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      setJobPositions(list.map((p) => ({ value: p.id, label: p.title || p.name })));
    }).catch(() => {});

    // 4. Load Working Schedules
    apiClient.get('/schedules', { limit: 100 }).then((res) => {
      const list = Array.isArray(res?.data) ? res.data : res?.data?.schedules || [];
      setSchedules(list.map((s) => ({ value: s.id, label: s.name })));
    }).catch(() => {});

    // 5. Load Salary Structures
    apiClient.get('/salary-structures', { limit: 100 }).then((res) => {
      const list = Array.isArray(res?.data) ? res.data : res?.data?.structures || [];
      setSalaryStructures(list.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })));
    }).catch(() => {});

    // 6. If Edit mode, load contract details
    if (isEdit) {
      contractService.getContractById(id).then((c) => {
        if (c) {
          setFormData({
            employee_id: c.employee_id || '',
            contract_number: c.contract_number || '',
            start_date: c.start_date ? c.start_date.split('T')[0] : '',
            end_date: c.end_date ? c.end_date.split('T')[0] : '',
            wage: c.wage !== undefined ? String(c.wage) : '',
            employment_type: c.employment_type || 'full_time',
            status: c.status || 'draft',
            department_id: c.department_id || '',
            job_position_id: c.job_position_id || '',
            working_schedule_id: c.working_schedule_id || '',
            salary_structure_id: c.salary_structure_id || '',
          });
        } else {
          toast.error('Contract not found.');
          navigate('/contracts');
        }
        setLoading(false);
      }).catch((err) => {
        toast.error('Failed to load contract.');
        navigate('/contracts');
      });
    }
  }, [id, isEdit, navigate, toast]);

  // When an employee is chosen in Create mode, auto-fill department, job position, schedule if empty
  const handleEmployeeChange = (empId) => {
    const selectedEmp = employees.find((e) => String(e.value) === String(empId));
    setFormData((prev) => ({
      ...prev,
      employee_id: empId,
      department_id: prev.department_id || selectedEmp?.departmentId || '',
      job_position_id: prev.job_position_id || selectedEmp?.jobPositionId || '',
      working_schedule_id: prev.working_schedule_id || selectedEmp?.workingScheduleId || '',
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.employee_id) errs.employee_id = 'Employee selection is required.';
    if (!formData.start_date) errs.start_date = 'Start date is required.';
    if (!formData.wage || isNaN(Number(formData.wage)) || Number(formData.wage) < 0) {
      errs.wage = 'Valid monthly wage is required.';
    }
    if (formData.end_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      errs.end_date = 'End date cannot be earlier than start date.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      const payload = {
        employee_id: Number(formData.employee_id),
        contract_number: formData.contract_number?.trim() || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date ? formData.end_date : null,
        wage: parseFloat(formData.wage),
        employment_type: formData.employment_type,
        status: formData.status,
        department_id: formData.department_id ? Number(formData.department_id) : null,
        job_position_id: formData.job_position_id ? Number(formData.job_position_id) : null,
        working_schedule_id: formData.working_schedule_id ? Number(formData.working_schedule_id) : null,
        salary_structure_id: formData.salary_structure_id ? Number(formData.salary_structure_id) : null,
      };

      if (isEdit) {
        await contractService.updateContract(id, payload);
        toast.success('Contract updated successfully.');
      } else {
        await contractService.createContract(payload);
        toast.success('Contract created and saved successfully.');
      }
      navigate('/contracts');
    } catch (err) {
      const msg = err.data?.errors?.length ? err.data.errors.join('. ') : (err.message || 'Failed to save contract.');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-sm">Loading contract...</p>
      </div>
    );
  }

  if (!isHRPayrollManager) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/contracts')}
        >
          Back to Contracts
        </Button>
      </div>

      <PageHeader
        title={isEdit ? 'Edit Employment Contract' : 'New Employment Contract'}
        description={
          isEdit
            ? `Update contract terms and compensation details for contract #${formData.contract_number}.`
            : 'Assign a new employment contract with salary terms, schedule, and role specifications.'
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Core Contract Details */}
        <Card>
          <CardHeader>
            <CardTitle>1. Employee & Identification</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={isEdit}
                value={formData.employee_id}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className={`w-full text-xs border rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  fieldErrors.employee_id ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              >
                <option value="">Select Employee...</option>
                {employees.map((emp) => (
                  <option key={emp.value} value={emp.value}>
                    {emp.label} ({emp.code})
                  </option>
                ))}
              </select>
              {fieldErrors.employee_id && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.employee_id}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contract Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                placeholder="Leave blank to auto-generate (e.g. CNT-2026-...)"
                value={formData.contract_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, contract_number: e.target.value }))}
              />
            </div>
          </CardBody>
        </Card>

        {/* 2. Compensation & Status */}
        <Card>
          <CardHeader>
            <CardTitle>2. Compensation & Terms</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly Wage ($) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 75000.00"
                value={formData.wage}
                onChange={(e) => setFormData((prev) => ({ ...prev, wage: e.target.value }))}
                error={fieldErrors.wage}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employment Type
              </label>
              <select
                value={formData.employment_type}
                onChange={(e) => setFormData((prev) => ({ ...prev, employment_type: e.target.value }))}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contractor</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contract Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                error={fieldErrors.start_date}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Date <span className="text-slate-400 font-normal">(Leave blank for indefinite)</span>
              </label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                error={fieldErrors.end_date}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Salary Structure
              </label>
              <select
                value={formData.salary_structure_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, salary_structure_id: e.target.value }))}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Standard / Default</option>
                {salaryStructures.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </CardBody>
        </Card>

        {/* 3. Department, Position & Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>3. Organization & Work Schedule</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, department_id: e.target.value }))}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Use Employee Default</option>
                {departments.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Position
              </label>
              <select
                value={formData.job_position_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, job_position_id: e.target.value }))}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Use Employee Default</option>
                {jobPositions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Working Schedule
              </label>
              <select
                value={formData.working_schedule_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, working_schedule_id: e.target.value }))}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Standard Shift (40h)</option>
                {schedules.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </CardBody>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/contracts')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={Save}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Contract'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContractFormPage;
