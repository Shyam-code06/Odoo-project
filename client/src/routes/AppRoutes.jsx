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
import { PlaceholderPage } from '../pages/placeholder/PlaceholderPage';

import { ROLES } from '../config/permissions';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Main Authenticated HRMS App Shell Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Employees Routes (Part 04) */}
          <Route
            path="/employees"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER]}>
                <PlaceholderPage title="Employees List" description="Manage complete employee directory, profiles and details." part="04" iconName="Users" />
              </RoleRoute>
            }
          />
          <Route path="/employees/kanban" element={<PlaceholderPage title="Employees Kanban Board" part="04" iconName="Kanban" />} />
          <Route path="/employees/new" element={<PlaceholderPage title="Add New Employee" part="04" iconName="UserPlus" />} />
          <Route path="/employees/:id" element={<PlaceholderPage title="Employee Profile Detail" part="04" iconName="User" />} />
          <Route path="/employees/:id/edit" element={<PlaceholderPage title="Edit Employee Profile" part="04" iconName="UserCheck" />} />

          {/* Organization Routes (Part 05) */}
          <Route path="/departments" element={<PlaceholderPage title="Departments" description="Configure company departments and structural hierarchy." part="05" iconName="Building2" />} />
          <Route path="/departments/new" element={<PlaceholderPage title="New Department" part="05" iconName="Plus" />} />
          <Route path="/departments/:id" element={<PlaceholderPage title="Department Details" part="05" iconName="Building2" />} />
          <Route path="/job-positions" element={<PlaceholderPage title="Job Positions" description="Manage job titles, pay grades and position roles." part="05" iconName="Briefcase" />} />
          <Route path="/job-positions/new" element={<PlaceholderPage title="New Job Position" part="05" iconName="Plus" />} />
          <Route path="/job-positions/:id" element={<PlaceholderPage title="Job Position Details" part="05" iconName="Briefcase" />} />

          {/* Workforce Routes (Parts 06, 07, 08) */}
          <Route path="/contracts" element={<PlaceholderPage title="Employment Contracts" part="06" iconName="FileText" />} />
          <Route path="/contracts/new" element={<PlaceholderPage title="New Contract" part="06" iconName="Plus" />} />
          <Route path="/contracts/:id" element={<PlaceholderPage title="Contract Detail" part="06" iconName="FileText" />} />
          <Route path="/contracts/:id/edit" element={<PlaceholderPage title="Edit Contract" part="06" iconName="FileText" />} />

          <Route path="/schedules" element={<PlaceholderPage title="Working Schedules" part="06" iconName="CalendarClock" />} />
          <Route path="/schedules/new" element={<PlaceholderPage title="New Working Schedule" part="06" iconName="Plus" />} />
          <Route path="/schedules/:id" element={<PlaceholderPage title="Schedule Detail" part="06" iconName="CalendarClock" />} />
          <Route path="/schedules/:id/edit" element={<PlaceholderPage title="Edit Schedule" part="06" iconName="CalendarClock" />} />

          <Route path="/attendance" element={<PlaceholderPage title="Attendance Tracker" part="07" iconName="Clock" />} />
          <Route path="/attendance/new" element={<PlaceholderPage title="Log Attendance" part="07" iconName="Plus" />} />
          <Route path="/attendance/:id" element={<PlaceholderPage title="Attendance Record" part="07" iconName="Clock" />} />
          <Route path="/attendance/:id/edit" element={<PlaceholderPage title="Edit Attendance" part="07" iconName="Clock" />} />

          <Route path="/time-off/requests" element={<PlaceholderPage title="Time Off Requests" part="08" iconName="Palmtree" />} />
          <Route path="/time-off/requests/new" element={<PlaceholderPage title="New Time Off Request" part="08" iconName="Plus" />} />
          <Route path="/time-off/requests/:id" element={<PlaceholderPage title="Time Off Request Detail" part="08" iconName="Palmtree" />} />
          <Route path="/time-off/allocations" element={<PlaceholderPage title="Leave Allocations" part="08" iconName="CalendarDays" />} />
          <Route path="/time-off/allocations/new" element={<PlaceholderPage title="New Leave Allocation" part="08" iconName="Plus" />} />
          <Route path="/time-off/allocations/:id" element={<PlaceholderPage title="Allocation Detail" part="08" iconName="CalendarDays" />} />
          <Route path="/time-off/types" element={<PlaceholderPage title="Leave Types" part="08" iconName="Sliders" />} />
          <Route path="/time-off/types/new" element={<PlaceholderPage title="New Leave Type" part="08" iconName="Plus" />} />
          <Route path="/time-off/types/:id" element={<PlaceholderPage title="Leave Type Detail" part="08" iconName="Sliders" />} />

          {/* Payroll Routes (Parts 09, 10, 11) */}
          <Route path="/payroll" element={<PlaceholderPage title="Payroll Overview" part="09" iconName="CircleDollarSign" />} />
          <Route path="/payroll/payruns" element={<PlaceholderPage title="Payruns" part="10" iconName="Receipt" />} />
          <Route path="/payroll/payruns/new" element={<PlaceholderPage title="Create New Payrun" part="10" iconName="Plus" />} />
          <Route path="/payroll/payruns/:id" element={<PlaceholderPage title="Payrun Details" part="10" iconName="Receipt" />} />
          <Route path="/payroll/payruns/:id/employees" element={<PlaceholderPage title="Payrun Employee List" part="10" iconName="Users" />} />

          <Route path="/payroll/payslips" element={<PlaceholderPage title="Payslips" part="11" iconName="FileSpreadsheet" />} />
          <Route path="/payroll/payslips/:id" element={<PlaceholderPage title="Payslip Detail" part="11" iconName="FileSpreadsheet" />} />
          <Route path="/payroll/payslips/:id/preview" element={<PlaceholderPage title="Payslip PDF Preview" part="11" iconName="FileText" />} />

          <Route path="/payroll/salary-structures" element={<PlaceholderPage title="Salary Structures" part="09" iconName="Layers" />} />
          <Route path="/payroll/salary-structures/new" element={<PlaceholderPage title="New Salary Structure" part="09" iconName="Plus" />} />
          <Route path="/payroll/salary-structures/:id" element={<PlaceholderPage title="Salary Structure Detail" part="09" iconName="Layers" />} />

          <Route path="/payroll/salary-rules" element={<PlaceholderPage title="Salary Rules" part="09" iconName="Sliders" />} />
          <Route path="/payroll/salary-rules/new" element={<PlaceholderPage title="New Salary Rule" part="09" iconName="Plus" />} />
          <Route path="/payroll/salary-rules/:id" element={<PlaceholderPage title="Salary Rule Detail" part="09" iconName="Sliders" />} />

          <Route path="/payroll/salary-rule-categories" element={<PlaceholderPage title="Salary Rule Categories" part="09" iconName="FolderKanban" />} />
          <Route path="/payroll/salary-rule-categories/new" element={<PlaceholderPage title="New Rule Category" part="09" iconName="Plus" />} />

          {/* Reports Routes (Part 12) */}
          <Route path="/reports" element={<PlaceholderPage title="HR Analytics & Reports" part="12" iconName="BarChart3" />} />
          <Route path="/reports/payroll" element={<PlaceholderPage title="Payroll Reports" part="12" iconName="BarChart3" />} />
          <Route path="/reports/employees" element={<PlaceholderPage title="Employee Reports" part="12" iconName="BarChart3" />} />
          <Route path="/reports/attendance" element={<PlaceholderPage title="Attendance Reports" part="12" iconName="BarChart3" />} />
          <Route path="/reports/time-off" element={<PlaceholderPage title="Time Off Reports" part="12" iconName="BarChart3" />} />

          {/* Administration Routes (Part 13) */}
          <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <PlaceholderPage title="System Users" part="13" iconName="UserCheck" />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <PlaceholderPage title="User Detail" part="13" iconName="UserCheck" />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <PlaceholderPage title="Roles & Permissions" part="13" iconName="ShieldCheck" />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/roles/:id"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <PlaceholderPage title="Role Detail" part="13" iconName="ShieldCheck" />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <PlaceholderPage title="System Settings" part="13" iconName="Settings" />
              </RoleRoute>
            }
          />

          {/* Fallback 404 Route */}
          <Route path="*" element={<PlaceholderPage title="404 - Page Not Found" description="The requested route does not exist." part="01" iconName="AlertCircle" />} />
        </Route>
      </Route>
    </Routes>
  );
};
