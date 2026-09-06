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

import { ContractListPage } from '../pages/contracts/ContractListPage';
import { ContractDetailsPage } from '../pages/contracts/ContractDetailsPage';
import { ContractFormPage } from '../pages/contracts/ContractFormPage';

import { WorkingScheduleListPage } from '../pages/schedules/WorkingScheduleListPage';
import { WorkingScheduleDetailsPage } from '../pages/schedules/WorkingScheduleDetailsPage';
import { WorkingScheduleFormPage } from '../pages/schedules/WorkingScheduleFormPage';

import { AttendanceListPage } from '../pages/attendance/AttendanceListPage';
import { AttendanceDetailsPage } from '../pages/attendance/AttendanceDetailsPage';
import { AttendanceFormPage } from '../pages/attendance/AttendanceFormPage';

import { TimeOffTypesPage } from '../pages/timeOff/types/TimeOffTypesPage';
import { TimeOffTypeDetailsPage } from '../pages/timeOff/types/TimeOffTypeDetailsPage';
import { TimeOffTypeFormPage } from '../pages/timeOff/types/TimeOffTypeFormPage';

import { AllocationsPage } from '../pages/timeOff/allocations/AllocationsPage';
import { AllocationDetailsPage } from '../pages/timeOff/allocations/AllocationDetailsPage';
import { AllocationFormPage } from '../pages/timeOff/allocations/AllocationFormPage';

import { TimeOffRequestsPage } from '../pages/timeOff/requests/TimeOffRequestsPage';
import { TimeOffRequestDetailsPage } from '../pages/timeOff/requests/TimeOffRequestDetailsPage';
import { TimeOffRequestFormPage } from '../pages/timeOff/requests/TimeOffRequestFormPage';

import SalaryStructuresPage from '../pages/payroll/structures/SalaryStructuresPage';
import SalaryStructureDetailsPage from '../pages/payroll/structures/SalaryStructureDetailsPage';
import SalaryStructureFormPage from '../pages/payroll/structures/SalaryStructureFormPage';

import SalaryRulesPage from '../pages/payroll/rules/SalaryRulesPage';
import SalaryRuleDetailsPage from '../pages/payroll/rules/SalaryRuleDetailsPage';
import SalaryRuleFormPage from '../pages/payroll/rules/SalaryRuleFormPage';
import SalaryRuleCategoriesPage from '../pages/payroll/categories/SalaryRuleCategoriesPage';

import PayrunsPage from '../pages/payroll/payruns/PayrunsPage';
import PayrunWizardPage from '../pages/payroll/payruns/PayrunWizardPage';
import PayrunProcessingPage from '../pages/payroll/payruns/PayrunProcessingPage';

