import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { useSalaryRule } from '../../../hooks/useSalary';
import salaryService from '../../../services/salaryService';

import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { useToast } from '../../../components/ui/Toast';

import {
  ArrowLeft,
  Edit2,
  ListOrdered,
  Layers,
  Calculator,
  Percent,
  Code,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

export default function SalaryRuleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const canEdit = hasPermission(PERMISSIONS.SALARY_RULES_EDIT);
  const { rule, loading, error, refetch } = useSalaryRule(id);
  const [isToggling, setIsToggling] = useState(false);

  if (loading) return <div className="p-6"><LoadingState message="Loading salary rule details..." /></div>;
  if (error || !rule) return <div className="p-6"><ErrorState description={error || 'Salary rule not found'} onRetry={refetch} /></div>;

  const handleToggleStatus = async () => {
    try {
      setIsToggling(true);
      const res = rule.isActive
        ? await salaryService.deactivateSalaryRule(id)
        : await salaryService.activateSalaryRule(id);

      if (res.success) {
        toast.success(res.message);
        refetch();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/payroll/salary-rules')}
            className="p-2 h-9 w-9 text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{rule.name}</h1>
              <Badge variant="outline" className="font-mono bg-slate-50 text-slate-700">
                {rule.code}
              </Badge>
              <Badge variant={rule.isActive ? 'success' : 'secondary'}>
                {rule.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sequence #{rule.sequence} • Structure: {rule.structureName || rule.salaryStructureId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                disabled={isToggling}
                className="gap-2 text-xs"
              >
                {rule.isActive ? (
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
                onClick={() => navigate(`/payroll/salary-rules/${id}/edit`)}
                className="gap-2 text-xs"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Rule</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Calculation Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border border-slate-200 bg-white rounded-xl shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-base">Calculation Configuration</h3>
                <p className="text-xs text-slate-500">Method used by engine during sequence execution</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Calculation Method</span>
                  <span className="text-sm font-bold text-slate-800 capitalize">{rule.calculationType}</span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-medium block">Value / Output</span>
                  <span className="text-sm font-bold font-mono text-orange-600">
                    {rule.calculationType === 'fixed' && formatCurrency(rule.value)}
                    {rule.calculationType === 'percentage' && `${rule.value}% of Base`}
                    {rule.calculationType === 'formula' && (rule.formulaExpression || 'Custom Formula')}
                  </span>
                </div>
              </div>

              {rule.calculationType === 'formula' && (
                <div className="p-4 bg-slate-900 text-orange-400 rounded-xl border border-slate-800 font-mono text-sm space-y-2">
                  <div className="text-slate-400 text-xs font-sans">Formula Expression:</div>
                  <div>{rule.formulaExpression || 'BASIC * 0.40'}</div>
                </div>
              )}

              {rule.conditionExpression && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-amber-600" />
                    <span>Execution Condition:</span>
                  </div>
                  <div className="font-mono text-xs text-amber-900 pl-5.5">
                    {rule.conditionExpression}
                  </div>
                  <p className="text-[11px] text-amber-700 pt-1">
                    Rule will only apply when this condition evaluates to true.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Rule Information Summary */}
        <div className="space-y-6">
          <Card className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 text-sm pb-3 border-b border-slate-100">
              Rule Metadata
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Execution Sequence</span>
                <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                  #{rule.sequence}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Salary Structure</span>
                <Link
                  to={`/payroll/salary-structures/${rule.salaryStructureId}`}
                  className="font-medium text-slate-800 hover:text-orange-600"
                >
                  {rule.structureName || rule.salaryStructureId}
                </Link>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Category</span>
                <Badge variant="secondary">{rule.categoryName || rule.categoryId}</Badge>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Rule Code</span>
                <Badge variant="outline" className="font-mono">{rule.code}</Badge>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500">Active Status</span>
                <Badge variant={rule.isActive ? 'success' : 'secondary'}>
                  {rule.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Info className="w-4 h-4 text-orange-500" />
              <span>Execution Note</span>
            </div>
            <p>
              Rule calculation results are stored with their execution sequence and passed to subsequent rules in the salary structure engine.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
