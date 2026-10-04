import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Flat, minimalist Textarea component.
 * Completely borderless, defined by smooth tonal surface and natural typography.
 */
export const Textarea = React.forwardRef(
  ({ className, error, rows = 4, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'w-full p-3.5 text-xs sm:text-sm bg-zinc-100/70 hover:bg-zinc-100 focus:bg-zinc-100 text-zinc-950 placeholder:text-zinc-400 rounded-xl resize-y',
            'transition-colors duration-150 outline-none leading-relaxed font-mono thin-scrollbar',
            'disabled:opacity-50',
            error && 'bg-red-50 text-red-950',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
