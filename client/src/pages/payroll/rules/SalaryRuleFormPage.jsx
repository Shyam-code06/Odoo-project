import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { useSalaryStructures, useSalaryCategories } from '../../../hooks/useSalary';
import salaryService from '../../../services/salaryService';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Switch } from '../../../components/ui/Switch';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useToast } from '../../../components/ui/Toast';
import { FormulaBuilderModal } from '../components/FormulaBuilderModal';

import {
  ArrowLeft,
  Save,
  ListOrdered,
  Calculator,
  Percent,
  Code,
  Wand2
} from 'lucide-react';

export default function SalaryRuleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const isEdit = Boolean(id);
  const defaultStructureId = searchParams.get('salaryStructureId') || '';
  const canManage = hasPermission(isEdit ? PERMISSIONS.SALARY_RULES_EDIT : PERMISSIONS.SALARY_RULES_CREATE);

  const { items: structures = [] } = useSalaryStructures({ pageSize: 100 });
  const { categories = [] } = useSalaryCategories();

  const [formData, setFormData] = useState({
    salaryStructureId: defaultStructureId,
    categoryId: 'CAT_ALLOW',
    name: '',
    code: '',
    sequence: 10,
    calculationType: 'fixed',
    value: '',
    conditionExpression: '',
    formulaExpression: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      async function fetchRule() {
        try {
          setLoading(true);
          const res = await salaryService.getSalaryRuleById(id);
          if (res.success && res.data) {
            const r = res.data;
            setFormData({
              salaryStructureId: r.salaryStructureId || '',
              categoryId: r.categoryId || 'CAT_ALLOW',
              name: r.name || '',
              code: r.code || '',
              sequence: r.sequence || 10,
              calculationType: r.calculationType || 'fixed',
              value: r.value !== undefined ? String(r.value) : '',
              conditionExpression: r.conditionExpression || '',
              formulaExpression: r.formulaExpression || '',
              isActive: r.isActive ?? true,
            });
          } else {
            toast.error(res.message || 'Rule not found');
            navigate('/payroll/salary-rules');
          }
        } catch (err) {
          toast.error('Failed to load salary rule details');
        } finally {
          setLoading(false);
        }
      }
      fetchRule();
    }
  }, [id, isEdit, navigate, toast]);

  if (!canManage) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-8 text-center text-slate-500">
          You do not have permission to manage salary rules.
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6"><LoadingState message="Loading rule details..." /></div>;
  }

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Rule Name is required';
    if (!formData.code.trim()) newErrors.code = 'Rule Code is required';
    if (!formData.salaryStructureId) newErrors.salaryStructureId = 'Salary Structure selection is required';
    if (!formData.categoryId) newErrors.categoryId = 'Category selection is required';

    if (formData.calculationType === 'fixed' || formData.calculationType === 'percentage') {
      if (formData.value === '' || isNaN(Number(formData.value))) {
        newErrors.value = `Numeric value is required for ${formData.calculationType} calculation`;
      }
    }

    if (formData.calculationType === 'formula') {
      if (!formData.formulaExpression.trim()) {
        newErrors.formulaExpression = 'Formula Expression is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        salaryStructureId: formData.salaryStructureId,
        categoryId: formData.categoryId,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        sequence: parseInt(formData.sequence, 10) || 10,
        calculationType: formData.calculationType,
        value: formData.value !== '' ? Number(formData.value) : undefined,
        conditionExpression: formData.conditionExpression.trim() || undefined,
        formulaExpression: formData.formulaExpression.trim() || undefined,
        isActive: formData.isActive,
      };

      const res = isEdit
        ? await salaryService.updateSalaryRule(id, payload)
        : await salaryService.createSalaryRule(payload);

      if (res.success) {
        toast.success(res.message);
        navigate(`/payroll/salary-structures/${formData.salaryStructureId}`);
      } else {
        if (res.errors) {
          setErrors(res.errors);
        } else {
          toast.error(res.message || 'Operation failed');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Error saving salary rule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(formData.salaryStructureId ? `/payroll/salary-structures/${formData.salaryStructureId}` : '/payroll/salary-rules')}
          className="p-2 h-9 w-9 text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <PageHeader
          title={isEdit ? 'Edit Salary Rule' : 'New Salary Rule'}
          description={isEdit ? 'Modify calculation parameters and order' : 'Configure an ordered salary component'}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <Card className="p-6 border border-slate-200 bg-white rounded-xl shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Rule Information</h3>
              <p className="text-xs text-slate-500">Associate with structure and assign category sequence</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Salary Structure <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.salaryStructureId}
                onChange={(e) => setFormData((prev) => ({ ...prev, salaryStructureId: e.target.value }))}
                options={[
                  { value: '', label: 'Select Salary Structure' },
                  ...(structures || []).map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
                ]}
                error={errors.salaryStructureId}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Rule Category <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.categoryId}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                options={[
                  { value: '', label: 'Select Category' },
                  ...(categories || []).map((c) => ({ value: c.id, label: c.name })),
                ]}
                error={errors.categoryId}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Rule Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Basic Salary"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                error={errors.name}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Rule Code <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. BASIC"
                value={formData.code}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                error={errors.code}
                helperText="Must be unique within structure (e.g. BASIC, HRA, PF)"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Sequence Order <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                value={formData.sequence}
                onChange={(e) => setFormData((prev) => ({ ...prev, sequence: e.target.value }))}
                helperText="Rules execute in ascending sequence order."
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 sm:col-span-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Active Status</span>
                <span className="text-xs text-slate-500">Inactive rules are excluded from calculation engine runs.</span>
              </div>
              <Switch
                checked={formData.isActive}
                onChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Calculation Configuration */}
        <Card className="p-6 border border-slate-200 bg-white rounded-xl shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Calculation Method</h3>
              <p className="text-xs text-slate-500">Choose fixed amount, percentage of base, or custom formula</p>
            </div>
          </div>

          {/* Type Selector */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'fixed', label: 'Fixed Amount', desc: 'Exact numeric value' },
              { type: 'percentage', label: 'Percentage', desc: '% of base salary' },
              { type: 'formula', label: 'Formula', desc: 'Custom arithmetic' },
            ].map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, calculationType: t.type }))}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  formData.calculationType === t.type
                    ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className={`text-xs font-bold block ${formData.calculationType === t.type ? 'text-orange-700' : 'text-slate-800'}`}>
                  {t.label}
                </span>
                <span className="text-[11px] text-slate-500">{t.desc}</span>
              </button>
            ))}
          </div>

          {/* Conditional Inputs */}
          <div className="space-y-4 pt-2">
            {formData.calculationType === 'fixed' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Fixed Amount (₹) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={formData.value}
                  onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                  error={errors.value}
                />
              </div>
            )}

            {formData.calculationType === 'percentage' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Percentage Value (%) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 40 (for 40%)"
                  value={formData.value}
                  onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                  error={errors.value}
                  helperText="Calculated as (Percentage / 100) × Base Salary"
                />
              </div>
            )}

            {formData.calculationType === 'formula' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Formula Expression <span className="text-red-500">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFormulaModalOpen(true)}
                    className="gap-1.5 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Open Formula Builder</span>
                  </Button>
                </div>
                <Input
                  type="text"
                  placeholder="e.g. BASIC * 0.40"
                  value={formData.formulaExpression}
                  onChange={(e) => setFormData((prev) => ({ ...prev, formulaExpression: e.target.value }))}
                  error={errors.formulaExpression}
                  className="font-mono text-sm"
                  helperText="Use tokens like BASIC, GROSS, HRA, PF, DEDUCTIONS with arithmetic operators (+, -, *, /)."
                />
              </div>
            )}

            {/* Condition Expression */}
            <div className="pt-3 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Condition Expression (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. BASIC > 30000"
                value={formData.conditionExpression}
                onChange={(e) => setFormData((prev) => ({ ...prev, conditionExpression: e.target.value }))}
                className="font-mono text-sm"
                helperText="Rule will only execute when condition evaluates to true (e.g. BASIC > 30000)."
              />
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(formData.salaryStructureId ? `/payroll/salary-structures/${formData.salaryStructureId}` : '/payroll/salary-rules')}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEdit ? 'Save Rule Changes' : 'Create Salary Rule'}</span>
          </Button>
        </div>
      </form>

      {/* Formula Builder Modal */}
      <FormulaBuilderModal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
        formula={formData.formulaExpression}
        setFormula={(val) => setFormData((prev) => ({ ...prev, formulaExpression: typeof val === 'function' ? val(prev.formulaExpression) : val }))}
      />
    </div>
  );
}
