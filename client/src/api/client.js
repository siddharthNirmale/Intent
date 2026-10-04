const API_BASE = '/api';

/**
 * Helper to get the saved JWT from localStorage
 */
export const getToken = () => localStorage.getItem('token');

/**
 * Centralized fetch wrapper that automatically attaches the JWT token
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
