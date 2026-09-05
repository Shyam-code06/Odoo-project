import React, { useState, useEffect, useMemo } from 'react';
import { usePayrunEligibility } from '../../../../hooks/usePayruns';
import { useSalaryStructure } from '../../../../hooks/useSalary';
import payrunService from '../../../../services/payrunService';
import { useNavigate } from 'react-router-dom';

import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Table } from '../../../../components/ui/Table';
import { Badge } from '../../../../components/ui/Badge';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { LoadingState } from '../../../../components/ui/LoadingState';
import { useToast } from '../../../../components/ui/Toast';

import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { formatCurrency } from '../../../../utils/formatters';

export function PayrunWizardStep2({ wizardData, updateWizardData, onBack }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { structure } = useSalaryStructure(wizardData.salaryStructureId);
  const {
    employees,
    loading,
    error,
    refetch
  } = usePayrunEligibility(
    wizardData.salaryStructureId,
    wizardData.periodStart,
    wizardData.periodEnd
  );

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Default selection: select all eligible employees on initial load
  useEffect(() => {
    if (employees.length > 0 && wizardData.selectedEmployeeIds.length === 0) {
      const eligibleIds = employees.filter((e) => e.isEligible).map((e) => e.id);
      updateWizardData({ selectedEmployeeIds: eligibleIds });
    }
  }, [employees]);

  // Derived lists and metrics
  const eligibleEmployees = useMemo(() => employees.filter((e) => e.isEligible), [employees]);
  const ineligibleEmployees = useMemo(() => employees.filter((e) => !e.isEligible), [employees]);

  const selectedSet = useMemo(() => new Set(wizardData.selectedEmployeeIds), [wizardData.selectedEmployeeIds]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesName = (e.fullName || '').toLowerCase().includes(q);
        const matchesCode = (e.employeeCode || '').toLowerCase().includes(q);
        const matchesContract = (e.contractCode || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesContract) return false;
      }
      if (departmentFilter && String(e.departmentId) !== String(departmentFilter)) return false;
      if (eligibilityFilter === 'eligible' && !e.isEligible) return false;
      if (eligibilityFilter === 'ineligible' && e.isEligible) return false;
      return true;
    });
  }, [employees, search, departmentFilter, eligibilityFilter]);

  const handleToggleEmployee = (id, isEligible) => {
    if (!isEligible) {
      toast.error('Ineligible employees cannot be selected for payroll.');
      return;
    }
    const nextSet = new Set(selectedSet);
    if (nextSet.has(id)) nextSet.delete(id);
    else nextSet.add(id);
    updateWizardData({ selectedEmployeeIds: Array.from(nextSet) });
  };

  const handleSelectAllEligible = () => {
    const eligibleIds = eligibleEmployees.map((e) => e.id);
    updateWizardData({ selectedEmployeeIds: eligibleIds });
  };

  const handleClearSelection = () => {
    updateWizardData({ selectedEmployeeIds: [] });
  };

  const handleCreatePayrun = async (e) => {
    e.preventDefault();
    if (wizardData.selectedEmployeeIds.length === 0) {
      toast.error('Please select at least one eligible employee to include in this payrun.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await payrunService.createPayrun(wizardData);
      if (res.success) {
        toast.success(res.message);
        navigate(`/payroll/payruns/${res.data.id}`);
      } else {
        toast.error(res.message || 'Failed to create payrun');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred during payrun creation');
    } finally {
      setSubmitting(false);
    }
  };

  // Extract unique departments for filter dropdown
  const departments = useMemo(() => {
    const map = new Map();
    employees.forEach((e) => {
      if (e.departmentId && !map.has(e.departmentId)) {
        map.set(e.departmentId, e.departmentName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [employees]);

  return (
    <form onSubmit={handleCreatePayrun} className="space-y-6">
      {/* Context Banner */}
      <Card className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-orange-100 uppercase tracking-wider font-medium">Selected Configuration</span>
            <h4 className="text-lg font-bold">{structure?.name || 'Salary Structure'}</h4>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-orange-100 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-orange-200" />
            <span>{wizardData.periodStart} to {wizardData.periodEnd}</span>
          </div>
          <span>•</span>
          <div>{wizardData.name}</div>
        </div>
      </Card>

      {/* Main Selection Card */}
      <Card className="p-6 border border-slate-200 bg-white rounded-xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Step 2: Employee Selection</h3>
              <p className="text-xs text-slate-500">Review contract eligibility and select employees for batch computation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllEligible}
              className="text-xs"
            >
              Select All Eligible ({eligibleEmployees.length})
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="text-xs text-slate-500 hover:text-red-600"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Metric Counter Chips */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>{selectedSet.size} Selected</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{eligibleEmployees.length} Eligible</span>
          </div>
          {ineligibleEmployees.length > 0 && (
            <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{ineligibleEmployees.length} Ineligible</span>
            </div>
          )}
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, code, contract..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div>
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
              className="text-sm"
            />
          </div>

          <div>
            <Select
              value={eligibilityFilter}
              onChange={(e) => setEligibilityFilter(e.target.value)}
              options={[
                { value: '', label: 'All Eligibility Statuses' },
                { value: 'eligible', label: 'Eligible Only' },
                { value: 'ineligible', label: 'Ineligible Only' },
              ]}
              className="text-sm"
            />
          </div>
        </div>

        {/* Employee Table */}
        {loading ? (
          <LoadingState message="Evaluating employee contract eligibility..." />
        ) : filteredEmployees.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No employees match your active filters.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <Table>
              <Table.Header>
                <Table.Row className="bg-slate-50/80">
                  <Table.HeaderCell className="w-12 text-center">
                    <Checkbox
                      checked={eligibleEmployees.length > 0 && eligibleEmployees.every((e) => selectedSet.has(e.id))}
                      onChange={handleSelectAllEligible}
                    />
                  </Table.HeaderCell>
                  <Table.HeaderCell>Employee</Table.HeaderCell>
                  <Table.HeaderCell>Department</Table.HeaderCell>
                  <Table.HeaderCell>Position</Table.HeaderCell>
                  <Table.HeaderCell>Contract</Table.HeaderCell>
                  <Table.HeaderCell>Base Wage</Table.HeaderCell>
                  <Table.HeaderCell>Eligibility</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {filteredEmployees.map((emp) => {
                  const isChecked = selectedSet.has(emp.id);
                  return (
                    <Table.Row key={emp.id} className={`hover:bg-slate-50/60 transition-colors ${!emp.isEligible ? 'bg-slate-50/40 opacity-70' : ''}`}>
                      <Table.Cell className="text-center">
                        <Checkbox
                          checked={isChecked}
                          onChange={() => handleToggleEmployee(emp.id, emp.isEligible)}
                          disabled={!emp.isEligible}
                        />
                      </Table.Cell>

                      <Table.Cell>
                        <div>
                          <span className="font-semibold text-slate-800 text-xs block">{emp.fullName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{emp.employeeCode}</span>
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <span className="text-xs text-slate-600">{emp.departmentName}</span>
                      </Table.Cell>

                      <Table.Cell>
                        <span className="text-xs text-slate-600">{emp.jobPositionTitle}</span>
                      </Table.Cell>

                      <Table.Cell>
                        <Badge variant="outline" className="font-mono text-[11px] bg-slate-50">
                          {emp.contractCode}
                        </Badge>
                      </Table.Cell>

                      <Table.Cell>
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {formatCurrency(emp.wage)}
                        </span>
                      </Table.Cell>

                      <Table.Cell>
                        {emp.isEligible ? (
                          <Badge variant="success" className="text-[10px]">
                            Eligible
                          </Badge>
                        ) : (
                          <div className="space-y-0.5">
                            <Badge variant="warning" className="text-[10px]">
                              Not Eligible
                            </Badge>
                            <p className="text-[10px] text-amber-700 line-clamp-1">{emp.ineligibilityReason}</p>
                          </div>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </div>
        )}
      </Card>

      {/* Action Footer */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Step 1</span>
        </Button>

        <Button
          type="submit"
          variant="primary"
          disabled={submitting || selectedSet.size === 0}
          className="gap-2"
        >
          <span>{submitting ? 'Creating Payrun...' : `Create Payrun (${selectedSet.size} Selected)`}</span>
        </Button>
      </div>
    </form>
  );
}
