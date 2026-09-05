import { ROLES, hasPermission } from '../config/permissions';
import {
  MOCK_STATS_BY_ROLE,
  MOCK_ATTENDANCE_SUMMARY,
  MOCK_UPCOMING_EVENTS,
  MOCK_RECENT_ACTIVITIES,
  MOCK_PAYROLL_SUMMARY,
  MOCK_NEEDS_ATTENTION_BY_ROLE,
  MOCK_QUICK_ACTIONS_BY_ROLE,
  getRawDashboardTimeOffRequests,
  setRawDashboardTimeOffRequests,
} from '../mocks';

export const dashboardService = {
  getDashboardData: async (user, role) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const stats = MOCK_STATS_BY_ROLE[role] || MOCK_STATS_BY_ROLE[ROLES.EMPLOYEE];
        const needsAttention = MOCK_NEEDS_ATTENTION_BY_ROLE[role] || [];
        const rawActions = MOCK_QUICK_ACTIONS_BY_ROLE[role] || MOCK_QUICK_ACTIONS_BY_ROLE[ROLES.EMPLOYEE];

        // Filter actions by permissions
        const quickActions = rawActions.filter(
          (act) => !act.permission || hasPermission(role, act.permission)
        );

        resolve({
          user,
          role,
          stats,
          attendanceSummary: MOCK_ATTENDANCE_SUMMARY,
          timeOffRequests: getRawDashboardTimeOffRequests(),
          upcomingEvents: MOCK_UPCOMING_EVENTS,
          recentActivities: MOCK_RECENT_ACTIVITIES,
          payrollSummary: MOCK_PAYROLL_SUMMARY,
          needsAttention,
          quickActions,
        });
      }, 300);
    });
  },

  approveTimeOff: async (requestId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentRequests = getRawDashboardTimeOffRequests();
        const updated = currentRequests.map((req) =>
          req.id === requestId ? { ...req, status: 'Approved' } : req
        );
        setRawDashboardTimeOffRequests(updated);
        resolve({ success: true, requests: updated });
      }, 200);
    });
  },

  rejectTimeOff: async (requestId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentRequests = getRawDashboardTimeOffRequests();
        const updated = currentRequests.map((req) =>
          req.id === requestId ? { ...req, status: 'Rejected' } : req
        );
        setRawDashboardTimeOffRequests(updated);
        resolve({ success: true, requests: updated });
      }, 200);
    });
  },
};
