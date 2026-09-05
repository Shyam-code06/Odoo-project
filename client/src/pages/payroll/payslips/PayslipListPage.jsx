import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { usePayslips } from '../../../hooks/usePayslips';
import { useSalaryStructures } from '../../../hooks/useSalary';
import { employeeService } from '../../../services/employeeService';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Table } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../components/ui/Toast';

import { PayslipSummaryCards } from '../../../components/payroll/payslips/PayslipSummaryCards';
import { PayslipFilters } from '../../../components/payroll/payslips/PayslipFilters';

import { formatCurrency, formatDate, formatPayrollPeriod } from '../../../utils/formatters';
import {
  FileSpreadsheet,
  Eye,
  Mail,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  UserCheck
} from 'lucide-react';

export default function PayslipListPage({ isSelfService = false }) {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();

  const canManage = hasPermission(PERMISSIONS.PAYSLIPS_VIEW);

  const [queryParams, setQueryParams] = useState({
    search: '',
    status: '',
    salaryStructureId: '',
    payrunId: '',
    departmentId: '',
    employmentType: '',
    emailStatus: '',
    employeeId: isSelfService && user ? (user.employee_id || user.id || '') : '',
    isSelfService: isSelfService,
    sortBy: 'periodEnd',
    sortDirection: 'desc',
    page: 1,
    pageSize: 10,
  });

  const { items, total, page, pageSize, totalPages, metrics, loading, error, refetch } = usePayslips(queryParams);
  const { items: structures = [] } = useSalaryStructures({ pageSize: 100 });

  // State for departments for dropdown filter
  const [departments, setDepartments] = useState([]);

  React.useEffect(() => {
    async function loadDepts() {
      try {
        const depts = employeeService._getRawDepartments() || [];
        setDepartments(depts);
      } catch (err) {
        console.error('Failed to load departments for filter', err);
      }
    }
    loadDepts();
  }, []);

  const handleClearFilters = () => {
    setQueryParams({
      search: '',
      status: '',
      salaryStructureId: '',
      payrunId: '',
      departmentId: '',
      employmentType: '',
      emailStatus: '',
      employeeId: isSelfService && user ? (user.employee_id || user.id || '') : '',
      isSelfService: isSelfService,
      sortBy: 'periodEnd',
      sortDirection: 'desc',
      page: 1,
      pageSize: 10,
    });
  };

  const hasActiveFilters = Boolean(
    queryParams.search ||
    queryParams.status ||
    queryParams.salaryStructureId ||
    queryParams.departmentId ||
    queryParams.emailStatus
  );

  const handleDisabledAction = (actionName) => {
    toast.info(`${actionName} functionality will be available in the upcoming document delivery update.`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title={isSelfService ? 'My Payslips' : 'Payslips Directory'}
        description={
          isSelfService
            ? 'View and download your monthly salary statements.'
            : 'View and manage employee payroll records generated from completed Payruns.'
        }
      />

      {/* Summary Cards */}
      <PayslipSummaryCards metrics={metrics} />

      {/* Filter Control Bar */}
      {!isSelfService && (
        <PayslipFilters
          queryParams={queryParams}
          setQueryParams={setQueryParams}
          structures={structures}
          departments={departments}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Main Table Content */}
      {loading ? (
        <LoadingState message="Loading payslips..." />
      ) : error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No payslips found"
          description={
            hasActiveFilters
              ? 'No payslips match your specified filter criteria.'
              : 'Payslips will automatically appear here once a Payrun is computed and processed.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            ) : null
          }
        />
      ) : (
        <Card className="border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden">
          <Table>
            <Table.Header>
              <Table.Row className="bg-slate-50/80">
                <Table.HeaderCell>Employee</Table.HeaderCell>
                <Table.HeaderCell>Payslip ID</Table.HeaderCell>
                <Table.HeaderCell>Payrun</Table.HeaderCell>
                <Table.HeaderCell>Period</Table.HeaderCell>
                <Table.HeaderCell>Gross Salary</Table.HeaderCell>
                <Table.HeaderCell>Deductions</Table.HeaderCell>
                <Table.HeaderCell>Net Salary</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Email Delivery</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {items.map((slip) => (
                <Table.Row key={slip.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Employee */}
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {slip.employeeAvatar ? (
                        <img
                          src={slip.employeeAvatar}
                          alt={slip.employeeName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">
                          {slip.employeeName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <Link
                          to={`/payroll/payslips/${slip.id}`}
                          className="font-semibold text-slate-800 hover:text-orange-600 text-xs block"
                        >
                          {slip.employeeName}
                        </Link>
                        <span className="text-[11px] text-slate-500 font-mono block">
                          {slip.employeeCode}
                        </span>
                      </div>
                    </div>
                  </Table.Cell>

                  {/* Payslip ID */}
                  <Table.Cell>
                    <Link
                      to={`/payroll/payslips/${slip.id}`}
                      className="font-mono text-xs font-semibold text-orange-600 hover:underline block"
                    >
                      {slip.id}
                    </Link>
                  </Table.Cell>

                  {/* Payrun */}
                  <Table.Cell>
                    <Link
                      to={`/payroll/payruns/${slip.payrunId}`}
                      className="text-xs font-medium text-slate-700 hover:text-orange-600 block"
                    >
                      {slip.payrunName || slip.payrunId}
                    </Link>
                  </Table.Cell>

                  {/* Period */}
                  <Table.Cell>
                    <span className="text-xs text-slate-700 block whitespace-nowrap">
                      {formatPayrollPeriod(slip.periodStart, slip.periodEnd)}
                    </span>
                  </Table.Cell>

                  {/* Gross Salary */}
                  <Table.Cell>
                    <span className="font-mono text-xs text-slate-700">
                      {formatCurrency(slip.grossSalary)}
                    </span>
                  </Table.Cell>

                  {/* Deductions */}
                  <Table.Cell>
                    <span className="font-mono text-xs text-red-600">
                      {formatCurrency(slip.totalDeductions)}
                    </span>
                  </Table.Cell>

                  {/* Net Salary */}
                  <Table.Cell>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {formatCurrency(slip.netSalary)}
                    </span>
                  </Table.Cell>

                  {/* Status */}
                  <Table.Cell>
                    <Badge variant={slip.status === 'paid' ? 'success' : 'secondary'} className="text-[10px] capitalize">
                      {slip.status}
                    </Badge>
                  </Table.Cell>

                  {/* Email Delivery */}
                  <Table.Cell>
                    {slip.emailSentAt ? (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Sent</span>
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] text-slate-500 bg-slate-100">
                        Not Sent
                      </Badge>
                    )}
                  </Table.Cell>

                  {/* Actions */}
                  <Table.Cell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/payroll/payslips/${slip.id}`)}
                        title="View Payslip Details"
                        className="p-1 h-8 w-8 text-slate-500 hover:text-orange-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisabledAction('Print Payslip')}
                        title="Print Statement (Future)"
                        className="p-1 h-8 w-8 text-slate-400 hover:text-slate-600"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisabledAction('Download PDF')}
                        title="Download PDF (Future)"
                        className="p-1 h-8 w-8 text-slate-400 hover:text-slate-600"
                      >
                        <Download className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisabledAction('Send Email')}
                        title="Send Payslip Email (Future)"
                        className="p-1 h-8 w-8 text-slate-400 hover:text-slate-600"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(newPage) => setQueryParams((prev) => ({ ...prev, page: newPage }))}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
