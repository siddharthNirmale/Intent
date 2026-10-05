import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import Button from './ui/Button';
import AccountSettingsModal from './AccountSettingsModal';
import { ArrowUpRight } from 'lucide-react';

export const Navbar = ({ onOpenAuth, onSelectAccount, onSelectSettings }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { pathname, navigate } = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState('account');
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
    if (onSelectAccount) {
      onSelectAccount();
    } else {
      navigate('/settings#account');
    }
  };

  const handleSettingsClick = () => {
    setDropdownOpen(false);
    if (onSelectSettings) {
      onSelectSettings();
    } else {
      navigate('/settings#settings');
    }
  };

  const isSettingsPage = pathname === '/settings' || pathname?.startsWith('/settings');

  return (
    <>
      <header className="w-full bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="font-semibold text-sm tracking-tight text-zinc-950 select-none hover:opacity-75 transition-opacity cursor-pointer outline-none flex items-center gap-2"
              title="Go to Studio"
            >
              <span>Intent</span>
            </button>

            {isSettingsPage && (
              <span className="text-xs text-zinc-300 select-none">/</span>
            )}
            {isSettingsPage && (
              <span className="text-xs font-medium text-zinc-500 select-none">
                Settings
              </span>
            )}
          </div>

          {/* User state / Auth action */}
          <div>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isSettingsPage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="text-xs text-zinc-600 hover:text-zinc-950 hidden sm:inline-flex"
                  >
                    Studio
                  </Button>
                )}

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
                    className="flex items-center gap-2 text-left group cursor-pointer select-none outline-none"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    {/* User Avatar */}
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center shrink-0">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-semibold text-zinc-600">
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-zinc-500 group-hover:text-zinc-950 max-w-[130px] truncate transition-colors">
                      {user?.name}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    className={`absolute right-0 top-full pt-1.5 z-50 transition-all duration-150 ease-out ${
                      dropdownOpen
                        ? 'opacity-100 translate-y-0 visible pointer-events-auto'
                        : 'opacity-0 -translate-y-1 invisible pointer-events-none'
                    }`}
                  >
                    <div className="w-36 bg-white rounded-xl shadow-xl p-1">
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
                      <div className="h-px bg-zinc-100 my-1" />
                      <a
                        href="https://siddharthn-portfolio.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full px-2.5 py-1.5 text-xs text-left text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer select-none outline-none flex items-center justify-between group"
                        title="Creator Portfolio"
                      >
                        <span>Portfolio</span>
                        <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
                      </a>
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

      {/* Internal Account / Settings Modal fallback */}
      {!onSelectAccount && (
        <AccountSettingsModal
          isOpen={accountModalOpen}
          onClose={() => setAccountModalOpen(false)}
          initialTab={accountModalTab}
        />
      )}
    </>
  );
};

export default Navbar;
