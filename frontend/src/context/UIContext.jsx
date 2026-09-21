import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  // Chat history is visible by default on desktop screens for easy navigation
  const [showHistory, setShowHistory] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  const toggleHistory = () => setShowHistory((prev) => !prev);

  return (
    <UIContext.Provider value={{ showHistory, setShowHistory, toggleHistory }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
