import React from 'react';

export const Radio = React.forwardRef(
  (
    {
      label,
      description,
      name,
      value,
      checked = false,
      onChange,
      isDisabled = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const radioId = id || `${name}-${value}`;

    return (
      <div className={`flex items-start gap-2.5 ${className}`}>
        <input
          ref={ref}
          id={radioId}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={isDisabled}
          className="w-4 h-4 mt-0.5 border-slate-300 text-orange-500 focus:ring-orange-500 focus:ring-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col select-none">
            {label && (
              <label htmlFor={radioId} className="text-sm font-medium text-slate-800 cursor-pointer">
                {label}
              </label>
            )}
            {description && <span className="text-xs text-slate-500">{description}</span>}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
