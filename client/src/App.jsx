import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import AccountSettingsModal from './components/AccountSettingsModal';
import CompilerStudio from './components/IntentCompiler/CompilerStudio';

export const AppContent = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState('account');

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenAccount = () => {
    setAccountModalTab('account');
    setAccountModalOpen(true);
  };

  const handleOpenSettings = () => {
    setAccountModalTab('settings');
    setAccountModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950 flex flex-col selection:bg-zinc-200">
      <Navbar
        onOpenAuth={handleOpenAuth}
        onSelectAccount={handleOpenAccount}
        onSelectSettings={handleOpenSettings}
      />

      <main className="flex-1 px-6">
        <CompilerStudio />
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
