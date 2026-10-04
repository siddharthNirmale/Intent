import React from 'react';
import { cn } from '../../lib/utils';

export const Badge = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-zinc-100 text-zinc-700',
    primary: 'bg-zinc-900 text-white',
    success: 'bg-emerald-50 text-emerald-800',
    warning: 'bg-amber-50 text-amber-800',
    neutral: 'bg-zinc-50 text-zinc-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
