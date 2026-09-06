import payrollAnalyticsService from '../services/payrollAnalyticsService.js';

/**
 * GET /api/payroll/analytics/salary-cost-by-department
 * Aggregate historical salary cost by department
 */
export const getSalaryCostByDepartment = async (req, res) => {
  try {
    const result = await payrollAnalyticsService.getSalaryCostByDepartment(req.query);
    return res.status(200).json({
      success: true,
      data: result.data,
      summary: {
        totalSalaryCost: result.totalSalaryCost,
        totalDepartments: result.totalDepartments
      }
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Unable to load salary cost by department analytics.',
      code: err.code || 'SALARY_COST_ANALYTICS_ERROR'
    });
  }
};

/**
 * GET /api/payroll/analytics/monthly-net-salary
 * Aggregate historical monthly net salary trends chronologically
 */
export const getMonthlyNetSalaryTrends = async (req, res) => {
  try {
    const result = await payrollAnalyticsService.getMonthlyNetSalaryTrends(req.query);
    return res.status(200).json({
      success: true,
      data: result.data,
      summary: {
        totalNetDisbursed: result.totalNetDisbursed,
        totalMonths: result.totalMonths
      }
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Unable to load monthly net salary analytics.',
      code: err.code || 'MONTHLY_SALARY_ANALYTICS_ERROR'
    });
  }
};

export default {
  getSalaryCostByDepartment,
  getMonthlyNetSalaryTrends
};
