// Automatically normalize base URL to guarantee a valid endpoint ending with /api
const getApiBase = () => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  // In production builds without explicit VITE_API_URL, target deployed backend
  if (import.meta.env.PROD) {
    return 'https://intent-server-ten.vercel.app/api';
  }
  // Local development defaults to Vite dev proxy /api
  return '/api';
};

const API_BASE = getApiBase();

/**
 * Helper to get the saved JWT from localStorage
 */
export const getToken = () => localStorage.getItem('token');

/**
 * Clean up any legacy API key from localStorage to enforce zero client-side storage
 */
try {
  if (typeof window !== 'undefined' && localStorage.getItem('intent_api_key')) {
    localStorage.removeItem('intent_api_key');
  }
} catch {
  // Ignore in SSR/restricted environments
}

/**
 * Legacy stubs preserved for backwards compatibility.
 * API keys are never stored on the client.
 */
export const getApiKey = () => '';
export const setApiKey = () => {};

/**
 * Centralized fetch wrapper that automatically attaches the JWT Bearer token
 * API keys are securely stored, decrypted, and utilized exclusively on the backend.
 */
async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      const friendlyError = new Error(
        'Unable to reach server. Please try again later.'
      );
      friendlyError.originalError = error;
      console.error(`[API Network Error] ${options.method || 'GET'} ${endpoint}:`, error);
      throw friendlyError;
    }
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error.message);
    throw error;
  }
}


// Auth API Methods
export const apiAuth = {
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () =>
    request('/auth/me', {
      method: 'GET',
    }),

  updateProfile: (profileData) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  // Securely retrieve API key status (hasKey, isValid, lastValidatedAt - never returns the raw key)
  getApiKey: () =>
    request('/auth/api-key', {
      method: 'GET',
    }),

  // Validate with Groq and securely save encrypted on backend
  updateApiKey: (apiKey) =>
    request('/auth/api-key', {
      method: 'PUT',
      body: JSON.stringify({ apiKey }),
    }),

  // Clear API key on backend
  clearApiKey: () =>
    request('/auth/api-key', {
      method: 'DELETE',
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),
};

// Intent Compiler API Methods
export const apiIntent = {
  compile: (payload) =>
    request('/intent/compile', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTasks: () =>
    request('/intent/tasks', {
      method: 'GET',
    }),

  getAgents: () =>
    request('/intent/agents', {
      method: 'GET',
    }),
};

// System Health API Method
export const apiHealth = {
  check: () =>
    request('/health', {
      method: 'GET',
    }),
};

export default {
  auth: apiAuth,
  intent: apiIntent,
  health: apiHealth,
};
