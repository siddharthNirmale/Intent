import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import AccountSettingsModal from './components/AccountSettingsModal';
import CompilerStudio from './components/IntentCompiler/CompilerStudio';
import SettingsPage from './pages/SettingsPage';

export const AppContent = () => {
  const { pathname, navigate } = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState('account');

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenAccount = () => {
    navigate('/settings#account');
  };

  const handleOpenSettings = () => {
    navigate('/settings#settings');
  };

  const isSettingsPage = pathname === '/settings' || pathname.startsWith('/settings');

  return (
    <div className="min-h-screen bg-white text-zinc-950 flex flex-col selection:bg-zinc-200">
      <Navbar
        onOpenAuth={handleOpenAuth}
        onSelectAccount={handleOpenAccount}
        onSelectSettings={handleOpenSettings}
      />

      <main className="flex-1 px-4 sm:px-6">
        {isSettingsPage ? (
          <SettingsPage onOpenAuth={handleOpenAuth} />
        ) : (
          <CompilerStudio onOpenAuth={handleOpenAuth} />
        )}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <AccountSettingsModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        initialTab={accountModalTab}
      />
    </div>
  );
};

export const App = () => {
  return (
    <RouterProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </RouterProvider>
  );
};

export default App;
