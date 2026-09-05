import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PayrunWizardStep1 } from './components/PayrunWizardStep1';
import { PayrunWizardStep2 } from './components/PayrunWizardStep2';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function PayrunWizardPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.PAYRUNS_CREATE);

  const [currentStep, setCurrentStep] = useState(1);

  // Initialize wizard state
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const formatDateStr = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const defaultStart = formatDateStr(firstDay);
  const defaultEnd = formatDateStr(lastDay);

  const [wizardData, setWizardData] = useState({
    salaryStructureId: '',
    periodStart: defaultStart,
    periodEnd: defaultEnd,
    name: `PAYRUN-${defaultStart.substring(0, 7)}`,
    selectedEmployeeIds: [],
  });

  const updateWizardData = (updates) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  };

  if (!canCreate) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-8 text-center text-slate-500">
          You do not have permission to create new payroll runs.
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/payroll/payruns')}
          className="p-2 h-9 w-9 text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <PageHeader
          title="Create New Payrun"
          description="Two-step wizard: Define payroll scope and period, evaluate contract eligibility, and select employees."
        />
      </div>

      {/* Stepper Bar */}
      <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-center gap-4 sm:gap-12">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              currentStep === 1 ? 'bg-orange-600 text-white shadow-sm' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {currentStep > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Scope & Period</span>
              <span className="text-[10px] text-slate-500 hidden sm:block">Select structure & date range</span>
            </div>
          </div>

          <div className="w-12 sm:w-24 h-0.5 bg-slate-200" />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              currentStep === 2 ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
            }`}>
              2
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Employee Selection</span>
              <span className="text-[10px] text-slate-500 hidden sm:block">Contract eligibility & employee picker</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Step Views */}
      {currentStep === 1 && (
        <PayrunWizardStep1
          wizardData={wizardData}
          updateWizardData={updateWizardData}
          onNext={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 2 && (
        <PayrunWizardStep2
          wizardData={wizardData}
          updateWizardData={updateWizardData}
          onBack={() => setCurrentStep(1)}
        />
      )}
    </div>
  );
}
