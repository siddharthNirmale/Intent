import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import Input from './ui/Input';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { login, register, clearError } = useAuth();

  useEffect(() => {
    setMode(initialMode);
    setFormError('');
  }, [initialMode, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email || !password) {
      setFormError('Please enter email and password.');
      return;
    }

    if (mode === 'register' && !name) {
      setFormError('Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      onClose();
    } catch (err) {
      setFormError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/10 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Surface */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 z-10 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Toggle Mode */}
        <div className="flex gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setFormError('');
            }}
            className={`transition-colors ${
              mode === 'login' ? 'text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setFormError('');
            }}
            className={`transition-colors ${
              mode === 'register' ? 'text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            Create account
          </button>
        </div>

        {/* Error message */}
        {formError && (
          <p className="text-xs text-red-600 font-medium">{formError}</p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <Input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          )}

          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoFocus={mode === 'login'}
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={loading}
            >
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
