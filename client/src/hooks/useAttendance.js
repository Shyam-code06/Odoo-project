import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { attendanceService } from '../services/attendanceService';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../config/permissions';

export const useAttendance = (initialParams = {}) => {
  const { currentUser, currentRole } = useAuth();
  const [searchParams] = useSearchParams();

  // If user is Employee role, restrict to their own employee ID
  const isEmployeeRole = currentRole === ROLES.EMPLOYEE;
  const loggedInEmpId = currentUser?.employeeId || (isEmployeeRole ? 'emp-001' : '');

  const initEmp = searchParams.get('employeeId') || searchParams.get('employee_id') || (isEmployeeRole ? loggedInEmpId : '');
  const initDept = searchParams.get('departmentId') || searchParams.get('department_id') || '';
  const initSched = searchParams.get('workingScheduleId') || searchParams.get('working_schedule_id') || '';
  const initStatus = searchParams.get('status') || '';
  const initDate = searchParams.get('date') || '';

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    totalRecords: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    missingCheckOutCount: 0,
    correctedCount: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [params, setParams] = useState({
    search: '',
    employeeId: initEmp,
    departmentId: initDept,
    workingScheduleId: initSched,
    status: initStatus,
    date: initDate,
    startDate: '',
    endDate: '',
    restrictEmployeeId: isEmployeeRole ? loggedInEmpId : '',
    page: 1,
    pageSize: 10,
    sortBy: 'attendanceDate',
    sortDirection: 'desc',
    ...initialParams,
  });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceService.getAttendanceRecords(params);
      setRecords(res.data);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      setError('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

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
      employeeId: isEmployeeRole ? loggedInEmpId : '',
      departmentId: '',
      workingScheduleId: '',
      status: '',
      date: '',
      startDate: '',
      endDate: '',
      restrictEmployeeId: isEmployeeRole ? loggedInEmpId : '',
      page: 1,
      pageSize: 10,
      sortBy: 'attendanceDate',
      sortDirection: 'desc',
    });
  };

  return {
    records,
    summary,
    totalCount,
    totalPages,
    loading,
    error,
    params,
    isEmployeeRole,
    updateFilters,
    clearFilters,
    refresh: fetchRecords,
  };
};

export const useAttendanceRecord = (id) => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const rec = await attendanceService.getAttendanceById(id);
      if (rec) {
        setRecord(rec);
      } else {
        setError('Attendance record not found.');
      }
    } catch (err) {
      setError('Failed to load attendance details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    record,
    loading,
    error,
    refresh: fetchDetail,
  };
};
