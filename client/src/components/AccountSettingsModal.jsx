import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiKey, setApiKey, apiAuth } from '../api/client';
import Button from './ui/Button';
import Input from './ui/Input';
import { X, Eye, EyeOff, Check, Key, Lock, Upload, RotateCcw } from 'lucide-react';

// Curated sleek, minimal avatar presets (SVG Data URIs for clean visual rendering)
const AVATAR_PRESETS = [
  {
    id: 'preset-mono',
    label: 'Monochrome',
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#18181b"/><circle cx="20" cy="15" r="6" fill="#f4f4f5"/><path d="M10 32C10 26.4772 14.4772 22 20 22C25.5228 22 30 26.4772 30 32" stroke="#f4f4f5" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'preset-emerald',
    label: 'Emerald',
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#064e3b"/><circle cx="20" cy="15" r="6" fill="#34d399"/><path d="M10 32C10 26.4772 14.4772 22 20 22C25.5228 22 30 26.4772 30 32" stroke="#34d399" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'preset-slate',
    label: 'Slate',
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#0f172a"/><circle cx="20" cy="15" r="6" fill="#38bdf8"/><path d="M10 32C10 26.4772 14.4772 22 20 22C25.5228 22 30 26.4772 30 32" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'preset-violet',
    label: 'Violet',
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#2e1065"/><circle cx="20" cy="15" r="6" fill="#c084fc"/><path d="M10 32C10 26.4772 14.4772 22 20 22C25.5228 22 30 26.4772 30 32" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'preset-amber',
    label: 'Amber',
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#451a03"/><circle cx="20" cy="15" r="6" fill="#fbbf24"/><path d="M10 32C10 26.4772 14.4772 22 20 22C25.5228 22 30 26.4772 30 32" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'preset-rose',
    label: 'Rose',
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#4c0519"/><circle cx="20" cy="15" r="6" fill="#fb7185"/><path d="M10 32C10 26.4772 14.4772 22 20 22C25.5228 22 30 26.4772 30 32" stroke="#fb7185" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
];

const svgToDataUrl = (svgString) => `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

export const AccountSettingsModal = ({ isOpen, onClose, initialTab = 'account' }) => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Account state
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);

  // Settings / API Key state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyMessage, setKeyMessage] = useState({ text: '', type: '' });

  // Sync initial tab and user data when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setName(user?.name || '');
      setAvatar(user?.avatar || '');
      setCustomUrl(user?.avatar && !user.avatar.startsWith('data:image/svg+xml') ? user.avatar : '');
      setAccountMessage({ text: '', type: '' });
      setKeyMessage({ text: '', type: '' });

      // Load API Key
      const savedKey = getApiKey();
      setCurrentApiKey(savedKey);
      setApiKeyInput(savedKey);

      // Check backend for API key if authenticated
      apiAuth.getApiKey()
        .then((res) => {
          if (res?.success && res.apiKey) {
            setCurrentApiKey(res.apiKey);
            setApiKeyInput(res.apiKey);
            setApiKey(res.apiKey);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialTab, user]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle Account Save
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setAccountMessage({ text: 'Please enter a valid name', type: 'error' });
      return;
    }

    setAccountLoading(true);
    setAccountMessage({ text: '', type: '' });

    try {
      await updateProfile({ name: name.trim(), avatar });
      setAccountMessage({ text: 'Account updated successfully', type: 'success' });
      setTimeout(() => {
        setAccountMessage({ text: '', type: '' });
      }, 3000);
    } catch (err) {
      setAccountMessage({ text: err.message || 'Failed to update account', type: 'error' });
    } finally {
      setAccountLoading(false);
    }
  };

  // Handle image upload from computer
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAccountMessage({ text: 'Please select an image file', type: 'error' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAccountMessage({ text: 'Image size should be under 2MB', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setAvatar(dataUrl);
        setCustomUrl('');
        setAccountMessage({ text: 'Avatar uploaded. Click Save to apply.', type: 'info' });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle API Key Save
  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setKeyLoading(true);
    setKeyMessage({ text: '', type: '' });

    const trimmedKey = apiKeyInput.trim();

    try {
      // Save locally
      setApiKey(trimmedKey);
      setCurrentApiKey(trimmedKey);

      // Save to backend if online
      try {
        await apiAuth.updateApiKey(trimmedKey);
      } catch (backendErr) {
        console.warn('Backend API key sync skipped:', backendErr.message);
      }

      setKeyMessage({
        text: trimmedKey ? 'API key saved securely' : 'API key cleared',
        type: 'success',
      });
      setTimeout(() => {
        setKeyMessage({ text: '', type: '' });
      }, 3000);
    } catch (err) {
      setKeyMessage({ text: err.message || 'Failed to save API key', type: 'error' });
    } finally {
      setKeyLoading(false);
    }
  };

  // Handle Clear Key
  const handleClearApiKey = async () => {
    setApiKeyInput('');
    setKeyLoading(true);
    setKeyMessage({ text: '', type: '' });

    try {
      setApiKey('');
      setCurrentApiKey('');
      try {
        await apiAuth.updateApiKey('');
      } catch (backendErr) {
        console.warn('Backend API key clear skipped:', backendErr.message);
      }
      setKeyMessage({ text: 'API key cleared', type: 'success' });
      setTimeout(() => {
        setKeyMessage({ text: '', type: '' });
      }, 3000);
    } catch (err) {
      setKeyMessage({ text: err.message || 'Failed to clear key', type: 'error' });
    } finally {
      setKeyLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/10 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 z-10 space-y-5 shadow-float ring-1 ring-zinc-950/5">
        {/* Header Tabs & Close */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex gap-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`transition-colors cursor-pointer select-none ${
                activeTab === 'account'
                  ? 'text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              My Account
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`transition-colors cursor-pointer select-none ${
                activeTab === 'settings'
                  ? 'text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              Settings
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-950 transition-colors p-1 rounded-md hover:bg-zinc-100/60"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TAB 1: MY ACCOUNT */}
        {activeTab === 'account' && (
          <form onSubmit={handleSaveAccount} className="space-y-4">
            {/* Avatar Preview & Options */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-600">
                Avatar
              </label>

              <div className="flex items-center gap-4">
                {/* Active Avatar Preview */}
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-zinc-100 ring-1 ring-zinc-950/10 flex items-center justify-center shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-base font-semibold text-zinc-700">
                      {name ? name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 rounded-md transition-colors cursor-pointer"
                    >
                      <Upload className="w-3 h-3 text-zinc-500" />
                      Upload image
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    {avatar && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatar('');
                          setCustomUrl('');
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Reset initials
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    PNG, JPG, or SVG up to 2MB
                  </p>
                </div>
              </div>

              {/* Minimalist Avatar Presets */}
              <div className="pt-1.5">
                <span className="text-[11px] text-zinc-400 block mb-1.5">
                  Or select a preset
                </span>
                <div className="flex items-center gap-2">
                  {AVATAR_PRESETS.map((preset) => {
                    const presetUrl = svgToDataUrl(preset.svg);
                    const isSelected = avatar === presetUrl;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setAvatar(presetUrl);
                          setCustomUrl('');
                        }}
                        className={`w-7 h-7 rounded-full overflow-hidden transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-zinc-950 scale-105'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                        title={preset.label}
                      >
                        <img
                          src={presetUrl}
                          alt={preset.label}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL Option */}
              <div className="pt-1">
                <Input
                  type="url"
                  placeholder="Or paste an image URL (optional)"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    if (e.target.value.trim()) {
                      setAvatar(e.target.value.trim());
                    }
                  }}
                  className="text-xs h-8"
                />
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-600">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                required
              />
            </div>

            {/* Email (Read-only) */}
            {user?.email && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400">
                  Email Address
                </label>
                <div className="px-3 py-2 text-xs bg-zinc-50 text-zinc-500 rounded-lg select-none truncate">
                  {user.email}
                </div>
              </div>
            )}

            {/* Feedback message */}
            {accountMessage.text && (
              <p
                className={`text-xs ${
                  accountMessage.type === 'error'
                    ? 'text-red-600'
                    : accountMessage.type === 'success'
                    ? 'text-emerald-600'
                    : 'text-zinc-600'
                }`}
              >
                {accountMessage.text}
              </p>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={accountLoading}
              >
                Save changes
              </Button>
            </div>
          </form>
        )}

        {/* TAB 2: SETTINGS (API KEY) */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveApiKey} className="space-y-4">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-zinc-900">API Key</h4>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    currentApiKey
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      currentApiKey ? 'bg-emerald-500' : 'bg-zinc-400'
                    }`}
                  />
                  {currentApiKey ? 'Configured' : 'Not configured'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Enter your personal API key to securely run compiler and agent operations.
              </p>
            </div>

            {/* API Key Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-600">
                Key Secret
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-ant-... or api key"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full h-10 pl-3 pr-10 text-xs bg-zinc-100/80 text-zinc-950 placeholder:text-zinc-400 rounded-lg transition-colors outline-none focus:bg-zinc-100 focus:ring-1 focus:ring-zinc-400 font-mono"
                  autoComplete="off"
                  spellCheck="false"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1 rounded transition-colors cursor-pointer"
                  title={showApiKey ? 'Hide key' : 'Show key'}
                >
                  {showApiKey ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Privacy & Security Notice */}
            <div className="p-3 bg-zinc-50 rounded-xl flex items-start gap-2.5">
              <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-zinc-500">
                Your key is stored securely in your browser and sent with compiler requests. It is never logged or exposed.
              </p>
            </div>

            {/* Feedback message */}
            {keyMessage.text && (
              <p
                className={`text-xs ${
                  keyMessage.type === 'error'
                    ? 'text-red-600'
                    : 'text-emerald-600'
                }`}
              >
                {keyMessage.text}
              </p>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="flex-1"
                isLoading={keyLoading}
              >
                Save API Key
              </Button>

              {currentApiKey && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={handleClearApiKey}
                  className="text-xs text-zinc-500 hover:text-red-600"
                  disabled={keyLoading}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AccountSettingsModal;
