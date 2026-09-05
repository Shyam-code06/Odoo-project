import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { useSalaryRules, useSalaryStructures, useSalaryCategories } from '../../../hooks/useSalary';
import salaryService from '../../../services/salaryService';

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
  ListOrdered,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Calculator,
  Percent,
  Layers,
  Eye,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

export default function SalaryRulesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const structureIdParam = searchParams.get('salaryStructureId') || '';

  const canCreate = hasPermission(PERMISSIONS.SALARY_RULES_CREATE);
  const canEdit = hasPermission(PERMISSIONS.SALARY_RULES_EDIT);
  const canDelete = hasPermission(PERMISSIONS.SALARY_RULES_DELETE);

  const [queryParams, setQueryParams] = useState({
    search: '',
    salaryStructureId: structureIdParam,
    categoryId: '',
    calculationType: '',
    isActive: '',
    sortBy: 'sequence',
    sortDirection: 'asc',
    page: 1,
    pageSize: 10,
  });

  useEffect(() => {
    if (structureIdParam !== queryParams.salaryStructureId) {
      setQueryParams((prev) => ({ ...prev, salaryStructureId: structureIdParam, page: 1 }));
    }
  }, [structureIdParam]);

  const { items, total, page, pageSize, totalPages, metrics = {}, loading, error, refetch } = useSalaryRules(queryParams);
  const { items: structures = [] } = useSalaryStructures({ pageSize: 100 });
  const { categories = [] } = useSalaryCategories();

  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dynamic Metric Summaries
  const totalCount = metrics.total ?? total ?? 0;
  const activeCount = metrics.active ?? items.filter((r) => r.isActive).length;
  const fixedCount = metrics.fixedCount ?? items.filter((r) => r.calculationType === 'fixed').length;
  const percentageCount = metrics.percentageCount ?? items.filter((r) => r.calculationType === 'percentage').length;
  const formulaCount = metrics.formulaCount ?? items.filter((r) => r.calculationType === 'formula').length;

  const handleSearchChange = (e) => {
    setQueryParams((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleFilterChange = (key, val) => {
    setQueryParams((prev) => ({ ...prev, [key]: val, page: 1 }));
    if (key === 'salaryStructureId') {
      if (val) {
        setSearchParams({ salaryStructureId: val });
      } else {
        searchParams.delete('salaryStructureId');
        setSearchParams(searchParams);
      }
    }
  };

  const handleClearFilters = () => {
    setSearchParams({});
    setQueryParams({
      search: '',
      salaryStructureId: '',
      categoryId: '',
      calculationType: '',
      isActive: '',
      sortBy: 'sequence',
      sortDirection: 'asc',
      page: 1,
      pageSize: 10,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!ruleToDelete) return;
    try {
      setIsDeleting(true);
      const res = await salaryService.deleteSalaryRule(ruleToDelete.id);
      if (res.success) {
        toast.success(res.message);
        refetch();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete rule');
    } finally {
      setIsDeleting(false);
      setRuleToDelete(null);
    }
  };

  const hasActiveFilters = Boolean(
    queryParams.search ||
    queryParams.salaryStructureId ||
    queryParams.categoryId ||
    queryParams.calculationType ||
    queryParams.isActive !== ''
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Salary Rules"
        description="Configure ordered salary components, conditions and calculation methods used by salary structures."
        action={
          canCreate && (
            <Button
              variant="primary"
              onClick={() => navigate(queryParams.salaryStructureId ? `/payroll/salary-rules/new?salaryStructureId=${queryParams.salaryStructureId}` : '/payroll/salary-rules/new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Salary Rule</span>
            </Button>
          )
        }
      />

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
            <ListOrdered className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">Total Rules</p>
            <h4 className="text-xl font-bold text-slate-800">{totalCount}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">Active</p>
            <h4 className="text-xl font-bold text-slate-800">{activeCount}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">Fixed</p>
            <h4 className="text-xl font-bold text-slate-800">{fixedCount}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">Percentage</p>
            <h4 className="text-xl font-bold text-slate-800">{percentageCount}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">Formula</p>
            <h4 className="text-xl font-bold text-slate-800">{formulaCount}</h4>
          </div>
        </Card>
      </div>

      {/* Filter and Control Bar */}
      <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by rule name, code..."
              value={queryParams.search}
              onChange={handleSearchChange}
              className="pl-9 text-sm"
            />
          </div>

          {/* Structure Selector */}
          <div>
            <Select
              value={queryParams.salaryStructureId}
              onChange={(e) => handleFilterChange('salaryStructureId', e.target.value)}
              options={[
                { value: '', label: 'All Structures' },
                ...(structures || []).map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
              ]}
              className="text-sm"
            />
          </div>

          {/* Category Filter */}
          <div>
            <Select
              value={queryParams.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...(categories || []).map((c) => ({ value: c.id, label: c.name })),
              ]}
              className="text-sm"
            />
          </div>

          {/* Calculation Type */}
          <div>
            <Select
              value={queryParams.calculationType}
              onChange={(e) => handleFilterChange('calculationType', e.target.value)}
              options={[
                { value: '', label: 'All Calc Types' },
                { value: 'fixed', label: 'Fixed Amount' },
                { value: 'percentage', label: 'Percentage' },
                { value: 'formula', label: 'Formula' },
              ]}
              className="text-sm"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-medium">Active Filters:</span>
              {queryParams.salaryStructureId && (
                <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700">
                  Structure: {(structures || []).find((s) => s.id === queryParams.salaryStructureId)?.code || queryParams.salaryStructureId}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('salaryStructureId', '')} />
                </Badge>
              )}
              {queryParams.categoryId && (
                <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700">
                  Category: {(categories || []).find((c) => c.id === queryParams.categoryId)?.name || queryParams.categoryId}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('categoryId', '')} />
                </Badge>
              )}
              {queryParams.calculationType && (
                <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700 capitalize">
                  Type: {queryParams.calculationType}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('calculationType', '')} />
                </Badge>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-slate-500 hover:text-orange-600 gap-1 text-xs">
              <X className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </Button>
          </div>
        )}
      </Card>

      {/* Main Table Content */}
      {loading ? (
        <LoadingState message="Loading salary rules..." />
      ) : error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No salary rules found"
          description={hasActiveFilters ? 'No salary rules match your specified filters.' : 'Create your first salary rule to define calculation logic.'}
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            ) : canCreate ? (
              <Button variant="primary" size="sm" onClick={() => navigate('/payroll/salary-rules/new')}>
                Create Salary Rule
              </Button>
            ) : null
          }
        />
      ) : (
        <Card className="border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden">
          <Table>
            <Table.Header>
              <Table.Row className="bg-slate-50/80">
                <Table.HeaderCell className="w-16">Seq</Table.HeaderCell>
                <Table.HeaderCell>Rule</Table.HeaderCell>
                <Table.HeaderCell>Code</Table.HeaderCell>
                <Table.HeaderCell>Structure</Table.HeaderCell>
                <Table.HeaderCell>Category</Table.HeaderCell>
                <Table.HeaderCell>Calculation</Table.HeaderCell>
                <Table.HeaderCell>Value / Expression</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {items.map((rule) => (
                <Table.Row key={rule.id} className="hover:bg-slate-50/60 transition-colors">
                  <Table.Cell>
                    <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      {String(rule.sequence).padStart(2, '0')}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <Link
                      to={`/payroll/salary-rules/${rule.id}`}
                      className="font-semibold text-slate-800 hover:text-orange-600 text-xs block"
                    >
                      {rule.name}
                    </Link>
                  </Table.Cell>

                  <Table.Cell>
                    <Badge variant="outline" className="font-mono text-[11px] bg-slate-50 text-slate-700">
                      {rule.code}
                    </Badge>
                  </Table.Cell>

                  <Table.Cell>
                    <Link
                      to={`/payroll/salary-structures/${rule.salaryStructureId}`}
                      className="text-xs font-medium text-slate-700 hover:text-orange-600 block"
                    >
                      {rule.structureName || rule.salaryStructureId}
                    </Link>
                  </Table.Cell>

                  <Table.Cell>
                    <Badge variant="secondary" className="text-[11px]">
                      {rule.categoryName || rule.categoryId}
                    </Badge>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-xs font-medium capitalize text-slate-700">
                      {rule.calculationType}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="font-mono text-xs text-slate-800">
                      {rule.calculationType === 'fixed' && formatCurrency(rule.value)}
                      {rule.calculationType === 'percentage' && `${rule.value}%`}
                      {rule.calculationType === 'formula' && (rule.formulaExpression || 'Formula')}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <Badge variant={rule.isActive ? 'success' : 'secondary'} className="text-[10px]">
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Cell>

                  <Table.Cell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/payroll/salary-rules/${rule.id}`)}
                        title="View Details"
                        className="p-1 h-8 w-8 text-slate-500 hover:text-orange-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/payroll/salary-rules/${rule.id}/edit`)}
                          title="Edit Rule"
                          className="p-1 h-8 w-8 text-slate-500 hover:text-orange-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRuleToDelete(rule)}
                          title="Delete / Deactivate"
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

          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => setQueryParams((prev) => ({ ...prev, page: newPage }))}
            />
          </div>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(ruleToDelete)}
        onClose={() => setRuleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Deactivate Salary Rule"
        message={`Are you sure you want to deactivate or remove rule "${ruleToDelete?.name}"? Historical payslips will preserve their historical values.`}
        confirmText="Deactivate Rule"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
