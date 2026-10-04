import React, { useState } from 'react';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Slider from '../ui/Slider';
import { apiIntent } from '../../api/client';
import { ChevronDown, ChevronUp, X, Search, Check, SlidersHorizontal } from 'lucide-react';

const BUILD_TYPES = ['Full Stack', 'Frontend', 'Backend'];

const PLATFORMS = [
  { id: 'claude-code', name: 'Claude Code' },
  { id: 'antigravity', name: 'Antigravity' },
  { id: 'cursor', name: 'Cursor' },
  { id: 'codex', name: 'Codex' },
];

const TECH_STACKS = [
  'MERN (React + Express + MongoDB)',
  'React + Vite + Tailwind',
  'Next.js (App Router)',
  'Node.js + Express REST API',
  'Python + FastAPI',
  'Custom',
];

const COLOR_PALETTES = [
  { name: 'Minimal White-First', dot: 'bg-white border border-zinc-200' },
  { name: 'Monochrome Slate', dot: 'bg-slate-300' },
  { name: 'Zinc Neutral', dot: 'bg-zinc-400' },
  { name: 'Onyx Dark', dot: 'bg-zinc-900' },
  { name: 'Warm Sand', dot: 'bg-amber-200' },
];

const CURATED_LIBRARIES = [
  'Tailwind CSS',
  'shadcn/ui',
  'Mongoose',
  'JWT',
  'Zod',
  'Lucide Icons',
  'Axios',
  'Bcrypt',
  'Prisma',
  'Express',
  'TanStack Query',
];

