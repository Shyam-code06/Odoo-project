import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, LayoutDashboard } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center py-8">
        <CardBody className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200 shadow-xs">
            <FileQuestion className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Error 404
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Page Not Found</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              The page or resource you are looking for does not exist or has been relocated.
            </p>
          </div>

          <div className="pt-2">
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
