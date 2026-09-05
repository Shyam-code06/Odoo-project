import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Calculator, Plus, Minus, X as Multiply, Divide } from 'lucide-react';

export function FormulaBuilderModal({ isOpen, onClose, formula, setFormula }) {
  const variables = [
    { code: 'BASIC', label: 'Basic Salary' },
    { code: 'GROSS', label: 'Gross Salary' },
    { code: 'HRA', label: 'House Rent Allowance' },
    { code: 'ALLOWANCES', label: 'Total Allowances' },
    { code: 'PF', label: 'Provident Fund' },
    { code: 'DEDUCTIONS', label: 'Total Deductions' },
    { code: 'NET', label: 'Net Salary' },
  ];

  const operators = ['+', '-', '*', '/', '(', ')'];

  const insertToken = (token) => {
    const space = formula && !formula.endsWith(' ') ? ' ' : '';
    setFormula((prev) => `${prev || ''}${space}${token} `);
  };

  const clearFormula = () => {
    setFormula('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Interactive Formula Builder"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Click variables and operators below to construct safe arithmetic formulas for your salary rule calculation.
        </p>

        {/* Formula Input Preview */}
        <div className="p-3 bg-slate-900 text-orange-400 font-mono text-sm rounded-lg border border-slate-700 min-h-[48px] flex items-center justify-between">
          <span>{formula || <span className="text-slate-600 font-sans italic text-xs">Formula expression will appear here...</span>}</span>
          {formula && (
            <button
              onClick={clearFormula}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors font-sans px-2 py-0.5 rounded border border-slate-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Available Variables */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-2">Available Rule Variables</label>
          <div className="flex flex-wrap gap-2">
            {variables.map((v) => (
              <button
                key={v.code}
                type="button"
                onClick={() => insertToken(v.code)}
                className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-xs font-medium text-orange-800 transition-colors flex items-center gap-1.5"
              >
                <Badge variant="outline" className="bg-white border-orange-300 text-orange-700 text-[10px]">
                  {v.code}
                </Badge>
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Operators */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-2">Arithmetic Operators</label>
          <div className="flex items-center gap-2">
            {operators.map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => insertToken(op)}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 transition-colors flex items-center justify-center"
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        {/* Example Formula Presets */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-2">Standard Formula Presets</label>
          <div className="space-y-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFormula('BASIC * 0.40')}
              className="w-full text-left p-2 hover:bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700 transition-colors flex justify-between items-center"
            >
              <span>HRA Standard (40% of Basic)</span>
              <span className="text-orange-600 font-bold">BASIC * 0.40</span>
            </button>
            <button
              type="button"
              onClick={() => setFormula('BASIC + HRA + TRANSPORT')}
              className="w-full text-left p-2 hover:bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700 transition-colors flex justify-between items-center"
            >
              <span>Gross Salary Standard</span>
              <span className="text-orange-600 font-bold">BASIC + HRA + TRANSPORT</span>
            </button>
            <button
              type="button"
              onClick={() => setFormula('GROSS - DEDUCTIONS')}
              className="w-full text-left p-2 hover:bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700 transition-colors flex justify-between items-center"
            >
              <span>Net Salary Standard</span>
              <span className="text-orange-600 font-bold">GROSS - DEDUCTIONS</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
