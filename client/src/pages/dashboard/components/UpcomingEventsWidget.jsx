import React from 'react';
import * as Icons from 'lucide-react';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../components/ui/Card';

export const UpcomingEventsWidget = ({ events = [] }) => {
  return (
    <Card className="flex flex-col justify-between" padding="none">
      <CardHeader className="p-4 sm:p-6 pb-3">
        <div>
          <CardTitle>Upcoming Events & Deadlines</CardTitle>
          <CardSubtitle>Anniversaries, holidays and key HR dates</CardSubtitle>
        </div>
      </CardHeader>

      <CardBody className="p-0 divide-y divide-slate-100">
        {events.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">No upcoming events scheduled.</div>
        ) : (
          events.map((evt) => {
            const IconComp = Icons[evt.iconName] || Icons.Calendar;
            return (
              <div key={evt.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${evt.color}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{evt.title}</div>
                    <div className="text-[11px] text-slate-500 truncate">{evt.category}</div>
                  </div>
                </div>
                <span className="px-2 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-md shrink-0">
                  {evt.date}
                </span>
              </div>
            );
          })
        )}
      </CardBody>
    </Card>
  );
};