export const CompilerStudio = () => {
  const [mode, setMode] = useState('build'); // 'build' | 'fix'
  const [prompt, setPrompt] = useState('');

  // All Configuration Options (Inside Advanced Section for Initial Build)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [buildType, setBuildType] = useState('Full Stack');
  const [techStack, setTechStack] = useState('MERN (React + Express + MongoDB)');
  const [platform, setPlatform] = useState('claude-code');
  const [temperature, setTemperature] = useState(0.2);
  const [colorPalette, setColorPalette] = useState('Minimal White-First');
  const [selectedLibraries, setSelectedLibraries] = useState([
    'Tailwind CSS',
    'JWT',
  ]);
  const [libSearch, setLibSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const toggleLibrary = (lib) => {
    if (selectedLibraries.includes(lib)) {
      setSelectedLibraries(selectedLibraries.filter((item) => item !== lib));
    } else {
      setSelectedLibraries([...selectedLibraries, lib]);
    }
  };

  const handleAddCustomLib = (e) => {
    if (e.key === 'Enter' && libSearch.trim()) {
      e.preventDefault();
      const val = libSearch.trim();
      if (!selectedLibraries.includes(val)) {
        setSelectedLibraries([...selectedLibraries, val]);
      }
      setLibSearch('');
    }
  };

  const getTemperatureLabel = (val) => {
    const num = parseFloat(val);
    if (num <= 0.3) return 'Precise';
    if (num <= 0.7) return 'Balanced';
    return 'Creative';
  };

  const handleCompile = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const response = await apiIntent.compile({
        rawPrompt: prompt,
        targetAgent: platform,
        mode,
        config: mode === 'build' ? {
          buildType,
          techStack,
          platform,
          temperature: `${temperature} (${getTemperatureLabel(temperature)})`,
          colorPalette,
          libraries: selectedLibraries,
        } : undefined,
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
    <div className="max-w-2xl mx-auto py-10 space-y-7">
      {/* Workflow Mode Switch */}
      <div className="flex items-center gap-5 text-xs">
        <button
          type="button"
          onClick={() => {
            setMode('build');
            setResult(null);
          }}
          className={`transition-colors ${
            mode === 'build'
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
          className={`transition-colors ${
            mode === 'fix'
              ? 'text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          Command Fix
        </button>
      </div>

      {/* Heading */}
      <h1 className="text-xl font-medium tracking-tight text-zinc-950">
        {mode === 'build'
          ? 'Generate implementation prompt for a new build.'
          : 'Generate precise fix prompt from an error or issue.'}
      </h1>

      {/* Input Workbench */}
      <div className="space-y-4">
        <Textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            mode === 'build'
              ? 'Describe what to build (requirements, feature scope, endpoints)...'
              : 'Paste error message, failing command, or buggy behavior...'
          }
          autoFocus
        />

        {/* Action Row - Clean and Minimal by Default */}
        <div className="flex items-center justify-between pt-1">
          {mode === 'build' ? (
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 font-medium py-1.5 px-2 rounded-lg hover:bg-zinc-100/70 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Advanced</span>
              {showAdvanced ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Platform:</span>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="text-xs text-zinc-700 bg-transparent py-1 outline-none cursor-pointer hover:text-zinc-950 transition-colors"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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

        {/* ================= ALL CONFIGURATION IN ADVANCED SECTION ================= */}
        {mode === 'build' && showAdvanced && (
          <div className="mt-3 p-5 bg-zinc-50/80 rounded-2xl space-y-5 animate-in fade-in duration-150">
            {/* 1. Build Type */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">
                Build Type
              </span>
              <div className="flex bg-zinc-100 p-0.5 rounded-lg text-xs">
                {BUILD_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBuildType(type)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      buildType === type
                        ? 'bg-white text-zinc-950 font-medium shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 2 & 3. Tech Stack & Platform */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-500 block">
                  Tech Stack
                </span>
                <select
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full text-xs text-zinc-900 bg-white px-3 py-2 rounded-lg outline-none cursor-pointer"
                >
                  {TECH_STACKS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-500 block">
                  Platform
                </span>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full text-xs text-zinc-900 bg-white px-3 py-2 rounded-lg outline-none cursor-pointer"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Temperature Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-500">
                  Temperature
                </span>
                <span className="text-zinc-400 font-mono">
                  {temperature} • {getTemperatureLabel(temperature)}
                </span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>0.0 Strict</span>
                <span>0.5 Balanced</span>
                <span>1.0 Creative</span>
              </div>
            </div>

            {/* 5. Color Palette */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-500 block">
                Color Palette
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLOR_PALETTES.map((palette) => {
                  const isSelected = colorPalette === palette.name;
                  return (
                    <button
                      key={palette.name}
                      type="button"
                      onClick={() => setColorPalette(palette.name)}
                      className={`p-2 rounded-lg text-left text-xs transition-colors flex items-center gap-2 ${
                        isSelected
                          ? 'bg-white text-zinc-950 shadow-xs font-medium'
                          : 'bg-zinc-100/60 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${palette.dot} shrink-0`} />
                      <span className="truncate">{palette.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Libraries (Searchable Multi-Select) */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-zinc-500 block">
                Libraries & Dependencies
              </span>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={libSearch}
                  onChange={(e) => setLibSearch(e.target.value)}
                  onKeyDown={handleAddCustomLib}
                  placeholder="Search libraries or type name + Enter..."
                  className="w-full text-xs bg-white text-zinc-900 placeholder:text-zinc-400 pl-8 pr-3 py-2 rounded-lg outline-none"
                />
              </div>

              {/* Selected Active Chips */}
              {selectedLibraries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedLibraries.map((lib) => (
                    <span
                      key={lib}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-900 text-white rounded text-[11px]"
                    >
                      <span>{lib}</span>
                      <button
                        type="button"
                        onClick={() => toggleLibrary(lib)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {CURATED_LIBRARIES.filter((lib) =>
                  lib.toLowerCase().includes(libSearch.toLowerCase())
                ).map((lib) => {
                  const isSelected = selectedLibraries.includes(lib);
                  if (isSelected) return null;
                  return (
                    <button
                      key={lib}
                      type="button"
                      onClick={() => toggleLibrary(lib)}
                      className="px-2 py-0.5 rounded text-[11px] bg-white text-zinc-600 hover:text-zinc-950 transition-colors"
                    >
                      + {lib}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
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
