import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Copy, Check } from 'lucide-react';

/**
 * Minimalist result viewer.
 * Presents the Refined Command directly with a clean copy action
 * and zero visual clutter.
 */
export const PromptResultViewer = ({
  result,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const handleCopy = () => {
    if (!result?.compiledAgentPrompt) return;
    navigator.clipboard.writeText(result.compiledAgentPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className={cn(
        'w-full bg-zinc-50/80 rounded-2xl p-5 space-y-3.5 animate-in fade-in duration-200',
        className
      )}
    >
      {/* Header: Title & Copy Action */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-950 truncate">
          {result.primaryIntent || 'Refined Command'}
        </h2>

        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer outline-none active:scale-[0.98]',
            copied
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-zinc-200/60 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950'
          )}
          title="Copy compiled prompt"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Refined Command Output */}
      <div className="rounded-xl bg-white p-4">
        <pre className="font-mono text-xs text-zinc-800 whitespace-pre-wrap break-words leading-relaxed max-h-[500px] overflow-y-auto pr-2 thin-scrollbar">
          {result.compiledAgentPrompt}
        </pre>
      </div>
    </div>
  );
};

export default PromptResultViewer;
