import React, { useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X, CornerDownLeft } from 'lucide-react';
import Button from './Button';

/**
 * Prompt-Kit inspired PromptBox container.
 * Combines an auto-resizing textarea with an integrated action toolbar,
 * model/agent badge, character counter, keyboard shortcut hint (⌘↵ / Ctrl+↵),
 * and tactile submit button.
 */
export const PromptBox = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Enter command or developer instruction...',
  isLoading = false,
  disabled = false,
  agentName = 'Antigravity',
  providerName = 'Google Gemini 3',
  statusText = '',
  submitLabel = 'Compile Intent',
  onClear,
  minRows = 3,
  maxRows = 12,
  className,
  children,
}) => {
  const textareaRef = useRef(null);

  // Auto-resize textarea to fit content naturally
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const computedLineHeight = 20; // approximate line height in px
    const minHeight = minRows * computedLineHeight + 24;
    const maxHeight = maxRows * computedLineHeight + 24;
    const nextHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${nextHeight}px`;
  }, [value, minRows, maxRows]);

  // Handle Ctrl+Enter / Cmd+Enter for quick submission
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && !disabled && value.trim() && onSubmit) {
        onSubmit();
      }
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
    textareaRef.current?.focus();
  };

  const charCount = value ? value.length : 0;
  const isMac = typeof window !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
  const shortcutHint = isMac ? '⌘↵' : 'Ctrl+↵';

  return (
    <div
      className={cn(
        'group relative w-full bg-zinc-100/70 hover:bg-zinc-100/90 focus-within:bg-zinc-100',
        'rounded-2xl transition-all duration-150',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
    >
      {/* Textarea Input Workbench */}
      <div className="p-4 pb-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full bg-transparent text-xs sm:text-sm text-zinc-950 placeholder:text-zinc-400',
            'outline-none resize-none font-mono leading-relaxed',
            'thin-scrollbar'
          )}
          style={{ minHeight: `${minRows * 20 + 20}px` }}
          autoFocus
        />
      </div>

      {/* Optional Injected Area */}
      {children}

      {/* Integrated Action Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 rounded-b-2xl">
        {/* Left: Active Provider / Agent Metadata */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 select-none">
          <span className="text-zinc-800 font-medium">
            {agentName}
          </span>
          <span className="hidden sm:inline-block text-zinc-300">•</span>
          <span className="hidden sm:inline-block text-zinc-400 text-[11px]">
            {providerName}
          </span>
          {statusText && (
            <>
              <span className="text-zinc-300">•</span>
              <span className="text-zinc-500 text-[11px] font-mono">{statusText}</span>
            </>
          )}
        </div>

        {/* Right: Shortcut Hint, Char Counter & Action Button */}
        <div className="flex items-center gap-2.5">
          {charCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 font-mono select-none">
                {charCount} chars
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="text-zinc-400 hover:text-zinc-700 transition-colors p-1 rounded-md hover:bg-zinc-200/50 cursor-pointer"
                title="Clear input"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono select-none hidden md:flex" title={`Press ${shortcutHint} to compile`}>
            <span>{shortcutHint}</span>
            <CornerDownLeft className="w-2.5 h-2.5 text-zinc-300" />
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onSubmit}
            isLoading={isLoading}
            disabled={!value?.trim() || disabled}
            className="text-xs h-8 px-3.5"
          >
            <span>{submitLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromptBox;
