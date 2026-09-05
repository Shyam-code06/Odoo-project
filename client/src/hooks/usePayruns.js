import { useState, useEffect, useCallback } from 'react';
import payrunService from '../services/payrunService';
import { payrollEligibilityService } from '../services/payrollEligibilityService';

/**
 * Custom Hooks for Payruns & Payroll Eligibility
 */

export function usePayruns(params = {}) {
  const [data, setData] = useState({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    metrics: { total: 0, draft: 0, computed: 0, validated: 0, paid: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayruns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await payrunService.getPayruns(params);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to fetch payruns');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading payruns');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchPayruns();
  }, [fetchPayruns]);

  return { ...data, loading, error, refetch: fetchPayruns };
}

export function usePayrun(id) {
  const [payrun, setPayrun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayrun = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await payrunService.getPayrunById(id);
      if (res.success) {
        setPayrun(res.data);
      } else {
        setError(res.message || 'Payrun not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load payrun details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPayrun();
  }, [fetchPayrun]);

  return { payrun, loading, error, refetch: fetchPayrun };
}

export function usePayrunEligibility(structureId, periodStart, periodEnd) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEligibility = useCallback(async () => {
    if (!structureId || !periodStart || !periodEnd) {
      setEmployees([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await payrollEligibilityService.getEligibleEmployeesForPayrun(
        structureId,
        periodStart,
        periodEnd
      );
      if (res.success) {
        setEmployees(res.data);
      } else {
        setError(res.message || 'Failed to evaluate employee eligibility');
      }
    } catch (err) {
      setError(err.message || 'Error evaluating eligibility');
    } finally {
      setLoading(false);
    }
  }, [structureId, periodStart, periodEnd]);

  useEffect(() => {
    fetchEligibility();
  }, [fetchEligibility]);

  return { employees, loading, error, refetch: fetchEligibility };
}
