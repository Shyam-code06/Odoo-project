import React from 'react';
import { Loader2 } from 'lucide-react';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

export const LoadingState = ({ variant = 'spinner', rows = 3, message = 'Loading details...' }) => {
  if (variant === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-2.5 text-slate-500">
        <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
        <span className="text-xs font-medium">{message}</span>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="w-full space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-12 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-6 bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className="space-y-4 max-w-lg w-full bg-white p-6 rounded-xl border border-slate-200">
        <Skeleton className="h-5 w-1/3 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    );
  }

  return null;
};
