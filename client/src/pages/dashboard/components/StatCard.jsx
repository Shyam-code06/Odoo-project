import React from 'react';
import * as Icons from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/LoadingState';

export const StatCard = ({
  title,
  value,
  iconName = 'Users',
  trend,
  trendDirection = 'up',
  description,
  color = 'bg-orange-50 text-orange-600 border-orange-200',
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card padding="normal" className="flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="w-9 h-9 rounded-xl" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </Card>
    );
  }

  const IconComponent = Icons[iconName] || Icons.Users;

  const trendColors = {
    up: 'text-emerald-600 bg-emerald-50',
    down: 'text-rose-600 bg-rose-50',
    neutral: 'text-slate-600 bg-slate-100',
  };

  const TrendIcon =
    trendDirection === 'up'
      ? Icons.TrendingUp
      : trendDirection === 'down'
      ? Icons.TrendingDown
      : Icons.Minus;

  return (
    <Card hover padding="normal" className="flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${color} shrink-0`}>
          <IconComponent className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        <div className="flex items-center justify-between mt-1 text-[11px]">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium ${
                trendColors[trendDirection] || trendColors.neutral
              }`}
            >
              <TrendIcon className="w-3 h-3" />
              {trend}
            </span>
          )}
          {description && <span className="text-slate-500 truncate">{description}</span>}
        </div>
      </div>
    </Card>
  );
};
