import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../components/ui/Card';

export const QuickActionsWidget = ({ actions = [] }) => {
  const navigate = useNavigate();

  if (!actions || actions.length === 0) return null;

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div>
          <CardTitle>Quick Actions</CardTitle>
          <CardSubtitle>Frequent operational shortcuts for your role</CardSubtitle>
        </div>
      </CardHeader>

      <CardBody className="pt-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {actions.map((act) => {
            const IconComp = Icons[act.iconName] || Icons.Zap;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => navigate(act.route)}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-orange-50/50 hover:border-orange-200 transition-all group cursor-pointer text-center"
              >
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-orange-500 group-hover:text-white transition-colors mb-2">
                  <IconComp className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-orange-600 truncate w-full">
                  {act.label}
                </span>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};
