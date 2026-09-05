import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Palmtree, CalendarDays } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

export const EmployeeSmartButtons = ({ employeeId, counts = {} }) => {
  const navigate = useNavigate();

  const smartButtons = [
    {
      id: 'contracts',
      label: 'Contracts',
      count: counts.contracts || 0,
      icon: FileText,
      color: 'bg-orange-50 text-orange-600 border-orange-200 hover:border-orange-400',
      route: `/contracts?employeeId=${employeeId}`,
    },
    {
      id: 'attendance',
      label: 'Attendance',
      count: counts.attendance || 0,
      icon: Clock,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400',
      route: `/attendance?employeeId=${employeeId}`,
    },
    {
      id: 'time-off',
      label: 'Time Off Requests',
      count: counts.timeOff || 0,
      icon: Palmtree,
      color: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400',
      route: `/time-off/requests?employeeId=${employeeId}`,
    },
    {
      id: 'allocations',
      label: 'Leave Allocations',
      count: counts.allocations || 0,
      icon: CalendarDays,
      color: 'bg-rose-50 text-rose-600 border-rose-200 hover:border-rose-400',
      route: `/time-off/allocations?employeeId=${employeeId}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {smartButtons.map((btn) => {
        const IconComponent = btn.icon;
        return (
          <Card
            key={btn.id}
            hover
            padding="tight"
            onClick={() => navigate(btn.route)}
            className={`cursor-pointer transition-all border ${btn.color} group`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">{btn.label}</span>
              <div className="p-1.5 rounded-lg bg-white shadow-2xs">
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {btn.count}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 group-hover:text-orange-600 font-medium">
              View related records &rarr;
            </div>
          </Card>
        );
      })}
    </div>
  );
};
