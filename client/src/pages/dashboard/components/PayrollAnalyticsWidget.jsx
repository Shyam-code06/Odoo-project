import React from 'react';
import { CircleDollarSign, RefreshCw, BarChart2 } from 'lucide-react';
import { usePayrollAnalytics } from '../../../hooks/usePayrollAnalytics';
import { SalaryCostByDepartmentChart } from './SalaryCostByDepartmentChart';
import { MonthlyNetSalaryTrendChart } from './MonthlyNetSalaryTrendChart';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export const PayrollAnalyticsWidget = () => {
  const {
    departmentData,
    departmentSummary,
    trendData,
    trendSummary,
    loading,
    error,
    refresh
  } = usePayrollAnalytics();

  return (
    <div className="space-y-4 pt-2">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-600 text-white shadow-xs">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Payroll & Salary Analytics</h2>
              <Badge variant="primary" className="text-[10px]">
                Live Database
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Historical workforce expenditure and monthly take-home salary distribution
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="gap-1.5 text-xs text-slate-600 self-end sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </Button>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <SalaryCostByDepartmentChart
          data={departmentData}
          totalCost={departmentSummary.totalSalaryCost}
          loading={loading}
          error={error}
          onRetry={refresh}
        />

        <MonthlyNetSalaryTrendChart
          data={trendData}
          totalDisbursed={trendSummary.totalNetDisbursed}
          loading={loading}
          error={error}
          onRetry={refresh}
        />
      </div>
    </div>
  );
};

export default PayrollAnalyticsWidget;
