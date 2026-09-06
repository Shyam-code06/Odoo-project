import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Building2, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { formatCurrency } from '../../../utils/formatters';

const BAR_COLORS = [
  '#EA580C', // Orange 600
  '#F97316', // Orange 500
  '#FB923C', // Orange 400
  '#0284C7', // Sky 600
  '#0D9488', // Teal 600
  '#8B5CF6', // Purple 500
  '#EC4899', // Pink 500
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1 z-50">
        <p className="font-bold text-slate-100 flex items-center gap-1.5 pb-1 border-b border-slate-800">
          <Building2 className="w-3.5 h-3.5 text-orange-400" />
          <span>{data.departmentName}</span>
        </p>
        <p className="flex justify-between gap-4 text-slate-300 pt-1">
          <span>Net Salary Cost:</span>
          <span className="font-mono font-bold text-orange-400">{formatCurrency(data.salaryCost)}</span>
        </p>
        {data.grossSalary > 0 && (
          <p className="flex justify-between gap-4 text-slate-400">
            <span>Gross Expenditure:</span>
            <span className="font-mono">{formatCurrency(data.grossSalary)}</span>
          </p>
        )}
        <p className="flex justify-between gap-4 text-slate-400">
          <span>Headcount:</span>
          <span>{data.employeeCount} employee(s)</span>
        </p>
        {data.percentageOfTotal > 0 && (
          <p className="flex justify-between gap-4 text-slate-400">
            <span>Share of Payroll:</span>
            <span>{data.percentageOfTotal}%</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const SalaryCostByDepartmentChart = ({
  data = [],
  totalCost = 0,
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Salary Cost by Department</CardTitle>
              <CardSubtitle>Loading historical department payroll...</CardSubtitle>
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Salary Cost by Department</CardTitle>
              <CardSubtitle>Historical salary disbursement by department</CardSubtitle>
            </div>
          </div>
        </CardHeader>
        <CardBody className="py-6">
          <ErrorState
            title="Unable to load payroll analytics"
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Salary Cost by Department</CardTitle>
              <CardSubtitle>Historical salary disbursement by department</CardSubtitle>
            </div>
          </div>
        </CardHeader>
        <CardBody className="py-6">
          <EmptyState
            icon={Building2}
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Salary Cost by Department</CardTitle>
              <CardSubtitle>Historical net payroll distributed across departments</CardSubtitle>
            </div>
          </div>
          {totalCost > 0 && (
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-slate-400 font-medium block">Total Net Disbursed</span>
              <span className="text-sm font-bold font-mono text-slate-800">{formatCurrency(totalCost, true)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardBody className="pt-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="departmentName"
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₹${val >= 100000 ? `${(val / 100000).toFixed(0)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
              <Bar
                dataKey="salaryCost"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
};

export default SalaryCostByDepartmentChart;
