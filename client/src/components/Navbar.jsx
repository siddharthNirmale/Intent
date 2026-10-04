import React from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';

export const Navbar = ({ onOpenAuth }) => {
  const { user, isAuthenticated, logout } = useAuth();

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
              <span className="text-xs text-zinc-500 max-w-[140px] truncate">
                {user?.name}
              </span>
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
