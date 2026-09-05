import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  departments: 'Departments',
  'job-positions': 'Job Positions',
  contracts: 'Contracts',
  schedules: 'Working Schedules',
  attendance: 'Attendance',
  'time-off': 'Time Off',
  requests: 'Requests',
  allocations: 'Allocations',
  types: 'Leave Types',
  payroll: 'Payroll',
  payruns: 'Payruns',
  payslips: 'Payslips',
  'salary-structures': 'Salary Structures',
  'salary-rules': 'Salary Rules',
  'salary-rule-categories': 'Rule Categories',
  reports: 'Reports',
  admin: 'Administration',
  users: 'Users',
  roles: 'Roles',
  settings: 'Settings',
  new: 'New',
  edit: 'Edit',
  preview: 'Preview',
  kanban: 'Board View',
};

export const Breadcrumb = ({ items, className = '' }) => {
  const location = useLocation();

  // Generate items dynamically if items prop is not manually supplied
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs =
    items ||
    pathSegments.map((segment, index) => {
      const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
      const label = ROUTE_LABELS[segment] || segment.replace(/-/g, ' ');
      return { label, path };
    });

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-slate-500 ${className}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link
            to="/dashboard"
            className="flex items-center gap-1 hover:text-orange-600 transition-colors text-slate-400"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <li key={crumb.path || idx} className="flex items-center gap-1.5 capitalize">
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              {isLast ? (
                <span className="font-semibold text-slate-800">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="hover:text-orange-600 transition-colors text-slate-500">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
