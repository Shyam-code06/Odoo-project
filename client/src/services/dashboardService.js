import { ROLES, hasPermission } from '../config/permissions';
import { MOCK_QUICK_ACTIONS_BY_ROLE } from '../mocks';
import { apiClient } from './apiClient';

const buildStatsForRole = (role, liveSummary) => {
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const headcount = liveSummary?.headcount || { total: 0, active: 0, inactive: 0, terminated: 0, on_leave: 0 };
  const paySummary = liveSummary?.payroll_summary || {};
  const toSummary = liveSummary?.time_off_summary || {};
  const totalUsers = liveSummary?.total_users ?? 0;
  const totalDepts = liveSummary?.total_departments ?? 0;
  const totalStructures = liveSummary?.total_salary_structures ?? 0;
  const totalRules = liveSummary?.total_salary_rules ?? 0;

  switch (role) {
    case ROLES.ADMIN:
      return [
        {
          id: 'stat_adm_1',
          title: 'Total Employees',
          value: Number(headcount.total || 0).toLocaleString(),
          description: 'All departments',
          iconName: 'Users',
          color: 'bg-orange-50 text-orange-600 border-orange-200',
        },
        {
          id: 'stat_adm_2',
          title: 'System Users',
          value: `${totalUsers} Accounts`,
          description: 'Active portal users',
          iconName: 'UserCheck',
          color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        },
        {
          id: 'stat_adm_3',
          title: 'Departments',
          value: `${totalDepts} Active`,
          description: 'Organizational units',
          iconName: 'Building2',
          color: 'bg-amber-50 text-amber-600 border-amber-200',
        },
        {
          id: 'stat_adm_4',
          title: 'Monthly Payroll',
          value: paySummary.total_net_disbursed
            ? `₹${Number(paySummary.total_net_disbursed).toLocaleString('en-IN')}`
            : '₹0',
          description: `${currentMonth} disbursement`,
          iconName: 'CircleDollarSign',
          color: 'bg-rose-50 text-rose-600 border-rose-200',
        },
      ];

    case ROLES.HR_MANAGER:
      return [
        {
          id: 'stat_hrm_1',
          title: 'Total Employees',
          value: Number(headcount.total || 0).toLocaleString(),
          description: 'Total workforce headcount',
          iconName: 'Users',
          color: 'bg-orange-50 text-orange-600 border-orange-200',
        },
        {
          id: 'stat_hrm_2',
          title: 'Active Employees',
          value: Number(headcount.active || 0).toLocaleString(),
          description: 'Currently operational',
          iconName: 'UserCheck',
          color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        },
        {
          id: 'stat_hrm_3',
          title: 'Employees On Leave',
          value: Number(headcount.on_leave || 0).toLocaleString(),
          description: 'Approved time off',
          iconName: 'Palmtree',
          color: 'bg-amber-50 text-amber-600 border-amber-200',
        },
        {
          id: 'stat_hrm_4',
          title: 'Pending Time Off',
          value: `${toSummary.pending_requests || 0} Requests`,
          description: 'Awaiting HR approval',
          iconName: 'CalendarDays',
          color: 'bg-rose-50 text-rose-600 border-rose-200',
        },
      ];

    case ROLES.HR_PAYROLL_USER:
      return [
        {
          id: 'stat_pru_1',
          title: 'Total Payroll Employees',
          value: Number(headcount.active || 0).toLocaleString(),
          description: 'Included in active cycle',
          iconName: 'Users',
          color: 'bg-orange-50 text-orange-600 border-orange-200',
        },
        {
          id: 'stat_pru_2',
          title: 'Processed Payslips',
          value: Number(paySummary.total_payslips_issued || 0).toLocaleString(),
          description: 'Payslips generated',
          iconName: 'Receipt',
          color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        },
        {
          id: 'stat_pru_3',
          title: 'Pending Processing',
          value: `${Math.max(0, (headcount.active || 0) - (paySummary.total_payslips_issued || 0))} Records`,
          description: 'Verification needed',
          iconName: 'Clock',
          color: 'bg-amber-50 text-amber-600 border-amber-200',
        },
        {
          id: 'stat_pru_4',
          title: 'Monthly Net Payroll',
          value: paySummary.total_net_disbursed
            ? `₹${Number(paySummary.total_net_disbursed).toLocaleString('en-IN')}`
            : '₹0',
          description: `${currentMonth} cycle`,
          iconName: 'CircleDollarSign',
          color: 'bg-rose-50 text-rose-600 border-rose-200',
        },
      ];

    case ROLES.HR_PAYROLL_MANAGER:
      return [
        {
          id: 'stat_prm_1',
          title: 'Gross Monthly Payroll',
          value: paySummary.total_gross_expenditure
            ? `₹${Number(paySummary.total_gross_expenditure).toLocaleString('en-IN')}`
            : '₹0',
          description: 'Total salary disbursement',
          iconName: 'CircleDollarSign',
          color: 'bg-orange-50 text-orange-600 border-orange-200',
        },
        {
          id: 'stat_prm_2',
          title: 'Salary Structures',
          value: `${totalStructures} Active`,
          description: 'Pay grade frameworks',
          iconName: 'Layers',
          color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        },
        {
          id: 'stat_prm_3',
          title: 'Salary Rules',
          value: `${totalRules} Rules`,
          description: 'Allowances & deductions',
          iconName: 'Sliders',
          color: 'bg-amber-50 text-amber-600 border-amber-200',
        },
        {
          id: 'stat_prm_4',
          title: 'Payrun Status',
          value: paySummary.recent_payrun?.status
            ? paySummary.recent_payrun.status.toUpperCase()
            : 'No Active Run',
          description: 'Current cycle status',
          iconName: 'CheckCircle2',
          color: 'bg-rose-50 text-rose-600 border-rose-200',
        },
      ];

    case ROLES.EMPLOYEE:
    default: {
      const myAtt = liveSummary?.current_month_attendance;
      const myLeaves = liveSummary?.leave_balances || [];
      const myPayslips = liveSummary?.recent_payslips || [];
      const totalLeaveBal = myLeaves.reduce((acc, b) => acc + (b.available_balance || 0), 0);

      return [
        {
          id: 'stat_emp_1',
          title: 'Today Check-In',
          value: myAtt?.present_days > 0 ? 'Recorded' : 'Not Checked In',
          description: `${myAtt?.total_worked_hours || 0}h worked this month`,
          iconName: 'Clock',
          color: 'bg-orange-50 text-orange-600 border-orange-200',
        },
        {
          id: 'stat_emp_2',
          title: 'Leave Balance',
          value: `${totalLeaveBal} Days`,
          description: myLeaves.map((l) => `${l.available_balance} ${l.leave_type_name}`).join(' • ') || 'No leave allocated',
          iconName: 'Palmtree',
          color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        },
        {
          id: 'stat_emp_3',
          title: 'Pending Requests',
          value: `${liveSummary?.pending_requests_count || 0} Request(s)`,
          description: 'Awaiting manager review',
          iconName: 'CalendarDays',
          color: 'bg-amber-50 text-amber-600 border-amber-200',
        },
        {
          id: 'stat_emp_4',
          title: 'Latest Payslip',
          value: myPayslips[0]?.net_salary
            ? `₹${Number(myPayslips[0].net_salary).toLocaleString('en-IN')}`
            : 'None',
          description: myPayslips[0]?.period_start ? `Period: ${myPayslips[0].period_start}` : 'No payslip issued',
          iconName: 'FileSpreadsheet',
          color: 'bg-rose-50 text-rose-600 border-rose-200',
        },
      ];
    }
  }
};

