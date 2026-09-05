import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { employeeService } from '../services/employeeService';

export const useEmployees = (initialParams = {}) => {
  const [searchParams] = useSearchParams();
  const initDept = searchParams.get('department_id') || searchParams.get('departmentId') || '';
  const initPos = searchParams.get('job_position_id') || searchParams.get('jobPositionId') || '';
  const initMgr = searchParams.get('manager_id') || searchParams.get('managerId') || '';
  const initStatus = searchParams.get('employment_status') || searchParams.get('status') || '';
  const initSched = searchParams.get('working_schedule_id') || searchParams.get('workingScheduleId') || '';

  const [employees, setEmployees] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [params, setParams] = useState({
    search: '',
    department_id: initDept,
    job_position_id: initPos,
    manager_id: initMgr,
    employment_status: initStatus,
    working_schedule_id: initSched,
    page: 1,
    pageSize: 10,
    sortBy: 'joining_date',
    sortDirection: 'desc',
    ...initialParams,
  });

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await employeeService.getEmployees(params);
      setEmployees(res.data);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError('Failed to load employee records.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const updateFilters = (newParams) => {
    setParams((prev) => ({
      ...prev,
      ...newParams,
      page: newParams.page !== undefined ? newParams.page : 1,
    }));
  };

  const clearFilters = () => {
    setParams({
      search: '',
      department_id: '',
      job_position_id: '',
      manager_id: '',
      employment_status: '',
      working_schedule_id: '',
      page: 1,
      pageSize: 10,
      sortBy: 'joining_date',
      sortDirection: 'desc',
    });
  };

  return {
    employees,
    totalCount,
    totalPages,
    loading,
    error,
    params,
    updateFilters,
    clearFilters,
    refresh: fetchEmployees,
  };
};

export const useEmployeeDetail = (id) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const emp = await employeeService.getEmployeeById(id);
      if (emp) {
        setEmployee(emp);
      } else {
        setError('Employee record not found.');
      }
    } catch (err) {
      setError('Failed to load employee detail.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    employee,
    loading,
    error,
    refresh: fetchDetail,
  };
};
