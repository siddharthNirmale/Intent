import IntentTask from '../models/IntentTask.js';
import { getDbStatus } from '../config/db.js';

/**
 * Helper to analyze developer input and compile into a structured agent prompt
 * Supports both:
 * 1. 'build' — Initial Build: complete implementation prompt from scratch
 * 2. 'fix' — Command Fix: analyze issue/error and generate precise fix prompt
 */
const compileDeveloperIntent = (rawPrompt, targetAgent = 'claude-code', mode = 'build', rules = []) => {
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

    const projectRules = [
      'Apply minimal surgical changes — do not rewrite working code',
      'Follow existing project conventions and file structure',
      'Validate fix immediately to ensure no regressions',
      ...rules,
    ];

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
        instructions: 'Make the minimal correction needed. Do not introduce new abstractions.',
        verificationCriteria: 'Error resolved with zero collateral side effects.',
      },
      {
        stepNumber: 3,
        title: 'Regression Verification',
        targetFiles: ['runtime / tests'],
        instructions: 'Test the fixed command or flow to verify expected behavior.',
        verificationCriteria: 'Exits cleanly with expected status.',
      },
    ];

    compiledAgentPrompt = `### AGENT TARGET: [${targetAgent.toUpperCase()}]
### WORKFLOW: COMMAND FIX
### OBJECTIVE
${primaryIntent}

### ERROR / ISSUE SPECIFICATION
${rawPrompt}

### CONSTRAINTS
${projectRules.map((r) => `- ${r}`).join('\n')}

### DIRECTIVES
1. [Diagnose] Trace the exact failure origin in target files without unnecessary refactoring.
2. [Fix] Apply the minimal, cleanest correction to resolve the issue.
3. [Verify] Test the fixed command or flow to verify it succeeds cleanly.
`;

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

    compiledAgentPrompt = `### AGENT TARGET: [${targetAgent.toUpperCase()}]
### WORKFLOW: INITIAL BUILD
### GOAL
${primaryIntent}

### SPECIFICATION
${rawPrompt}

### ARCHITECTURAL RULES
${projectRules.map((r) => `- ${r}`).join('\n')}

### EXECUTION BLUEPRINT
1. [Scaffold] Configure files and data models adhering to project structure.
2. [Implement] Write clean, beginner-friendly JavaScript with no unnecessary layers.
3. [Verify] Validate feature correctness with real test requests.
`;
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

// Predefined System Defaults for Initial Build Advanced Settings
const DEFAULTS = {
  techStack: 'MERN Stack (React, Express, MongoDB)',
  platform: 'claude-code',
  temperature: '0.2 (Precise)',
  colorPalette: 'Minimal White-First',
  libraries: ['Tailwind CSS', 'JWT'],
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
      const effectiveTechStack = config.techStack || DEFAULTS.techStack;
      const effectiveTemperature = config.temperature || DEFAULTS.temperature;
      const effectivePalette = config.colorPalette || DEFAULTS.colorPalette;
      const effectiveLibraries =
        Array.isArray(config.libraries) && config.libraries.length > 0
          ? config.libraries
          : DEFAULTS.libraries;

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
    }

    const effectiveAgent = targetAgent || config.platform || DEFAULTS.platform;
    const compilation = compileDeveloperIntent(rawPrompt, effectiveAgent, mode, effectiveRules);

    let savedTask = null;
    if (getDbStatus()) {
      try {
        savedTask = await IntentTask.create({
          user: req.user ? req.user._id : null,
          rawPrompt: rawPrompt.trim(),
          targetAgent: targetAgent || 'claude-code',
          projectRules: compilation.projectRules || [],
          analysis: {
            primaryIntent: compilation.primaryIntent,
            detectedAmbiguities: compilation.detectedAmbiguities,
            detectedContradictions: compilation.detectedContradictions,
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
        targetAgent: targetAgent || 'claude-code',
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
