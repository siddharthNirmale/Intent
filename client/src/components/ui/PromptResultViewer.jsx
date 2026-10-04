import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Copy, Check, ListOrdered, FileCode, CheckCircle2 } from 'lucide-react';
import Badge from './Badge';

/**
 * Minimalist, borderless result viewer.
 * Presents compiled directives and the executable Antigravity agent prompt
 * in clear, natural English with zero artificial AI decorations or borders.
 */
export const PromptResultViewer = ({
  result,
  className,
}) => {
  const [viewTab, setViewTab] = useState('steps'); // 'steps' | 'prompt'
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const handleCopy = () => {
    if (!result?.compiledAgentPrompt) return;
    navigator.clipboard.writeText(result.compiledAgentPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const hasPlan = Array.isArray(result.structuredPlan) && result.structuredPlan.length > 0;
  const confidencePercent = result.confidenceScore
    ? Math.round(result.confidenceScore * 100)
    : 95;

  return (
    <div
      className={cn(
        'w-full bg-zinc-50/80 rounded-2xl p-6 space-y-5 animate-in fade-in duration-200',
        className
      )}
    >
      {/* Header: Primary Intent & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-zinc-950">
              {result.primaryIntent || 'Compiled Execution Plan'}
            </h2>
            <Badge variant="neutral">
              {confidencePercent}% confidence
            </Badge>
          </div>
          <p className="text-xs text-zinc-400">
            Target Agent: Antigravity • Compiled with Google Gemini 3
          </p>
        </div>

        {/* View Switcher & Copy Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasPlan && (
            <div className="flex items-center p-0.5 bg-zinc-200/60 rounded-lg select-none">
              <button
                type="button"
                onClick={() => setViewTab('steps')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer',
                  viewTab === 'steps'
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950'
                )}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Directives</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab('prompt')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer',
                  viewTab === 'prompt'
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950'
                )}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Agent Prompt</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
              'transition-colors cursor-pointer outline-none active:scale-[0.98]',
              copied
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-zinc-200/70 text-zinc-800 hover:bg-zinc-200 hover:text-zinc-950'
            )}
            title="Copy compiled agent prompt"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                <span>Copy Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewTab === 'steps' && hasPlan ? (
        <div className="space-y-3">
          {result.structuredPlan.map((step) => (
            <div
              key={step.stepNumber}
              className="p-4 rounded-xl bg-white space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400 font-mono">
                    {step.stepNumber}.
                  </span>
                  <span className="text-xs font-semibold text-zinc-950">
                    {step.title}
                  </span>
                </div>
                {Array.isArray(step.targetFiles) && step.targetFiles.length > 0 && (
                  <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md truncate max-w-[220px]">
                    {step.targetFiles.join(', ')}
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed pl-5">
                {step.instructions}
              </p>

              {step.verificationCriteria && (
                <div className="flex items-center gap-1.5 pl-5 pt-0.5 text-[11px] text-zinc-500">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="font-mono text-[11px] text-zinc-600 truncate">
                    Acceptance: {step.verificationCriteria}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Formatted Agent Prompt */
        <div className="rounded-xl bg-white p-5">
          <pre className="font-mono text-xs text-zinc-800 whitespace-pre-wrap break-words leading-relaxed max-h-[500px] overflow-y-auto pr-2 thin-scrollbar">
            {result.compiledAgentPrompt}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PromptResultViewer;
