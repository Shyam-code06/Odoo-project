import React from 'react';
import { Card } from '../../ui/Card';
import { FileSpreadsheet, CheckCircle2, Clock, Wallet } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

export function PayslipSummaryCards({ metrics = {} }) {
  const total = metrics.total ?? 0;
  const generatedCount = metrics.generatedCount ?? 0;
  const paidCount = metrics.paidCount ?? 0;
  const totalNetPayroll = metrics.totalNetPayroll ?? 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Payslips */}
      <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Payslips</p>
          <h4 className="text-xl font-bold text-slate-800">{total}</h4>
        </div>
      </Card>

      {/* Generated */}
      <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Generated</p>
          <h4 className="text-xl font-bold text-slate-800">{generatedCount}</h4>
        </div>
      </Card>

      {/* Paid */}
      <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Paid</p>
          <h4 className="text-xl font-bold text-slate-800">{paidCount}</h4>
        </div>
      </Card>

      {/* Total Net Payroll */}
      <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Net Payout</p>
          <h4 className="text-xl font-bold text-slate-800">{formatCurrency(totalNetPayroll)}</h4>
        </div>
      </Card>
    </div>
  );
}

export default PayslipSummaryCards;
