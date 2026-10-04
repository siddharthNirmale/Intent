import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Copy, Check, ListOrdered, FileCode, CheckCircle2, Sparkles } from 'lucide-react';
import Badge from './Badge';

const AGENT_NAME_MAP = {
  antigravity: 'Antigravity',
  'claude-code': 'Claude Code',
  cursor: 'Cursor',
  codex: 'Codex',
  generic: 'Generic Agent',
};

/**
 * Minimalist, borderless result viewer.
 * Presents the agent-ready Refined Command, execution directives, and Gemini reasoning
 * in clear, natural English with zero artificial AI decorations or borders.
 */
export const PromptResultViewer = ({
  result,
  className,
}) => {
  const [viewTab, setViewTab] = useState('prompt'); // 'prompt' | 'steps' | 'reasoning'
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const handleCopy = () => {
    if (!result?.compiledAgentPrompt) return;
    navigator.clipboard.writeText(result.compiledAgentPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const hasPlan = Array.isArray(result.structuredPlan) && result.structuredPlan.length > 0;
  const hasReasoning = Boolean(result.reasoning || (Array.isArray(result.detectedAmbiguities) && result.detectedAmbiguities.length > 0));
  const confidencePercent = result.confidenceScore
    ? Math.round(result.confidenceScore * 100)
    : 95;

  const targetAgentDisplay =
    result.targetAgentName ||
    AGENT_NAME_MAP[result.targetAgent?.toLowerCase()] ||
    result.targetAgent ||
    'Antigravity';

  const sourceDisplay =
    result.compilationSource === 'gemini-ai' ? 'Google Gemini AI' : 'Deterministic Engine';

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
              {result.primaryIntent || 'Compiled Refined Command'}
            </h2>
            <Badge variant="neutral">
              {confidencePercent}% confidence
            </Badge>
          </div>
          <p className="text-xs text-zinc-400">
            Target Agent: <span className="text-zinc-600 font-medium">{targetAgentDisplay}</span> • Compiled with {sourceDisplay}
          </p>
        </div>

        {/* View Switcher & Copy Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center p-0.5 bg-zinc-200/60 rounded-lg select-none">
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
              <span>Refined Command</span>
            </button>
            {hasPlan && (
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
            )}
            {hasReasoning && (
              <button
                type="button"
                onClick={() => setViewTab('reasoning')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer',
                  viewTab === 'reasoning'
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Reasoning</span>
              </button>
            )}
          </div>

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
            title={`Copy refined command for ${targetAgentDisplay}`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                <span>Copy Command</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewTab === 'prompt' && (
        /* Agent-Ready Refined Command */
        <div className="rounded-xl bg-white p-5 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono border-b border-zinc-100 pb-2">
            <span>Agent-Ready Command ({targetAgentDisplay})</span>
            <span>Directly pasteable into {targetAgentDisplay}</span>
          </div>
          <pre className="font-mono text-xs text-zinc-800 whitespace-pre-wrap break-words leading-relaxed max-h-[520px] overflow-y-auto pr-2 thin-scrollbar">
            {result.compiledAgentPrompt}
          </pre>
        </div>
      )}

      {viewTab === 'steps' && hasPlan && (
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
      )}

      {viewTab === 'reasoning' && (
        /* Intent Analysis & Reasoning Breakdown */
        <div className="rounded-xl bg-white p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              Understood Developer Intent
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {result.reasoning?.understoodGoal || result.primaryIntent}
            </p>
          </div>

          {Array.isArray(result.reasoning?.missingRequirementsIdentified) && result.reasoning.missingRequirementsIdentified.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-zinc-100">
              <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Unstated Requirements & Edge Cases Resolved
              </h3>
              <ul className="space-y-1 text-xs text-zinc-600 list-disc list-inside">
                {result.reasoning.missingRequirementsIdentified.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(result.detectedAmbiguities) && result.detectedAmbiguities.length > 0 && !result.reasoning?.missingRequirementsIdentified && (
            <div className="space-y-1.5 pt-2 border-t border-zinc-100">
              <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Ambiguities Resolved
              </h3>
              <ul className="space-y-1 text-xs text-zinc-600 list-disc list-inside">
                {result.detectedAmbiguities.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(result.reasoning?.architecturalDecisions) && result.reasoning.architecturalDecisions.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-zinc-100">
              <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Architectural Decisions Applied
              </h3>
              <ul className="space-y-1 text-xs text-zinc-600 list-disc list-inside">
                {result.reasoning.architecturalDecisions.map((decision, idx) => (
                  <li key={idx} className="leading-relaxed">{decision}</li>
                ))}
              </ul>
            </div>
          )}

          {result.reasoning?.agentOptimization && (
            <div className="space-y-1 pt-2 border-t border-zinc-100">
              <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Optimization for {targetAgentDisplay}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {result.reasoning.agentOptimization}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptResultViewer;
