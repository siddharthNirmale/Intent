/**
 * Gemini AI Integration & Key Validation Service
 *
 * Provides genuine, usable verification of Google Gemini API keys
 * and intent compilation without ever leaking keys in logs or responses.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Gemini models in priority order based on availability
const SUPPORTED_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3-flash-preview',
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

  // Format validation: Google API keys are alphanumeric + dashes/underscores/dots (typically 39-60 chars)
  if (cleanKey.length < 20 || cleanKey.length > 120 || !/^[a-zA-Z0-9_\-.]+$/.test(cleanKey)) {
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
 * Performs the minimum necessary processing to safely display the AI's returned result
 * without outer markdown wrappers or introductory preamble.
 */
function cleanRefinedOutput(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.trim();

  // Strip conversational intro phrases if returned by the AI
  cleaned = cleaned.replace(/^(?:Here is (?:the|your) refined[^:\n]*:|Here's (?:the|your) refined[^:\n]*:|Sure, here is[^:\n]*:)\s*/i, '');
  cleaned = cleaned.replace(/^\s*\*\*\*\s*/, '').trim();

  // If the AI wrapped the entire output in an outer ```markdown ... ``` block, unwrap it
  const outerBlockMatch = cleaned.match(/^```(?:markdown)?\s*\n([\s\S]*?)\n```$/i);
  if (outerBlockMatch) {
    cleaned = outerBlockMatch[1].trim();
  }

  return cleaned;
}

/**
 * Refines developer command directly using Google Gemini AI.
 * Internally sends: "Refine this command: {user's complete input and context}"
 * Returns the actual refined response directly without template injection or forced sections.
 *
 * @param {object} params
 * @param {string} [params.apiKey] - Decrypted Gemini API key or backend fallback
 * @param {string} params.userContextText - Complete user input and context
 * @param {number} [params.temperature] - Generation precision/temperature
 * @returns {Promise<string>} The actual refined response returned by the AI directly
 */
export async function compileWithGemini({
  apiKey,
  userContextText,
  temperature = 0.2,
}) {
  const cleanKey = (apiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!cleanKey) {
    throw new Error('No Gemini API key configured on server or in account.');
  }

  const promptContent = (userContextText || '').trim();
  if (!promptContent) {
    throw new Error('Please provide developer instructions to compile.');
  }

  // Internal AI system instruction: invisible to the user
  const systemInstruction = `You are an expert AI prompt engineer and autonomous software architect.
Your task is to refine the user's provided command and context into a high-quality, clear, precise, and actionable prompt for the specified coding agent.

CRITICAL INSTRUCTIONS:
1. Output ONLY the actual refined command directly.
2. Do NOT wrap your output in templates, markdown headers like "### AGENT TARGET" or "### STRUCTURED EXECUTION PLAN", or artificial sections.
3. Do NOT include conversational filler, introductory remarks, or concluding explanations (e.g. do NOT say "Here is your refined command:" or "I have refined...").
4. Do NOT wrap the entire response in outer markdown code fences (like \`\`\`markdown ... \`\`\`).
5. Preserve the user's authentic intent, specifications, and details without unnecessarily rewriting or adding unrelated content.
6. Address any ambiguities or missing requirements naturally within the refined command so the coding agent can execute it successfully.`;

  // The request format strictly as requested:
  // "Refine this command: {user's complete input and context}"
  const requestMessage = `Refine this command: ${promptContent}`;

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
              parts: [{ text: requestMessage }],
            },
          ],
          generationConfig: {
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

      if (!candidateText || candidateText.trim().length === 0) {
        throw new Error('Gemini returned an empty response.');
      }

      // Return the actual refined response directly with minimum necessary processing
      return cleanRefinedOutput(candidateText);
    } catch (err) {
      clearTimeout(timeoutId);
      const safeError = sanitizeMessage(err.message, cleanKey);
      lastError = new Error(safeError);
      console.warn(`[GeminiService Warning] Model ${model} unavailable: ${safeError}. Trying next supported model...`);
    }
  }

  // If all models failed
  const finalErrorMsg = lastError ? lastError.message : 'All supported Gemini models failed to respond.';
  console.warn('[GeminiService Warning] Gemini compilation failed:', finalErrorMsg);
  throw new Error(finalErrorMsg);
}

export default {
  validateGeminiKey,
  compileWithGemini,
};
