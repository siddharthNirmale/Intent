/**
 * Gemini AI Integration & Key Validation Service
 *
 * Provides genuine, usable verification of Google Gemini API keys
 * and intent compilation without ever leaking keys in logs or responses.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Gemini 3 and Gemini 2.5 models in priority order based on availability
const SUPPORTED_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-2.5-flash',
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
  const candidateKey = apiKey || process.env.GEMINI_API_KEY;
  if (!candidateKey || typeof candidateKey !== 'string') {
    return {
      isValid: false,
      error: 'Please provide a valid Gemini API key.',
    };
  }

  const cleanKey = candidateKey.trim();

  // Basic length validation (Google AI Studio and Cloud keys are typically 39-55 chars)
  if (cleanKey.length < 20) {
    return {
      isValid: false,
      error: 'The provided API key is too short. Please provide a valid Google Gemini API key.',
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
 * Sends the internal instruction format `refine this command for Antigravity {command}` to Gemini.
 * The prefix is an internal instruction and is never exposed in outputs to users.
 *
 * @param {object} params
 * @param {string} [params.apiKey] - The decrypted Gemini API key or backend default
 * @param {string} params.rawPrompt - The user's input command
 * @param {string} [params.targetAgent] - Target agent ID (defaults to 'antigravity')
 * @param {string} [params.mode] - 'build' or 'fix'
 * @param {Array<string>} [params.rules] - Architectural rules and constraints
 * @param {object} [params.config] - Mode-specific configuration overrides
 * @returns {Promise<object>} Structured compilation data
 */
export async function compileWithGemini({
  apiKey,
  rawPrompt,
  targetAgent = 'antigravity',
  mode = 'build',
  rules = [],
  config = {},
}) {
  const cleanKey = (apiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!cleanKey) {
    throw new Error('No Gemini API key configured on server or in account.');
  }

  // {command} contains strictly the user's actual command
  const command = (rawPrompt || '').trim();

  // Internal system instruction format for Gemini:
  // "refine this command for Antigravity {command}"
  const internalInstruction = `refine this command for Antigravity ${command}`;

  const systemInstruction = `You are an elite Software Architect and AI Intent Compiler.
Your role is to analyze developer instructions and commands, compiling them into a deterministic, surgical execution blueprint for ${targetAgent.toUpperCase()}.

Mode: ${mode.toUpperCase()} (${mode === 'fix' ? 'Diagnose issue & provide surgical patch' : 'Scaffold or refine command for execution'})

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

  let lastError = null;

  // Try available Gemini 3 / Gemini 2.5 models
  for (const model of SUPPORTED_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

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
              parts: [{ text: internalInstruction }],
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
      let candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        throw new Error('Gemini returned an empty response.');
      }

      // Strip markdown wrapping if model included it
      candidateText = candidateText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(candidateText);

      // Ensure internal instruction prefix is never leaked or shown to the user in primaryIntent
      let cleanPrimaryIntent = (parsed.primaryIntent || '').trim();
      cleanPrimaryIntent = cleanPrimaryIntent
        .replace(/^refine this command for antigravity\s*:?\s*/i, '')
        .replace(/refine this command for antigravity/gi, 'Refine command');

      if (!cleanPrimaryIntent) {
        cleanPrimaryIntent = mode === 'fix'
          ? 'Diagnose issue and apply surgical command fix'
          : 'Refine and execute command for Antigravity';
      }

      return {
        modelUsed: model,
        primaryIntent: cleanPrimaryIntent,
        detectedAmbiguities: Array.isArray(parsed.detectedAmbiguities) ? parsed.detectedAmbiguities : [],
        detectedContradictions: Array.isArray(parsed.detectedContradictions) ? parsed.detectedContradictions : [],
        confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.95,
        structuredPlan: Array.isArray(parsed.structuredPlan) ? parsed.structuredPlan : [],
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
