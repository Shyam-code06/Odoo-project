import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';

export function StructureValidationPanel({ validation, onRefresh, isRefreshing }) {
  if (!validation) return null;

  const isValid = Boolean(validation.isValid ?? validation.valid);
  const errors = Array.isArray(validation.errors) ? validation.errors : [];
  const warnings = Array.isArray(validation.warnings) ? validation.warnings : [];
  const issues = Array.isArray(validation.issues)
    ? validation.issues
    : [...errors, ...warnings];
  const issuesCount = issues.length;

  return (
    <Card className="p-5 border border-slate-200 shadow-sm bg-white rounded-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {isValid ? (
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 text-base">Configuration Health</h3>
              <Badge variant={isValid ? 'success' : 'warning'}>
                {isValid ? 'Ready for Payroll' : `${issuesCount} Issues Found`}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isValid
                ? 'All salary rules are properly configured, sequenced, and free of dependency conflicts.'
                : 'Please resolve configuration warnings before using this structure in live payruns.'}
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Re-validate configuration"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
          </button>
        )}
      </div>

      {isValid ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>Rule sequences ordered correctly</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>No duplicate rule codes detected</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>No circular dependencies</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>Valid formula and percentage definitions</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {errors.map((issue, idx) => {
            const ruleCode = typeof issue === 'object' ? issue.ruleCode : null;
            const message = typeof issue === 'object' ? issue.message : String(issue);
            return (
              <div key={`err-${idx}`} className="p-3 bg-red-50/70 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  {ruleCode && <span className="font-medium">Rule Code {ruleCode}: </span>}
                  {message}
                </div>
              </div>
            );
          })}
          {warnings.map((issue, idx) => {
            const ruleCode = typeof issue === 'object' ? issue.ruleCode : null;
            const message = typeof issue === 'object' ? issue.message : String(issue);
            return (
              <div key={`warn-${idx}`} className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  {ruleCode && <span className="font-medium">Rule Code {ruleCode}: </span>}
                  {message}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
