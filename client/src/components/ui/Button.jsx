import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Flat, minimalist Button component.
 * Completely borderless, relying on crisp tonal contrast and clean typography.
 */
export const Button = React.forwardRef(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium select-none cursor-pointer outline-none',
      'transition-all duration-150 ease-out',
      'active:scale-[0.99]',
      'disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100'
    );

    const variants = {
      primary: 'bg-zinc-950 text-white hover:bg-zinc-800 active:bg-zinc-900',
      secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80 active:bg-zinc-200',
      ghost: 'bg-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80',
      subtle: 'bg-zinc-100/70 text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950',
      destructive: 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700',
    };

    const sizes = {
      xs: 'h-7 px-2.5 text-xs rounded-lg gap-1.5',
      sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-9 px-4 text-xs rounded-lg gap-2',
      lg: 'h-10 px-5 text-sm rounded-xl gap-2',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
