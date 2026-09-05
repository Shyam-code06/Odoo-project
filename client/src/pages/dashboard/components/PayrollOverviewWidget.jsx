import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleDollarSign, ArrowUpRight, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency } from '../../../utils/formatters';

export const PayrollOverviewWidget = ({ summary }) => {
  const navigate = useNavigate();

  if (!summary) return null;

  const percentProcessed = Math.round(
    (summary.processedCount / summary.totalEmployees) * 100
  );

  return (
    <Card className="h-full flex flex-col justify-between bg-gradient-to-br from-white to-orange-50/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-500 text-white shadow-xs">
            <CircleDollarSign className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Payroll Cycle Summary</CardTitle>
            <CardSubtitle>{summary.period}</CardSubtitle>
          </div>
        </div>
        <Badge variant="primary">{summary.status}</Badge>
      </CardHeader>

      <CardBody className="space-y-4 pt-2">
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-500 font-medium">Gross Monthly Payroll</span>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(summary.grossPayroll, true)}
            </span>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-600 mb-1 font-medium">
              <span>{summary.processedCount} Processed</span>
              <span>{summary.pendingCount} Pending</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${percentProcessed}%` }}
                className="bg-orange-500 h-full rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            <span>
              <strong>{summary.totalEmployees}</strong> Active Employees
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            rightIcon={ArrowUpRight}
            onClick={() => navigate('/payroll/payruns')}
          >
            View Payrun
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
