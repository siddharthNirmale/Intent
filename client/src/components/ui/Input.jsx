import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Flat, minimalist Input field.
 * Completely borderless, defined by soft tonal background and crisp typography.
 */
export const Input = React.forwardRef(
  ({ className, type = 'text', error, startIcon, endIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center w-full">
          {startIcon && (
            <div className="absolute left-3 text-zinc-400 pointer-events-none flex items-center justify-center">
              {startIcon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              'w-full h-9 text-xs bg-zinc-100/70 hover:bg-zinc-100 focus:bg-zinc-100 text-zinc-950 placeholder:text-zinc-400 rounded-xl',
              'transition-colors duration-150 outline-none',
              'disabled:opacity-50 disabled:pointer-events-none',
              startIcon ? 'pl-8 pr-3' : 'px-3',
              endIcon ? 'pr-8' : '',
              error && 'bg-red-50 text-red-950',
              className
            )}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 flex items-center justify-center">
              {endIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
