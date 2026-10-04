import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';

export const Navbar = ({ onOpenAuth, onSelectAccount, onSelectSettings }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef(null);
  const menuRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [dropdownOpen]);

  const handleAccountClick = () => {
    setDropdownOpen(false);
    if (onSelectAccount) onSelectAccount();
  };

  const handleSettingsClick = () => {
    setDropdownOpen(false);
    if (onSelectSettings) onSelectSettings();
  };

  return (
    <header className="w-full bg-white">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <span className="font-semibold text-sm tracking-tight text-zinc-950 select-none">
          Intent
        </span>

        {/* User state / Auth action */}
        <div>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* User Dropdown Trigger & Menu */}
              <div
                ref={menuRef}
                className="relative py-1"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="text-xs text-zinc-500 hover:text-zinc-950 max-w-[140px] truncate transition-colors cursor-pointer select-none outline-none block text-left"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  {user?.name}
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`absolute left-0 top-full pt-1.5 z-50 transition-all duration-150 ease-out ${
                    dropdownOpen
                      ? 'opacity-100 translate-y-0 visible pointer-events-auto'
                      : 'opacity-0 -translate-y-1 invisible pointer-events-none'
                  }`}
                >
                  <div className="w-36 bg-white rounded-xl shadow-float ring-1 ring-zinc-950/5 p-1">
                    <button
                      type="button"
                      onClick={handleAccountClick}
                      className="w-full px-2.5 py-1.5 text-xs text-left text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer select-none outline-none"
                    >
                      My Account
                    </button>
                    <button
                      type="button"
                      onClick={handleSettingsClick}
                      className="w-full px-2.5 py-1.5 text-xs text-left text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer select-none outline-none"
                    >
                      Settings
                    </button>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-xs text-zinc-500 hover:text-zinc-950"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenAuth('login')}
              className="text-xs text-zinc-700 hover:text-zinc-950"
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
