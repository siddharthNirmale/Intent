import React from 'react';
import { cn } from '../../lib/utils';

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
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors select-none disabled:opacity-40 disabled:pointer-events-none cursor-pointer outline-none';

    const variants = {
      primary: 'bg-zinc-950 text-white hover:bg-zinc-800 active:bg-zinc-900',
      secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300',
      outline: 'border border-zinc-200/80 bg-white text-zinc-900 hover:bg-zinc-50 active:bg-zinc-100',
      ghost: 'bg-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70',
      subtle: 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100',
      destructive: 'bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-10 px-4 text-sm rounded-lg gap-2',
      lg: 'h-11 px-5 text-sm rounded-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
