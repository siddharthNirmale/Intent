/**
 * Groq AI Integration & Key Validation Service
 *
 * Provides genuine, usable verification of Groq API keys
 * and intent compilation using Groq's high-speed LLM inference
 * without ever leaking keys in logs or responses.
 */

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';

// Supported Groq models in priority order
const SUPPORTED_MODELS = [
  process.env.GROQ_MODEL,
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
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
 * Validates whether a Groq API key is genuine, active, and usable.
 * Makes a real test request to Groq's OpenAI-compatible models API.
 *
 * @param {string} apiKey - The plain Groq API key
 * @returns {Promise<{ isValid: boolean, error?: string, modelCount?: number }>}
 */
export async function validateGroqKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return {
      isValid: false,
      error: 'Please provide a valid Groq API key.',
    };
  }

  const cleanKey = apiKey.trim();

  // Basic sanity check: prevent empty strings, internal whitespace, or unreasonable lengths
  if (cleanKey.length < 10 || cleanKey.length > 512 || /\s/.test(cleanKey)) {
    return {
      isValid: false,
      error: 'Invalid API key format. Please ensure your key has no spaces.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

  try {
    const url = `${GROQ_API_BASE}/models`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const rawErrorMsg = errData?.error?.message || `Status ${response.status}`;
      const safeErrorMsg = sanitizeMessage(rawErrorMsg, cleanKey);

      // User-friendly mapping of common Groq API rejections
      if (response.status === 401) {
        return {
          isValid: false,
          error: 'Groq rejected this API key as invalid or unauthorized. Please verify your key at console.groq.com/keys.',
        };
      }

      if (response.status === 403) {
        return {
          isValid: false,
          error: 'Permission denied: This Groq API key is unauthorized or restricted.',
        };
      }

      if (response.status === 429) {
        return {
          isValid: false,
          error: 'This Groq API key has exceeded its rate limit or quota.',
        };
      }

      return {
        isValid: false,
        error: `Groq API key verification failed (${response.status}): ${safeErrorMsg}`,
      };
    }

    const data = await response.json();
    const models = Array.isArray(data?.data) ? data.data : [];

    if (models.length === 0) {
      return {
        isValid: false,
        error: 'Key was accepted, but no active models are available for this Groq account.',
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
        error: 'Connection to Groq timed out. Please check your network connection.',
      };
    }

    const safeMsg = sanitizeMessage(err.message, cleanKey);
    return {
      isValid: false,
      error: `Could not reach Groq to verify key: ${safeMsg}`,
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
 * Refines developer command directly using Groq AI.
 * Internally sends: "Refine this command: {user's complete input and context}"
 * Returns the actual refined response directly without template injection or forced sections.
 *
 * @param {object} params
 * @param {string} [params.apiKey] - Decrypted Groq API key or backend fallback
 * @param {string} params.userContextText - Complete user input and context
 * @param {number} [params.temperature] - Generation precision/temperature
 * @returns {Promise<string>} The actual refined response returned by Groq AI directly
 */
export async function compileWithGroq({
  apiKey,
  userContextText,
  temperature = 0.2,
}) {
  const cleanKey = (apiKey || process.env.GROQ_API_KEY || '').trim();
  if (!cleanKey) {
    throw new Error('No Groq API key configured on server or in account.');
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

  // The request format: "Refine this command: {user's complete input and context}"
  const requestMessage = `Refine this command: ${promptContent}`;

  let lastError = null;

  // Try available Groq models in sequence
  for (const model of SUPPORTED_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20-second timeout

    try {
      const url = `${GROQ_API_BASE}/chat/completions`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemInstruction,
            },
            {
              role: 'user',
              content: requestMessage,
            },
          ],
          temperature,
          max_completion_tokens: 4096,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const rawMsg = errData?.error?.message || `Groq API status ${response.status}`;
        throw new Error(sanitizeMessage(rawMsg, cleanKey));
      }

      const data = await response.json();
      const candidateText = data?.choices?.[0]?.message?.content;

      if (!candidateText || candidateText.trim().length === 0) {
        throw new Error('Groq returned an empty response.');
      }

      // Return the actual refined response directly with minimum necessary processing
      return cleanRefinedOutput(candidateText);
    } catch (err) {
      clearTimeout(timeoutId);
      const safeError = sanitizeMessage(err.message, cleanKey);
      lastError = new Error(safeError);
      console.warn(`[GroqService Warning] Model ${model} unavailable: ${safeError}. Trying next supported model...`);
    }
  }

  // If all models failed
  const finalErrorMsg = lastError ? lastError.message : 'All supported Groq models failed to respond.';
  console.warn('[GroqService Warning] Groq compilation failed:', finalErrorMsg);
  throw new Error(finalErrorMsg);
}

export default {
  validateGroqKey,
  compileWithGroq,
};
