import React from 'react';
import { cn } from '../../lib/utils';

export const Textarea = React.forwardRef(
  ({ className, error, rows = 5, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'w-full p-4 text-sm bg-zinc-50 text-zinc-950 placeholder:text-zinc-400 rounded-xl resize-y',
            'transition-colors outline-none focus:bg-zinc-100/70 focus:ring-1 focus:ring-zinc-400',
            'disabled:opacity-50 leading-relaxed font-mono',
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

Textarea.displayName = 'Textarea';
export default Textarea;
