import React, { createContext, useState, useContext, useCallback } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [flashMessages, setFlashMessages] = useState([]);
  const [pendingSharesCount, setPendingSharesCount] = useState(0);
  const [globalLoading, setGlobalLoading] = useState(false);

  /**
   * Add flash message
   */
  const addFlash = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    const flash = { id, type, message };
    
    setFlashMessages((prev) => [...prev, flash]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeFlash(id);
    }, 5000);
  }, []);

  /**
   * Remove flash message
   */
  const removeFlash = useCallback((id) => {
    setFlashMessages((prev) => prev.filter((flash) => flash.id !== id));
  }, []);

  /**
   * Shorthand methods for different flash types
   */
  const flashSuccess = useCallback((message) => addFlash('success', message), [addFlash]);
  const flashError = useCallback((message) => addFlash('error', message), [addFlash]);
  const flashInfo = useCallback((message) => addFlash('info', message), [addFlash]);
  const flashWarning = useCallback((message) => addFlash('warning', message), [addFlash]);

  /**
   * Update pending shares count
   */
  const updatePendingShares = useCallback((count) => {
    setPendingSharesCount(count);
  }, []);

  /**
   * Show/hide global loading
   */
  const showLoading = useCallback(() => setGlobalLoading(true), []);
  const hideLoading = useCallback(() => setGlobalLoading(false), []);

  const value = {
    // Flash messages
    flashMessages,
    addFlash,
    removeFlash,
    flashSuccess,
    flashError,
    flashInfo,
    flashWarning,
    
    // Pending shares
    pendingSharesCount,
    updatePendingShares,
    
    // Global loading
    globalLoading,
    showLoading,
    hideLoading
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
