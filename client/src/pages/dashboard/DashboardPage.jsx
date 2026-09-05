import React from 'react';
import { Users, UserCheck, CalendarDays, DollarSign, TrendingUp, Plus, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Table } from '../../components/ui/Table';
import { useAuth } from '../../contexts/AuthContext';

export const DashboardPage = () => {
  const { user } = useAuth();

  const kpis = [
    {
      title: 'Total Employees',
      value: '248',
      change: '+12% from last month',
      icon: Users,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      title: 'Active Employees',
      value: '236',
      change: '95.1% operational workforce',
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Pending Time Off',
      value: '14',
      change: '8 requests require approval',
      icon: CalendarDays,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Monthly Payroll',
      value: '$184,250',
      change: 'September payrun processed',
      icon: DollarSign,
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  const recentEmployees = [
    { id: '1', name: 'Eleanor Vance', position: 'Senior Frontend Engineer', dept: 'Engineering', status: 'Active', joined: 'Sep 01, 2026' },
    { id: '2', name: 'Marcus Chen', position: 'Product Designer', dept: 'Design', status: 'Active', joined: 'Aug 28, 2026' },
    { id: '3', name: 'Sophia Martinez', position: 'HR Coordinator', dept: 'Human Resources', status: 'Pending', joined: 'Aug 24, 2026' },
    { id: '4', name: 'David Kim', position: 'Payroll Analyst', dept: 'Finance', status: 'Active', joined: 'Aug 15, 2026' },
  ];

  const columns = [
    {
      header: 'Employee Name',
      key: 'name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name}</div>
          <div className="text-[11px] text-slate-500">{row.position}</div>
        </div>
      ),
    },
    { header: 'Department', key: 'dept' },
    { header: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Joined Date', key: 'joined' },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name || 'User'} 👋`}
        description="Here is an overview of your organization's workforce, leave requests, and payroll metrics."
        action={
          <Button variant="primary" leftIcon={Plus}>
            Quick Action
          </Button>
        }
      />

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => {
          const IconComponent = kpi.icon;
          return (
            <Card key={kpi.title} hover className="flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`p-2.5 rounded-xl ${kpi.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{kpi.change}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Content Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Employees Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="none">
            <CardHeader className="p-4 sm:p-6 pb-4">
              <div>
                <CardTitle>Recent Team Members</CardTitle>
                <CardSubtitle>Newly added employees across departments</CardSubtitle>
              </div>
              <Button variant="ghost" size="sm" rightIcon={ArrowUpRight}>
                View All
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              <Table columns={columns} data={recentEmployees} />
            </CardBody>
          </Card>
        </div>

        {/* Quick System Announcements & Module Shortcuts */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div>
                <CardTitle>HRMS System Status</CardTitle>
                <CardSubtitle>Part 01 Foundation Active</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody className="text-xs space-y-3 pt-2 text-slate-600">
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <h5 className="font-semibold text-orange-900 mb-1">Design System Ready</h5>
                <p className="text-orange-800 leading-relaxed">
                  The application shell, navigation tokens, buttons, form controls, tables, and modal overlays are loaded.
                </p>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                <h5 className="font-semibold text-rose-900 mb-1">Light Pink & Orange Theme</h5>
                <p className="text-rose-800 leading-relaxed">
                  Clean SaaS surfaces with subtle borders, orange primary highlights, and light pink accents.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
