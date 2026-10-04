import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiAuth } from '../api/client';
import Button from './ui/Button';
import Input from './ui/Input';
import { X, Eye, EyeOff, Upload, RotateCcw } from 'lucide-react';

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
  const { user, updateProfile, refreshUsage } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Account state
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);

  // Settings / API Key state (Key is never stored in browser memory/storage)
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [isDefaultKey, setIsDefaultKey] = useState(false);
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
      setApiKeyInput('');

      // Check backend for API key configuration status (secure, masked, never returns raw key)
      apiAuth.getApiKey()
        .then((res) => {
          if (res?.success) {
            setHasKey(Boolean(res.hasKey));
            setIsKeyValid(Boolean(res.isValid));
            setIsDefaultKey(Boolean(res.isDefaultKey));
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

  // Handle API Key Save & Verification
  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    const trimmedKey = apiKeyInput.trim();
    if (!trimmedKey) {
      setKeyMessage({ text: 'Please enter a Gemini API key to save & verify', type: 'error' });
      return;
    }

    setKeyLoading(true);
    setKeyMessage({ text: 'Verifying key with Google Gemini API...', type: 'info' });

    try {
      const res = await apiAuth.updateApiKey(trimmedKey);
      if (res?.success) {
        setHasKey(true);
        setIsKeyValid(true);
        setApiKeyInput(''); // Never retain raw plaintext in memory
        setKeyMessage({
          text: 'Gemini API key verified & encrypted on backend',
          type: 'success',
        });
        if (typeof refreshUsage === 'function') refreshUsage();
      } else {
        throw new Error(res?.message || 'Verification failed');
      }
      setTimeout(() => {
        setKeyMessage({ text: '', type: '' });
      }, 4000);
    } catch (err) {
      setKeyMessage({ text: err.message || 'Failed to verify key', type: 'error' });
    } finally {
      setKeyLoading(false);
    }
  };

  // Handle Clear Key
  const handleClearApiKey = async () => {
    setKeyLoading(true);
    setKeyMessage({ text: '', type: '' });

    try {
      await apiAuth.clearApiKey();
      setHasKey(false);
      setIsKeyValid(false);
      setApiKeyInput('');
      setKeyMessage({ text: 'Gemini API key removed', type: 'success' });
      if (typeof refreshUsage === 'function') refreshUsage();
      setTimeout(() => {
        setKeyMessage({ text: '', type: '' });
      }, 3000);
    } catch (err) {
      setKeyMessage({ text: err.message || 'Failed to remove key', type: 'error' });
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
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 z-10 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header Tabs & Close */}
        <div className="flex items-center justify-between pb-3">
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
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center shrink-0">
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
                            ? 'scale-110 opacity-100 shadow-sm'
                            : 'opacity-60 hover:opacity-100'
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

        {/* TAB 2: SETTINGS (GEMINI API KEY) */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveApiKey} className="space-y-3.5 pt-0.5">
            {/* 1. Header & Status */}
            <div className="flex items-center justify-between">
              <label htmlFor="gemini-key" className="text-xs font-semibold text-zinc-900">
                Gemini API Key
              </label>
              {hasKey && (
                <span className="text-[11px] font-medium text-emerald-700">
                  {isKeyValid ? (isDefaultKey ? 'Default Active' : 'Active & Validated') : 'Configured'}
                </span>
              )}
            </div>

            {/* 2. Key Input */}
            <div className="relative">
              <input
                id="gemini-key"
                type={showApiKey ? 'text' : 'password'}
                placeholder={hasKey ? (isDefaultKey ? "•••••••••••••••• (Default Server Key)" : "Key configured • Enter new key to update") : "AIzaSy..."}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-xs bg-zinc-100/80 text-zinc-950 placeholder:text-zinc-400 rounded-lg outline-none focus:bg-zinc-200/70 font-mono transition-colors"
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1 rounded transition-colors cursor-pointer"
                title={showApiKey ? 'Hide key' : 'Show key'}
              >
                {showApiKey ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* 3. Security & Agent Notice */}
            <div className="space-y-1">
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Keys are verified with Google Generative AI, encrypted with AES-256-GCM at rest, and never exposed in browser storage.
              </p>
              <p className="text-[10px] text-zinc-400">
                Support for additional AI agents (OpenAI, Claude, DeepSeek) will be available in future releases.
              </p>
            </div>

            {/* 4. Feedback Message */}
            {keyMessage.text && (
              <p
                className={`text-xs ${
                  keyMessage.type === 'error'
                    ? 'text-red-600'
                    : keyMessage.type === 'info'
                    ? 'text-zinc-600'
                    : 'text-emerald-600'
                }`}
              >
                {keyMessage.text}
              </p>
            )}

            {/* 5. Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="flex-1 text-xs h-8"
                isLoading={keyLoading}
              >
                {hasKey ? 'Update key' : 'Save & Verify'}
              </Button>

              {hasKey && !isDefaultKey && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearApiKey}
                  className="text-xs h-8 text-zinc-400 hover:text-red-600"
                  disabled={keyLoading}
                >
                  Remove Key
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
