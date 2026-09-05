import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Calculator, ArrowRight, Info } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

export function CalculationPreviewCard({ calculationResult, baseSalary, onBaseSalaryChange, isLoading }) {
  const [inputVal, setInputVal] = useState(baseSalary || 50000);

  const handleApply = (e) => {
    e.preventDefault();
    const parsed = parseFloat(inputVal) || 0;
    onBaseSalaryChange(parsed);
  };

  const {
    lines = [],
    gross = 0,
    deductions = 0,
    net = 0,
    earnings = []
  } = calculationResult || {};

  const deductionLines = lines.filter((l) => l.categoryCode === 'DED' || l.categoryCode === 'TAX');
  const earningLines = lines.filter((l) => l.categoryCode !== 'DED' && l.categoryCode !== 'TAX' && l.ruleCode !== 'GROSS' && l.ruleCode !== 'NET');

  return (
    <Card className="p-5 border border-slate-200 shadow-sm bg-white rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-base">Live Calculation Preview</h3>
            <p className="text-xs text-slate-500">Test evaluation logic against sample employee basic salary</p>
          </div>
        </div>

        <form onSubmit={handleApply} className="flex items-center gap-2">
          <div className="w-36">
            <Input
              type="number"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Base Salary"
              className="text-sm h-9"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={isLoading} className="h-9">
            Calculate
          </Button>
        </form>
      </div>

      <div className="mb-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-center gap-2">
        <Info className="w-4 h-4 text-orange-500 flex-shrink-0" />
        <span>Preview using sample basic salary input of <strong>{formatCurrency(baseSalary)}</strong>. Rules execute in sequence order.</span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-slate-400 text-xs animate-pulse">
          Calculating salary rule output...
        </div>
      ) : lines.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          No active salary rules configured to preview.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Earnings & Allowances</span>
              <span className="text-xs text-slate-500 font-medium">Calculated</span>
            </div>

            <div className="space-y-2">
              {earningLines.map((line) => (
                <div key={line.ruleId} className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-slate-50 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-slate-400 font-mono text-[10px]">{String(line.sequence).padStart(2, '0')}</span>
                    <span className="font-medium text-slate-800">{line.ruleName}</span>
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{line.ruleCode}</Badge>
                  </div>
                  <span className="font-semibold text-slate-800">{formatCurrency(line.amount)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Gross Salary</span>
              <span className="text-orange-600">{formatCurrency(gross)}</span>
            </div>
          </div>

          {/* Deductions & Summary Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Deductions & Contributions</span>
              <span className="text-xs text-slate-500 font-medium">Calculated</span>
            </div>

            <div className="space-y-2">
              {deductionLines.length === 0 ? (
                <div className="text-xs text-slate-400 py-2 italic">No deduction rules configured</div>
              ) : (
                deductionLines.map((line) => (
                  <div key={line.ruleId} className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-slate-50 rounded transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-slate-400 font-mono text-[10px]">{String(line.sequence).padStart(2, '0')}</span>
                      <span className="font-medium text-slate-800">{line.ruleName}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">{line.ruleCode}</Badge>
                    </div>
                    <span className="font-semibold text-red-600">-{formatCurrency(line.amount)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Total Deductions</span>
              <span className="text-red-600">-{formatCurrency(deductions)}</span>
            </div>
          </div>

          {/* Net Salary Banner */}
          <div className="lg:col-span-2 mt-2 p-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <ArrowRight className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-orange-100 font-medium uppercase tracking-wider">Estimated Net Salary</span>
                <h4 className="text-2xl font-bold">{formatCurrency(net)}</h4>
              </div>
            </div>
            <div className="text-right text-xs text-orange-100">
              <div>Gross: {formatCurrency(gross)}</div>
              <div>Deductions: {formatCurrency(deductions)}</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
