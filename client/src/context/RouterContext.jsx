import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const RouterContext = createContext(null);

export const RouterProvider = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [currentHash, setCurrentHash] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.hash || '';
    }
    return '';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname || '/');
      setCurrentHash(window.location.hash || '');
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = useCallback((to) => {
    if (!to || typeof window === 'undefined') return;

    try {
      const url = new URL(to, window.location.origin);
      const newPath = url.pathname;
      const newHash = url.hash;

      if (window.location.pathname !== newPath || window.location.hash !== newHash) {
        window.history.pushState(null, '', to);
        setCurrentPath(newPath);
        setCurrentHash(newHash);
      } else if (newHash && newHash !== currentHash) {
        setCurrentHash(newHash);
      }

      // Scroll to top or element if needed
      if (!newHash) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      console.warn('Navigation error:', e);
    }
  }, [currentHash]);

  const value = {
    pathname: currentPath,
    hash: currentHash,
    navigate,
  };

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

export default RouterContext;
