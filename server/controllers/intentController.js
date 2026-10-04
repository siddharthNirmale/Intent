import IntentTask from '../models/IntentTask.js';
import { getDbStatus } from '../config/db.js';
import agentRegistry from '../services/agents/agentRegistry.js';
import { compileWithGemini } from '../services/ai/geminiService.js';
import { decryptApiKey } from '../services/cryptoService.js';

// Predefined System Defaults for Initial Build Advanced Settings
export const BUILD_DEFAULTS = {
  techStack: 'MERN Stack (React, Express, MongoDB)',
  platform: 'claude-code',
  temperature: '0.2 (Precise)',
  colorPalette: 'Minimal White-First',
  libraries: ['Tailwind CSS', 'JWT'],
};

// Predefined System Defaults for Command Fix Advanced Settings
export const FIX_DEFAULTS = {
  platform: 'claude-code',
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
 * Helper to analyze developer input and compile into a structured agent prompt
 * Supports both:
 * 1. 'build' — Initial Build: complete implementation prompt from scratch
 * 2. 'fix' — Command Fix: analyze issue/error and generate precise fix prompt
 */
const compileDeveloperIntent = (rawPrompt, targetAgent = 'claude-code', mode = 'build', rules = [], config = {}) => {
  const promptLower = rawPrompt.toLowerCase();
  const isFix = mode === 'fix';

  let primaryIntent = '';
  const detectedAmbiguities = [];
  const detectedContradictions = [];
  let structuredPlan = [];
  let compiledAgentPrompt = '';

  if (isFix) {
    // Command Fix Mode
    primaryIntent = 'Isolate root cause and apply precise fix';
    if (promptLower.includes('eaddrinuse') || promptLower.includes('port')) {
      primaryIntent = 'Resolve port collision and process lifecycle conflict';
    } else if (promptLower.includes('econnrefused') || promptLower.includes('mongo')) {
      primaryIntent = 'Fix database connection string and network timeout';
    } else if (promptLower.includes('typeerror') || promptLower.includes('cannot read') || promptLower.includes('undefined')) {
      primaryIntent = 'Fix runtime null / undefined reference exception';
    } else if (promptLower.includes('import') || promptLower.includes('resolve') || promptLower.includes('module')) {
      primaryIntent = 'Correct module resolution and import paths';
    } else if (promptLower.includes('cors')) {
      primaryIntent = 'Fix Cross-Origin Resource Sharing (CORS) origin policy';
    }

    if (!promptLower.includes('expected') && !promptLower.includes('should')) {
      detectedAmbiguities.push('Expected outcome inferred from standard framework behavior.');
    }

    const fixStrategy = config.fixStrategy || FIX_DEFAULTS.fixStrategy;
    const verification = config.verification || FIX_DEFAULTS.verification;
    const isManualVerification = verification.toLowerCase().includes('manual');

    const projectRules = rules.length > 0 ? rules : [
      `Fix Strategy: ${fixStrategy}`,
      `Verification: ${verification}`,
      ...FIX_DEFAULTS.safetyRules.map((r) => `Constraint: ${r}`),
    ];

    const verifyStep = isManualVerification
      ? {
        stepNumber: 3,
        title: 'Manual Verification',
        targetFiles: ['reproduction steps'],
        instructions: 'Follow explicit step-by-step reproduction instructions to verify fix manually.',
        verificationCriteria: 'Manually verified with zero reproduction of issue.',
      }
      : {
        stepNumber: 3,
        title: 'Regression Verification',
        targetFiles: ['runtime / tests'],
        instructions: 'Test the fixed command or flow to verify expected behavior.',
        verificationCriteria: 'Exits cleanly with expected status 0.',
      };

    structuredPlan = [
      {
        stepNumber: 1,
        title: 'Diagnose Root Cause',
        targetFiles: ['affected file(s)'],
        instructions: `Trace origin of issue: ${rawPrompt.slice(0, 100)}... Confirm error condition.`,
        verificationCriteria: 'Exact failure point verified.',
      },
      {
        stepNumber: 2,
        title: 'Apply Surgical Fix',
        targetFiles: ['target module'],
        instructions: `Apply correction adhering strictly to strategy: ${fixStrategy}.`,
        verificationCriteria: 'Error resolved with zero collateral side effects.',
      },
      verifyStep,
    ];

    const agent = typeof targetAgent === 'string' ? agentRegistry.getAgent(targetAgent) : targetAgent;
    compiledAgentPrompt = agent.formatPrompt({
      mode,
      primaryIntent,
      rawPrompt,
      projectRules,
      structuredPlan,
      config,
    });
  } else {
    // Initial Build Mode
    primaryIntent = 'Scaffold and implement feature from scratch';
    if (promptLower.includes('auth') || promptLower.includes('login') || promptLower.includes('jwt')) {
      primaryIntent = 'Implement secure user authentication pipeline';
    } else if (promptLower.includes('database') || promptLower.includes('mongo') || promptLower.includes('schema')) {
      primaryIntent = 'Design and connect database models and schemas';
    } else if (promptLower.includes('ui') || promptLower.includes('component') || promptLower.includes('page')) {
      primaryIntent = 'Construct minimal white-first frontend interface';
    }

    if (!promptLower.includes('test') && !promptLower.includes('verify')) {
      detectedAmbiguities.push('Verification criteria omitted; generating standard acceptance checks.');
    }

    const projectRules = [
      'Strictly use JavaScript (no TypeScript)',
      'Follow clean MERN separation: client/ and server/ with separate node_modules',
      'Minimalist white-first design with no visible borders, no glow, no decorative AI graphics',
      ...rules,
    ];

    structuredPlan = [
      {
        stepNumber: 1,
        title: 'Scaffold Architecture',
        targetFiles: ['package.json', 'config/*'],
        instructions: `Structure boundaries for: ${primaryIntent}`,
        verificationCriteria: 'All dependencies and boundaries confirmed.',
      },
      {
        stepNumber: 2,
        title: 'Core Implementation',
        targetFiles: ['client/src/*', 'server/*'],
        instructions: `Build out functionality: ${rawPrompt.slice(0, 100)}...`,
        verificationCriteria: 'Zero syntax errors, clean separation of concerns.',
      },
      {
        stepNumber: 3,
        title: 'Verification',
        targetFiles: ['client/src/App.jsx', 'server/server.js'],
        instructions: 'Validate integration and UI responsiveness.',
        verificationCriteria: 'Feature works end-to-end as specified.',
      },
    ];

    const agent = typeof targetAgent === 'string' ? agentRegistry.getAgent(targetAgent) : targetAgent;
    compiledAgentPrompt = agent.formatPrompt({
      mode,
      primaryIntent,
      rawPrompt,
      projectRules,
      structuredPlan,
      config,
    });
  }

  return {
    mode,
    primaryIntent,
    detectedAmbiguities,
    detectedContradictions,
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

    let effectiveRules = [...(Array.isArray(rules) ? rules : [])];

    if (mode === 'build') {
      // Use user's customized setting if provided; otherwise seamlessly use system defaults
      const effectiveTechStack = config.techStack || BUILD_DEFAULTS.techStack;
      const effectiveTemperature = config.temperature || BUILD_DEFAULTS.temperature;
      const effectivePalette = config.colorPalette || BUILD_DEFAULTS.colorPalette;
      const effectiveLibraries =
        Array.isArray(config.libraries) && config.libraries.length > 0
          ? config.libraries
          : BUILD_DEFAULTS.libraries;

      // Naturally determine project type from the effective tech stack
      let inferredBuildType = config.buildType;
      if (!inferredBuildType) {
        const stackLower = effectiveTechStack.toLowerCase();
        if (
          stackLower.includes('frontend') ||
          stackLower.includes('react + vite') ||
          stackLower.includes('vue') ||
          stackLower.includes('svelte') ||
          stackLower.includes('astro')
        ) {
          inferredBuildType = 'Frontend';
        } else if (
          stackLower.includes('backend') ||
          stackLower.includes('api') ||
          stackLower.includes('fastapi') ||
          stackLower.includes('nestjs') ||
          stackLower.includes('fiber') ||
          stackLower.includes('hono')
        ) {
          inferredBuildType = 'Backend';
        } else {
          inferredBuildType = 'Full Stack';
        }
      }

      effectiveRules.push(
        `Project Scope: ${inferredBuildType}`,
        `Tech Stack: ${effectiveTechStack}`,
        `Temperature: ${effectiveTemperature}`,
        `Design Palette: ${effectivePalette}`,
        ...(effectiveLibraries.length > 0 ? [`Libraries: ${effectiveLibraries.join(', ')}`] : [])
      );
    } else if (mode === 'fix') {
      // Use user's customized setting if provided; otherwise seamlessly use system defaults
      const effectiveStrategy = config.fixStrategy || FIX_DEFAULTS.fixStrategy;
      const effectiveDomain = config.issueDomain || FIX_DEFAULTS.issueDomain;
      const effectiveVerification = config.verification || FIX_DEFAULTS.verification;
      const effectiveSafetyRules =
        Array.isArray(config.safetyRules) && config.safetyRules.length > 0
          ? config.safetyRules
          : FIX_DEFAULTS.safetyRules;

      effectiveRules.push(
        `Fix Strategy: ${effectiveStrategy}`,
        ...(effectiveDomain && !effectiveDomain.toLowerCase().includes('auto-detect')
          ? [`Issue Domain: ${effectiveDomain}`]
          : []),
        `Verification: ${effectiveVerification}`,
        ...effectiveSafetyRules.map((rule) => `Constraint: ${rule}`)
      );
    }

    const effectiveAgent = targetAgent || config.platform || (mode === 'fix' ? FIX_DEFAULTS.platform : BUILD_DEFAULTS.platform);
    const agent = agentRegistry.getAgent(effectiveAgent);

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
          targetAgent: agent.id,
          mode,
          rules: effectiveRules,
          config,
        });

        // Format agent-specific prompt using the extensible agent
        const compiledAgentPrompt = agent.formatPrompt({
          mode,
          primaryIntent: geminiResult.primaryIntent,
          rawPrompt,
          projectRules: effectiveRules,
          structuredPlan: geminiResult.structuredPlan,
          config,
        });

        compilation = {
          mode,
          primaryIntent: geminiResult.primaryIntent,
          detectedAmbiguities: geminiResult.detectedAmbiguities,
          detectedContradictions: geminiResult.detectedContradictions,
          confidenceScore: geminiResult.confidenceScore,
          structuredPlan: geminiResult.structuredPlan,
          compiledAgentPrompt,
        };
        compilationSource = 'gemini-ai';
      } catch (geminiError) {
        // Safe logging - never log keys
        console.warn('[Compile Intent] Gemini AI compilation unavailable, falling back to deterministic compiler.');
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
          projectRules: compilation.projectRules || effectiveRules || [],
          analysis: {
            primaryIntent: compilation.primaryIntent,
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
