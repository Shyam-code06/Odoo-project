import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { departmentService } from '../services/departmentService';

export const useDepartments = (initialParams = {}) => {
  const [searchParams] = useSearchParams();
  const initialManager = searchParams.get('managerId') || searchParams.get('manager_id') || '';
  const initialStatus = searchParams.get('status') || '';

  const [departments, setDepartments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [params, setParams] = useState({
    search: '',
    managerId: initialManager,
    status: initialStatus,
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sortDirection: 'asc',
    ...initialParams,
  });

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await departmentService.getDepartments(params);
      setDepartments(res.data);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError('Failed to load department records.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

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
      managerId: '',
      status: '',
      page: 1,
      pageSize: 10,
      sortBy: 'name',
      sortDirection: 'asc',
    });
  };

  return {
    departments,
    totalCount,
    totalPages,
    loading,
    error,
    params,
    updateFilters,
    clearFilters,
    refresh: fetchDepartments,
  };
};

export const useDepartmentDetail = (id) => {
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const dept = await departmentService.getDepartmentById(id);
      if (dept) {
        setDepartment(dept);
      } else {
        setError('Department record not found.');
      }
    } catch (err) {
      setError('Failed to load department details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    department,
    loading,
    error,
    refresh: fetchDetail,
  };
};
