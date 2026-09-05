import React from 'react';

export const Checkbox = React.forwardRef(
  (
    {
      label,
      description,
      checked = false,
      onChange,
      isDisabled = false,
      error,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const boxId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex items-start gap-2.5 ${className}`}>
        <input
          ref={ref}
          id={boxId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={isDisabled}
          className="w-4 h-4 mt-0.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500 focus:ring-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col select-none">
            {label && (
              <label htmlFor={boxId} className="text-sm font-medium text-slate-800 cursor-pointer">
                {label}
              </label>
            )}
            {description && <span className="text-xs text-slate-500">{description}</span>}
            {error && <span className="text-xs text-red-600 mt-0.5">{error}</span>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
