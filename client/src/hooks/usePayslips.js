import { useState, useEffect, useCallback } from 'react';
import payslipService from '../services/payslipService';

/**
 * Custom hook to manage Payslip List, filtering, sorting, pagination, and metrics.
 */
export function usePayslips(params = {}) {
  const [data, setData] = useState({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    metrics: { total: 0, generatedCount: 0, paidCount: 0, totalNetPayroll: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayslips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await payslipService.getPayslips(params);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to fetch payslips');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching payslips');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  return { ...data, loading, error, refetch: fetchPayslips };
}

/**
 * Custom hook to manage Single Payslip Details, employee context, contract, structure, lines, and history.
 */
export function usePayslip(id) {
  const [data, setData] = useState({
    payslip: null,
    employee: null,
    contract: null,
    salaryStructure: null,
    payrun: null,
    lines: [],
    integrityCheck: { isValid: true, warnings: [] },
    employeeHistory: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayslip = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await payslipService.getPayslipById(id);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Payslip not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load payslip details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPayslip();
  }, [fetchPayslip]);

  return { ...data, loading, error, refetch: fetchPayslip };
}
