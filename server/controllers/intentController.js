import IntentTask from '../models/IntentTask.js';
import User from '../models/User.js';
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
 * Assembles all details provided by the user (command, agent, settings, rules)
 * into a single unified context string to be sent directly to the AI.
 */
export function buildUserCompleteContext({ rawPrompt, targetAgentName, mode, config = {}, rules = [] }) {
  const settings = [];

  if (targetAgentName) {
    settings.push(`Target AI Coding Agent: ${targetAgentName}`);
  }

  if (mode === 'fix') {
    settings.push(`Workflow: Command Fix`);
    if (config.fixStrategy) {
      settings.push(`Fix Strategy: ${config.fixStrategy}`);
    }
    if (config.issueDomain && !config.issueDomain.toLowerCase().includes('auto-detect')) {
      settings.push(`Issue Domain: ${config.issueDomain}`);
    }
    if (config.verification) {
      settings.push(`Verification: ${config.verification}`);
    }
    if (Array.isArray(config.safetyRules) && config.safetyRules.length > 0) {
      settings.push(`Safety Guardrails: ${config.safetyRules.join('; ')}`);
    }
  } else {
    settings.push(`Workflow: Initial Build`);
    if (config.techStack && !config.techStack.toLowerCase().includes('auto-detect')) {
      settings.push(`Technology Stack: ${config.techStack}`);
    }
    if (Array.isArray(config.libraries) && config.libraries.length > 0) {
      settings.push(`Libraries / Frameworks: ${config.libraries.join(', ')}`);
    }
    if (config.colorPalette) {
      const palette = config.colorPalette;
      const paletteName = typeof palette === 'object' ? palette.name : String(palette);
      settings.push(`Design / Palette: ${paletteName}`);
    }
    if (config.temperatureLabel) {
      settings.push(`Precision Level: ${config.temperatureLabel}`);
    }
  }

  if (Array.isArray(rules) && rules.length > 0) {
    for (const r of rules) {
      if (typeof r === 'string' && r.trim() && !settings.includes(r.trim())) {
        settings.push(r.trim());
      }
    }
  }

  if (settings.length > 0) {
    return `${rawPrompt.trim()}\n\n[Context & Requirements]\n${settings.map((s) => `- ${s}`).join('\n')}`;
  }

  return rawPrompt.trim();
}

/**
 * Natural fallback refinement without template injection or rigid boilerplate
 */
const compileDeveloperIntent = ({ rawPrompt, targetAgentName, mode, config = {}, rules = [] }) => {
  const isFix = mode === 'fix';
  let refined = rawPrompt.trim();

  const contextItems = [];
  if (targetAgentName) {
    contextItems.push(`Target Agent: ${targetAgentName}`);
  }

  if (isFix) {
    if (config.fixStrategy) contextItems.push(`Strategy: ${config.fixStrategy}`);
    if (config.verification) contextItems.push(`Verification: ${config.verification}`);
    if (Array.isArray(config.safetyRules) && config.safetyRules.length > 0) {
      contextItems.push(`Constraints: ${config.safetyRules.join('; ')}`);
    }
  } else {
    if (config.techStack && !config.techStack.toLowerCase().includes('auto-detect')) {
      contextItems.push(`Tech Stack: ${config.techStack}`);
    }
    if (Array.isArray(config.libraries) && config.libraries.length > 0) {
      contextItems.push(`Libraries: ${config.libraries.join(', ')}`);
    }
    if (config.colorPalette) {
      const palette = config.colorPalette;
      const paletteName = typeof palette === 'object' ? palette.name : String(palette);
      contextItems.push(`Design: ${paletteName}`);
    }
  }

  if (contextItems.length > 0) {
    refined += `\n\nRequirements:\n${contextItems.map((c) => `- ${c}`).join('\n')}`;
  }

  return refined;
};

/**
 * @desc    Compile developer prompt into structured agent instructions
 * @route   POST /api/intent/compile
 * @access  Private (Authentication required)
 */
