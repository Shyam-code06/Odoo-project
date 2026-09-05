import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const Alert = ({
  variant = 'info',
  title,
  children,
  isDismissible = true,
  className = '',
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const styles = {
    info: {
      container: 'bg-sky-50 border-sky-200 text-sky-900',
      icon: Info,
      iconColor: 'text-sky-600',
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    error: {
      container: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
    },
  };

  const current = styles[variant] || styles.info;
  const IconComponent = current.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border text-xs leading-relaxed ${current.container} ${className}`}
      role="alert"
    >
      <IconComponent className={`w-4 h-4 shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1">
        {title && <h4 className="font-semibold text-sm mb-0.5">{title}</h4>}
        <div>{children}</div>
      </div>
      {isDismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
