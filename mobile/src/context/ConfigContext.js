import { createContext, useContext, useMemo, useState } from 'react';
import defaultConfig from '../config';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [apiBaseUrl, setApiBaseUrl] = useState(defaultConfig.apiBaseUrl);

  const value = useMemo(
    () => ({
      apiBaseUrl,
      setApiBaseUrl,
      requestTimeoutMs: defaultConfig.requestTimeoutMs,
    }),
    [apiBaseUrl]
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error('useConfig must be used inside ConfigProvider');
  }
  return ctx;
}