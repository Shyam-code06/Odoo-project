import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jobPositionService } from '../services/jobPositionService';

export const useJobPositions = (initialParams = {}) => {
  const [searchParams] = useSearchParams();
  const initialDept = searchParams.get('departmentId') || searchParams.get('department_id') || '';
  const initialStatus = searchParams.get('status') || '';

  const [jobPositions, setJobPositions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [params, setParams] = useState({
    search: '',
    departmentId: initialDept,
    status: initialStatus,
    page: 1,
    pageSize: 10,
    sortBy: 'title',
    sortDirection: 'asc',
    ...initialParams,
  });

  const fetchJobPositions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await jobPositionService.getJobPositions(params);
      setJobPositions(res.data);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError('Failed to load job position records.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchJobPositions();
  }, [fetchJobPositions]);

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
      departmentId: '',
      status: '',
      page: 1,
      pageSize: 10,
      sortBy: 'title',
      sortDirection: 'asc',
    });
  };

  return {
    jobPositions,
    totalCount,
    totalPages,
    loading,
    error,
    params,
    updateFilters,
    clearFilters,
    refresh: fetchJobPositions,
  };
};

export const useJobPositionDetail = (id) => {
  const [jobPosition, setJobPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const pos = await jobPositionService.getJobPositionById(id);
      if (pos) {
        setJobPosition(pos);
      } else {
        setError('Job position record not found.');
      }
    } catch (err) {
      setError('Failed to load job position details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    jobPosition,
    loading,
    error,
    refresh: fetchDetail,
  };
};
