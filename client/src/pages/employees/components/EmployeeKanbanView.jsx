import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Briefcase, User } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { StatusBadge } from '../../../components/ui/StatusBadge';

export const EmployeeKanbanView = ({ employees = [] }) => {
  const navigate = useNavigate();

  const statuses = ['Active', 'Inactive', 'Terminated'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statuses.map((status) => {
        const groupEmployees = employees.filter(
          (e) => e.employment_status.toLowerCase() === status.toLowerCase()
        );

        return (
          <div key={status} className="flex flex-col gap-3">
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-100/80 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {status}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-white text-slate-600 rounded-full border border-slate-200">
                  {groupEmployees.length}
                </span>
              </div>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 min-h-[200px]">
              {groupEmployees.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                  No {status.toLowerCase()} employees
                </div>
              ) : (
                groupEmployees.map((emp) => (
                  <Card
                    key={emp.id}
                    hover
                    padding="tight"
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="cursor-pointer transition-all hover:border-orange-300"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar src={emp.avatar} name={emp.fullName} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-slate-900 truncate">
                          {emp.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {emp.employee_code}
                        </div>

                        <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                          <div className="flex items-center gap-1.5 truncate">
                            <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{emp.jobPositionTitle}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{emp.departmentName}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                          <StatusBadge status={emp.employment_status} size="sm" />
                          <span className="text-[10px] text-slate-400">
                            Joined {emp.joining_date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
