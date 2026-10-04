import React from 'react';
import { cn } from '../../lib/utils';

export const Slider = React.forwardRef(
  ({ className, min = 0, max = 1, step = 0.1, value, onChange, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className={cn(
          'w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-950 outline-none',
          className
        )}
        {...props}
      />
    );
  }
);

Slider.displayName = 'Slider';
export default Slider;
