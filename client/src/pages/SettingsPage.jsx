import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { apiAuth } from '../api/client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import Separator from '../components/ui/Separator';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '../components/ui/Sidebar';
import {
  User,
  Sliders,
  Upload,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '../lib/utils';

const AVATAR_PRESETS = [
  { id: 'mono', svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#18181b"/><circle cx="20" cy="15" r="6" fill="#f4f4f5"/><path d="M10 32C10 26.4772 14.4772 22 20 22C25.5228 22 30 26.4772 30 32" stroke="#f4f4f5" stroke-width="2.5" stroke-linecap="round"/></svg>` },
  { id: 'emerald', svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#064e3b"/><circle cx="20" cy="15" r="6" fill="#34d399"/><path d="M10 32C10 26.4772 14.4772 22 20 22C25.5228 22 30 26.4772 30 32" stroke="#34d399" stroke-width="2.5" stroke-linecap="round"/></svg>` },
  { id: 'slate', svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#0f172a"/><circle cx="20" cy="15" r="6" fill="#38bdf8"/><path d="M10 32C10 26.4772 14.4772 22 20 22C25.5228 22 30 26.4772 30 32" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/></svg>` },
  { id: 'violet', svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#2e1065"/><circle cx="20" cy="15" r="6" fill="#c084fc"/><path d="M10 32C10 26.4772 14.4772 22 20 22C25.5228 22 30 26.4772 30 32" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round"/></svg>` },
  { id: 'amber', svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#451a03"/><circle cx="20" cy="15" r="6" fill="#fbbf24"/><path d="M10 32C10 26.4772 14.4772 22 20 22C25.5228 22 30 26.4772 30 32" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/></svg>` },
  { id: 'rose', svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#4c0519"/><circle cx="20" cy="15" r="6" fill="#fb7185"/><path d="M10 32C10 26.4772 14.4772 22 20 22C25.5228 22 30 26.4772 30 32" stroke="#fb7185" stroke-width="2.5" stroke-linecap="round"/></svg>` },
];

const svgToDataUrl = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export const SettingsPage = ({ onOpenAuth }) => {
  const { user, isAuthenticated, loading: authLoading, updateProfile } = useAuth();
  const { hash, navigate } = useRouter();

  const [activeSection, setActiveSection] = useState(() => (hash === '#settings' ? 'settings' : 'account'));

  const nameInputRef = useRef(null);
  const geminiKeyInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // My Account state
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState({ text: '', type: '' });

  // Settings state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [isDefaultKey, setIsDefaultKey] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyMessage, setKeyMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
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
  }, [isAuthenticated]);

  useEffect(() => {
    if (hash === '#settings') {
      setActiveSection('settings');
      setTimeout(() => geminiKeyInputRef.current?.focus(), 100);
    } else if (hash === '#account' || hash === '') {
      setActiveSection('account');
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [hash]);

  const handleSelectSection = (sectionId) => {
    setActiveSection(sectionId);
    navigate(`/settings#${sectionId}`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      setAccountMessage({ text: 'Please select an image under 2MB', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setAvatar(dataUrl);
        setAccountMessage({ text: '', type: '' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setAccountLoading(true);
    setAccountMessage({ text: '', type: '' });

    try {
      await updateProfile({ name: name.trim(), avatar });
      setAccountMessage({ text: 'Saved', type: 'success' });
      setTimeout(() => setAccountMessage({ text: '', type: '' }), 2500);
    } catch (err) {
      setAccountMessage({ text: err.message || 'Failed to save', type: 'error' });
    } finally {
      setAccountLoading(false);
    }
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;

    setKeyLoading(true);
    setKeyMessage({ text: '', type: '' });

    try {
      const res = await apiAuth.updateApiKey(trimmed);
      if (res?.success) {
        setHasKey(true);
        setIsKeyValid(true);
        setApiKeyInput('');
        setKeyMessage({ text: 'Verified and saved', type: 'success' });
      } else {
        throw new Error(res?.message || 'Verification failed');
      }
      setTimeout(() => setKeyMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setKeyMessage({ text: err.message || 'Verification failed', type: 'error' });
    } finally {
      setKeyLoading(false);
    }
  };

  const handleClearApiKey = async () => {
    setKeyLoading(true);
    setKeyMessage({ text: '', type: '' });

    try {
      await apiAuth.clearApiKey();
      setHasKey(false);
      setIsKeyValid(false);
      setApiKeyInput('');
      setKeyMessage({ text: 'Removed', type: 'success' });
      setTimeout(() => setKeyMessage({ text: '', type: '' }), 2500);
    } catch (err) {
      setKeyMessage({ text: err.message || 'Failed to remove', type: 'error' });
    } finally {
      setKeyLoading(false);
    }
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="max-w-sm mx-auto py-24 px-6 text-center space-y-4">
        <h1 className="text-base font-medium text-zinc-950">Settings</h1>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onOpenAuth?.('login')}
        >
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-6">
      {/* Top Header / Breadcrumb */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="h-8 px-2 -ml-2 text-xs text-zinc-500 hover:text-zinc-950 gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Studio</span>
        </Button>
      </div>

      {/* Mobile Switcher */}
      <div className="flex md:hidden bg-zinc-100 p-1 rounded-xl gap-1">
        <Button
          type="button"
          variant={activeSection === 'account' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleSelectSection('account')}
          className={cn(
            'flex-1 h-8 text-xs font-medium',
            activeSection === 'account'
              ? 'bg-white text-zinc-950 shadow-xs hover:bg-white'
              : 'text-zinc-600 hover:text-zinc-950'
          )}
        >
          <User className="w-3.5 h-3.5" />
          <span>My Account</span>
        </Button>
        <Button
          type="button"
          variant={activeSection === 'settings' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleSelectSection('settings')}
          className={cn(
            'flex-1 h-8 text-xs font-medium',
            activeSection === 'settings'
              ? 'bg-white text-zinc-950 shadow-xs hover:bg-white'
              : 'text-zinc-600 hover:text-zinc-950'
          )}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Settings</span>
        </Button>
      </div>

      {/* 2-Column Layout */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Minimal Sidebar Navigation */}
        <Sidebar className="hidden md:flex w-44 border-none bg-transparent p-0 shadow-none shrink-0">
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === 'account'}
                  onClick={() => handleSelectSection('account')}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>My Account</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === 'settings'}
                  onClick={() => handleSelectSection('settings')}
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    <span>Settings</span>
                  </div>
                  {hasKey && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Section Content */}
        <main className="flex-1 min-w-0 w-full">
          {/* SECTION 1: MY ACCOUNT */}
          {activeSection === 'account' && (
            <div id="account" className="space-y-4">
              <h2 className="text-base font-semibold tracking-tight text-zinc-950">
                My Account
              </h2>

              <Card>
                <form onSubmit={handleSaveAccount}>
                  <CardContent className="p-6 space-y-5">
                    {/* Avatar */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-medium text-zinc-700 block">Avatar</label>
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={avatar} alt={name || 'User'} />
                          <AvatarFallback>{name ? name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Upload
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                          {avatar && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setAvatar('')}
                              className="text-zinc-400 hover:text-zinc-700"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Reset
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="flex items-center gap-2 pt-1">
                        {AVATAR_PRESETS.map((p) => {
                          const url = svgToDataUrl(p.svg);
                          const isSelected = avatar === url;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setAvatar(url)}
                              className={cn(
                                'w-7 h-7 rounded-full overflow-hidden transition-all cursor-pointer outline-none',
                                isSelected ? 'ring-2 ring-zinc-950 scale-105' : 'opacity-60 hover:opacity-100'
                              )}
                            >
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Separator />

                    {/* Name */}
                    <div className="space-y-1.5">
                      <label htmlFor="account-name" className="text-xs font-medium text-zinc-700 block">
                        Name
                      </label>
                      <Input
                        id="account-name"
                        ref={nameInputRef}
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={50}
                        required
                        className="h-8 text-xs bg-zinc-50 border border-zinc-200/80 focus:bg-white"
                      />
                    </div>

                    {/* Email */}
                    {user?.email && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 block">
                          Email
                        </label>
                        <div className="text-xs text-zinc-500 font-mono py-1">
                          {user.email}
                        </div>
                      </div>
                    )}

                    {accountMessage.text && (
                      <p className={`text-xs ${accountMessage.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {accountMessage.text}
                      </p>
                    )}

                    <div className="pt-1">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={accountLoading}
                      >
                        Save changes
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </Card>
            </div>
          )}

          {/* SECTION 2: SETTINGS */}
          {activeSection === 'settings' && (
            <div id="settings" className="space-y-4">
              <h2 className="text-base font-semibold tracking-tight text-zinc-950">
                Settings
              </h2>

              <Card>
                <CardContent className="p-6 space-y-4">
                  {/* Gemini API Key */}
                  <form onSubmit={handleSaveApiKey} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="gemini-key" className="text-xs font-medium text-zinc-700">
                        Gemini API Key
                      </label>
                      <Badge variant={hasKey ? (isKeyValid ? 'success' : 'warning') : 'neutral'} className="text-[10px]">
                        {hasKey ? (isKeyValid ? (isDefaultKey ? 'Default Active' : 'Active') : 'Configured') : 'Not set'}
                      </Badge>
                    </div>

                    <div className="relative">
                      <input
                        id="gemini-key"
                        ref={geminiKeyInputRef}
                        type={showApiKey ? 'text' : 'password'}
                        placeholder={hasKey ? (isDefaultKey ? "•••••••••••••••• (Default Server Key)" : "••••••••••••••••") : "AIzaSy..."}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        className="w-full h-8 pl-3 pr-8 text-xs bg-zinc-50 hover:bg-zinc-100/60 text-zinc-950 placeholder:text-zinc-400 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-zinc-400 border border-zinc-200/80 font-mono transition-colors"
                        autoComplete="off"
                        spellCheck="false"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer transition-colors"
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {keyMessage.text && (
                      <p className={`text-xs ${keyMessage.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {keyMessage.text}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={keyLoading}
                      >
                        {hasKey ? 'Update key' : 'Save key'}
                      </Button>
                      {hasKey && !isDefaultKey && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleClearApiKey}
                          disabled={keyLoading}
                        >
                          Remove custom key
                        </Button>
                      )}
                    </div>

                    {/* Simple notice below Gemini API Key section */}
                    <p className="text-xs text-zinc-400 pt-1.5">
                      Other AI agent API access coming soon.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
