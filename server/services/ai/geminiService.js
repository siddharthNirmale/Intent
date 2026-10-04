/**
 * Gemini AI Integration & Key Validation Service
 *
 * Provides genuine, usable verification of Google Gemini API keys
 * and intent compilation without ever leaking keys in logs or responses.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

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

  // Basic format check: Google AI Studio keys typically start with AIza and are ~39 chars
  if (cleanKey.length < 20) {
    return {
      isValid: false,
      error: 'The provided API key is too short. Google Gemini API keys typically begin with "AIzaSy".',
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
 *
 * @param {object} params
 * @param {string} params.apiKey - The decrypted Gemini API key
 * @param {string} params.rawPrompt - The user's input prompt
 * @param {string} params.targetAgent - Target agent ID (e.g. 'claude-code', 'antigravity')
 * @param {string} params.mode - 'build' or 'fix'
 * @param {Array<string>} params.rules - Architectural rules and constraints
 * @param {object} params.config - Mode-specific configuration overrides
 * @returns {Promise<object>} Structured compilation data
 */
export async function compileWithGemini({
  apiKey,
  rawPrompt,
  targetAgent = 'claude-code',
  mode = 'build',
  rules = [],
  config = {},
}) {
  const cleanKey = apiKey.trim();

  const systemInstruction = `You are an elite Software Architect and AI Intent Compiler.
Your role is to analyze messy, complex, or ambiguous developer instructions and compile them into a deterministic, surgical execution blueprint for coding agents like ${targetAgent.toUpperCase()}.

Mode: ${mode.toUpperCase()} (${mode === 'fix' ? 'Diagnose issue & provide surgical patch' : 'Initial build from scratch'})

Constraints and Rules:
${rules.map((r) => `- ${r}`).join('\n')}

You MUST respond strictly in valid JSON matching this exact schema:
{
  "primaryIntent": "Short single sentence summarizing the core objective",
  "detectedAmbiguities": ["Ambiguity or unstated assumption 1", "..."],
  "detectedContradictions": ["Contradiction 1 if any, or empty list"],
  "confidenceScore": 0.95,
  "structuredPlan": [
    {
      "stepNumber": 1,
      "title": "Short descriptive step title",
      "targetFiles": ["path/to/target/file"],
      "instructions": "Specific, actionable implementation directive",
      "verificationCriteria": "Concrete acceptance check or command exit code"
    }
  ]
}`;

  const promptText = `Developer Input to Compile:
"""
${rawPrompt}
"""

Target Agent: ${targetAgent}
Workflow Mode: ${mode}
Configuration Overrides: ${JSON.stringify(config, null, 2)}

Produce the complete JSON analysis.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

  try {
    const model = 'gemini-1.5-flash';
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
            parts: [{ text: promptText }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
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
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsed = JSON.parse(candidateText);

    return {
      primaryIntent: parsed.primaryIntent || 'Execute requested developer instructions',
      detectedAmbiguities: Array.isArray(parsed.detectedAmbiguities) ? parsed.detectedAmbiguities : [],
      detectedContradictions: Array.isArray(parsed.detectedContradictions) ? parsed.detectedContradictions : [],
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.95,
      structuredPlan: Array.isArray(parsed.structuredPlan) ? parsed.structuredPlan : [],
    };
  } catch (err) {
    clearTimeout(timeoutId);
    // Sanitize any error message
    const safeError = sanitizeMessage(err.message, cleanKey);
    console.warn('[GeminiService Warning]:', safeError);
    throw new Error(safeError);
  }
}

export default {
  validateGeminiKey,
  compileWithGemini,
};
