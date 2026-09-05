import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = React.forwardRef(
  (
    {
      label,
      helperText,
      error,
      isRequired = false,
      isDisabled = false,
      isPasswordToggleable = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className = '',
      id,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const inputType = isPasswordToggleable
      ? showPassword
        ? 'text'
        : 'password'
      : type;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 select-none">
            {label}
            {isRequired && <span className="text-orange-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {LeftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              <LeftIcon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={isDisabled}
            className={`w-full rounded-lg border text-sm px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
              LeftIcon ? 'pl-9' : ''
            } ${RightIcon || isPasswordToggleable ? 'pr-9' : ''} ${
              error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
            } ${className}`}
            {...props}
          />
          {isPasswordToggleable ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : RightIcon ? (
            <div className="absolute right-3 text-slate-400">
              <RightIcon className="w-4 h-4" />
            </div>
          ) : null}
        </div>
        {error ? (
          <span className="text-xs text-red-600">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-slate-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
