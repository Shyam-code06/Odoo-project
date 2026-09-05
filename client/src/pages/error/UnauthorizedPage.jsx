import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { currentRole } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center py-8">
        <CardBody className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Error 403 • Restricted Area
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Access Restricted</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Your active role (<strong>{currentRole || 'User'}</strong>) does not have authorization to view this HRMS section or execute operations on this path.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
            <Button
              variant="outline"
              size="md"
              leftIcon={ArrowLeft}
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={LayoutDashboard}
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
