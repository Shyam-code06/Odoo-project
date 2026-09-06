import { apiClient } from './apiClient';

/**
 * Frontend Payroll Analytics Service
 * Retrieves database-aggregated salary distribution and historical trends
 */
export const payrollAnalyticsService = {
  /**
   * Fetch Salary Cost by Department
   * @param {object} filters - Optional { date_from, date_to, department_id, status }
   */
  getSalaryCostByDepartment: async (filters = {}) => {
    try {
      const res = await apiClient.get('/payroll/analytics/salary-cost-by-department', filters);
      if (res && res.success) {
        return {
          data: res.data || [],
          summary: res.raw?.summary || {},
        };
      }
      return { data: [], summary: {} };
    } catch (err) {
      console.error('[payrollAnalyticsService] getSalaryCostByDepartment error:', err);
      throw err;
    }
  },

  /**
   * Fetch Monthly Net Salary Trends
   * @param {object} filters - Optional { date_from, date_to, department_id, status }
   */
  getMonthlyNetSalaryTrends: async (filters = {}) => {
    try {
      const res = await apiClient.get('/payroll/analytics/monthly-net-salary', filters);
      if (res && res.success) {
        return {
          data: res.data || [],
          summary: res.raw?.summary || {},
        };
      }
      return { data: [], summary: {} };
    } catch (err) {
      console.error('[payrollAnalyticsService] getMonthlyNetSalaryTrends error:', err);
      throw err;
    }
  },
};

export default payrollAnalyticsService;
