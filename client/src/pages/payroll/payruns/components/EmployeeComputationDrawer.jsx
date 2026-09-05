import React from 'react';
import { Modal } from '../../../../components/ui/Modal';
import { Badge } from '../../../../components/ui/Badge';
import { Table } from '../../../../components/ui/Table';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Calculator, ArrowRight, Info, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../../../utils/formatters';

export function EmployeeComputationDrawer({ isOpen, onClose, payrunEmployee }) {
  if (!payrunEmployee) return null;

  const { employee, contract, payslip, errorMessage } = payrunEmployee;
  const lines = payslip ? payslip.lines || [] : [];

  const earningLines = lines.filter((l) => l.category !== 'DED' && l.category !== 'TAX' && l.code !== 'GROSS' && l.code !== 'NET');
  const deductionLines = lines.filter((l) => l.category === 'DED' || l.category === 'TAX');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payslip Calculation Breakdown - ${employee?.fullName || 'Employee'}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Employee & Contract Context */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Employee</span>
            <span className="font-bold text-slate-800">{employee?.fullName}</span>
            <span className="text-[10px] text-slate-400 font-mono block">{employee?.employee_code}</span>
          </div>

          <div>
            <span className="text-slate-500 block">Department / Role</span>
            <span className="font-semibold text-slate-800">{employee?.departmentName}</span>
            <span className="text-[10px] text-slate-500 block">{employee?.jobPositionTitle}</span>
          </div>

          <div>
            <span className="text-slate-500 block">Contract & Wage</span>
            <Badge variant="outline" className="font-mono text-[10px] bg-white">
              {contract?.contract_code || 'CON'}
            </Badge>
            <span className="font-bold text-slate-800 block mt-0.5">{formatCurrency(contract?.wage || 0)}</span>
          </div>

          <div>
            <span className="text-slate-500 block">Computation Status</span>
            <Badge variant={payrunEmployee.status === 'computed' ? 'success' : 'danger'} className="mt-1">
              {payrunEmployee.status}
            </Badge>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold block">Computation Error</span>
              {errorMessage}
            </div>
          </div>
        )}

        {!payslip ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Payroll has not been computed for this employee yet. Click "Compute Payroll" on the payrun processing screen.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Rule Sequence Execution Table */}
            <div>
              <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-2">
                Executed Salary Rule Sequence
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <Table>
                  <Table.Header>
                    <Table.Row className="bg-slate-50/80">
                      <Table.HeaderCell className="w-14">Seq</Table.HeaderCell>
                      <Table.HeaderCell>Rule Component</Table.HeaderCell>
                      <Table.HeaderCell>Code</Table.HeaderCell>
                      <Table.HeaderCell>Category</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Calculated Amount</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {lines.map((line) => {
                      const isDeduction = line.category === 'DED' || line.category === 'TAX';
                      const isSummary = line.code === 'GROSS' || line.code === 'NET';

                      return (
                        <Table.Row key={line.id} className={`hover:bg-slate-50/60 transition-colors ${isSummary ? 'bg-orange-50/40 font-bold' : ''}`}>
                          <Table.Cell>
                            <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                              {String(line.sequence).padStart(2, '0')}
                            </span>
                          </Table.Cell>

                          <Table.Cell>
                            <span className={`text-xs ${isSummary ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                              {line.name}
                            </span>
                          </Table.Cell>

                          <Table.Cell>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {line.code}
                            </Badge>
                          </Table.Cell>

                          <Table.Cell>
                            <Badge variant="secondary" className="text-[10px]">
                              {line.category}
                            </Badge>
                          </Table.Cell>

                          <Table.Cell className="text-right">
                            <span className={`font-mono text-xs font-semibold ${isDeduction ? 'text-red-600' : 'text-slate-800'}`}>
                              {isDeduction ? `-${formatCurrency(line.amount)}` : formatCurrency(line.amount)}
                            </span>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
              </div>
            </div>

            {/* Summary Totals Banner */}
            <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs text-orange-100 uppercase tracking-wider font-medium">Net Take-Home Pay</span>
                <h3 className="text-2xl font-bold">{formatCurrency(payslip.netSalary)}</h3>
              </div>

              <div className="text-right text-xs text-orange-100 space-y-0.5">
                <div>Gross Earnings: <strong>{formatCurrency(payslip.grossSalary)}</strong></div>
                <div>Total Deductions: <strong>-{formatCurrency(payslip.totalDeductions)}</strong></div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Breakdown
          </Button>
        </div>
      </div>
    </Modal>
  );
}
