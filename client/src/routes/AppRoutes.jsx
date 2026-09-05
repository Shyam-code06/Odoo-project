import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { AccountSettingsPage } from '../pages/settings/AccountSettingsPage';
import { UnauthorizedPage } from '../pages/error/UnauthorizedPage';
import { NotFoundPage } from '../pages/error/NotFoundPage';
import { PlaceholderPage } from '../pages/placeholder/PlaceholderPage';

import { EmployeeListPage } from '../pages/employees/EmployeeListPage';
import { EmployeeDetailsPage } from '../pages/employees/EmployeeDetailsPage';
import { EmployeeFormPage } from '../pages/employees/EmployeeFormPage';

import { DepartmentListPage } from '../pages/departments/DepartmentListPage';
import { DepartmentDetailsPage } from '../pages/departments/DepartmentDetailsPage';
import { DepartmentFormPage } from '../pages/departments/DepartmentFormPage';

import { JobPositionListPage } from '../pages/jobPositions/JobPositionListPage';
import { JobPositionDetailsPage } from '../pages/jobPositions/JobPositionDetailsPage';
import { JobPositionFormPage } from '../pages/jobPositions/JobPositionFormPage';

import { PERMISSIONS, ROLES } from '../config/permissions';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Unauthenticated Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Main Authenticated HRMS Application Shell Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.DASHBOARD_VIEW}>
                <DashboardPage />
              </RoleRoute>
            }
          />

          {/* Self-Service Routes */}
          <Route
            path="/profile"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.PROFILE_VIEW}>
                <ProfilePage />
              </RoleRoute>
            }
          />
          <Route
            path="/settings/account"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.PROFILE_VIEW}>
                <AccountSettingsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/my-attendance"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.MY_ATTENDANCE_VIEW}>
                <PlaceholderPage title="My Attendance Records" description="View your personal clock-in history and work logs." part="07" iconName="Clock" />
              </RoleRoute>
            }
          />
          <Route
            path="/my-time-off"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.MY_TIME_OFF_VIEW}>
                <PlaceholderPage title="My Leave & Time Off" description="View leave balances and submit vacation requests." part="08" iconName="Palmtree" />
              </RoleRoute>
            }
          />
          <Route
            path="/my-payslips"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.MY_PAYSLIPS_VIEW}>
                <PlaceholderPage title="My Payslips" description="View and download your monthly payroll slips." part="11" iconName="FileSpreadsheet" />
              </RoleRoute>
            }
          />

          {/* Employee Master Management Routes (Part 04) */}
          <Route
            path="/employees"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.EMPLOYEES_VIEW}>
                <EmployeeListPage />
              </RoleRoute>
            }
          />
          <Route
            path="/employees/kanban"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.EMPLOYEES_VIEW}>
                <EmployeeListPage />
              </RoleRoute>
            }
          />
          <Route
            path="/employees/new"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.EMPLOYEES_CREATE}>
                <EmployeeFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.EMPLOYEES_VIEW}>
                <EmployeeDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/employees/:id/edit"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.EMPLOYEES_EDIT}>
                <EmployeeFormPage />
              </RoleRoute>
            }
          />

          {/* Organization Routes (Part 05) */}
          <Route
            path="/departments"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.DEPARTMENTS_VIEW}>
                <DepartmentListPage />
              </RoleRoute>
            }
          />
          <Route
            path="/departments/new"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.DEPARTMENTS_CREATE}>
                <DepartmentFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/departments/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.DEPARTMENTS_VIEW}>
                <DepartmentDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/departments/:id/edit"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.DEPARTMENTS_EDIT}>
                <DepartmentFormPage />
              </RoleRoute>
            }
          />

          <Route
            path="/job-positions"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.JOB_POSITIONS_VIEW}>
                <JobPositionListPage />
              </RoleRoute>
            }
          />
          <Route
            path="/job-positions/new"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.JOB_POSITIONS_CREATE}>
                <JobPositionFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/job-positions/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.JOB_POSITIONS_VIEW}>
                <JobPositionDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/job-positions/:id/edit"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.JOB_POSITIONS_EDIT}>
                <JobPositionFormPage />
              </RoleRoute>
            }
          />

          {/* Workforce Routes (Parts 06, 07, 08) */}
          <Route path="/contracts" element={<RoleRoute requiredPermission={PERMISSIONS.CONTRACTS_VIEW}><PlaceholderPage title="Employment Contracts" part="06" iconName="FileText" /></RoleRoute>} />
          <Route path="/contracts/new" element={<RoleRoute requiredPermission={PERMISSIONS.CONTRACTS_CREATE}><PlaceholderPage title="New Contract" part="06" iconName="Plus" /></RoleRoute>} />
          <Route path="/contracts/:id" element={<RoleRoute requiredPermission={PERMISSIONS.CONTRACTS_VIEW}><PlaceholderPage title="Contract Detail" part="06" iconName="FileText" /></RoleRoute>} />
          <Route path="/contracts/:id/edit" element={<RoleRoute requiredPermission={PERMISSIONS.CONTRACTS_EDIT}><PlaceholderPage title="Edit Contract" part="06" iconName="FileText" /></RoleRoute>} />

          <Route path="/schedules" element={<RoleRoute requiredPermission={PERMISSIONS.SCHEDULES_VIEW}><PlaceholderPage title="Working Schedules" part="06" iconName="CalendarClock" /></RoleRoute>} />
          <Route path="/schedules/new" element={<RoleRoute requiredPermission={PERMISSIONS.SCHEDULES_CREATE}><PlaceholderPage title="New Working Schedule" part="06" iconName="Plus" /></RoleRoute>} />
          <Route path="/schedules/:id" element={<RoleRoute requiredPermission={PERMISSIONS.SCHEDULES_VIEW}><PlaceholderPage title="Schedule Detail" part="06" iconName="CalendarClock" /></RoleRoute>} />
          <Route path="/schedules/:id/edit" element={<RoleRoute requiredPermission={PERMISSIONS.SCHEDULES_EDIT}><PlaceholderPage title="Edit Schedule" part="06" iconName="CalendarClock" /></RoleRoute>} />

          <Route path="/attendance" element={<RoleRoute requiredPermission={PERMISSIONS.ATTENDANCE_VIEW}><PlaceholderPage title="Attendance Tracker" part="07" iconName="Clock" /></RoleRoute>} />
          <Route path="/attendance/new" element={<RoleRoute requiredPermission={PERMISSIONS.ATTENDANCE_CREATE}><PlaceholderPage title="Log Attendance" part="07" iconName="Plus" /></RoleRoute>} />
          <Route path="/attendance/:id" element={<RoleRoute requiredPermission={PERMISSIONS.ATTENDANCE_VIEW}><PlaceholderPage title="Attendance Record" part="07" iconName="Clock" /></RoleRoute>} />

          <Route path="/time-off/requests" element={<RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_VIEW}><PlaceholderPage title="Time Off Requests" part="08" iconName="Palmtree" /></RoleRoute>} />
          <Route path="/time-off/requests/new" element={<RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_CREATE}><PlaceholderPage title="New Time Off Request" part="08" iconName="Plus" /></RoleRoute>} />
          <Route path="/time-off/requests/:id" element={<RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_VIEW}><PlaceholderPage title="Time Off Request Detail" part="08" iconName="Palmtree" /></RoleRoute>} />
          <Route path="/time-off/allocations" element={<RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_VIEW}><PlaceholderPage title="Leave Allocations" part="08" iconName="CalendarDays" /></RoleRoute>} />
          <Route path="/time-off/types" element={<RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_VIEW}><PlaceholderPage title="Leave Types" part="08" iconName="Sliders" /></RoleRoute>} />

          {/* Payroll Routes (Parts 09, 10, 11) */}
          <Route path="/payroll" element={<RoleRoute requiredPermission={PERMISSIONS.PAYRUNS_VIEW}><PlaceholderPage title="Payroll Overview" part="09" iconName="CircleDollarSign" /></RoleRoute>} />
          <Route path="/payroll/payruns" element={<RoleRoute requiredPermission={PERMISSIONS.PAYRUNS_VIEW}><PlaceholderPage title="Payruns" part="10" iconName="Receipt" /></RoleRoute>} />
          <Route path="/payroll/payruns/new" element={<RoleRoute requiredPermission={PERMISSIONS.PAYRUNS_CREATE}><PlaceholderPage title="Create New Payrun" part="10" iconName="Plus" /></RoleRoute>} />
          <Route path="/payroll/payruns/:id" element={<RoleRoute requiredPermission={PERMISSIONS.PAYRUNS_VIEW}><PlaceholderPage title="Payrun Details" part="10" iconName="Receipt" /></RoleRoute>} />
          <Route path="/payroll/payruns/:id/employees" element={<RoleRoute requiredPermission={PERMISSIONS.PAYRUNS_VIEW}><PlaceholderPage title="Payrun Employee List" part="10" iconName="Users" /></RoleRoute>} />

          <Route path="/payroll/payslips" element={<RoleRoute requiredPermission={PERMISSIONS.PAYSLIPS_VIEW}><PlaceholderPage title="Payslips Directory" part="11" iconName="FileSpreadsheet" /></RoleRoute>} />
          <Route path="/payroll/payslips/:id" element={<RoleRoute requiredPermission={PERMISSIONS.PAYSLIPS_VIEW}><PlaceholderPage title="Payslip Detail" part="11" iconName="FileSpreadsheet" /></RoleRoute>} />

          <Route path="/payroll/salary-structures" element={<RoleRoute requiredPermission={PERMISSIONS.SALARY_STRUCTURES_VIEW}><PlaceholderPage title="Salary Structures" part="09" iconName="Layers" /></RoleRoute>} />
          <Route path="/payroll/salary-rules" element={<RoleRoute requiredPermission={PERMISSIONS.SALARY_RULES_VIEW}><PlaceholderPage title="Salary Rules" part="09" iconName="Sliders" /></RoleRoute>} />
          <Route path="/payroll/salary-rule-categories" element={<RoleRoute requiredPermission={PERMISSIONS.SALARY_RULE_CATEGORIES_VIEW}><PlaceholderPage title="Salary Rule Categories" part="09" iconName="FolderKanban" /></RoleRoute>} />

          {/* Reports Routes (Part 12) */}
          <Route path="/reports" element={<RoleRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}><PlaceholderPage title="HR Analytics & Reports" part="12" iconName="BarChart3" /></RoleRoute>} />
          <Route path="/reports/payroll" element={<RoleRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}><PlaceholderPage title="Payroll Reports" part="12" iconName="BarChart3" /></RoleRoute>} />
          <Route path="/reports/employees" element={<RoleRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}><PlaceholderPage title="Employee Reports" part="12" iconName="BarChart3" /></RoleRoute>} />
          <Route path="/reports/attendance" element={<RoleRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}><PlaceholderPage title="Attendance Reports" part="12" iconName="BarChart3" /></RoleRoute>} />
          <Route path="/reports/time-off" element={<RoleRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}><PlaceholderPage title="Time Off Reports" part="12" iconName="BarChart3" /></RoleRoute>} />

          {/* Administration Routes (Part 13) */}
          <Route path="/admin/users" element={<RoleRoute requiredPermission={PERMISSIONS.USERS_VIEW}><PlaceholderPage title="System Users" part="13" iconName="UserCheck" /></RoleRoute>} />
          <Route path="/admin/users/:id" element={<RoleRoute requiredPermission={PERMISSIONS.USERS_VIEW}><PlaceholderPage title="User Detail" part="13" iconName="UserCheck" /></RoleRoute>} />
          <Route path="/admin/roles" element={<RoleRoute requiredPermission={PERMISSIONS.ROLES_VIEW}><PlaceholderPage title="Roles & Permissions" part="13" iconName="ShieldCheck" /></RoleRoute>} />
          <Route path="/admin/roles/:id" element={<RoleRoute requiredPermission={PERMISSIONS.ROLES_VIEW}><PlaceholderPage title="Role Detail" part="13" iconName="ShieldCheck" /></RoleRoute>} />
          <Route path="/admin/settings" element={<RoleRoute requiredPermission={PERMISSIONS.SETTINGS_VIEW}><PlaceholderPage title="System Settings" part="13" iconName="Settings" /></RoleRoute>} />

          {/* Explicit Error Routes */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/404" element={<NotFoundPage />} />

          {/* Fallback Catch-All Route */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};
