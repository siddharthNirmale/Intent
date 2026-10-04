const API_BASE = '/api';

/**
 * Helper to get the saved JWT from localStorage
 */
export const getToken = () => localStorage.getItem('token');

/**
 * Helper to get the saved API Key from localStorage
 */
export const getApiKey = () => localStorage.getItem('intent_api_key') || '';

/**
 * Helper to save or clear the API Key in localStorage
 */
export const setApiKey = (key) => {
  if (key && typeof key === 'string' && key.trim()) {
    localStorage.setItem('intent_api_key', key.trim());
  } else {
    localStorage.removeItem('intent_api_key');
  }
};

/**
 * Centralized fetch wrapper that automatically attaches the JWT token and API key
 */
async function request(endpoint, options = {}) {
  const token = getToken();
  const apiKey = getApiKey();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(apiKey && { 'x-api-key': apiKey }),
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

  getApiKey: () =>
    request('/auth/api-key', {
      method: 'GET',
    }),

  updateApiKey: (apiKey) =>
    request('/auth/api-key', {
      method: 'PUT',
      body: JSON.stringify({ apiKey }),
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
