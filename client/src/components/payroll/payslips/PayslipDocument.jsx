import React from 'react';
import { formatCurrency, formatDate, formatPayrollPeriod } from '../../../utils/formatters';
import { groupPayslipLines } from '../../../utils/payslipGrouping';
import { Badge } from '../../ui/Badge';

export function PayslipDocument({
  payslip,
  employee,
  contract,
  salaryStructure,
  payrun,
  lines = [],
}) {
  if (!payslip) return null;

  const { earnings, deductions, earningsTotal, deductionsTotal } = groupPayslipLines(lines);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 print:border-none print:p-0 print:shadow-none font-sans text-slate-800">
      {/* 1. Company Header & Statement Identifier */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600 text-white font-bold text-base flex items-center justify-center">
              H
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">HRMS Enterprise OXP</span>
          </div>
          <p className="text-xs text-slate-500">123 Technology Innovation Park, Suite 400, Bangalore, KA - 560103</p>
        </div>

        <div className="text-left sm:text-right space-y-1">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Salary Statement</h2>
          <div className="flex items-center sm:justify-end gap-2 text-xs font-mono text-slate-600">
            <span>Ref: {payslip.id}</span>
            <Badge variant={payslip.status === 'paid' ? 'success' : 'secondary'} className="text-[10px] capitalize">
              {payslip.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* 2. Employee & Payroll Period Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-xs">
        {/* Employee Details */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Employee Details</p>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-slate-500 font-medium">Name:</span>
            <span className="col-span-2 font-bold text-slate-900">{employee?.fullName || 'Employee'}</span>

            <span className="text-slate-500 font-medium">Code:</span>
            <span className="col-span-2 font-mono text-slate-700">{employee?.employeeCode || '—'}</span>

            <span className="text-slate-500 font-medium">Department:</span>
            <span className="col-span-2 text-slate-700">{employee?.departmentName || 'Engineering'}</span>

            <span className="text-slate-500 font-medium">Position:</span>
            <span className="col-span-2 text-slate-700">{employee?.jobPositionTitle || 'Software Engineer'}</span>
          </div>
        </div>

        {/* Contract & Payrun Context */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payroll Context</p>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-slate-500 font-medium">Payroll Period:</span>
            <span className="col-span-2 font-bold text-slate-900">
              {formatPayrollPeriod(payslip.periodStart, payslip.periodEnd)}
            </span>

            <span className="text-slate-500 font-medium">Payrun Ref:</span>
            <span className="col-span-2 font-mono text-slate-700">{payrun?.name || payslip.payrunId}</span>

            <span className="text-slate-500 font-medium">Structure:</span>
            <span className="col-span-2 text-slate-700">{salaryStructure?.name || 'Regular Structure'}</span>

            <span className="text-slate-500 font-medium">Employment:</span>
            <span className="col-span-2 text-slate-700">{contract?.employmentType || 'Full-time'}</span>
          </div>
        </div>
      </div>

      {/* 3. Earnings & Deductions Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Earnings Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-2 border-b-2 border-orange-500">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Earnings</h4>
            <span className="text-xs font-bold text-slate-900">{formatCurrency(earningsTotal || payslip.grossSalary)}</span>
          </div>

          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-[11px] text-slate-400 font-semibold uppercase border-b border-slate-100">
                <th className="py-2">Component</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {earnings.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-3 text-center text-slate-400 italic">No earnings items recorded</td>
                </tr>
              ) : (
                earnings.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50/50">
                    <td className="py-2 font-medium text-slate-700">
                      <div>{line.name}</div>
                      {line.calculationDetails && (
                        <div className="text-[10px] text-slate-400 font-mono">{line.calculationDetails}</div>
                      )}
                    </td>
                    <td className="py-2 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(line.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Deductions Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-400">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Deductions</h4>
            <span className="text-xs font-bold text-slate-900">{formatCurrency(deductionsTotal || payslip.totalDeductions)}</span>
          </div>

          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-[11px] text-slate-400 font-semibold uppercase border-b border-slate-100">
                <th className="py-2">Deduction Item</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deductions.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-3 text-center text-slate-400 italic">No deduction items recorded</td>
                </tr>
              ) : (
                deductions.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50/50">
                    <td className="py-2 font-medium text-slate-700">
                      <div>{line.name}</div>
                      {line.calculationDetails && (
                        <div className="text-[10px] text-slate-400 font-mono">{line.calculationDetails}</div>
                      )}
                    </td>
                    <td className="py-2 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(line.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Salary Totals & Net Pay Highlight Box */}
      <div className="pt-4 border-t border-slate-200">
        <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-orange-800">Net Take-Home Pay</p>
            <p className="text-xs text-orange-600">
              Gross ({formatCurrency(payslip.grossSalary)}) - Total Deductions ({formatCurrency(payslip.totalDeductions)})
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-orange-700 font-mono block">
              {formatCurrency(payslip.netSalary)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Statement Footer & Digital Verification */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>This is a computer-generated document and does not require a physical signature.</span>
        <span>Generated: {formatDate(payslip.createdAt)}</span>
      </div>
    </div>
  );
}

export default PayslipDocument;
