/**
 * Custom React Hooks for Time Off Module
 */

import { useState, useEffect, useCallback } from 'react';
import { timeOffService } from '../services/timeOffService';

export const useTimeOffTypes = (params = {}) => {
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    allocationRequired: 0,
    paidCount: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await timeOffService.getTimeOffTypes(params);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setData(list);
      setMetrics(res?.metrics || {
        total: list.length,
        active: list.filter((t) => t.isActive).length,
        allocationRequired: list.filter((t) => t.requiresAllocation && t.isActive).length,
        paidCount: list.filter((t) => t.isPaid && t.isActive).length,
      });
      setPagination(res?.pagination || { page: 1, pageSize: 10, totalItems: list.length, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load Time Off Types.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  return { data, metrics, pagination, loading, error, refetch: fetchTypes };
};

export const useTimeOffType = (id) => {
  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchType = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await timeOffService.getTimeOffTypeById(id);
      setType(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load Time Off Type.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchType();
  }, [fetchType]);

  return { type, loading, error, refetch: fetchType };
};

export const useAllocations = (params = {}) => {
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, approved: 0, totalRemaining: 0 });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await timeOffService.getAllocations(params);
      setData(res.data);
      setMetrics(res.metrics);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load Allocations.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  return { data, metrics, pagination, loading, error, refetch: fetchAllocations };
};

export const useAllocation = (id) => {
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllocation = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await timeOffService.getAllocationById(id);
      setAllocation(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load Allocation.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAllocation();
  }, [fetchAllocation]);

  return { allocation, loading, error, refetch: fetchAllocation };
};

export const useTimeOffRequests = (params = {}) => {
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    approvedDays: 0,
    approvedHours: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await timeOffService.getTimeOffRequests(params);
      setData(res.data);
      setMetrics(res.metrics);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load Time Off Requests.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { data, metrics, pagination, loading, error, refetch: fetchRequests };
};

export const useTimeOffRequest = (id) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequest = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await timeOffService.getTimeOffRequestById(id);
      setRequest(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load Time Off Request.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  return { request, loading, error, refetch: fetchRequest };
};

export const useEmployeeLeaveBalances = (employeeId) => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBalances = useCallback(async () => {
    if (!employeeId) {
      setBalances([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await timeOffService.getEmployeeLeaveBalances(employeeId);
      setBalances(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    } catch (err) {
      setError(err.message || 'Failed to load leave balances.');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return { balances, loading, error, refetch: fetchBalances };
};
