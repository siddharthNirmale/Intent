import IntentTask from '../models/IntentTask.js';
import { getDbStatus } from '../config/db.js';
import agentRegistry from '../services/agents/agentRegistry.js';
import { compileWithGemini } from '../services/ai/geminiService.js';
import { decryptApiKey } from '../services/cryptoService.js';

// Predefined System Defaults for Initial Build Advanced Settings
export const BUILD_DEFAULTS = {
  techStack: 'Auto-Detect (Infer from prompt)',
  platform: 'antigravity',
  temperature: '0.2 (Precise)',
  colorPalette: 'Auto-Contextual (Clean Minimal)',
  libraries: [],
};

// Predefined System Defaults for Command Fix Advanced Settings
export const FIX_DEFAULTS = {
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

/**
 * Intelligent deterministic fallback compiler when Gemini AI is offline
 * Analyzes developer input dynamically without forcing hardcoded stacks or templates
 */
const compileDeveloperIntent = (rawPrompt, targetAgent = 'antigravity', mode = 'build', rules = [], config = {}) => {
  const promptLower = rawPrompt.toLowerCase();
  const isFix = mode === 'fix';

  let primaryIntent = '';
  const detectedAmbiguities = [];
  const detectedContradictions = [];
  let structuredPlan = [];
  const agent = typeof targetAgent === 'string' ? agentRegistry.getAgent(targetAgent) : targetAgent;

  if (isFix) {
    // Dynamic error diagnosis in fallback
    if (promptLower.includes('eaddrinuse') || promptLower.includes('port')) {
      primaryIntent = 'Resolve port collision and process lifecycle conflict';
    } else if (promptLower.includes('econnrefused') || promptLower.includes('mongo') || promptLower.includes('connection refused')) {
      primaryIntent = 'Fix database connection string and network timeout';
    } else if (promptLower.includes('typeerror') || promptLower.includes('cannot read') || promptLower.includes('undefined')) {
      primaryIntent = 'Fix runtime null / undefined reference exception';
    } else if (promptLower.includes('import') || promptLower.includes('resolve') || promptLower.includes('module')) {
      primaryIntent = 'Correct module resolution and package import paths';
    } else if (promptLower.includes('cors')) {
      primaryIntent = 'Resolve Cross-Origin Resource Sharing (CORS) origin policy mismatch';
    } else {
      primaryIntent = 'Isolate root cause of failure and apply surgical fix';
    }

    if (!promptLower.includes('expected') && !promptLower.includes('should')) {
      detectedAmbiguities.push('Implicit expected outcome inferred from standard error-free execution.');
    }

    const fixStrategy = config.fixStrategy || FIX_DEFAULTS.fixStrategy;
    const verification = config.verification || FIX_DEFAULTS.verification;
    const isManualVerification = verification.toLowerCase().includes('manual');

    structuredPlan = [
      {
        stepNumber: 1,
        title: 'Diagnose Failure Origin',
        targetFiles: ['affected file(s)'],
        instructions: `Trace origin of error condition from input: ${rawPrompt.slice(0, 120)}... Confirm exact root cause.`,
        verificationCriteria: 'Exact failure point identified with zero ambiguity.',
      },
      {
        stepNumber: 2,
        title: 'Apply Surgical Correction',
        targetFiles: ['target module'],
        instructions: `Apply correction adhering strictly to strategy: ${fixStrategy}. Keep changes minimal and isolated.`,
        verificationCriteria: 'Underlying defect resolved with zero collateral regressions.',
      },
      {
        stepNumber: 3,
        title: isManualVerification ? 'Manual Verification' : 'Automated Verification',
        targetFiles: ['test / runtime'],
        instructions: isManualVerification
          ? 'Verify fix manually following reproduction steps.'
          : 'Run command or test suite to assert clean exit with status 0.',
        verificationCriteria: isManualVerification
          ? 'Zero reproduction of issue observed.'
          : 'Exits cleanly with status 0.',
      },
    ];
  } else {
    // Dynamic feature intent analysis in fallback
    // Check if tech stack was specified by user or infer from prompt
    let detectedStack = config.techStack;
    if (!config.isTechStackCustom || !detectedStack || detectedStack.toLowerCase().includes('auto-detect')) {
      if (promptLower.includes('python') || promptLower.includes('fastapi')) {
        detectedStack = 'Python + FastAPI';
      } else if (promptLower.includes('next.js') || promptLower.includes('nextjs')) {
        detectedStack = 'Next.js 15';
      } else if (promptLower.includes('go') || promptLower.includes('golang')) {
        detectedStack = 'Go (Golang)';
      } else if (promptLower.includes('vue')) {
        detectedStack = 'Vue 3 + Vite';
      } else if (promptLower.includes('svelte')) {
        detectedStack = 'SvelteKit';
      } else if (promptLower.includes('express') || promptLower.includes('node')) {
        detectedStack = 'Node.js + Express';
      } else {
        detectedStack = 'Modern Web Architecture (Adaptive to prompt)';
      }
    }

    if (promptLower.includes('auth') || promptLower.includes('login') || promptLower.includes('jwt')) {
      primaryIntent = 'Implement secure user authentication flow';
    } else if (promptLower.includes('database') || promptLower.includes('schema') || promptLower.includes('model')) {
      primaryIntent = 'Design and connect database models and schemas';
    } else if (promptLower.includes('ui') || promptLower.includes('component') || promptLower.includes('page') || promptLower.includes('dashboard')) {
      primaryIntent = 'Construct responsive and accessible user interface';
    } else if (promptLower.includes('api') || promptLower.includes('endpoint')) {
      primaryIntent = 'Implement robust REST/API endpoints with validation';
    } else {
      primaryIntent = `Scaffold and implement feature specification in ${detectedStack}`;
    }

    if (!promptLower.includes('test') && !promptLower.includes('verify')) {
      detectedAmbiguities.push('Verification criteria inferred from functional acceptance requirements.');
    }

    structuredPlan = [
      {
        stepNumber: 1,
        title: 'Architect Boundaries & Types',
        targetFiles: ['config/*', 'types/*'],
        instructions: `Define boundaries, dependencies, and configuration for: ${primaryIntent}.`,
        verificationCriteria: 'Configuration and types validated with zero compilation errors.',
      },
      {
        stepNumber: 2,
        title: 'Core Implementation',
        targetFiles: ['src/*'],
        instructions: `Implement functionality based on user specification: ${rawPrompt.slice(0, 120)}... Adhere to ${detectedStack}.`,
        verificationCriteria: 'Feature logic complete, clean separation of concerns, zero syntax errors.',
      },
      {
        stepNumber: 3,
        title: 'End-to-End Validation',
        targetFiles: ['test/*', 'src/*'],
        instructions: 'Run automated tests or end-to-end flow to verify feature meets requirements.',
        verificationCriteria: 'All acceptance criteria satisfied.',
      },
    ];
  }

  // Format refined command using agent-specific structure
  const compiledAgentPrompt = agent.formatPrompt({
    mode,
    primaryIntent,
    rawPrompt,
    projectRules: rules,
    structuredPlan,
    config,
  });

  const reasoning = {
    understoodGoal: primaryIntent,
    missingRequirementsIdentified: detectedAmbiguities,
    architecturalDecisions: rules.slice(0, 3),
    agentOptimization: `Structured specifically for ${agent.name} autonomous workflow.`,
  };

  return {
    mode,
    primaryIntent,
    reasoning,
    detectedAmbiguities,
    detectedContradictions,
    confidenceScore: 0.9,
    structuredPlan,
    compiledAgentPrompt,
  };
};

/**
 * @desc    Compile developer prompt into structured agent instructions
 * @route   POST /api/intent/compile
 * @access  Public / Optional Auth
 */
export const compileIntent = async (req, res) => {
  try {
    const { rawPrompt, targetAgent, mode = 'build', rules = [], config = {} } = req.body;

    if (!rawPrompt || rawPrompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide instructions to compile',
      });
    }

    // Resolve target agent from registry
    const effectiveAgentId = targetAgent || config.platform || (mode === 'fix' ? FIX_DEFAULTS.platform : BUILD_DEFAULTS.platform);
    const agent = agentRegistry.getAgent(effectiveAgentId);

    // Build intelligent, contextual effectiveRules
    const effectiveRules = [...(Array.isArray(rules) ? rules : [])];

    if (mode === 'build') {
      const isCustomStack = Boolean(config.isTechStackCustom && config.techStack && !config.techStack.toLowerCase().includes('auto-detect'));
      const effectiveTechStack = isCustomStack ? config.techStack : BUILD_DEFAULTS.techStack;

      if (isCustomStack) {
        effectiveRules.push(
          `[MANDATORY TECH STACK] Strictly use: ${effectiveTechStack}. Do not alter, replace, or inject conflicting frameworks.`
        );
      } else {
        effectiveRules.push(
          `[DYNAMIC TECH STACK] The developer has not mandated a fixed technology stack. Analyze the user prompt to detect any intended or implied language/framework (e.g. Python, Next.js, Go, React). If the prompt is technology-agnostic, select an optimal modern standard stack suited for the task.`
        );
      }

      // Precision / Temperature setting
      if (config.temperature !== undefined) {
        effectiveRules.push(`[PRECISION LEVEL] Temperature: ${config.temperature} (${config.temperatureLabel || 'Precise'})`);
      }

      // Design / Color Palette
      if (config.isPaletteCustom && config.colorPalette) {
        const palette = config.colorPalette;
        const paletteDesc = typeof palette === 'object'
          ? `${palette.name} (Background: ${palette.bg}, Surface: ${palette.surface}, Text: ${palette.text}, Accent: ${palette.accent})`
          : String(palette);
        effectiveRules.push(`[DESIGN PALETTE] Apply color palette: ${paletteDesc}. Specify these design tokens for UI styling.`);
      } else {
        effectiveRules.push(`[DYNAMIC STYLING] If UI or frontend is involved, apply a clean, high-contrast, modern aesthetic. If this task is pure backend, CLI, or scripting, omit visual styling.`);
      }

      // Libraries & Dependencies
      if (config.isLibrariesCustom && Array.isArray(config.libraries) && config.libraries.length > 0) {
        effectiveRules.push(`[MANDATORY LIBRARIES] Include and utilize: ${config.libraries.join(', ')}.`);
      } else {
        effectiveRules.push(`[DYNAMIC LIBRARIES] Include only minimal, high-utility dependencies strictly necessary for this feature. Do not force unrequested packages.`);
      }
    } else if (mode === 'fix') {
      // Fix Strategy
      const effectiveStrategy = config.fixStrategy || FIX_DEFAULTS.fixStrategy;
      effectiveRules.push(`[FIX STRATEGY] Adhere to strategy: ${effectiveStrategy}`);

      // Issue Domain
      const isCustomDomain = Boolean(config.isDomainCustom && config.issueDomain && !config.issueDomain.toLowerCase().includes('auto-detect'));
      if (isCustomDomain) {
        effectiveRules.push(`[TARGET DOMAIN] Issue domain: ${config.issueDomain}`);
      } else {
        effectiveRules.push(`[DYNAMIC DOMAIN] Deduce exact failure domain (e.g. process lifecycle, database, module resolution, runtime exception) directly from the error stack trace or description.`);
      }

      // Verification Method
      const effectiveVerification = config.verification || FIX_DEFAULTS.verification;
      effectiveRules.push(`[VERIFICATION METHOD] Verification requirement: ${effectiveVerification}`);

      // Safety Rules
      const effectiveSafetyRules = Array.isArray(config.safetyRules) && config.safetyRules.length > 0
        ? config.safetyRules
        : FIX_DEFAULTS.safetyRules;
      effectiveRules.push(`[SAFETY GUARDRAILS] Inviolable constraints: ${effectiveSafetyRules.join('; ')}`);
    }

    // Securely resolve active Gemini API key:
    // 1. Try logged-in user's securely encrypted key in database
    let activeGeminiKey = '';
    if (req.user?.apiKeys?.gemini?.encryptedKey) {
      activeGeminiKey = decryptApiKey(req.user.apiKeys.gemini);
    }
    // 2. Try server-level environment fallback key if configured
    if (!activeGeminiKey && process.env.GEMINI_API_KEY) {
      activeGeminiKey = process.env.GEMINI_API_KEY.trim();
    }

    let compilation = null;
    let compilationSource = 'rule-engine';

    // If an active key is present, compile with real Gemini AI
    if (activeGeminiKey) {
      try {
        const geminiResult = await compileWithGemini({
          apiKey: activeGeminiKey,
          rawPrompt,
          targetAgentName: agent.name,
          targetAgentId: agent.id,
          agentGuidelines: typeof agent.getOptimizationGuidelines === 'function' ? agent.getOptimizationGuidelines() : '',
          mode,
          rules: effectiveRules,
          config,
        });

        // Format agent-specific prompt using the agent registry class
        const compiledAgentPrompt = agent.formatPrompt({
          mode,
          primaryIntent: geminiResult.primaryIntent,
          rawPrompt,
          refinedCommand: geminiResult.refinedCommand,
          projectRules: effectiveRules,
          structuredPlan: geminiResult.structuredPlan,
          config,
        });

        compilation = {
          mode,
          primaryIntent: geminiResult.primaryIntent,
          reasoning: geminiResult.reasoning,
          detectedAmbiguities: geminiResult.detectedAmbiguities,
          detectedContradictions: geminiResult.detectedContradictions,
          confidenceScore: geminiResult.confidenceScore,
          structuredPlan: geminiResult.structuredPlan,
          compiledAgentPrompt,
        };
        compilationSource = 'gemini-ai';
      } catch (geminiError) {
        // Safe logging - never log keys
        console.warn('[Compile Intent] Gemini AI compilation unavailable, falling back to deterministic compiler. Reason:', geminiError.message);
      }
    }

    // Gracefully fall back to deterministic compiler if Gemini wasn't used or failed
    if (!compilation) {
      compilation = compileDeveloperIntent(rawPrompt, agent, mode, effectiveRules, config);
      compilationSource = 'rule-engine';
    }

    let savedTask = null;
    if (getDbStatus()) {
      try {
        savedTask = await IntentTask.create({
          user: req.user ? req.user._id : null,
          rawPrompt: rawPrompt.trim(),
          targetAgent: agent.id,
          compilationSource,
          projectRules: effectiveRules || [],
          analysis: {
            primaryIntent: compilation.primaryIntent,
            reasoning: compilation.reasoning,
            detectedAmbiguities: compilation.detectedAmbiguities,
            detectedContradictions: compilation.detectedContradictions,
            confidenceScore: compilation.confidenceScore || 0.95,
          },
          structuredPlan: compilation.structuredPlan,
          compiledAgentPrompt: compilation.compiledAgentPrompt,
        });
      } catch (dbErr) {
        console.warn('[IntentTask Save Warning]:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        id: savedTask ? savedTask._id : 'ephemeral-' + Date.now(),
        rawPrompt,
        targetAgent: agent.id,
        targetAgentName: agent.name,
        compilationSource,
        ...compilation,
      },
    });
  } catch (error) {
    console.error('[Compile Intent Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to compile intent. Please try again.',
    });
  }
};

/**
 * @desc    Get list of supported AI agents
 * @route   GET /api/intent/agents
 * @access  Public
 */
export const getSupportedAgents = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: agentRegistry.listAgents(),
  });
};

/**
 * @desc    Get user's compiled intent history
 * @route   GET /api/intent/tasks
 * @access  Private
 */
export const getIntentTasks = async (req, res) => {
  try {
    if (!getDbStatus()) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const tasks = await IntentTask.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('[GetIntentTasks Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving compiled tasks',
    });
  }
};
