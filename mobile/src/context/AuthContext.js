import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '../services/api';
import { saveToken, getToken, clearToken } from '../services/tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Runs once on launch. Until it finishes, Routes renders nothing, so the
  // app never flashes the Welcome screen before jumping to the tabs.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const token = await getToken();

      if (!token) {
        if (!cancelled) setIsRestoring(false);
        return;
      }

      try {
        const data = await api.getMe();
        if (!cancelled) setUser(data.user);
      } catch (err) {
        // A rejected token is cleared. A network failure is not: the token
        // may be perfectly valid and the backend simply unreachable.
        if (err.code !== 'NETWORK' && err.code !== 'TIMEOUT') {
          await clearToken();
        }
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const data = await api.login(credentials);
    await saveToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signUp = useCallback(async (payload) => {
    const data = await api.register(payload);
    await saveToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  // Called after a profile edit so the name shown in Settings stays in step
  // with the server without a restart.
  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isRestoring,
      signIn,
      signUp,
      signOut,
      updateUser,
    }),
    [user, isRestoring, signIn, signUp, signOut, updateUser]
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
