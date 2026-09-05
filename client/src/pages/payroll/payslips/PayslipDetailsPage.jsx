import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { usePayslip } from '../../../hooks/usePayslips';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Table } from '../../../components/ui/Table';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { useToast } from '../../../components/ui/Toast';

import { PayslipDocument } from '../../../components/payroll/payslips/PayslipDocument';
import { groupPayslipLines } from '../../../utils/payslipGrouping';
import { formatCurrency, formatDate, formatPayrollPeriod } from '../../../utils/formatters';

import {
  ArrowLeft,
  Printer,
  Download,
  Mail,
  User,
  FileText,
  Layers,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  History,
  Copy,
  Check
} from 'lucide-react';

export default function PayslipDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const [copiedField, setCopiedField] = useState(null);
  const [activeViewMode, setActiveViewMode] = useState('document'); // 'document' | 'breakdown'

  const {
    payslip,
    employee,
    contract,
    salaryStructure,
    payrun,
    lines = [],
    integrityCheck = { isValid: true, warnings: [] },
    employeeHistory = [],
    loading,
    error,
    refetch,
  } = usePayslip(id);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDisabledAction = (actionName) => {
    toast.info(`${actionName} will be available in the upcoming document delivery update.`);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <LoadingState message="Loading detailed payslip statement..." />
      </div>
    );
  }

  if (error || !payslip) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/payroll/payslips')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payslips</span>
        </Button>
        <ErrorState description={error || 'The requested payslip record could not be found.'} onRetry={refetch} />
      </div>
    );
  }

  const { earnings, deductions, earningsTotal, deductionsTotal } = groupPayslipLines(lines);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* 1. Header & Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/payroll/payslips')}
            className="p-2 h-9 w-9 text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-mono">{payslip.id}</h1>
              <Badge variant={payslip.status === 'paid' ? 'success' : 'secondary'} className="text-[11px] capitalize">
                {payslip.status}
              </Badge>
              {payslip.emailSentAt && (
                <Badge variant="success" className="text-[10px] gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Email Sent</span>
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Statement Period: {formatPayrollPeriod(payslip.periodStart, payslip.periodEnd)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDisabledAction('Print Statement')}
            className="gap-1.5 text-xs text-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print Statement</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDisabledAction('Download PDF')}
            className="gap-1.5 text-xs text-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleDisabledAction('Send Email')}
            className="gap-1.5 text-xs"
          >
            <Mail className="w-4 h-4" />
            <span>Send Payslip</span>
          </Button>
        </div>
      </div>

      {/* 2. Data Integrity Warning Banner */}
      {!integrityCheck.isValid && (
        <Card className="p-4 border border-amber-200 bg-amber-50/80 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Payroll Data Integrity Warning</span>
          </div>
          <ul className="list-disc pl-5 text-xs text-amber-700 space-y-1">
            {integrityCheck.warnings.map((w, idx) => (
              <li key={idx}>{w.message}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* 3. Reference Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card A: Employee Info */}
        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
              <User className="w-4 h-4 text-orange-600" />
              <span>Employee Info</span>
            </div>
            <button
              onClick={() => handleCopy(employee?.employeeCode, 'Employee Code')}
              className="text-[11px] text-slate-400 hover:text-orange-600 flex items-center gap-1"
            >
              {copiedField === 'Employee Code' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              {employee?.avatar ? (
                <img src={employee.avatar} alt={employee.fullName} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">
                  {employee?.fullName?.charAt(0) || 'E'}
                </div>
              )}
              <div>
                <p className="font-bold text-slate-900">{employee?.fullName}</p>
                <p className="font-mono text-[11px] text-slate-500">{employee?.employeeCode}</p>
              </div>
            </div>
            <div className="pt-2 text-slate-600 space-y-0.5 text-[11px]">
              <p><span className="text-slate-400">Dept:</span> {employee?.departmentName}</p>
              <p><span className="text-slate-400">Role:</span> {employee?.jobPositionTitle}</p>
            </div>
          </div>
        </Card>

        {/* Card B: Payroll Contract */}
        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
              <FileText className="w-4 h-4 text-orange-600" />
              <span>Employment Contract</span>
            </div>
            <button
              onClick={() => handleCopy(contract?.contractCode, 'Contract Code')}
              className="text-[11px] text-slate-400 hover:text-orange-600 flex items-center gap-1"
            >
              {copiedField === 'Contract Code' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <div className="space-y-1 text-xs text-slate-600">
            <p className="font-mono font-semibold text-slate-800">{contract?.contractCode || payslip.contractId}</p>
            <div className="space-y-0.5 text-[11px]">
              <p><span className="text-slate-400">Base Wage:</span> <span className="font-mono font-bold text-slate-900">{formatCurrency(contract?.wage || 0)}</span></p>
              <p><span className="text-slate-400">Type:</span> {contract?.employmentType || 'Full-time'}</p>
              <p><span className="text-slate-400">Status:</span> <span className="text-emerald-600 font-medium">{contract?.status || 'Active'}</span></p>
            </div>
          </div>
        </Card>

        {/* Card C: Salary Structure */}
        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
              <Layers className="w-4 h-4 text-orange-600" />
              <span>Salary Structure</span>
            </div>
            <Link
              to={`/payroll/salary-structures/${salaryStructure?.id}`}
              className="text-[11px] text-orange-600 hover:underline flex items-center gap-0.5"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-1 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">{salaryStructure?.name}</p>
            <div className="space-y-0.5 text-[11px]">
              <p><span className="text-slate-400">Code:</span> <span className="font-mono text-slate-700">{salaryStructure?.code}</span></p>
              <p><span className="text-slate-400">Rules Applied:</span> {salaryStructure?.ruleCount || 6} Rules</p>
            </div>
          </div>
        </Card>

        {/* Card D: Payrun Context */}
        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
              <Receipt className="w-4 h-4 text-orange-600" />
              <span>Payrun Context</span>
            </div>
            <Link
              to={`/payroll/payruns/${payrun?.id}`}
              className="text-[11px] text-orange-600 hover:underline flex items-center gap-0.5"
            >
              <span>Payrun</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-1 text-xs text-slate-600">
            <p className="font-mono font-semibold text-slate-800">{payrun?.name || payslip.payrunId}</p>
            <div className="space-y-0.5 text-[11px]">
              <p><span className="text-slate-400">Payrun Status:</span> <span className="capitalize font-medium text-slate-800">{payrun?.status}</span></p>
              <p><span className="text-slate-400">Processed By:</span> {payrun?.createdBy}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Main Statement View (Printable Document Component) */}
      <Card className="p-6 border border-slate-200 bg-white rounded-xl shadow-sm">
        <PayslipDocument
          payslip={payslip}
          employee={employee}
          contract={contract}
          salaryStructure={salaryStructure}
          payrun={payrun}
          lines={lines}
        />
      </Card>

      {/* 5. Detailed Salary Rules Line Breakdown Table */}
      <Card className="p-6 border border-slate-200 bg-white rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800 text-base">Rule Calculation Breakdown</h3>
            <p className="text-xs text-slate-500">Detailed calculation rules executed by the payroll computation engine</p>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {lines.length} Calculation Lines
          </Badge>
        </div>

        <Table>
          <Table.Header>
            <Table.Row className="bg-slate-50/80">
              <Table.HeaderCell className="w-16">Seq</Table.HeaderCell>
              <Table.HeaderCell>Rule Component</Table.HeaderCell>
              <Table.HeaderCell>Code</Table.HeaderCell>
              <Table.HeaderCell>Category</Table.HeaderCell>
              <Table.HeaderCell>Calculation Details</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Amount</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {lines.map((line) => (
              <Table.Row key={line.id} className="hover:bg-slate-50/60 transition-colors">
                <Table.Cell>
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {String(line.sequence).padStart(2, '0')}
                  </span>
                </Table.Cell>

                <Table.Cell>
                  <Link
                    to={`/payroll/salary-rules/${line.salaryRuleId}`}
                    className="font-semibold text-slate-800 hover:text-orange-600 text-xs block"
                  >
                    {line.name}
                  </Link>
                </Table.Cell>

                <Table.Cell>
                  <Badge variant="outline" className="font-mono text-[11px] bg-slate-50 text-slate-700">
                    {line.code}
                  </Badge>
                </Table.Cell>

                <Table.Cell>
                  <Badge variant="secondary" className="text-[11px]">
                    {line.category}
                  </Badge>
                </Table.Cell>

                <Table.Cell>
                  <span className="font-mono text-xs text-slate-600">
                    {line.calculationDetails || '—'}
                  </span>
                </Table.Cell>

                <Table.Cell className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {formatCurrency(line.amount)}
                  </span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>

      {/* 6. Employee Payroll History Section */}
      {employeeHistory.length > 0 && (
        <Card className="p-6 border border-slate-200 bg-white rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <History className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Employee Payroll History</h3>
              <p className="text-xs text-slate-500">Previous payslips generated for {employee?.fullName}</p>
            </div>
          </div>

          <Table>
            <Table.Header>
              <Table.Row className="bg-slate-50/80">
                <Table.HeaderCell>Payslip ID</Table.HeaderCell>
                <Table.HeaderCell>Period</Table.HeaderCell>
                <Table.HeaderCell>Payrun</Table.HeaderCell>
                <Table.HeaderCell>Gross</Table.HeaderCell>
                <Table.HeaderCell>Deductions</Table.HeaderCell>
                <Table.HeaderCell>Net Pay</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {employeeHistory.map((hist) => (
                <Table.Row key={hist.id} className="hover:bg-slate-50/60 transition-colors">
                  <Table.Cell>
                    <Link
                      to={`/payroll/payslips/${hist.id}`}
                      className="font-mono text-xs font-semibold text-orange-600 hover:underline block"
                    >
                      {hist.id}
                    </Link>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-xs text-slate-700">
                      {formatPayrollPeriod(hist.periodStart, hist.periodEnd)}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-xs font-medium text-slate-700">
                      {hist.payrunName}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="font-mono text-xs text-slate-700">
                      {formatCurrency(hist.grossSalary)}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="font-mono text-xs text-red-600">
                      {formatCurrency(hist.totalDeductions)}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {formatCurrency(hist.netSalary)}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <Badge variant={hist.status === 'paid' ? 'success' : 'secondary'} className="text-[10px] capitalize">
                      {hist.status}
                    </Badge>
                  </Table.Cell>

                  <Table.Cell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/payroll/payslips/${hist.id}`)}
                      className="p-1 h-8 w-8 text-slate-500 hover:text-orange-600"
                      title="View Payslip"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card>
      )}
    </div>
  );
}
