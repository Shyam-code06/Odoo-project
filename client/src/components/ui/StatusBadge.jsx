import React from 'react';
import { Badge } from './Badge';

const STATUS_MAP = {
  Active: { variant: 'success', label: 'Active' },
  Inactive: { variant: 'neutral', label: 'Inactive' },
  Pending: { variant: 'warning', label: 'Pending' },
  Approved: { variant: 'success', label: 'Approved' },
  Rejected: { variant: 'danger', label: 'Rejected' },
  Draft: { variant: 'neutral', label: 'Draft' },
  Processing: { variant: 'primary', label: 'Processing' },
  Completed: { variant: 'success', label: 'Completed' },
  Paid: { variant: 'success', label: 'Paid' },
  Cancelled: { variant: 'danger', label: 'Cancelled' },
  OnLeave: { variant: 'pink', label: 'On Leave' },
  Terminated: { variant: 'danger', label: 'Terminated' },
};

export const StatusBadge = ({ status, size = 'md', className = '' }) => {
  const config = STATUS_MAP[status] || { variant: 'neutral', label: status || 'Unknown' };

  return (
    <Badge variant={config.variant} size={size} className={className}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75 inline-block" />
      {config.label}
    </Badge>
  );
};
