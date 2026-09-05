import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../components/ui/Card';

export const NeedsAttentionWidget = ({ items = [] }) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  const itemIcons = {
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-500 shrink-0" />,
  };

  return (
    <Card className="h-full flex flex-col justify-between" padding="none">
      <CardHeader className="p-4 sm:p-6 pb-3">
        <div>
          <CardTitle>Needs Attention</CardTitle>
          <CardSubtitle>Workflow items requiring authorization or review</CardSubtitle>
        </div>
      </CardHeader>

      <CardBody className="p-0 divide-y divide-slate-100">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => item.route && navigate(item.route)}
            className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-orange-50/40 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {itemIcons[item.type] || itemIcons.info}
              <span className="font-semibold text-slate-800 group-hover:text-orange-600 truncate">
                {item.label}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-transform group-hover:translate-x-0.5 shrink-0" />
          </div>
        ))}
      </CardBody>
    </Card>
  );
};
