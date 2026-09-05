import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Filter, RotateCcw } from 'lucide-react';
import { employeeService } from '../../../services/employeeService';

export const EmployeeFilterDrawer = ({ isOpen, onClose, filters, onApply, onReset }) => {
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    employeeService.getDepartmentOptions().then(setDepartments);
    employeeService.getManagerOptions().then(setManagers);
    employeeService.getScheduleOptions().then(setSchedules);
  }, []);

  useEffect(() => {
    employeeService
      .getJobPositionOptions(localFilters.department_id || null)
      .then(setPositions);
  }, [localFilters.department_id]);

  const handleChange = (key, value) => {
    setLocalFilters((prev) => {
      const next = { ...prev, [key]: value };
      // Reset position if department changes
      if (key === 'department_id') {
        next.job_position_id = '';
      }
      return next;
    });
  };

  const handleApplyAction = () => {
    onApply(localFilters);
    onClose();
  };

  const handleResetAction = () => {
    onReset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Employee Directory"
      subtitle="Refine workforce records by department, manager, status or shift"
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" leftIcon={RotateCcw} onClick={handleResetAction}>
            Reset Filters
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" leftIcon={Filter} onClick={handleApplyAction}>
              Apply Filters
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="Department"
          value={localFilters.department_id || ''}
          onChange={(e) => handleChange('department_id', e.target.value)}
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
          placeholder="All Departments"
        />

        <Select
          label="Job Position"
          value={localFilters.job_position_id || ''}
          onChange={(e) => handleChange('job_position_id', e.target.value)}
          options={positions.map((p) => ({ value: p.id, label: p.title }))}
          placeholder="All Job Positions"
        />

        <Select
          label="Reporting Manager"
          value={localFilters.manager_id || ''}
          onChange={(e) => handleChange('manager_id', e.target.value)}
          options={managers.map((m) => ({ value: m.id, label: m.name }))}
          placeholder="All Managers"
        />

        <Select
          label="Employment Status"
          value={localFilters.employment_status || ''}
          onChange={(e) => handleChange('employment_status', e.target.value)}
          options={[
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
            { value: 'Terminated', label: 'Terminated' },
          ]}
          placeholder="All Statuses"
        />

        <Select
          label="Working Schedule"
          value={localFilters.working_schedule_id || ''}
          onChange={(e) => handleChange('working_schedule_id', e.target.value)}
          options={schedules.map((s) => ({ value: s.id, label: s.name }))}
          placeholder="All Schedules"
        />
      </div>
    </Modal>
  );
};
