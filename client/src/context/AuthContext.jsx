import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiAuth, getToken } from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);
  const [token, setToken] = useState(() => getToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUsage = async () => {
    const storedToken = getToken();
    if (!storedToken) {
      setUsage(null);
      return null;
    }
    try {
      const response = await apiAuth.getMe();
      if (response.success && response.user) {
        setUser(response.user);
        if (response.usage) {
          setUsage(response.usage);
        }
        return response.usage;
      }
    } catch {
      // Quietly ignore network failures on background refresh
    }
    return null;
  };

  // Check existing token on initial load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiAuth.getMe();
        if (response.success && response.user) {
          setUser(response.user);
          if (response.usage) {
            setUsage(response.usage);
          }
        } else {
          // Token invalid
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setUsage(null);
        }
      } catch (err) {
        console.warn('Initial session restore failed:', err.message);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setUsage(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await apiAuth.login({ email, password });
      if (response.success) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);
        if (response.usage) {
          setUsage(response.usage);
        }
        return response.user;
      }
    } catch (err) {
      const msg = err.message || 'Unable to sign in. Please try again later.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const response = await apiAuth.register({ name, email, password });
      if (response.success) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);
        if (response.usage) {
          setUsage(response.usage);
        }
        return response.user;
      }
    } catch (err) {
      const msg = err.message || 'Unable to create account. Please try again later.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await apiAuth.logout().catch(() => {});
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setUsage(null);
      setError(null);
    }
  };

  const updateProfile = async ({ name, avatar }) => {
    setError(null);
    try {
      let updatedUser = { ...(user || {}) };
      if (name) updatedUser.name = name;
      if (avatar !== undefined) updatedUser.avatar = avatar;

      try {
        const response = await apiAuth.updateProfile({ name, avatar });
        if (response.success && response.user) {
          updatedUser = response.user;
        }
      } catch (apiErr) {
        console.warn('Backend updateProfile unavailable, persisting locally:', apiErr.message);
      }

      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const msg = err.message || 'Unable to update profile. Please try again later.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const updateUsage = (newUsage) => {
    if (!newUsage) return;
    setUsage((prev) => ({ ...(prev || {}), ...newUsage }));
  };

  const clearError = () => setError(null);

  const value = {
    user,
    token,
    usage,
    loading,
    error,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    updateProfile,
    logout,
    updateUsage,
    refreshUsage,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
