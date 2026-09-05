import React from 'react';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../components/ui/Card';
import { Users, UserCheck, Clock, UserX, Palmtree, Home } from 'lucide-react';

export const AttendanceOverviewWidget = ({ summary }) => {
  if (!summary) return null;

  const categories = [
    { label: 'Present', count: summary.present, color: 'bg-emerald-500 text-emerald-700 bg-emerald-50 border-emerald-200', icon: UserCheck },
    { label: 'Late', count: summary.late, color: 'bg-amber-500 text-amber-700 bg-amber-50 border-amber-200', icon: Clock },
    { label: 'Absent', count: summary.absent, color: 'bg-rose-500 text-rose-700 bg-rose-50 border-rose-200', icon: UserX },
    { label: 'On Leave', count: summary.onLeave, color: 'bg-pink-500 text-pink-700 bg-pink-50 border-pink-200', icon: Palmtree },
    { label: 'WFH', count: summary.wfh, color: 'bg-sky-500 text-sky-700 bg-sky-50 border-sky-200', icon: Home },
  ];

  const maxVal = Math.max(...(summary.weeklyTrend?.map((t) => t.present) || [900]));

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <div>
          <CardTitle>Today's Attendance Breakdown</CardTitle>
          <CardSubtitle>Real-time workforce attendance & availability metrics</CardSubtitle>
        </div>
      </CardHeader>

      <CardBody className="space-y-6 pt-2">
        {/* Category Pills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {categories.map((cat) => {
            const IconComp = cat.icon;
            return (
              <div
                key={cat.label}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${cat.color}`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{cat.label}</span>
                  <IconComp className="w-3.5 h-3.5 opacity-80" />
                </div>
                <div className="text-xl font-bold mt-1">{cat.count}</div>
              </div>
            );
          })}
        </div>

        {/* Weekly Trend Bar Chart */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700">Weekly Attendance Trend</span>
            <span className="text-slate-400">Avg. 94.8% Operational</span>
          </div>
          <div className="grid grid-cols-5 gap-3 pt-2 items-end h-28 border-b border-slate-100 pb-2">
            {summary.weeklyTrend?.map((item) => {
              const heightPercent = Math.round((item.present / maxVal) * 100);
              return (
                <div key={item.day} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="w-full max-w-[28px] bg-slate-100 rounded-t-md h-full flex items-end overflow-hidden p-0.5">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t transition-all duration-500 group-hover:from-orange-600 group-hover:to-orange-500"
                      title={`${item.present} present on ${item.day}`}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
