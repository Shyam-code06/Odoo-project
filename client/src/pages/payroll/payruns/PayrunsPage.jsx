import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { usePayruns } from '../../../hooks/usePayruns';
import { useSalaryStructures } from '../../../hooks/useSalary';
import payrunService from '../../../services/payrunService';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Table } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../components/ui/Toast';

import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  CheckCheck,
  CreditCard,
  Eye,
  Trash2,
  X,
  Layers
} from 'lucide-react';
import { formatDate } from '../../../utils/formatters';

export default function PayrunsPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const canCreate = hasPermission(PERMISSIONS.PAYRUNS_CREATE);

  const [queryParams, setQueryParams] = useState({
    search: '',
    status: '',
    salaryStructureId: '',
    sortBy: 'periodEnd',
    sortDirection: 'desc',
    page: 1,
    pageSize: 10,
  });

  const { items, total, page, pageSize, totalPages, metrics = {}, loading, error, refetch } = usePayruns(queryParams);
  const { items: structures } = useSalaryStructures({ pageSize: 100 });

  const [payrunToDelete, setPayrunToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearchChange = (e) => {
    setQueryParams((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleFilterChange = (key, val) => {
    setQueryParams((prev) => ({ ...prev, [key]: val, page: 1 }));
  };

  const handleClearFilters = () => {
    setQueryParams({
      search: '',
      status: '',
      salaryStructureId: '',
      sortBy: 'periodEnd',
      sortDirection: 'desc',
      page: 1,
      pageSize: 10,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!payrunToDelete) return;
    try {
      setIsDeleting(true);
      const res = await payrunService.deletePayrun(payrunToDelete.id);
      if (res.success) {
        toast.success(res.message);
        refetch();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete payrun');
    } finally {
      setIsDeleting(false);
      setPayrunToDelete(null);
    }
  };

  const hasActiveFilters = Boolean(queryParams.search || queryParams.status || queryParams.salaryStructureId);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'computed':
        return <Badge variant="warning"><CheckCircle2 className="w-3 h-3 mr-1" />Computed</Badge>;
      case 'validated':
        return <Badge variant="primary"><CheckCheck className="w-3 h-3 mr-1" />Validated</Badge>;
      case 'paid':
        return <Badge variant="success"><CreditCard className="w-3 h-3 mr-1" />Paid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Payruns"
        description="Create, process, validate and finalize payroll runs for selected salary structures and periods."
        action={
          canCreate && (
            <Button
              variant="primary"
              onClick={() => navigate('/payroll/payruns/new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Payrun</span>
            </Button>
          )
        }
      />

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">Total Payruns</p>
            <h4 className="text-xl font-bold text-slate-800">{metrics.total ?? total ?? 0}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">Draft</p>
            <h4 className="text-xl font-bold text-slate-800">{metrics.draft ?? 0}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">Computed</p>
            <h4 className="text-xl font-bold text-slate-800">{metrics.computed ?? 0}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <CheckCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">Validated</p>
            <h4 className="text-xl font-bold text-slate-800">{metrics.validated ?? 0}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">Paid / Finalized</p>
            <h4 className="text-xl font-bold text-slate-800">{metrics.paid ?? 0}</h4>
          </div>
        </Card>
      </div>

      {/* Filter and Control Bar */}
      <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by payrun name, structure, creator..."
              value={queryParams.search}
              onChange={handleSearchChange}
              className="pl-9 text-sm"
            />
          </div>

          <div>
            <Select
              value={queryParams.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'computed', label: 'Computed' },
                { value: 'validated', label: 'Validated' },
                { value: 'paid', label: 'Paid' },
              ]}
              className="text-sm"
            />
          </div>

          <div>
            <Select
              value={queryParams.salaryStructureId}
              onChange={(e) => handleFilterChange('salaryStructureId', e.target.value)}
              options={[
                { value: '', label: 'All Salary Structures' },
                ...structures.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
              ]}
              className="text-sm"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-medium">Active Filters:</span>
              {queryParams.search && (
                <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700">
                  Search: "{queryParams.search}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('search', '')} />
                </Badge>
              )}
              {queryParams.status && (
                <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700 capitalize">
                  Status: {queryParams.status}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('status', '')} />
                </Badge>
              )}
              {queryParams.salaryStructureId && (
                <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700">
                  Structure: {structures.find((s) => s.id === queryParams.salaryStructureId)?.code || queryParams.salaryStructureId}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('salaryStructureId', '')} />
                </Badge>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-slate-500 hover:text-orange-600 gap-1 text-xs">
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </Button>
          </div>
        )}
      </Card>

      {/* Main Table Content */}
      {loading ? (
        <LoadingState message="Loading payruns..." />
      ) : error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payruns found"
          description={hasActiveFilters ? 'No payruns match your specified filters.' : 'Create your first payroll run to begin processing employee salaries.'}
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            ) : canCreate ? (
              <Button variant="primary" size="sm" onClick={() => navigate('/payroll/payruns/new')}>
                Create Payrun
              </Button>
            ) : null
          }
        />
      ) : (
        <Card className="border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden">
          <Table>
            <Table.Header>
              <Table.Row className="bg-slate-50/80">
                <Table.HeaderCell>Payrun Batch</Table.HeaderCell>
                <Table.HeaderCell>Salary Structure</Table.HeaderCell>
                <Table.HeaderCell>Payroll Period</Table.HeaderCell>
                <Table.HeaderCell>Employees</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Created By</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {items.map((payrun) => (
                <Table.Row key={payrun.id} className="hover:bg-slate-50/60 transition-colors">
                  <Table.Cell>
                    <div>
                      <Link
                        to={`/payroll/payruns/${payrun.id}`}
                        className="font-bold text-slate-800 hover:text-orange-600 text-xs block"
                      >
                        {payrun.name}
                      </Link>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        ID: {payrun.id}
                      </span>
                    </div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs font-semibold text-slate-700">
                        {payrun.structureName}
                      </span>
                      {payrun.structureCode && (
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {payrun.structureCode}
                        </Badge>
                      )}
                    </div>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-xs font-medium text-slate-700">
                      {formatDate(payrun.periodStart)} – {formatDate(payrun.periodEnd)}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <Badge variant="secondary" className="text-[11px]">
                      {payrun.employeeCount} Employees
                    </Badge>
                  </Table.Cell>

                  <Table.Cell>
                    {getStatusBadge(payrun.status)}
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-xs text-slate-600">{payrun.createdBy}</span>
                  </Table.Cell>

                  <Table.Cell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/payroll/payruns/${payrun.id}`)}
                        title="View / Process Payrun"
                        className="p-1 h-8 w-8 text-slate-500 hover:text-orange-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {payrun.status !== 'paid' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPayrunToDelete(payrun)}
                          title="Delete Payrun"
                          className="p-1 h-8 w-8 text-slate-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(payrunToDelete)}
        onClose={() => setPayrunToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Payrun Batch"
        message={`Are you sure you want to delete payrun "${payrunToDelete?.name}"? Draft payrun records will be removed.`}
        confirmText="Delete Payrun"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
