import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Spectrum UI inspired precision Slider.
 * Clean, subtle track with smooth thumb and high tactile control.
 */
export const Slider = React.forwardRef(
  ({ className, min = 0, max = 1, step = 0.1, value, onChange, ...props }, ref) => {
    // Calculate percentage for filled track
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

    return (
      <div className="relative w-full flex items-center py-1">
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          style={{
            background: `linear-gradient(to right, #18181b ${percentage}%, #e4e4e7 ${percentage}%)`,
          }}
          className={cn(
            'w-full h-1.5 rounded-lg appearance-none cursor-pointer outline-none transition-all',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-950',
            '[&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-95',
            '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';
export default Slider;
