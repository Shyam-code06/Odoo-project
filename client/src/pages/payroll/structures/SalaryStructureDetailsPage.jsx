import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { useSalaryStructure, useStructureCalculation } from '../../../hooks/useSalary';
import salaryService from '../../../services/salaryService';

import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Table } from '../../../components/ui/Table';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { useToast } from '../../../components/ui/Toast';
import { StructureValidationPanel } from '../components/StructureValidationPanel';
import { CalculationPreviewCard } from '../components/CalculationPreviewCard';

import {
  ArrowLeft,
  Edit2,
  Plus,
  ArrowUp,
  ArrowDown,
  Layers,
  ListOrdered,
  Users,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Eye,
  Trash2
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

export default function SalaryStructureDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const canEdit = hasPermission(PERMISSIONS.SALARY_STRUCTURES_EDIT);
  const canCreateRule = hasPermission(PERMISSIONS.SALARY_RULES_CREATE);

  const { structure, loading, error, refetch } = useSalaryStructure(id);
  const [sampleBaseSalary, setSampleBaseSalary] = useState(50000);

  const {
    result: calcResult,
    validation,
    loading: calcLoading,
    refetch: refetchCalc
  } = useStructureCalculation(id, sampleBaseSalary);

  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  if (loading) return <div className="p-6"><LoadingState message="Loading salary structure details..." /></div>;
  if (error || !structure) return <div className="p-6"><ErrorState description={error || 'Structure not found'} onRetry={refetch} /></div>;

  const rules = (structure.rules || []).slice().sort((a, b) => a.sequence - b.sequence);
  const activeRulesCount = rules.filter((r) => r.isActive).length;
  const inactiveRulesCount = rules.filter((r) => !r.isActive).length;

  const handleToggleStatus = async () => {
    try {
      setIsTogglingStatus(true);
      const res = structure.isActive
        ? await salaryService.deactivateSalaryStructure(id)
        : await salaryService.activateSalaryStructure(id);

      if (res.success) {
        toast.success(res.message);
        refetch();
        refetchCalc();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to toggle structure status');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleMoveRule = async (index, direction) => {
    if (!canEdit) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rules.length) return;

    const newRules = [...rules];
    const temp = newRules[index];
    newRules[index] = newRules[targetIndex];
    newRules[targetIndex] = temp;

    const orderedIds = newRules.map((r) => r.id);

    try {
      setIsReordering(true);
      const res = await salaryService.reorderRules(id, orderedIds);
      if (res.success) {
        toast.success('Rule sequence updated successfully');
        refetch();
        refetchCalc();
      } else {
        toast.error(res.message || 'Failed to update rule order');
      }
    } catch (err) {
      toast.error(err.message || 'Error reordering rules');
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/payroll/salary-structures')}
            className="p-2 h-9 w-9 text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{structure.name}</h1>
              <Badge variant="outline" className="font-mono bg-slate-50 text-slate-700">
                {structure.code}
              </Badge>
              <Badge variant={structure.isActive ? 'success' : 'secondary'}>
                {structure.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {structure.description && (
              <p className="text-xs text-slate-500 mt-1">{structure.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                disabled={isTogglingStatus}
                className="gap-2 text-xs"
              >
                {structure.isActive ? (
                  <>
                    <ToggleLeft className="w-4 h-4 text-slate-400" />
                    <span>Deactivate</span>
                  </>
                ) : (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-600" />
                    <span>Activate</span>
                  </>
                )}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/payroll/salary-structures/${id}/edit`)}
                className="gap-2 text-xs"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Structure</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
            <ListOrdered className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Rules</p>
            <h4 className="text-2xl font-bold text-slate-800">{rules.length}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Rules</p>
            <h4 className="text-2xl font-bold text-slate-800">{activeRulesCount}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-100 text-slate-500">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Inactive Rules</p>
            <h4 className="text-2xl font-bold text-slate-800">{inactiveRulesCount}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-50 text-pink-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned Employees</p>
            <h4 className="text-2xl font-bold text-slate-800">{structure.employeeCount || 0}</h4>
          </div>
        </Card>
      </div>

      {/* Configuration Health Panel */}
      <StructureValidationPanel
        validation={validation}
        onRefresh={refetchCalc}
        isRefreshing={calcLoading}
      />

      {/* Rules Configuration Table Section */}
      <Card className="border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-800 text-base">Ordered Salary Rules</h3>
            <p className="text-xs text-slate-500">Rules execute in sequence (Sequence ASC). Reorder to adjust calculation dependency flow.</p>
          </div>

          {canCreateRule && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/payroll/salary-rules/new?salaryStructureId=${id}`)}
              className="gap-2 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Salary Rule</span>
            </Button>
          )}
        </div>

        {rules.length === 0 ? (
          <div className="p-12 text-center">
            <ListOrdered className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-700">No salary rules configured yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Add rules like Basic Salary, HRA, Provident Fund, or Net Salary to enable payroll calculations.
            </p>
            {canCreateRule && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/payroll/salary-rules/new?salaryStructureId=${id}`)}
              >
                Add First Salary Rule
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row className="bg-slate-50/80">
                <Table.HeaderCell className="w-20">Seq</Table.HeaderCell>
                <Table.HeaderCell>Rule Name</Table.HeaderCell>
                <Table.HeaderCell>Code</Table.HeaderCell>
                <Table.HeaderCell>Category</Table.HeaderCell>
                <Table.HeaderCell>Calculation</Table.HeaderCell>
                <Table.HeaderCell>Value / Formula</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {rules.map((rule, idx) => (
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
                    <Badge variant="secondary" className="text-[11px]">
                      {rule.categoryName || rule.categoryId}
                    </Badge>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-xs capitalize font-medium text-slate-700">
                      {rule.calculationType}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="font-mono text-xs text-slate-800">
                      {rule.calculationType === 'fixed' && formatCurrency(rule.value)}
                      {rule.calculationType === 'percentage' && `${rule.value}%`}
                      {rule.calculationType === 'formula' && (rule.formulaExpression || 'Custom Formula')}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <Badge variant={rule.isActive ? 'success' : 'secondary'} className="text-[10px]">
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Cell>

                  <Table.Cell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveRule(idx, 'up')}
                            disabled={idx === 0 || isReordering}
                            title="Move Up"
                            className="p-1 h-7 w-7 text-slate-400 hover:text-orange-600 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveRule(idx, 'down')}
                            disabled={idx === rules.length - 1 || isReordering}
                            title="Move Down"
                            className="p-1 h-7 w-7 text-slate-400 hover:text-orange-600 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/payroll/salary-rules/${rule.id}`)}
                        title="View Rule Details"
                        className="p-1 h-7 w-7 text-slate-500 hover:text-orange-600"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>

                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/payroll/salary-rules/${rule.id}/edit`)}
                          title="Edit Rule"
                          className="p-1 h-7 w-7 text-slate-500 hover:text-orange-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>

      {/* Live Calculation Preview */}
      <CalculationPreviewCard
        calculationResult={calcResult}
        baseSalary={sampleBaseSalary}
        onBaseSalaryChange={(val) => {
          setSampleBaseSalary(val);
          refetchCalc();
        }}
        isLoading={calcLoading}
      />
    </div>
  );
}
