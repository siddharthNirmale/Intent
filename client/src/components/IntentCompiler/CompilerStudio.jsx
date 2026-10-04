import React, { useState } from 'react';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import { apiIntent } from '../../api/client';

const TARGET_AGENTS = [
  { id: 'claude-code', name: 'Claude Code' },
  { id: 'cursor', name: 'Cursor' },
  { id: 'cline', name: 'Cline' },
  { id: 'codex', name: 'Codex' },
];

export const CompilerStudio = () => {
  const [mode, setMode] = useState('build'); // 'build' | 'fix'
  const [prompt, setPrompt] = useState('');
  const [agent, setAgent] = useState('claude-code');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCompile = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const response = await apiIntent.compile({
        rawPrompt: prompt,
        targetAgent: agent,
        mode,
      });

      if (response.success && response.data) {
        setResult(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.compiledAgentPrompt) return;
    navigator.clipboard.writeText(result.compiledAgentPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-7">
      {/* Mode Switch */}
      <div className="flex items-center gap-5 text-xs">
        <button
          type="button"
          onClick={() => {
            setMode('build');
            setResult(null);
          }}
          className={`transition-colors ${mode === 'build'
              ? 'text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-700'
            }`}
        >
          Initial Build
        </button>
        <span className="text-zinc-200">/</span>
        <button
          type="button"
          onClick={() => {
            setMode('fix');
            setResult(null);
          }}
          className={`transition-colors ${mode === 'fix'
              ? 'text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-700'
            }`}
        >
          Command Fix
        </button>
      </div>

      {/* Dynamic Heading */}
      <h1 className="text-xl font-medium tracking-tight text-zinc-950">
        {mode === 'build'
          ? 'Generate implementation prompt for a new feature.'
          : 'Generate precise fix prompt from an error or issue.'}
      </h1>

      {/* Input Workbench */}
      <div className="space-y-4">
        <Textarea
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            mode === 'build'
              ? 'Describe what you want to build from scratch (stack, requirements, UI)...'
              : 'Paste error message, failing command, or buggy behavior...'
          }
          autoFocus
        />

        <div className="flex items-center justify-between">
          <select
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            className="text-xs text-zinc-500 bg-transparent py-1.5 outline-none cursor-pointer hover:text-zinc-950 transition-colors"
          >
            {TARGET_AGENTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            size="md"
            onClick={handleCompile}
            isLoading={loading}
            disabled={!prompt.trim()}
          >
            {mode === 'build' ? 'Generate Build Prompt' : 'Generate Fix Prompt'}
          </Button>
        </div>
      </div>

      {/* Compiled Output */}
      {result && (
        <div className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-900">
              {result.primaryIntent}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-zinc-500 hover:text-zinc-950 transition-colors"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="bg-zinc-50 p-4 rounded-xl">
            <pre className="font-mono text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed">
              {result.compiledAgentPrompt}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompilerStudio;
