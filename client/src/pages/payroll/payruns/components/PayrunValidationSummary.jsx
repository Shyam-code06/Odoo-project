import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';

export function PayrunValidationSummary({ summary, onRecompute, isRecomputing }) {
  if (!summary) return null;

  const {
    computedCount = 0,
    errorCount = 0,
    warnings = [],
    errors = [],
  } = summary;

  const isValid = errorCount === 0 && errors.length === 0;

  return (
    <Card className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {isValid ? (
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 text-base">Payroll Validation & Diagnostics</h3>
              <Badge variant={isValid ? 'success' : 'danger'}>
                {isValid ? 'Validation Ready' : `${errors.length + warnings.length} Issues Flagged`}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isValid
                ? `${computedCount} employee payslips computed successfully and ready to validate.`
                : `${errorCount} errors must be resolved before finalizing payrun validation.`}
            </p>
          </div>
        </div>

        {onRecompute && (
          <button
            onClick={onRecompute}
            disabled={isRecomputing}
            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Re-run payroll calculation"
          >
            <RefreshCw className={`w-4 h-4 ${isRecomputing ? 'animate-spin text-orange-600' : ''}`} />
          </button>
        )}
      </div>

      {/* Validation Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{computedCount} Employees computed</span>
        </div>
        <div className="flex items-center gap-2">
          {warnings.length === 0 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}
          <span>{warnings.length} Non-blocking warnings</span>
        </div>
        <div className="flex items-center gap-2">
          {errors.length === 0 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          <span>{errors.length} Blocking errors</span>
        </div>
      </div>

      {/* Detailed Issues Banner */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          {errors.map((err, idx) => (
            <div key={`err-${idx}`} className="p-3 bg-red-50/80 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold">{err.employeeName}:</span> {err.message}
              </div>
            </div>
          ))}

          {warnings.map((warn, idx) => (
            <div key={`warn-${idx}`} className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold">{warn.employeeName}:</span> {warn.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
