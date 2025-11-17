import React, { createContext, useContext, type ReactNode } from 'react';

/**
 * Demo Context value interface defining demo mode state
 */
export interface DemoContextValue {
  isDemo: boolean;
}

/**
 * Demo Context for managing demo mode state
 */
const DemoContext = createContext<DemoContextValue | undefined>(undefined);

/**
 * Props for DemoProvider component
 */
interface DemoProviderProps {
  children: ReactNode;
  isDemo?: boolean;
}

/**
 * DemoProvider component that wraps demo routes and provides demo mode state
 */
export const DemoProvider: React.FC<DemoProviderProps> = ({ 
  children, 
  isDemo = false 
}) => {
  const value: DemoContextValue = {
    isDemo,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

/**
 * Custom hook to use Demo Context
 * @returns DemoContextValue with demo mode state
 * @throws Error if used outside DemoProvider
 */
export const useDemo = (): DemoContextValue => {
  const context = useContext(DemoContext);

  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }

  return context;
};
