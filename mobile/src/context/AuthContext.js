import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Stage 1.4 replaces this with a token read from expo-secure-store
  // on app start. The shape of what it exposes does not change.
  const [user, setUser] = useState(null);
  const [isRestoring] = useState(false);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isRestoring,
      signIn: (nextUser) => setUser(nextUser),
      signOut: () => setUser(null),
    }),
    [user, isRestoring]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