import PayslipListPage from '../pages/payroll/payslips/PayslipListPage';
import PayslipDetailsPage from '../pages/payroll/payslips/PayslipDetailsPage';
import UserManagementPage from '../pages/admin/UserManagementPage';

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
                <AttendanceListPage isSelfService={true} />
              </RoleRoute>
            }
          />
          <Route
            path="/my-time-off"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.MY_TIME_OFF_VIEW}>
                <TimeOffRequestsPage isSelfService={true} />
              </RoleRoute>
            }
          />
          <Route
            path="/my-payslips"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.MY_PAYSLIPS_VIEW}>
                <PayslipListPage isSelfService={true} />
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

          {/* Workforce Routes (Contracts, Attendance, Time Off) */}
          <Route
            path="/contracts"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.CONTRACTS_VIEW}>
                <ContractListPage />
              </RoleRoute>
            }
          />
          <Route
            path="/contracts/new"
            element={
              <RoleRoute strictRoles={[ROLES.HR_PAYROLL_MANAGER]}>
                <ContractFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/contracts/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.CONTRACTS_VIEW}>
                <ContractDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/contracts/:id/edit"
            element={
              <RoleRoute strictRoles={[ROLES.HR_PAYROLL_MANAGER]}>
                <ContractFormPage />
              </RoleRoute>
            }
          />

          {/* Working Schedules (Part 06) */}
          <Route
            path="/working-schedules"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SCHEDULES_VIEW}>
                <WorkingScheduleListPage />
              </RoleRoute>
            }
          />
          <Route
            path="/working-schedules/new"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SCHEDULES_CREATE}>
                <WorkingScheduleFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/working-schedules/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SCHEDULES_VIEW}>
                <WorkingScheduleDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/working-schedules/:id/edit"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SCHEDULES_EDIT}>
                <WorkingScheduleFormPage />
              </RoleRoute>
            }
          />

          {/* Legacy / Alias /schedules routes */}
          <Route
            path="/schedules"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SCHEDULES_VIEW}>
                <WorkingScheduleListPage />
              </RoleRoute>
            }
          />
          <Route
            path="/schedules/new"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SCHEDULES_CREATE}>
                <WorkingScheduleFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/schedules/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SCHEDULES_VIEW}>
                <WorkingScheduleDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/schedules/:id/edit"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SCHEDULES_EDIT}>
                <WorkingScheduleFormPage />
              </RoleRoute>
            }
          />

          {/* Attendance Management Routes (Part 07) */}
          <Route
            path="/attendance"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.ATTENDANCE_VIEW}>
                <AttendanceListPage />
              </RoleRoute>
            }
          />
          <Route
            path="/attendance/new"
            element={
              <RoleRoute strictRoles={[ROLES.ADMIN]}>
                <AttendanceFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/attendance/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.ATTENDANCE_VIEW}>
                <AttendanceDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/attendance/:id/edit"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.ATTENDANCE_EDIT}>
                <AttendanceFormPage />
              </RoleRoute>
            }
          />

          {/* Time Off Management Routes (Part 08) */}
          <Route
            path="/time-off/types"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_VIEW}>
                <TimeOffTypesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/time-off/types/new"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_TYPE_CREATE}>
                <TimeOffTypeFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/time-off/types/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_VIEW}>
                <TimeOffTypeDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/time-off/types/:id/edit"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_TYPE_EDIT}>
                <TimeOffTypeFormPage />
              </RoleRoute>
            }
          />

          <Route
            path="/time-off/allocations"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_VIEW}>
                <AllocationsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/time-off/allocations/new"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_ALLOCATION_CREATE}>
                <AllocationFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/time-off/allocations/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_VIEW}>
                <AllocationDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/time-off/allocations/:id/edit"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_ALLOCATION_EDIT}>
                <AllocationFormPage />
              </RoleRoute>
            }
          />

          <Route
            path="/time-off/requests"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_VIEW}>
                <TimeOffRequestsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/time-off/requests/new"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_CREATE}>
                <TimeOffRequestFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/time-off/requests/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_VIEW}>
                <TimeOffRequestDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/time-off/requests/:id/edit"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.TIME_OFF_REQUEST_EDIT}>
                <TimeOffRequestFormPage />
              </RoleRoute>
            }
          />

          {/* Payroll Routes (Parts 09, 10, 11) */}
          <Route path="/payroll" element={<RoleRoute requiredPermission={PERMISSIONS.PAYRUNS_VIEW}><PayrunsPage /></RoleRoute>} />
          <Route
            path="/payroll/payruns"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.PAYRUNS_VIEW}>
                <PayrunsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/payruns/new"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.PAYRUNS_CREATE}>
                <PayrunWizardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/payruns/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.PAYRUNS_VIEW}>
                <PayrunProcessingPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/payruns/:id/employees"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.PAYRUNS_VIEW}>
                <PayrunProcessingPage />
              </RoleRoute>
            }
          />

          <Route
            path="/payroll/payslips"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.PAYSLIPS_VIEW}>
                <PayslipListPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/payslips/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.PAYSLIPS_VIEW}>
                <PayslipDetailsPage />
              </RoleRoute>
            }
          />

          {/* Salary Structures (Part 09) */}
          <Route
            path="/payroll/salary-structures"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_STRUCTURES_VIEW}>
                <SalaryStructuresPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/structures"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_STRUCTURES_VIEW}>
                <SalaryStructuresPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/salary-structures/new"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_STRUCTURES_CREATE}>
                <SalaryStructureFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/structures/new"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_STRUCTURES_CREATE}>
                <SalaryStructureFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/salary-structures/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_STRUCTURES_VIEW}>
                <SalaryStructureDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/structures/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_STRUCTURES_VIEW}>
                <SalaryStructureDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/salary-structures/:id/edit"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_STRUCTURES_EDIT}>
                <SalaryStructureFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/structures/:id/edit"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_STRUCTURES_EDIT}>
                <SalaryStructureFormPage />
              </RoleRoute>
            }
          />

          {/* Salary Rules (Part 09) */}
          <Route
            path="/payroll/salary-rules"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_RULES_VIEW}>
                <SalaryRulesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/rules"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_RULES_VIEW}>
                <SalaryRulesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/salary-rules/new"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_RULES_CREATE}>
                <SalaryRuleFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/rules/new"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_RULES_CREATE}>
                <SalaryRuleFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/salary-rules/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_RULES_VIEW}>
                <SalaryRuleDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/rules/:id"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_RULES_VIEW}>
                <SalaryRuleDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/salary-rules/:id/edit"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_RULES_EDIT}>
                <SalaryRuleFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/rules/:id/edit"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_RULES_EDIT}>
                <SalaryRuleFormPage />
              </RoleRoute>
            }
          />
          {/* Salary Rule Categories (Part 09) */}
          <Route
            path="/payroll/salary-rule-categories"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_RULE_CATEGORIES_VIEW}>
                <SalaryRuleCategoriesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/rule-categories"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_RULE_CATEGORIES_VIEW}>
                <SalaryRuleCategoriesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/categories"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_RULE_CATEGORIES_VIEW}>
                <SalaryRuleCategoriesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/salary-categories"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_RULE_CATEGORIES_VIEW}>
                <SalaryRuleCategoriesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payroll/rules/categories"
            element={
              <RoleRoute requiredPermission={PERMISSIONS.SALARY_RULE_CATEGORIES_VIEW}>
                <SalaryRuleCategoriesPage />
              </RoleRoute>
            }
          />

          {/* Reports Routes */}
          <Route path="/reports" element={<Navigate to="/dashboard" replace />} />
          <Route path="/reports/*" element={<Navigate to="/dashboard" replace />} />

          {/* Administration Routes (Part 13) */}
          <Route path="/admin/users" element={<RoleRoute requiredPermission={PERMISSIONS.USERS_VIEW}><UserManagementPage /></RoleRoute>} />
          <Route path="/admin/users/:id" element={<RoleRoute requiredPermission={PERMISSIONS.USERS_VIEW}><UserManagementPage /></RoleRoute>} />
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
