import React from 'react';
import { Breadcrumb } from './Breadcrumb';

export const PageHeader = ({
  title,
  description,
  action,
  secondaryActions,
  breadcrumbs,
  className = '',
}) => {
  return (
    <div className={`mb-6 flex flex-col gap-3 ${className}`}>
      {/* Breadcrumb row */}
      <Breadcrumb items={breadcrumbs} />

      {/* Main Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {description && <p className="text-xs text-slate-500 mt-1 max-w-2xl">{description}</p>}
        </div>

        {(action || secondaryActions) && (
          <div className="flex items-center gap-2.5 shrink-0">
            {secondaryActions}
            {action}
          </div>
        )}
      </div>
    </div>
  );
};