export const dashboardService = {
  getDashboardData: async (user, role) => {
    let liveSummary = null;
    let liveAlerts = null;

    // 1. Live API calls
    try {
      if (role === ROLES.EMPLOYEE) {
        const myRes = await apiClient.get('/dashboard/my');
        if (myRes?.success && myRes?.data) {
          liveSummary = myRes.data;
        }
      } else {
        const [sumRes, alertRes] = await Promise.allSettled([
          apiClient.get('/dashboard/summary'),
          apiClient.get('/dashboard/alerts'),
        ]);
        if (sumRes.status === 'fulfilled' && sumRes.value?.success) {
          liveSummary = sumRes.value.data;
        }
        if (alertRes.status === 'fulfilled' && alertRes.value?.success) {
          liveAlerts = alertRes.value.data;
        }
      }
    } catch (err) {
      console.warn('[dashboardService] Live dashboard call error:', err.message);
    }

    // 2. Format with real database values
    const stats = buildStatsForRole(role, liveSummary);

    const attData = liveSummary?.attendance_summary || {};
    const weeklyTrend = liveSummary?.weekly_trend || [
      { day: 'Mon', present: 0 },
      { day: 'Tue', present: 0 },
      { day: 'Wed', present: 0 },
      { day: 'Thu', present: 0 },
      { day: 'Fri', present: 0 },
    ];
    const attendanceSummary = {
      present: attData.present ?? 0,
      late: attData.late ?? 0,
      absent: attData.absent ?? 0,
      onLeave: attData.on_leave ?? (liveSummary?.headcount?.on_leave || 0),
      wfh: attData.wfh ?? 0,
      weeklyTrend,
    };

    const payData = liveSummary?.payroll_summary || {};
    const totalEmployees = liveSummary?.headcount?.total || 0;
    const currentMonthYear = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const payrollSummary = {
      period: payData.recent_payrun?.name || currentMonthYear,
      totalEmployees,
      grossPayroll: payData.total_gross_expenditure || 0,
      netPayroll: payData.total_net_disbursed || 0,
      processedCount: payData.total_payslips_issued || 0,
      pendingCount: Math.max(0, totalEmployees - (payData.total_payslips_issued || 0)),
      status: payData.recent_payrun?.status ? payData.recent_payrun.status.toUpperCase() : 'No Active Run',
      payrunId: payData.recent_payrun?.id ? `PAY-${payData.recent_payrun.id}` : null,
    };

    let needsAttention = [];
    if (Array.isArray(liveAlerts) && liveAlerts.length > 0) {
      needsAttention = liveAlerts.map((a, i) => ({
        id: `alert-${i}`,
        label: a.title || a.message || 'Operational alert',
        type: a.type?.toLowerCase() === 'warning' ? 'warning' : a.type?.toLowerCase() === 'error' ? 'error' : 'info',
        route:
          a.category === 'TIME_OFF'
            ? '/time-off/requests'
            : a.category === 'PAYROLL'
            ? '/payroll/payruns'
            : a.category === 'CONTRACTS'
            ? '/contracts'
            : '/dashboard',
      }));
    }

    const timeOffRequests = liveSummary?.recent_time_off_requests || [];
    const upcomingEvents = liveSummary?.upcoming_events || [];
    const recentActivities = liveSummary?.recent_activities || [];

    const rawActions =
      MOCK_QUICK_ACTIONS_BY_ROLE[role] ||
      MOCK_QUICK_ACTIONS_BY_ROLE[ROLES.EMPLOYEE];
    const quickActions = rawActions.filter(
      (act) => !act.permission || hasPermission(role, act.permission)
    );

    return {
      user,
      role,
      stats,
      attendanceSummary,
      timeOffRequests,
      upcomingEvents,
      recentActivities,
      payrollSummary,
      needsAttention,
      quickActions,
    };
  },

  approveTimeOff: async (requestId) => {
    try {
      const res = await apiClient.patch(`/time-off/requests/${requestId}/approve`);
      return res?.data || { success: true };
    } catch (err) {
      console.error(`[dashboardService] approveTimeOff(${requestId}) error:`, err.message);
      throw err;
    }
  },

  rejectTimeOff: async (requestId, reason = 'Rejected from dashboard') => {
    try {
      const res = await apiClient.patch(`/time-off/requests/${requestId}/reject`, {
        refusal_reason: reason,
      });
      return res?.data || { success: true };
    } catch (err) {
      console.error(`[dashboardService] rejectTimeOff(${requestId}) error:`, err.message);
      throw err;
    }
  },
};

export default dashboardService;
