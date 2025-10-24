import { createContext, useState, useContext, useCallback } from 'react';

const FlashContext = createContext();

export const useFlash = () => {
  const context = useContext(FlashContext);
  if (!context) {
    throw new Error('useFlash must be used within a FlashProvider');
  }
  return context;
};

export const FlashProvider = ({ children }) => {
  const [messages, setMessages] = useState({
    success: [],
    error: [],
    info: [],
  });

  const addMessage = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setMessages((prev) => ({
      ...prev,
      [type]: [...prev[type], { id, message }],
    }));

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeMessage(type, id);
    }, 5000);
  }, []);

  const removeMessage = useCallback((type, id) => {
    setMessages((prev) => ({
      ...prev,
      [type]: prev[type].filter((msg) => msg.id !== id),
    }));
  }, []);

  const success = useCallback((message) => {
    addMessage('success', message);
  }, [addMessage]);

  const error = useCallback((message) => {
    addMessage('error', message);
  }, [addMessage]);

  const info = useCallback((message) => {
    addMessage('info', message);
  }, [addMessage]);

  const clear = useCallback(() => {
    setMessages({ success: [], error: [], info: [] });
  }, []);

  const value = {
    messages,
    success,
    error,
    info,
    clear,
    removeMessage,
  };

  return <FlashContext.Provider value={value}>{children}</FlashContext.Provider>;
};
