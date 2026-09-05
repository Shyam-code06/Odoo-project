import React, { useState, useEffect } from 'react';
import { useSalaryStructures, useSalaryStructure } from '../../../../hooks/useSalary';
import payrunService from '../../../../services/payrunService';

import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Badge } from '../../../../components/ui/Badge';

import {
  Calendar,
  Layers,
  AlertTriangle,
  ArrowRight,
  ListOrdered,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function PayrunWizardStep1({ wizardData, updateWizardData, onNext }) {
  const { items: rawStructures } = useSalaryStructures({ pageSize: 100 });
  const activeStructures = rawStructures.filter((s) => s.isActive);

  const { structure: selectedStructure } = useSalaryStructure(wizardData.salaryStructureId);

  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Set default structure if only 1 active structure exists or not selected
  useEffect(() => {
    if (!wizardData.salaryStructureId && activeStructures.length > 0) {
      updateWizardData({ salaryStructureId: activeStructures[0].id });
    }
  }, [activeStructures, wizardData.salaryStructureId]);

  // Check duplicate payrun when structure or period changes
  useEffect(() => {
    async function checkDuplicate() {
      if (wizardData.salaryStructureId && wizardData.periodStart && wizardData.periodEnd) {
        setIsCheckingDuplicate(true);
        const isDup = await payrunService.checkDuplicatePayrun(
          wizardData.salaryStructureId,
          wizardData.periodStart,
          wizardData.periodEnd
        );
        setDuplicateWarning(isDup);
        setIsCheckingDuplicate(false);
      } else {
        setDuplicateWarning(false);
      }
    }
    checkDuplicate();
  }, [wizardData.salaryStructureId, wizardData.periodStart, wizardData.periodEnd]);

  // Helper date preset handler
  const handleApplyPreset = (presetType) => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth(); // 0-indexed

    if (presetType === 'prev') {
      month -= 1;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
    } else if (presetType === 'next') {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const formatDate = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const startStr = formatDate(firstDay);
    const endStr = formatDate(lastDay);

    updateWizardData({
      periodStart: startStr,
      periodEnd: endStr,
      name: `PAYRUN-${startStr.substring(0, 7)}`,
    });
  };

  const validate = () => {
    const errs = {};
    if (!wizardData.salaryStructureId) errs.salaryStructureId = 'Salary Structure selection is required';
    if (!wizardData.periodStart) errs.periodStart = 'Period Start date is required';
    if (!wizardData.periodEnd) errs.periodEnd = 'Period End date is required';

    if (wizardData.periodStart && wizardData.periodEnd) {
      if (new Date(wizardData.periodStart) > new Date(wizardData.periodEnd)) {
        errs.periodEnd = 'Period End must be on or after Period Start';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  const activeRules = selectedStructure ? (selectedStructure.rules || []).filter((r) => r.isActive) : [];

  return (
    <form onSubmit={handleContinue} className="space-y-6">
      {/* Scope & Period Card */}
      <Card className="p-6 border border-slate-200 bg-white rounded-xl shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Step 1: Scope & Payroll Period</h3>
              <p className="text-xs text-slate-500">Choose salary structure container and pay cycle dates</p>
            </div>
          </div>

          <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
            Step 1 of 2
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Inputs */}
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Salary Structure <span className="text-red-500">*</span>
              </label>
              <Select
                value={wizardData.salaryStructureId}
                onChange={(e) => updateWizardData({ salaryStructureId: e.target.value })}
                options={[
                  { value: '', label: 'Select Active Structure' },
                  ...activeStructures.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
                ]}
                error={errors.salaryStructureId}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Only active salary structures can be selected for payroll execution.
              </p>
            </div>

            {/* Quick Period Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Quick Period Presets
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('prev')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                >
                  Previous Month
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('current')}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-medium rounded-lg transition-colors"
                >
                  Current Month
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('next')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                >
                  Next Month
                </button>
              </div>
            </div>

            {/* Period Date Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Period Start <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={wizardData.periodStart}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateWizardData({
                      periodStart: val,
                      name: val ? `PAYRUN-${val.substring(0, 7)}` : wizardData.name,
                    });
                  }}
                  error={errors.periodStart}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Period End <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={wizardData.periodEnd}
                  onChange={(e) => updateWizardData({ periodEnd: e.target.value })}
                  error={errors.periodEnd}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Payrun Name
              </label>
              <Input
                type="text"
                placeholder="e.g. PAYRUN-2026-09"
                value={wizardData.name}
                onChange={(e) => updateWizardData({ name: e.target.value })}
                helperText="Auto-generated from period start date. Custom names permitted."
              />
            </div>

            {/* Duplicate Payrun Alert */}
            {duplicateWarning && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold block">Duplicate Payrun Warning</span>
                  A Payrun already exists for this Salary Structure and payroll period. Proceeding may cause duplicate payslip conflicts.
                </div>
              </div>
            )}
          </div>

          {/* Right: Structure Preview */}
          <div>
            <Card className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-500" />
                  <h4 className="font-semibold text-slate-800 text-sm">Structure Rule Preview</h4>
                </div>
                {selectedStructure && (
                  <Link
                    to={`/payroll/salary-structures/${selectedStructure.id}`}
                    target="_blank"
                    className="text-[11px] text-orange-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>View Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {!selectedStructure ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Select a salary structure to preview its calculation rules.
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{selectedStructure.name}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {selectedStructure.code}
                      </Badge>
                    </div>
                    {selectedStructure.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{selectedStructure.description}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-xs font-semibold text-slate-700 block mb-2">
                      Active Execution Rules ({activeRules.length})
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {activeRules.map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded border border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-orange-600">{String(r.sequence).padStart(2, '0')}</span>
                            <span className="font-medium text-slate-800">{r.name}</span>
                          </div>
                          <Badge variant="secondary" className="text-[10px] py-0">{r.code}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </Card>

      {/* Action Bar */}
      <div className="flex items-center justify-end">
        <Button
          type="submit"
          variant="primary"
          disabled={isCheckingDuplicate}
          className="gap-2"
        >
          <span>Continue to Employee Selection</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
