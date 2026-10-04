import React, { createContext, useContext } from 'react';
import { cn } from '../../lib/utils';

const TabsContext = createContext(null);

/**
 * Spectrum UI + Animate UI inspired Tabs component.
 * Minimalist, tactile tab navigation with smooth active indicator.
 */
export const Tabs = ({
  value,
  onValueChange,
  children,
  className,
  ...props
}) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ className, children, ...props }) => {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-zinc-100/80 rounded-xl select-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const TabsTrigger = ({
  value,
  disabled = false,
  className,
  children,
  ...props
}) => {
  const context = useContext(TabsContext);
  const isActive = context?.value === value;

  const handleClick = () => {
    if (!disabled && context?.onValueChange) {
      context.onValueChange(value);
    }
  };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer outline-none',
        'transition-all duration-150 ease-out active:scale-[0.98]',
        'focus-visible:bg-zinc-200/60',
        isActive
          ? 'bg-white text-zinc-950 font-semibold'
          : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/50',
        disabled && 'opacity-40 pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, className, children, ...props }) => {
  const context = useContext(TabsContext);
  if (context?.value !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn('animate-in fade-in duration-150 outline-none', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Tabs;
