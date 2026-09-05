import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';

export const useDashboard = () => {
  const { user, currentRole } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!user || !currentRole) return;
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getDashboardData(user, currentRole);
      setData(res);
    } catch (err) {
      setError('Failed to load dashboard metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, currentRole]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const approveTimeOff = async (requestId) => {
    const res = await dashboardService.approveTimeOff(requestId);
    if (res.success && data) {
      setData((prev) => ({
        ...prev,
        timeOffRequests: res.requests,
      }));
    }
    return res;
  };

  const rejectTimeOff = async (requestId) => {
    const res = await dashboardService.rejectTimeOff(requestId);
    if (res.success && data) {
      setData((prev) => ({
        ...prev,
        timeOffRequests: res.requests,
      }));
    }
    return res;
  };

  return {
    data,
    loading,
    error,
    refresh: fetchDashboard,
    approveTimeOff,
    rejectTimeOff,
  };
};
