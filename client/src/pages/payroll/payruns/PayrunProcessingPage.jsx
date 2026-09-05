import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { usePayrun } from '../../../hooks/usePayruns';
import payrunService from '../../../services/payrunService';

import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Table } from '../../../components/ui/Table';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { useToast } from '../../../components/ui/Toast';
import { PayrunValidationSummary } from './components/PayrunValidationSummary';
import { EmployeeComputationDrawer } from './components/EmployeeComputationDrawer';

import {
  ArrowLeft,
  Calculator,
  CheckCheck,
  CreditCard,
  Clock,
  CheckCircle2,
  Users,
  Layers,
  Calendar,
  Eye,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../utils/formatters';

export default function PayrunProcessingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const canCompute = hasPermission(PERMISSIONS.PAYRUNS_COMPUTE);
  const canValidate = hasPermission(PERMISSIONS.PAYRUNS_VALIDATE);
  const canMarkPaid = hasPermission(PERMISSIONS.PAYRUNS_MARK_PAID);

  const { payrun, loading, error, refetch } = usePayrun(id);

  const [isComputing, setIsComputing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [showPaidDialog, setShowPaidDialog] = useState(false);

  // Drawer State
  const [selectedPE, setSelectedPE] = useState(null);

  if (loading) return <div className="p-6"><LoadingState message="Loading payrun processing batch..." /></div>;
  if (error || !payrun) return <div className="p-6"><ErrorState description={error || 'Payrun not found'} onRetry={refetch} /></div>;

  const isPaid = payrun.status === 'paid';
  const isValidated = payrun.status === 'validated';
  const isComputed = payrun.status === 'computed' || isValidated || isPaid;
  const isDraft = payrun.status === 'draft';

  const employees = payrun.employees || [];

  const handleCompute = async () => {
    try {
      setIsComputing(true);
      const res = await payrunService.computePayrun(id);
      if (res.success) {
        toast.success(res.message);
        refetch();
      } else {
        toast.error(res.message || 'Payroll computation failed');
      }
    } catch (err) {
      toast.error(err.message || 'Error executing payroll computation');
    } finally {
      setIsComputing(false);
    }
  };

  const handleValidate = async () => {
    try {
      setIsValidating(true);
      const res = await payrunService.validatePayrun(id);
      if (res.success) {
        toast.success(res.message);
        refetch();
      } else {
        toast.error(res.message || 'Validation failed');
      }
    } catch (err) {
      toast.error(err.message || 'Error validating payrun');
    } finally {
      setIsValidating(false);
    }
  };

  const handleMarkPaidConfirm = async () => {
    try {
      setIsMarkingPaid(true);
      const res = await payrunService.markPayrunPaid(id);
      if (res.success) {
        toast.success(res.message);
        setShowPaidDialog(false);
        refetch();
      } else {
        toast.error(res.message || 'Failed to mark as paid');
      }
    } catch (err) {
      toast.error(err.message || 'Error marking payrun paid');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/payroll/payruns')}
            className="p-2 h-9 w-9 text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{payrun.name}</h1>
              <Badge variant="outline" className="font-mono bg-slate-50 text-slate-700">
                {payrun.structureCode || payrun.structureName}
              </Badge>
              <Badge
                variant={
                  isPaid ? 'success' : isValidated ? 'primary' : isComputed ? 'warning' : 'secondary'
                }
                className="capitalize"
              >
                {payrun.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Period: {formatDate(payrun.periodStart)} – {formatDate(payrun.periodEnd)} • Created by {payrun.createdBy}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isPaid ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Paid on {formatDate(payrun.paidAt)} • Historical Record</span>
            </div>
          ) : (
            <>
              {isDraft && canCompute && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCompute}
                  disabled={isComputing}
                  className="gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{isComputing ? 'Computing Payroll...' : 'Compute Payroll'}</span>
                </Button>
              )}

              {isComputed && !isValidated && canValidate && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCompute}
                    disabled={isComputing}
                    className="gap-1.5 text-xs"
                  >
                    <Calculator className="w-3.5 h-3.5 text-orange-500" />
                    <span>Re-Compute</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleValidate}
                    disabled={isValidating}
                    className="gap-2"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>{isValidating ? 'Validating...' : 'Validate Payrun'}</span>
                  </Button>
                </>
              )}

              {isValidated && canMarkPaid && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowPaidDialog(true)}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Mark as Paid</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lifecycle Status Stepper Bar */}
      <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className={`p-2.5 rounded-lg border font-medium flex items-center justify-center gap-2 ${
            isDraft ? 'bg-orange-50 border-orange-300 text-orange-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <Clock className="w-4 h-4 text-slate-400" />
            <span>1. Draft Setup</span>
          </div>

          <div className={`p-2.5 rounded-lg border font-medium flex items-center justify-center gap-2 ${
            payrun.status === 'computed' ? 'bg-orange-50 border-orange-300 text-orange-800 font-bold' : isComputed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <Calculator className="w-4 h-4" />
            <span>2. Computed</span>
          </div>

          <div className={`p-2.5 rounded-lg border font-medium flex items-center justify-center gap-2 ${
            payrun.status === 'validated' ? 'bg-orange-50 border-orange-300 text-orange-800 font-bold' : isValidated || isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <CheckCheck className="w-4 h-4" />
            <span>3. Validated</span>
          </div>

          <div className={`p-2.5 rounded-lg border font-medium flex items-center justify-center gap-2 ${
            isPaid ? 'bg-emerald-600 text-white font-bold border-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <CreditCard className="w-4 h-4" />
            <span>4. Paid & Finalized</span>
          </div>
        </div>
      </Card>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Employees</p>
            <h4 className="text-2xl font-bold text-slate-800">{payrun.employeeCount || employees.length}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gross Payroll</p>
            <h4 className="text-2xl font-bold text-slate-800">{formatCurrency(payrun.grossSalary || 0)}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-50 text-pink-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Deductions</p>
            <h4 className="text-2xl font-bold text-slate-800">-{formatCurrency(payrun.totalDeductions || 0)}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Take-Home Pay</p>
            <h4 className="text-2xl font-bold text-emerald-700">{formatCurrency(payrun.netSalary || 0)}</h4>
          </div>
        </Card>
      </div>

      {/* Validation Summary & Diagnostics (when computed or validated) */}
      {isComputed && (
        <PayrunValidationSummary
          summary={{
            computedCount: employees.filter((e) => e.status === 'computed').length,
            errorCount: employees.filter((e) => e.status === 'error').length,
            warnings: [],
            errors: employees.filter((e) => e.status === 'error').map((e) => ({
              employeeName: e.employee?.fullName || 'Employee',
              message: e.errorMessage || 'Calculation error',
            })),
          }}
          onRecompute={handleCompute}
          isRecomputing={isComputing}
        />
      )}

      {/* Employee Computation Table */}
      <Card className="border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden space-y-4">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-800 text-base">Included Employees & Payroll Results</h3>
            <p className="text-xs text-slate-500">Calculated using contract base wages and {payrun.structureName} rules</p>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {employees.length} Employee records
          </span>
        </div>

        {employees.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No employees attached to this payrun.
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row className="bg-slate-50/80">
                <Table.HeaderCell>Employee</Table.HeaderCell>
                <Table.HeaderCell>Contract</Table.HeaderCell>
                <Table.HeaderCell>Gross Salary</Table.HeaderCell>
                <Table.HeaderCell>Deductions</Table.HeaderCell>
                <Table.HeaderCell>Net Salary</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {employees.map((pe) => {
                const slip = pe.payslip;
                const emp = pe.employee;
                const contract = pe.contract;

                return (
                  <Table.Row key={pe.id} className="hover:bg-slate-50/60 transition-colors">
                    <Table.Cell>
                      <div>
                        <span className="font-semibold text-slate-800 text-xs block">{emp?.fullName || 'Employee'}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{emp?.employee_code}</span>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <div>
                        <Badge variant="outline" className="font-mono text-[11px] bg-slate-50">
                          {contract?.contract_code || 'CON'}
                        </Badge>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Base: {formatCurrency(contract?.wage || 0)}
                        </span>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <span className="font-mono text-xs font-semibold text-slate-800">
                        {slip ? formatCurrency(slip.grossSalary) : '—'}
                      </span>
                    </Table.Cell>

                    <Table.Cell>
                      <span className="font-mono text-xs font-semibold text-red-600">
                        {slip ? `-${formatCurrency(slip.totalDeductions)}` : '—'}
                      </span>
                    </Table.Cell>

                    <Table.Cell>
                      <span className="font-mono text-xs font-bold text-emerald-700">
                        {slip ? formatCurrency(slip.netSalary) : '—'}
                      </span>
                    </Table.Cell>

                    <Table.Cell>
                      <Badge variant={pe.status === 'computed' ? 'success' : pe.status === 'error' ? 'danger' : 'secondary'}>
                        {pe.status}
                      </Badge>
                    </Table.Cell>

                    <Table.Cell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPE(pe)}
                        title="View Computation Breakdown"
                        className="p-1 h-8 px-2 text-xs text-orange-600 hover:bg-orange-50 gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Breakdown</span>
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        )}
      </Card>

      {/* Computation Breakdown Drawer */}
      <EmployeeComputationDrawer
        isOpen={Boolean(selectedPE)}
        onClose={() => setSelectedPE(null)}
        payrunEmployee={selectedPE}
      />

      {/* Mark Paid Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showPaidDialog}
        onClose={() => setShowPaidDialog(false)}
        onConfirm={handleMarkPaidConfirm}
        title="Finalize Payroll & Mark as Paid"
        message={`Are you sure you want to mark "${payrun.name}" as Paid? This action finalizes the payroll batch and locks it as an uneditable historical record.`}
        confirmText="Confirm Payout"
        variant="primary"
        isLoading={isMarkingPaid}
      />
    </div>
  );
}
