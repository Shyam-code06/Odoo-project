import dashboardService from '../services/dashboardService.js';

/**
 * GET /api/dashboard/summary
 * Main HR & Payroll Dashboard Analytics Summary
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardSummary(req.query, req.user);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'DASHBOARD_ERROR'
    });
  }
};

/**
 * GET /api/dashboard/my
 * Employee Self-Service Dashboard (Personal attendance, leaves, recent payslips)
 */
export const getEmployeeDashboard = async (req, res) => {
  try {
    if (!req.user.employee_id) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to this user account.',
        code: 'NO_EMPLOYEE_PROFILE'
      });
    }

    const data = await dashboardService.getEmployeeDashboard(req.user.employee_id);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'EMPLOYEE_DASHBOARD_ERROR'
    });
  }
};

/**
 * GET /api/dashboard/alerts
 * Operational HR & Payroll Alerts
 */
export const getOperationalAlerts = async (req, res) => {
  try {
    const alerts = await dashboardService.getOperationalAlerts();
    return res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'ALERTS_ERROR'
    });
  }
};

/**
 * GET /api/reports/employees
 * Employee Headcount & Demographics Report
 */
export const getEmployeeReport = async (req, res) => {
  try {
    const report = await dashboardService.getEmployeeReport(req.query);
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'REPORT_ERROR'
    });
  }
};

/**
 * GET /api/reports/attendance
 * Attendance & Working Hours Report
 */
export const getAttendanceReport = async (req, res) => {
  try {
    const report = await dashboardService.getAttendanceReport(req.query);
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'REPORT_ERROR'
    });
  }
};

/**
 * GET /api/reports/time-off
 * Time-Off & Leave Utilization Report
 */
export const getTimeOffReport = async (req, res) => {
  try {
    const report = await dashboardService.getTimeOffReport(req.query);
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'REPORT_ERROR'
    });
  }
};

/**
 * GET /api/reports/payroll
 * Payroll & Salary Expenditure Report
 */
export const getPayrollReport = async (req, res) => {
  try {
    const report = await dashboardService.getPayrollReport(req.query);
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'REPORT_ERROR'
    });
  }
};

export default {
  getDashboardSummary,
  getEmployeeDashboard,
  getOperationalAlerts,
  getEmployeeReport,
  getAttendanceReport,
  getTimeOffReport,
  getPayrollReport
};