export const compileIntent = async (req, res) => {
  try {
    // 1. Strict Authentication Enforcement
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to compile prompts.',
      });
    }

    const { rawPrompt, targetAgent, mode = 'build', rules = [], config = {} } = req.body;

    // 2. Strict Input Validation & Sanitization
    if (!rawPrompt || typeof rawPrompt !== 'string' || rawPrompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide instructions to compile',
      });
    }

    if (rawPrompt.length > 20000) {
      return res.status(400).json({
        success: false,
        message: 'Prompt exceeds maximum character length limit (20,000 characters).',
      });
    }

    // 3. User Key Resolution & Free Trial Quota Enforcement
    // Check if user has their own valid, encrypted personal Gemini key configured
    let activeGeminiKey = '';
    const hasPersonalKey = Boolean(
      (req.user.apiKeys?.gemini?.encryptedKey || req.user.apiKey) &&
      req.user.apiKeys?.gemini?.isValid !== false
    );

    let usage = {
      attemptsCount: req.user.usage?.attemptsCount || 0,
      maxFreeAttempts: req.user.usage?.maxFreeAttempts || 3,
      remainingAttempts: 0,
      hasPersonalKey,
      trialExhausted: false,
    };

    if (hasPersonalKey) {
      // User is using their own personal Gemini key -> Unlimited compiles
      if (req.user.apiKeys?.gemini?.encryptedKey) {
        activeGeminiKey = decryptApiKey(req.user.apiKeys.gemini);
      } else if (req.user.apiKey) {
        activeGeminiKey = req.user.apiKey.trim();
      }

      if (!activeGeminiKey) {
        return res.status(400).json({
          success: false,
          message: 'Unable to decrypt your saved personal Gemini API key. Please re-enter your key in Settings.',
        });
      }

      usage.remainingAttempts = Math.max(0, usage.maxFreeAttempts - usage.attemptsCount);
      usage.trialExhausted = false;
    } else {
      // User is on the Free Trial (3 free attempts)
      const maxAttempts = req.user.usage?.maxFreeAttempts || 3;
      const currentAttempts = req.user.usage?.attemptsCount || 0;

      if (currentAttempts >= maxAttempts) {
        return res.status(403).json({
          success: false,
          trialExhausted: true,
          message: 'Free trial limit reached (3/3 attempts). Please add your free Google Gemini API key in Settings to continue unlimited usage.',
          usage: {
            attemptsCount: currentAttempts,
            maxFreeAttempts: maxAttempts,
            remainingAttempts: 0,
            hasPersonalKey: false,
            trialExhausted: true,
          },
        });
      }

      // Concurrency-safe atomic attempt increment on the server
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.user._id, 'usage.attemptsCount': { $lt: maxAttempts } },
        { $inc: { 'usage.attemptsCount': 1 } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(403).json({
          success: false,
          trialExhausted: true,
          message: 'Free trial limit reached (3/3 attempts). Please add your free Google Gemini API key in Settings to continue unlimited usage.',
          usage: {
            attemptsCount: maxAttempts,
            maxFreeAttempts: maxAttempts,
            remainingAttempts: 0,
            hasPersonalKey: false,
            trialExhausted: true,
          },
        });
      }

      const newCount = updatedUser.usage.attemptsCount;
      usage = {
        attemptsCount: newCount,
        maxFreeAttempts: maxAttempts,
        remainingAttempts: Math.max(0, maxAttempts - newCount),
        hasPersonalKey: false,
        trialExhausted: newCount >= maxAttempts,
      };

      // Server-level fallback key provides AI during free trial attempts
      if (process.env.GEMINI_API_KEY) {
        activeGeminiKey = process.env.GEMINI_API_KEY.trim();
      }
    }

    // 4. Resolve target agent from registry
    const effectiveAgentId = targetAgent || config.platform || (mode === 'fix' ? FIX_DEFAULTS.platform : BUILD_DEFAULTS.platform);
    const agent = agentRegistry.getAgent(effectiveAgentId);

    // 5. Build user's complete input and context without hardcoded templates
    const userContextText = buildUserCompleteContext({
      rawPrompt,
      targetAgentName: agent.name,
      mode,
      config,
      rules,
    });

    let refinedResult = '';
    let compilationSource = 'rule-engine';

    // 6. If an active key is present, refine command with real Gemini AI
    if (activeGeminiKey) {
      try {
        let temperature = 0.2;
        if (config.temperature !== undefined) {
          const parsed = parseFloat(config.temperature);
          if (!isNaN(parsed)) {
            temperature = Math.max(0.0, Math.min(1.0, parsed));
          }
        }

        refinedResult = await compileWithGemini({
          apiKey: activeGeminiKey,
          userContextText,
          temperature,
        });

        compilationSource = 'gemini-ai';
      } catch (geminiError) {
        console.warn('[Compile Intent] Gemini AI refinement failed. Reason:', geminiError.message);
        if (hasPersonalKey) {
          return res.status(400).json({
            success: false,
            message: `Your personal Gemini API key was rejected: ${geminiError.message}. Please check or replace your key in Settings.`,
          });
        }
      }
    }

    // Gracefully fall back to direct natural refinement if Gemini wasn't used or failed
    if (!refinedResult) {
      refinedResult = compileDeveloperIntent({
        rawPrompt,
        targetAgentName: agent.name,
        mode,
        config,
        rules,
      });
      compilationSource = 'rule-engine';
    }

    // 7. Persist task strictly scoped to authenticated user
    let savedTask = null;
    if (getDbStatus()) {
      try {
        savedTask = await IntentTask.create({
          user: req.user._id,
          rawPrompt: rawPrompt.trim(),
          targetAgent: agent.id,
          compilationSource,
          compiledAgentPrompt: refinedResult,
        });
      } catch (dbErr) {
        console.warn('[IntentTask Save Warning]:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        id: savedTask ? savedTask._id : 'task-' + Date.now(),
        rawPrompt,
        targetAgent: agent.id,
        targetAgentName: agent.name,
        compilationSource,
        usage,
        compiledAgentPrompt: refinedResult,
        refinedCommand: refinedResult,
        primaryIntent: 'Refined Command',
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
