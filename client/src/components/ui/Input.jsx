import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full h-10 px-3 text-sm bg-zinc-100/80 text-zinc-950 placeholder:text-zinc-400 rounded-lg',
            'transition-colors outline-none focus:bg-zinc-100 focus:ring-1 focus:ring-zinc-400',
            'disabled:opacity-50',
            error && 'bg-red-50 text-red-950 focus:ring-red-400',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
