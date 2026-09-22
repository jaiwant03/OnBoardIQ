import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  // Chat history is visible by default for a seamless ChatGPT/Gemini experience
  const [showHistory, setShowHistory] = useState(true);

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
