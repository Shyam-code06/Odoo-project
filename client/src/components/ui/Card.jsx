import React from 'react';

export const Card = ({
  children,
  className = '',
  padding = 'normal',
  hover = false,
  ...props
}) => {
  const paddings = {
    none: 'p-0',
    tight: 'p-4',
    normal: 'p-6',
    spacious: 'p-8',
  };

  return (
    <div
      className={`surface-card ${hover ? 'surface-card-hover' : ''} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between pb-4 border-b border-slate-100 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className="text-base font-semibold text-slate-900 tracking-tight">{children}</h3>
);

export const CardSubtitle = ({ children, className = '' }) => (
  <p className="text-xs text-slate-500 mt-0.5">{children}</p>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`py-2 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`pt-4 border-t border-slate-100 flex items-center justify-between ${className}`}>
    {children}
  </div>
);
