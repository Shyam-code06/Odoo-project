import { useState, useEffect, useCallback } from 'react';
import { payrollAnalyticsService } from '../services/payrollAnalyticsService';

/**
 * Custom hook to fetch and manage payroll analytics data
 *
 * @param {object} filters - Optional filters { date_from, date_to, department_id, status }
 */
export const usePayrollAnalytics = (filters = {}) => {
  const [departmentData, setDepartmentData] = useState([]);
  const [departmentSummary, setDepartmentSummary] = useState({});
  const [trendData, setTrendData] = useState([]);
  const [trendSummary, setTrendSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptRes, trendRes] = await Promise.all([
        payrollAnalyticsService.getSalaryCostByDepartment(filters),
        payrollAnalyticsService.getMonthlyNetSalaryTrends(filters),
      ]);

      setDepartmentData(deptRes.data || []);
      setDepartmentSummary(deptRes.summary || {});
      setTrendData(trendRes.data || []);
      setTrendSummary(trendRes.summary || {});
    } catch (err) {
      console.error('[usePayrollAnalytics] fetchAnalytics error:', err);
      setError(err.message || 'Unable to load payroll analytics data.');
    } finally {
      setLoading(false);
    }
  }, [
    filters.date_from,
    filters.date_to,
    filters.department_id,
    filters.status,
  ]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    departmentData,
    departmentSummary,
    trendData,
    trendSummary,
    loading,
    error,
    refresh: fetchAnalytics,
  };
};

export default usePayrollAnalytics;
