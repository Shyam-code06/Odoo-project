import React from 'react';

export const IconButton = React.forwardRef(
  (
    {
      icon: Icon,
      ariaLabel,
      variant = 'ghost',
      size = 'md',
      isDisabled = false,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0';

    const variants = {
      primary: 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500 shadow-sm',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400 border border-slate-200',
      outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-orange-500 bg-white',
      ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-400',
      destructive: 'hover:bg-red-50 text-red-600 focus:ring-red-400',
    };

    const sizes = {
      sm: 'p-1.5 text-xs',
      md: 'p-2 text-sm',
      lg: 'p-2.5 text-base',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        disabled={isDisabled}
        onClick={onClick}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {Icon ? <Icon className={iconSizes[size]} /> : null}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
