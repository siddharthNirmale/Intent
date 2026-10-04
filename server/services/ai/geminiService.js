/**
 * Gemini AI Integration & Key Validation Service
 *
 * Provides genuine, usable verification of Google Gemini API keys
 * and intent compilation without ever leaking keys in logs or responses.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Gemini 2.0, 2.5, 3 and 1.5 models in priority order based on availability
const SUPPORTED_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-1.5-pro',
].filter(Boolean);

/**
 * Strips any sensitive API key string from error messages or logs
 */
function sanitizeMessage(message, key) {
  if (!message || typeof message !== 'string') return 'Unknown error';
  if (!key) return message;
  return message.split(key).join('[REDACTED_KEY]');
}

/**
 * Validates whether a Gemini API key is genuine, active, and usable.
 * Makes a real test request to Google's Generative Language API.
 *
 * @param {string} apiKey - The plain Gemini API key
 * @returns {Promise<{ isValid: boolean, error?: string, modelCount?: number }>}
 */
export async function validateGeminiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return {
      isValid: false,
      error: 'Please provide a valid Gemini API key.',
    };
  }

  const cleanKey = apiKey.trim();

  // Format validation: Google API keys are alphanumeric + dashes/underscores (typically 39 chars)
  if (cleanKey.length < 20 || cleanKey.length > 120 || !/^[a-zA-Z0-9_\-]+$/.test(cleanKey)) {
    return {
      isValid: false,
      error: 'Invalid API key format. Please provide a valid Google Gemini API key.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

  try {
    const url = `${GEMINI_API_BASE}/models?key=${encodeURIComponent(cleanKey)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const rawErrorMsg = errData?.error?.message || `Google API returned status ${response.status}`;
      const safeErrorMsg = sanitizeMessage(rawErrorMsg, cleanKey);

      if (response.status === 400 || response.status === 403) {
        return {
          isValid: false,
          error: `Google rejected this API key: ${safeErrorMsg}`,
        };
      }

      return {
        isValid: false,
        error: `Gemini API key verification failed (${response.status}): ${safeErrorMsg}`,
      };
    }

    const data = await response.json();
    const models = Array.isArray(data?.models) ? data.models : [];
    const hasGeminiModels = models.some(
      (m) => typeof m.name === 'string' && m.name.toLowerCase().includes('gemini')
    );

    if (models.length === 0 || !hasGeminiModels) {
      return {
        isValid: false,
        error: 'Key was accepted, but no active Gemini models are available for this Google Cloud project.',
      };
    }

    return {
      isValid: true,
      modelCount: models.length,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        isValid: false,
        error: 'Connection to Google Gemini timed out. Please verify your network connection.',
      };
    }

    const safeMsg = sanitizeMessage(err.message, cleanKey);
    return {
      isValid: false,
      error: `Could not verify key with Google Gemini: ${safeMsg}`,
    };
  }
}

/**
 * Compiles developer intent using Google's Gemini models.
 * Conducts deep intent reasoning, resolves missing requirements,
 * enforces customization guardrails, and synthesizes a high-impact Refined Command
 * specifically optimized for the target AI coding agent.
 *
 * @param {object} params
 * @param {string} [params.apiKey] - The decrypted Gemini API key or backend default
 * @param {string} params.rawPrompt - The user's input prompt or error
 * @param {string} [params.targetAgentName] - Target agent human readable name (e.g. 'Antigravity')
 * @param {string} [params.targetAgentId] - Target agent identifier (e.g. 'antigravity')
 * @param {string} [params.agentGuidelines] - Specific optimization guidelines for target agent
 * @param {string} [params.mode] - 'build' or 'fix'
 * @param {Array<string>} [params.rules] - Architectural rules, customization parameters & constraints
 * @param {object} [params.config] - Mode-specific configuration overrides
 * @returns {Promise<object>} Structured compilation data including reasoning & refinedCommand
 */
export async function compileWithGemini({
  apiKey,
  rawPrompt,
  targetAgentName = 'Antigravity',
  targetAgentId = 'antigravity',
  agentGuidelines = '',
  mode = 'build',
  rules = [],
  config = {},
}) {
  const cleanKey = (apiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!cleanKey) {
    throw new Error('No Gemini API key configured on server or in account.');
  }

  const userCommand = (rawPrompt || '').trim();
  const isFix = mode === 'fix';

  // Determine dynamic temperature from slider or default
  let temperature = 0.2;
  if (config.temperature !== undefined) {
    const parsedTemp = parseFloat(config.temperature);
    if (!isNaN(parsedTemp)) {
      temperature = Math.max(0.0, Math.min(1.0, parsedTemp));
    }
  }

  const systemInstruction = `You are the core intelligence engine of "Intent", an elite Prompt Improvement Tool and Autonomous Software Architect.
Your mission is to transform raw, vague, incomplete, or poorly structured developer requests into high-quality, actionable, and agent-ready REFINED COMMANDS specifically crafted for the AI coding agent: ${targetAgentName.toUpperCase()}.

CORE PRINCIPLES & THINKING BEHAVIOR:
1. UNDERSTAND TRUE INTENT (NOT JUST A TEXT REWRITER):
   - Analyze the developer's underlying goal and domain.
   - Do NOT simply paraphrase words. Reason about what software architecture, API contracts, state models, or file modifications are actually necessary to accomplish this goal.
2. REASON AND RESOLVE GAPS:
   - Identify missing specifications, unstated assumptions, implicit edge cases, error handling, and test criteria that the developer omitted.
   - Fill in those gaps using industry-standard engineering patterns while preserving the user's authentic intent.
3. ADHERE TO CUSTOMIZATION PARAMETERS:
   - Strictly enforce any explicit technology stack, libraries, color palette, fix strategy, or safety rules specified in the parameters.
   - If a parameter is dynamic or unspecified (e.g. auto-detect tech stack or domain), intelligently deduce the optimal choices from the user's prompt without blindly forcing unrelated templates.
4. ZERO GENERIC FILLER OR IRRELEVANT INSTRUCTIONS:
   - Eliminate vague disclaimers (e.g., "Ensure code is clean", "Follow best practices", "Remember to test").
   - Eliminate unrequested template injection (e.g., do not force React or MERN onto a Python script or CLI tool).
5. OPTIMIZE FOR THE SELECTED CODING AGENT (${targetAgentName.toUpperCase()}):
${agentGuidelines || 'Provide clear, deterministic, and self-contained execution directives with concrete acceptance criteria.'}

6. PRODUCE A COMPLETE REFINED COMMAND:
   - Generate a single, comprehensive, agent-ready prompt ("refinedCommand") written in clear, natural, professional English.
   - The developer should be able to copy this refinedCommand and directly paste it into ${targetAgentName} to execute the task flawlessly on the first try.

RESPONSE FORMAT:
You MUST respond strictly in valid JSON matching this exact schema:
{
  "primaryIntent": "Short single sentence capturing the core technical objective in natural English",
  "reasoning": {
    "understoodGoal": "Clear explanation of what the user is trying to accomplish",
    "missingRequirementsIdentified": [
      "Key unstated requirement or edge case 1 that you resolved",
      "Key unstated requirement or edge case 2 that you resolved"
    ],
    "architecturalDecisions": [
      "Architectural or technical design decision 1",
      "Architectural or technical design decision 2"
    ],
    "agentOptimization": "Specific explanation of how this prompt is tailored for ${targetAgentName}"
  },
  "detectedAmbiguities": [
    "Ambiguity or assumption 1 resolved from the raw prompt",
    "Ambiguity or assumption 2 resolved from the raw prompt"
  ],
  "detectedContradictions": [
    "Contradiction resolved, or leave empty list if none"
  ],
  "confidenceScore": 0.95,
  "structuredPlan": [
    {
      "stepNumber": 1,
      "title": "Short descriptive step title",
      "targetFiles": ["path/to/target/file"],
      "instructions": "Specific, actionable implementation directive",
      "verificationCriteria": "Concrete acceptance check or command exit code"
    }
  ],
  "refinedCommand": "The complete, self-contained, agent-ready refined command in clear, professional English tailored specifically for ${targetAgentName}. Must be ready to copy and execute."
}`;

  const userContextMessage = `### DEVELOPER REQUEST TO COMPILE
Workflow Mode: ${isFix ? 'COMMAND FIX (Error Diagnosis & Surgical Patch)' : 'INITIAL BUILD (Feature Implementation / Architecture)'}
Target Coding Agent: ${targetAgentName} (${targetAgentId})

### RAW USER INPUT:
${userCommand}

### CUSTOMIZATION PARAMETERS & CONSTRAINTS:
${rules.length > 0 ? rules.map((r) => `- ${r}`).join('\n') : '- Dynamic defaults: deduce optimal architecture and libraries from the user input.'}

### INSTRUCTIONS:
Reason deeply about the developer's complete intent, resolve any missing requirements, apply all customization parameters, and synthesize the structured plan and the final Refined Command for ${targetAgentName}.`;

  let lastError = null;

  // Try available Gemini models in sequence
  for (const model of SUPPORTED_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20-second timeout

    try {
      const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userContextMessage }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const rawMsg = errData?.error?.message || `Google API status ${response.status}`;
        throw new Error(sanitizeMessage(rawMsg, cleanKey));
      }

      const data = await response.json();
      let candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        throw new Error('Gemini returned an empty response.');
      }

      // Strip markdown wrapping if model included it
      candidateText = candidateText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(candidateText);

      let cleanPrimaryIntent = (parsed.primaryIntent || '').trim();
      if (!cleanPrimaryIntent) {
        cleanPrimaryIntent = isFix
          ? 'Diagnose root cause and apply surgical patch'
          : `Implement feature specification for ${targetAgentName}`;
      }

      // Ensure refinedCommand is populated
      let refinedCommand = (parsed.refinedCommand || '').trim();
      if (!refinedCommand) {
        // Fallback assembly if model omitted refinedCommand
        const planText = (Array.isArray(parsed.structuredPlan) ? parsed.structuredPlan : [])
          .map((s) => `${s.stepNumber}. **${s.title}** (${(s.targetFiles || []).join(', ') || 'Target files'}): ${s.instructions}`)
          .join('\n');
        refinedCommand = `## Goal: ${cleanPrimaryIntent}\n\n### Specification:\n${userCommand}\n\n### Execution Steps:\n${planText}`;
      }

      const reasoning = parsed.reasoning || {
        understoodGoal: cleanPrimaryIntent,
        missingRequirementsIdentified: parsed.detectedAmbiguities || [],
        architecturalDecisions: rules || [],
        agentOptimization: `Structured specifically for ${targetAgentName} execution model.`,
      };

      return {
        modelUsed: model,
        primaryIntent: cleanPrimaryIntent,
        reasoning,
        detectedAmbiguities: Array.isArray(parsed.detectedAmbiguities) ? parsed.detectedAmbiguities : [],
        detectedContradictions: Array.isArray(parsed.detectedContradictions) ? parsed.detectedContradictions : [],
        confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.95,
        structuredPlan: Array.isArray(parsed.structuredPlan) ? parsed.structuredPlan : [],
        refinedCommand,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const safeError = sanitizeMessage(err.message, cleanKey);
      lastError = new Error(safeError);
      console.warn(`[GeminiService Warning] Model ${model} unavailable: ${safeError}. Trying next supported model...`);
    }
  }

  // If all models failed or errored out
  const finalErrorMsg = lastError ? lastError.message : 'All supported Gemini models failed to respond.';
  console.warn('[GeminiService Warning] Gemini compilation failed:', finalErrorMsg);
  throw new Error(finalErrorMsg);
}

export default {
  validateGeminiKey,
  compileWithGemini,
};
