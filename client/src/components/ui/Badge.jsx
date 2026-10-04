import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Minimalist, flat tag / badge.
 * Zero borders, zero rings, no artificial decorative dots or pulsating effects.
 */
export const Badge = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-zinc-100 text-zinc-700',
    primary: 'bg-zinc-950 text-white',
    success: 'bg-emerald-100/80 text-emerald-800',
    warning: 'bg-amber-100/80 text-amber-800',
    neutral: 'bg-zinc-100 text-zinc-600',
    info: 'bg-sky-100/80 text-sky-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium select-none',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      <span>{children}</span>
    </span>
  );
};

export default Badge;

