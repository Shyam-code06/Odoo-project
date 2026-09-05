import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { workingScheduleService } from '../services/workingScheduleService';

export const useWorkingSchedules = (initialParams = {}) => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const initialTz = searchParams.get('timezone') || '';

  const [schedules, setSchedules] = useState([]);
  const [summary, setSummary] = useState({
    totalSchedules: 0,
    activeSchedules: 0,
    inactiveSchedules: 0,
    totalAssignedEmployees: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [params, setParams] = useState({
    search: '',
    status: initialStatus,
    timezone: initialTz,
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sortDirection: 'asc',
    ...initialParams,
  });

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await workingScheduleService.getWorkingSchedules(params);
      setSchedules(res.data);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      setError('Failed to load working schedule records.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

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
      status: '',
      timezone: '',
      page: 1,
      pageSize: 10,
      sortBy: 'name',
      sortDirection: 'asc',
    });
  };

  return {
    schedules,
    summary,
    totalCount,
    totalPages,
    loading,
    error,
    params,
    updateFilters,
    clearFilters,
    refresh: fetchSchedules,
  };
};

export const useWorkingScheduleDetail = (id) => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const sched = await workingScheduleService.getWorkingScheduleById(id);
      if (sched) {
        setSchedule(sched);
      } else {
        setError('Working schedule record not found.');
      }
    } catch (err) {
      setError('Failed to load working schedule details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    schedule,
    loading,
    error,
    refresh: fetchDetail,
  };
};
