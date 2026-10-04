import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Select = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Determine current display label
  const getDisplayLabel = () => {
    if (!value) return placeholder;

    // Check if options has groups
    for (const opt of options) {
      if (opt.group && Array.isArray(opt.items)) {
        const found = opt.items.find((item) =>
          typeof item === 'object' ? item.value === value || item.id === value : item === value
        );
        if (found) return typeof found === 'object' ? found.label || found.name : found;
      } else {
        const itemVal = typeof opt === 'object' ? opt.value || opt.id : opt;
        if (itemVal === value) {
          return typeof opt === 'object' ? opt.label || opt.name : opt;
        }
      }
    }

    return value;
  };

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full h-9 px-3 py-1.5 text-xs text-left bg-white text-zinc-900 rounded-lg',
          'flex items-center justify-between gap-2 cursor-pointer',
          'hover:bg-zinc-50/90 active:bg-zinc-100 transition-colors outline-none',
          isOpen && 'bg-zinc-50 ring-1 ring-zinc-300',
          className
        )}
      >
        <span className="truncate">{getDisplayLabel()}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-150',
            isOpen && 'rotate-180 text-zinc-600'
          )}
        />
      </button>

      {/* Menu Dropdown Popup */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] w-full min-w-[200px] max-h-64 overflow-y-auto bg-white rounded-xl shadow-float p-1 z-50 animate-in fade-in duration-100">
          {options.map((opt, optIdx) => {
            // Grouped Options
            if (opt.group && Array.isArray(opt.items)) {
              return (
                <div key={opt.group} className="space-y-0.5 mb-1.5 last:mb-0">
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {opt.group}
                  </div>
                  {opt.items.map((item) => {
                    const itemVal = typeof item === 'object' ? item.value || item.id : item;
                    const itemLabel = typeof item === 'object' ? item.label || item.name : item;
                    const isSelected = itemVal === value;

                    return (
                      <button
                        key={itemVal}
                        type="button"
                        onClick={() => handleSelect(itemVal)}
                        className={cn(
                          'w-full px-2.5 py-1.5 text-xs text-left rounded-md flex items-center justify-between gap-2 transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-zinc-100 text-zinc-950 font-medium'
                            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'
                        )}
                      >
                        <span className="truncate">{itemLabel}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-zinc-950 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              );
            }

            // Flat Options
            const itemVal = typeof opt === 'object' ? opt.value || opt.id : opt;
            const itemLabel = typeof opt === 'object' ? opt.label || opt.name : opt;
            const isSelected = itemVal === value;

            return (
              <button
                key={itemVal || optIdx}
                type="button"
                onClick={() => handleSelect(itemVal)}
                className={cn(
                  'w-full px-2.5 py-1.5 text-xs text-left rounded-md flex items-center justify-between gap-2 transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-zinc-100 text-zinc-950 font-medium'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'
                )}
              >
                <span className="truncate">{itemLabel}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-zinc-950 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Select;
