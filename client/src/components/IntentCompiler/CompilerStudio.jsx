import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Slider from '../ui/Slider';
import Select from '../ui/Select';
import PromptBox from '../ui/PromptBox';
import PromptResultViewer from '../ui/PromptResultViewer';
import { apiIntent } from '../../api/client';
import { ChevronDown, ChevronUp, X, Search, Check, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

const PLATFORM_OPTIONS = [
  { id: 'antigravity', label: 'Antigravity' },
  { id: 'claude-code', label: 'Claude Code' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'codex', label: 'Codex' },
];

const TECH_STACK_OPTIONS = [
  {
    group: 'Full Stack Frameworks',
    items: [
      'MERN Stack (React, Express, MongoDB)',
      'Next.js 15 (App Router, RSC, Tailwind)',
      'T3 Stack (Next.js, tRPC, Prisma, Tailwind)',
      'Next.js + Supabase + Tailwind',
      'Remix + PostgreSQL + Prisma',
      'Nuxt 3 + Vue + Nitro + Supabase',
      'SvelteKit + Supabase + Tailwind',
    ],
  },
  {
    group: 'Frontend Focused',
    items: [
      'React + Vite + Tailwind CSS',
      'Vue 3 + Vite + Pinia + Tailwind',
      'SvelteKit + Tailwind CSS (Frontend)',
      'Astro + Tailwind CSS (Content & Web)',
    ],
  },
  {
    group: 'Backend, APIs & Runtimes',
    items: [
      'Node.js + Express.js + Mongoose',
      'Python + FastAPI + SQLAlchemy',
      'NestJS + TypeScript + PostgreSQL',
      'Go + Gin / Fiber + PostgreSQL',
      'Bun + Elysia.js + Drizzle ORM',
      'Hono + Cloudflare Workers (Edge API)',
    ],
  },
  {
    group: 'Custom',
    items: ['Custom Architecture'],
  },
];

const COLOR_PALETTES = [
  {
    id: 'white-first',
    name: 'Minimal White-First',
    desc: 'Clean white background, subtle canvas, crisp neutral text',
    colors: ['#ffffff', '#f8fafc', '#09090b', '#18181b'],
    bg: '#ffffff',
    surface: '#f8fafc',
    text: '#09090b',
    accent: '#18181b',
    accentText: '#ffffff',
  },
  {
    id: 'monochrome',
    name: 'Vercel Monochrome',
    desc: 'Stark white, high-contrast zinc, solid pitch black',
    colors: ['#ffffff', '#f4f4f5', '#000000', '#52525b'],
    bg: '#ffffff',
    surface: '#f4f4f5',
    text: '#000000',
    accent: '#000000',
    accentText: '#ffffff',
  },
  {
    id: 'nordic',
    name: 'Nordic Frost',
    desc: 'Polar white canvas with cool arctic blue highlights',
    colors: ['#f8fafc', '#f1f5f9', '#0f172a', '#0284c7'],
    bg: '#f8fafc',
    surface: '#f1f5f9',
    text: '#0f172a',
    accent: '#0284c7',
    accentText: '#ffffff',
  },
  {
    id: 'linear-violet',
    name: 'Linear Violet',
    desc: 'Pure soft canvas with electric violet accents',
    colors: ['#faf5ff', '#f3e8ff', '#1e1b4b', '#7c3aed'],
    bg: '#faf5ff',
    surface: '#f3e8ff',
    text: '#1e1b4b',
    accent: '#7c3aed',
    accentText: '#ffffff',
  },
  {
    id: 'emerald',
    name: 'Emerald Terminal',
    desc: 'Developer green tints on clean white surfaces',
    colors: ['#ffffff', '#f0fdf4', '#064e3b', '#059669'],
    bg: '#ffffff',
    surface: '#f0fdf4',
    text: '#064e3b',
    accent: '#059669',
    accentText: '#ffffff',
  },
  {
    id: 'warm-editorial',
    name: 'Warm Editorial',
    desc: 'Warm cream paper, linen surface, terracotta amber',
    colors: ['#faf8f5', '#f4efe6', '#292524', '#d97706'],
    bg: '#faf8f5',
    surface: '#f4efe6',
    text: '#292524',
    accent: '#d97706',
    accentText: '#ffffff',
  },
  {
    id: 'onyx-dark',
    name: 'Onyx Studio (Dark)',
    desc: 'Deep graphite dark mode with electric cyan accent',
    colors: ['#09090b', '#18181b', '#f4f4f5', '#06b6d4'],
    bg: '#09090b',
    surface: '#18181b',
    text: '#f4f4f5',
    accent: '#06b6d4',
    accentText: '#09090b',
  },
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
  'TanStack Query',
  'Drizzle ORM',
  'NextAuth / Auth.js',
];

// Predefined system defaults for Initial Build
const SYSTEM_DEFAULTS = {
  techStack: 'MERN Stack (React, Express, MongoDB)',
  platform: 'antigravity',
  temperature: 0.2,
  selectedPaletteId: 'white-first',
  selectedLibraries: ['Tailwind CSS', 'JWT'],
};

// Command Fix Advanced Options
const FIX_STRATEGY_OPTIONS = [
  { id: 'surgical', label: 'Surgical Patch (Minimal changes, zero refactor)' },
  { id: 'root-cause', label: 'Root-Cause Fix (Eliminate underlying debt)' },
  { id: 'defensive', label: 'Defensive Guard (Add validation & error bounds)' },
  { id: 'diagnostic', label: 'Diagnostic Trace (Inject debug logging first)' },
];

const ISSUE_DOMAIN_OPTIONS = [
  { id: 'auto', label: 'Auto-Detect (Infer from error text)' },
  { id: 'backend', label: 'Backend & API (Node.js, Express, Middleware)' },
  { id: 'frontend', label: 'Frontend & UI (React, Vite, State, DOM)' },
  { id: 'database', label: 'Database & Storage (MongoDB, Mongoose, SQL)' },
  { id: 'lifecycle', label: 'Process & Ports (EADDRINUSE, kill, sockets)' },
  { id: 'build', label: 'Build & Bundler (npm, Vite, ESM, imports)' },
];

const VERIFICATION_OPTIONS = [
  { id: 'automated', label: 'Automated Command (Run command & check exit 0)' },
  { id: 'manual', label: 'Manual Steps (Step-by-step reproduction check)' },
  { id: 'inspection', label: 'Code Inspection (Syntax & logic review only)' },
];

const CURATED_SAFETY_RULES = [
  'Preserve existing API signatures',
  'Do not touch package.json dependencies',
  'Preserve working code & file structure',
  'Zero external network calls during fix',
  'Add regression unit test',
];

// Predefined system defaults for Command Fix
const FIX_DEFAULTS = {
  platform: 'antigravity',
  fixStrategy: 'Surgical Patch (Minimal changes, zero refactor)',
  issueDomain: 'Auto-Detect (Infer from error text)',
  verification: 'Automated Command (Run command & check exit 0)',
  safetyRules: [
    'Preserve existing API signatures',
    'Do not touch package.json dependencies',
    'Preserve working code & file structure',
  ],
};

export const CompilerStudio = () => {
  const [mode, setMode] = useState('build'); // 'build' | 'fix'
  const [prompt, setPrompt] = useState('');

  // Initial Build Advanced Settings state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [techStack, setTechStack] = useState(SYSTEM_DEFAULTS.techStack);
  const [platform, setPlatform] = useState(SYSTEM_DEFAULTS.platform);
  const [temperature, setTemperature] = useState(SYSTEM_DEFAULTS.temperature);
  const [selectedPaletteId, setSelectedPaletteId] = useState(SYSTEM_DEFAULTS.selectedPaletteId);
  const [selectedLibraries, setSelectedLibraries] = useState([...SYSTEM_DEFAULTS.selectedLibraries]);
  const [libSearch, setLibSearch] = useState('');

  // Track explicit user overrides for Initial Build
  const [overrides, setOverrides] = useState({
    techStack: false,
    platform: false,
    temperature: false,
    colorPalette: false,
    libraries: false,
  });

  // Command Fix Advanced Settings state
  const [showFixAdvanced, setShowFixAdvanced] = useState(false);
  const [fixPlatform, setFixPlatform] = useState(FIX_DEFAULTS.platform);
  const [fixStrategy, setFixStrategy] = useState(FIX_DEFAULTS.fixStrategy);
  const [issueDomain, setIssueDomain] = useState(FIX_DEFAULTS.issueDomain);
  const [verification, setVerification] = useState(FIX_DEFAULTS.verification);
  const [safetyRules, setSafetyRules] = useState([...FIX_DEFAULTS.safetyRules]);

  // Track explicit user overrides for Command Fix
  const [fixOverrides, setFixOverrides] = useState({
    platform: false,
    fixStrategy: false,
    issueDomain: false,
    verification: false,
    safetyRules: false,
  });

  const [loading, setLoading] = useState(false);
  const [aiStage, setAiStage] = useState(0);
  const [result, setResult] = useState(null);
  const [platformOptions, setPlatformOptions] = useState(PLATFORM_OPTIONS);

  // Progressive AI State progression without artificial glowing effects
  useEffect(() => {
    if (!loading) {
      setAiStage(0);
      return;
    }
    setAiStage(1);
    const t1 = setTimeout(() => setAiStage(2), 1400);
    const t2 = setTimeout(() => setAiStage(3), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  // Dynamically synchronize supported AI agents from backend registry
  useEffect(() => {
    apiIntent.getAgents()
      .then((res) => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setPlatformOptions(res.data.map((agent) => ({ id: agent.id, label: agent.name })));
        }
      })
      .catch(() => {});
  }, []);

  const activePalette =
    COLOR_PALETTES.find((p) => p.id === selectedPaletteId) || COLOR_PALETTES[0];

  const hasCustomOverrides = Object.values(overrides).some(Boolean);
  const hasCustomFixOverrides = Object.values(fixOverrides).some(Boolean);

  const handleResetDefaults = () => {
    setTechStack(SYSTEM_DEFAULTS.techStack);
    setPlatform(SYSTEM_DEFAULTS.platform);
    setTemperature(SYSTEM_DEFAULTS.temperature);
    setSelectedPaletteId(SYSTEM_DEFAULTS.selectedPaletteId);
    setSelectedLibraries([...SYSTEM_DEFAULTS.selectedLibraries]);
    setOverrides({
      techStack: false,
      platform: false,
      temperature: false,
      colorPalette: false,
      libraries: false,
    });
  };

  const handleResetFixDefaults = () => {
    setFixPlatform(FIX_DEFAULTS.platform);
    setFixStrategy(FIX_DEFAULTS.fixStrategy);
    setIssueDomain(FIX_DEFAULTS.issueDomain);
    setVerification(FIX_DEFAULTS.verification);
    setSafetyRules([...FIX_DEFAULTS.safetyRules]);
    setFixOverrides({
      platform: false,
      fixStrategy: false,
      issueDomain: false,
      verification: false,
      safetyRules: false,
    });
  };

  const toggleSafetyRule = (rule) => {
    setFixOverrides((prev) => ({ ...prev, safetyRules: true }));
    if (safetyRules.includes(rule)) {
      setSafetyRules(safetyRules.filter((r) => r !== rule));
    } else {
      setSafetyRules([...safetyRules, rule]);
    }
  };

  const toggleLibrary = (lib) => {
    setOverrides((prev) => ({ ...prev, libraries: true }));
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
      setOverrides((prev) => ({ ...prev, libraries: true }));
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
      let response;
      if (mode === 'build') {
        const dynamicConfig = {};
        if (overrides.techStack) dynamicConfig.techStack = techStack;
        if (overrides.platform) dynamicConfig.platform = platform;
        if (overrides.temperature) dynamicConfig.temperature = `${temperature} (${getTemperatureLabel(temperature)})`;
        if (overrides.colorPalette) dynamicConfig.colorPalette = `${activePalette.name} (Background: ${activePalette.bg}, Surface: ${activePalette.surface}, Accent: ${activePalette.accent})`;
        if (overrides.libraries) dynamicConfig.libraries = selectedLibraries;

        response = await apiIntent.compile({
          rawPrompt: prompt,
          targetAgent: platform,
          mode,
          config: dynamicConfig,
        });
      } else {
        const dynamicConfig = {};
        if (fixOverrides.platform) dynamicConfig.platform = fixPlatform;
        if (fixOverrides.fixStrategy) dynamicConfig.fixStrategy = fixStrategy;
        if (fixOverrides.issueDomain) dynamicConfig.issueDomain = issueDomain;
        if (fixOverrides.verification) dynamicConfig.verification = verification;
        if (fixOverrides.safetyRules) dynamicConfig.safetyRules = safetyRules;

        response = await apiIntent.compile({
          rawPrompt: prompt,
          targetAgent: fixPlatform,
          mode,
          config: dynamicConfig,
        });
      }

      if (response && response.success && response.data) {
        setResult(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      {/* Workflow Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-zinc-100 rounded-xl select-none">
          <button
            type="button"
            onClick={() => {
              setMode('build');
              setResult(null);
            }}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer outline-none',
              mode === 'build'
                ? 'bg-white text-zinc-950 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            Initial Build
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('fix');
              setResult(null);
            }}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer outline-none',
              mode === 'fix'
                ? 'bg-white text-zinc-950 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            Command Fix
          </button>
        </div>

        {/* Clean Agent Status */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 select-none">
          <span>Target: Antigravity</span>
          <span>•</span>
          <span>Google Gemini 3</span>
        </div>
      </div>

      {/* Main Heading */}
      <h1 className="text-xl font-medium tracking-tight text-zinc-950">
        {mode === 'build'
          ? 'Compile implementation blueprint for Antigravity.'
          : 'Refine error into surgical fix directives for Antigravity.'}
      </h1>

      {/* Clean Workbench */}
      <div className="space-y-3">
        <PromptBox
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onSubmit={handleCompile}
          onClear={() => setPrompt('')}
          placeholder={
            mode === 'build'
              ? 'Enter command or feature requirements to compile...'
              : 'Paste error message, failing command, or unintended behavior...'
          }
          agentName={mode === 'build' ? platform : fixPlatform}
          providerName="Gemini 3 Flash"
          submitLabel={mode === 'build' ? 'Compile Blueprint' : 'Compile Fix'}
          isLoading={loading}
          disabled={loading}
        />

        {/* Natural AI Reasoning State Communication */}
        {loading && (
          <div className="bg-zinc-100/80 rounded-xl px-4 py-3 flex items-center justify-between text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-zinc-400">
                Phase {aiStage} of 3
              </span>
              <span className="text-zinc-800 font-medium">
                {aiStage === 1 && 'Understanding developer intent and context...'}
                {aiStage === 2 && 'Structuring execution directives and constraints...'}
                {aiStage === 3 && 'Synthesizing deterministic Antigravity blueprint...'}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline-block">
              Gemini 3
            </span>
          </div>
        )}

        {/* Advanced Settings Toggle & Actions */}
        <div className="flex items-center justify-between pt-1">
          {mode === 'build' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 font-medium py-1.5 px-2.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                <span>Architecture Parameters</span>
                {showAdvanced ? (
                  <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </button>

              {hasCustomOverrides && showAdvanced && (
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors px-1.5 py-1 rounded cursor-pointer"
                  title="Reset to system defaults"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset defaults</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFixAdvanced(!showFixAdvanced)}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 font-medium py-1.5 px-2.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                <span>Preservation Guardrails</span>
                {showFixAdvanced ? (
                  <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </button>

              {hasCustomFixOverrides && showFixAdvanced && (
                <button
                  type="button"
                  onClick={handleResetFixDefaults}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors px-1.5 py-1 rounded cursor-pointer"
                  title="Reset to system defaults"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset defaults</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ================= ADVANCED SECTION (INITIAL BUILD) ================= */}
        {mode === 'build' && showAdvanced && (
          <div className="p-5 bg-zinc-50/80 rounded-2xl space-y-6 animate-in fade-in duration-150">
            {/* 1. Tech Stack & Platform */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">
                    Tech Stack
                  </span>
                  {!overrides.techStack && (
                    <span className="text-[10px] text-zinc-400">Default</span>
                  )}
                </div>
                <Select
                  value={techStack}
                  onChange={(val) => {
                    setTechStack(val);
                    setOverrides((prev) => ({ ...prev, techStack: true }));
                  }}
                  options={TECH_STACK_OPTIONS}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">
                    Target Agent
                  </span>
                  {!overrides.platform && (
                    <span className="text-[10px] text-zinc-400">Default</span>
                  )}
                </div>
                <Select
                  value={platform}
                  onChange={(val) => {
                    setPlatform(val);
                    setOverrides((prev) => ({ ...prev, platform: true }));
                  }}
                  options={platformOptions}
                />
              </div>
            </div>

            {/* 2. Temperature Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-500">
                  Precision Level
                </span>
                <span className="text-zinc-400 font-mono">
                  {temperature} • {getTemperatureLabel(temperature)}
                  {!overrides.temperature && ' (Default)'}
                </span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={(e) => {
                  setTemperature(parseFloat(e.target.value));
                  setOverrides((prev) => ({ ...prev, temperature: true }));
                }}
              />
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>0.0 Strict & Deterministic</span>
                <span>0.5 Balanced</span>
                <span>1.0 Exploratory</span>
              </div>
            </div>

            {/* 3. Color Palette */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Theme Palette
                </span>
                <span className="text-[11px] text-zinc-400">
                  {overrides.colorPalette ? 'Custom: ' : 'Default: '}
                  <span className="font-medium text-zinc-700">{activePalette.name}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLOR_PALETTES.map((palette) => {
                  const isSelected = selectedPaletteId === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => {
                        setSelectedPaletteId(palette.id);
                        setOverrides((prev) => ({ ...prev, colorPalette: true }));
                      }}
                      className={cn(
                        'p-2.5 rounded-xl text-left transition-colors flex flex-col justify-between gap-2 cursor-pointer',
                        isSelected
                          ? 'bg-white font-medium'
                          : 'bg-zinc-100/70 hover:bg-zinc-200/60'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-zinc-900 truncate">
                          {palette.name}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
                        )}
                      </div>

                      <div className="flex h-2.5 w-full rounded-md overflow-hidden">
                        {palette.colors.map((c, i) => (
                          <div
                            key={i}
                            className="flex-1 h-full"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Libraries */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Frameworks & Dependencies
                </span>
                {!overrides.libraries && (
                  <span className="text-[10px] text-zinc-400">Default: Tailwind CSS, JWT</span>
                )}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={libSearch}
                  onChange={(e) => setLibSearch(e.target.value)}
                  onKeyDown={handleAddCustomLib}
                  placeholder="Search libraries or type name + Enter..."
                  className="w-full text-xs bg-white text-zinc-900 placeholder:text-zinc-400 pl-8 pr-3 py-2 rounded-lg outline-none focus:bg-zinc-100/80 transition-colors"
                />
              </div>

              {selectedLibraries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedLibraries.map((lib) => (
                    <span
                      key={lib}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-900 text-white rounded-md text-[11px] font-medium"
                    >
                      <span>{lib}</span>
                      <button
                        type="button"
                        onClick={() => toggleLibrary(lib)}
                        className="text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

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
                      className="px-2 py-0.5 rounded-md text-[11px] bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700 transition-colors cursor-pointer"
                    >
                      + {lib}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= ADVANCED SECTION (COMMAND FIX) ================= */}
        {mode === 'fix' && showFixAdvanced && (
          <div className="p-5 bg-zinc-50/80 rounded-2xl space-y-5 animate-in fade-in duration-150">
            {/* 1. Target Agent & Fix Strategy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">
                    Target Agent
                  </span>
                  {!fixOverrides.platform && (
                    <span className="text-[10px] text-zinc-400">Default</span>
                  )}
                </div>
                <Select
                  value={fixPlatform}
                  onChange={(val) => {
                    setFixPlatform(val);
                    setFixOverrides((prev) => ({ ...prev, platform: true }));
                  }}
                  options={platformOptions}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">
                    Fix Strategy
                  </span>
                  {!fixOverrides.fixStrategy && (
                    <span className="text-[10px] text-zinc-400">Default</span>
                  )}
                </div>
                <Select
                  value={fixStrategy}
                  onChange={(val) => {
                    setFixStrategy(val);
                    setFixOverrides((prev) => ({ ...prev, fixStrategy: true }));
                  }}
                  options={FIX_STRATEGY_OPTIONS}
                />
              </div>
            </div>

            {/* 2. Issue Domain & Verification Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">
                    Issue Domain
                  </span>
                  {!fixOverrides.issueDomain && (
                    <span className="text-[10px] text-zinc-400">Default</span>
                  )}
                </div>
                <Select
                  value={issueDomain}
                  onChange={(val) => {
                    setIssueDomain(val);
                    setFixOverrides((prev) => ({ ...prev, issueDomain: true }));
                  }}
                  options={ISSUE_DOMAIN_OPTIONS}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">
                    Verification Method
                  </span>
                  {!fixOverrides.verification && (
                    <span className="text-[10px] text-zinc-400">Default</span>
                  )}
                </div>
                <Select
                  value={verification}
                  onChange={(val) => {
                    setVerification(val);
                    setFixOverrides((prev) => ({ ...prev, verification: true }));
                  }}
                  options={VERIFICATION_OPTIONS}
                />
              </div>
            </div>

            {/* 3. Safety & Preservation Guardrails */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Preservation & Safety Guardrails
                </span>
                {!fixOverrides.safetyRules ? (
                  <span className="text-[10px] text-zinc-400">Default: 3 active</span>
                ) : (
                  <span className="text-[10px] text-zinc-700 font-medium">
                    {safetyRules.length} active
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {CURATED_SAFETY_RULES.map((rule) => {
                  const isActive = safetyRules.includes(rule);
                  return (
                    <button
                      key={rule}
                      type="button"
                      onClick={() => toggleSafetyRule(rule)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer',
                        isActive
                          ? 'bg-zinc-900 text-white font-medium'
                          : 'bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700'
                      )}
                    >
                      {isActive && <Check className="w-3 h-3 text-white" />}
                      <span>{rule}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Output Viewer */}
      {result && (
        <PromptResultViewer result={result} />
      )}
    </div>
  );
};

export default CompilerStudio;
