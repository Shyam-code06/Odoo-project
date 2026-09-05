import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { getTimeAwareGreeting } from '../../utils/formatters';
import { PageHeader } from '../../components/ui/PageHeader';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Select } from '../../components/ui/Select';
import { StatCard } from './components/StatCard';
import { AttendanceOverviewWidget } from './components/AttendanceOverviewWidget';
import { TimeOffRequestsWidget } from './components/TimeOffRequestsWidget';
import { UpcomingEventsWidget } from './components/UpcomingEventsWidget';
import { RecentActivityWidget } from './components/RecentActivityWidget';
import { PayrollOverviewWidget } from './components/PayrollOverviewWidget';
import { NeedsAttentionWidget } from './components/NeedsAttentionWidget';
import { QuickActionsWidget } from './components/QuickActionsWidget';

export const DashboardPage = () => {
  const { user, currentRole } = useAuth();
  const { data, loading, error, refresh, approveTimeOff, rejectTimeOff } = useDashboard();
  const [timeFilter, setTimeFilter] = useState('today');

  const greeting = getTimeAwareGreeting(user?.name || 'User');

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={greeting}
          description="Fetching live workforce statistics and organization metrics..."
        />
        <LoadingState variant="card" rows={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load dashboard metrics"
          description={error || 'An unexpected error occurred while loading your HRMS dashboard.'}
          onRetry={refresh}
        />
      </div>
    );
  }

  const {
    stats,
    attendanceSummary,
    timeOffRequests,
    upcomingEvents,
    recentActivities,
    payrollSummary,
    needsAttention,
    quickActions,
  } = data;

  return (
    <div className="space-y-6">
      {/* Top Header & Range Selector */}
      <PageHeader
        title={`${greeting}`}
        description={
          currentRole === 'Employee'
            ? "Here is your personal work summary, attendance check-in, and upcoming schedule."
            : "Here is an overview of your organization's workforce, attendance, and HR operations."
        }
        action={
          <div className="w-40">
            <Select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              options={[
                { label: 'Today', value: 'today' },
                { label: 'This Week', value: 'week' },
                { label: 'This Month', value: 'month' },
              ]}
              placeholder=""
            />
          </div>
        }
      />

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((st) => (
          <StatCard key={st.id} {...st} />
        ))}
      </div>

      {/* Needs Attention Alert Banner */}
      <NeedsAttentionWidget items={needsAttention} />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Attendance & Operations) */}
        <div className="lg:col-span-2 space-y-6">
          <AttendanceOverviewWidget summary={attendanceSummary} />
          <TimeOffRequestsWidget
            requests={timeOffRequests}
            onApprove={approveTimeOff}
            onReject={rejectTimeOff}
          />
          {payrollSummary && (currentRole.includes('Payroll') || currentRole === 'Admin') && (
            <PayrollOverviewWidget summary={payrollSummary} />
          )}
        </div>

        {/* Right Column (Events, Activities & Quick Actions) */}
        <div className="space-y-6">
          <QuickActionsWidget actions={quickActions} />
          <UpcomingEventsWidget events={upcomingEvents} />
          <RecentActivityWidget activities={recentActivities} />
        </div>
      </div>
    </div>
  );
};
