import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { formatCurrency } from '../../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1 z-50">
        <p className="font-bold text-slate-100 flex items-center gap-1.5 pb-1 border-b border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-orange-400" />
          <span>{data.monthLabel || data.month}</span>
        </p>
        <p className="flex justify-between gap-4 text-slate-300 pt-1">
          <span>Net Disbursed:</span>
          <span className="font-mono font-bold text-orange-400">{formatCurrency(data.netSalary)}</span>
        </p>
        {data.grossSalary > 0 && (
          <p className="flex justify-between gap-4 text-slate-400">
            <span>Gross Payroll:</span>
            <span className="font-mono">{formatCurrency(data.grossSalary)}</span>
          </p>
        )}
        <p className="flex justify-between gap-4 text-slate-400">
          <span>Payslips Issued:</span>
          <span>{data.payslipCount} payslip(s)</span>
        </p>
        {data.employeeCount > 0 && (
          <p className="flex justify-between gap-4 text-slate-400">
            <span>Beneficiaries:</span>
            <span>{data.employeeCount} employee(s)</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const MonthlyNetSalaryTrendChart = ({
  data = [],
  totalDisbursed = 0,
  loading = false,
  error = null,
  onRetry = null,
}) => {
  if (loading) {
    return (
      <Card className="h-full flex flex-col justify-between">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Monthly Net Salary Trends</CardTitle>
              <CardSubtitle>Loading historical payroll trends...</CardSubtitle>
            </div>
          </div>
        </CardHeader>
        <CardBody className="py-12 flex items-center justify-center">
          <div className="space-y-3 w-full max-w-md animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-32 bg-slate-100 rounded-lg"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full flex flex-col justify-between">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Monthly Net Salary Trends</CardTitle>
              <CardSubtitle>Historical monthly net payroll disbursement</CardSubtitle>
            </div>
          </div>
        </CardHeader>
        <CardBody className="py-6">
          <ErrorState
            title="Unable to load payroll trends"
            description={error}
            onRetry={onRetry}
          />
        </CardBody>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="h-full flex flex-col justify-between">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Monthly Net Salary Trends</CardTitle>
              <CardSubtitle>Historical monthly net payroll disbursement</CardSubtitle>
            </div>
          </div>
        </CardHeader>
        <CardBody className="py-6">
          <EmptyState
            icon={TrendingUp}
            title="No payroll history available"
            description="There is not enough historical payroll data to display this chart."
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Monthly Net Salary Trends</CardTitle>
              <CardSubtitle>Chronological time-series net payroll disbursements</CardSubtitle>
            </div>
          </div>
          {totalDisbursed > 0 && (
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-slate-400 font-medium block">All-time Net Payroll</span>
              <span className="text-sm font-bold font-mono text-slate-800">{formatCurrency(totalDisbursed, true)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardBody className="pt-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="netSalaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EA580C" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₹${val >= 100000 ? `${(val / 100000).toFixed(0)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="netSalary"
                stroke="#EA580C"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#netSalaryGradient)"
                activeDot={{ r: 6, fill: '#EA580C', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
};

export default MonthlyNetSalaryTrendChart;
