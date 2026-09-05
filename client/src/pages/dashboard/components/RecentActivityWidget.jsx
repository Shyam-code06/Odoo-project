import React from 'react';
import * as Icons from 'lucide-react';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../components/ui/Card';
import { formatTimeAgo } from '../../../utils/formatters';

export const ActivityItem = ({ actorName, action, target, timestamp, iconName = 'Clock' }) => {
  const IconComp = Icons[iconName] || Icons.Clock;

  return (
    <div className="relative pl-6 pb-4 last:pb-0 group">
      {/* Timeline vertical bar line */}
      <div className="absolute left-2.5 top-3 bottom-0 w-[1.5px] bg-slate-200 group-last:hidden" />

      {/* Timeline Dot Icon */}
      <div className="absolute left-0 top-0.5 w-5 h-5 rounded-full bg-orange-100 border border-orange-300 text-orange-600 flex items-center justify-center">
        <IconComp className="w-3 h-3" />
      </div>

      <div className="text-xs leading-relaxed">
        <span className="font-semibold text-slate-900">{actorName}</span>{' '}
        <span className="text-slate-600">{action}</span>{' '}
        <span className="font-medium text-orange-600">{target}</span>
        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
          {formatTimeAgo(timestamp)}
        </div>
      </div>
    </div>
  );
};

export const RecentActivityWidget = ({ activities = [] }) => {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div>
          <CardTitle>Recent HR Operations Activity</CardTitle>
          <CardSubtitle>Live audit trail of system workflows</CardSubtitle>
        </div>
      </CardHeader>

      <CardBody className="pt-2">
        {activities.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">No recent activity recorded.</div>
        ) : (
          <div className="space-y-1">
            {activities.map((act) => (
              <ActivityItem key={act.id} {...act} />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
