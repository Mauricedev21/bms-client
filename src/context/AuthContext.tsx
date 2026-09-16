import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { TOKEN_KEY, type AuthUser, type SalonInfo } from '@/lib/types';

interface AuthSession {
  token?: string;
  user?: AuthUser;
  salon?: SalonInfo | null;
  barber?: { _id: string; name: string; phone: string; role: string };
}

interface AuthContextValue {
  user: AuthUser | null;
  salon: SalonInfo | null;
  barber: { _id: string; name: string; phone: string; role: string } | null;
  role: 'manager' | 'admin' | 'barber' | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<AuthSession>;
  register: (payload: Record<string, unknown>) => Promise<AuthSession>;
  logout: () => void;
  refresh: () => Promise<void>;
  applySession: (data: AuthSession) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [salon, setSalon] = useState<SalonInfo | null>(null);
  const [barber, setBarber] = useState<{ _id: string; name: string; phone: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data: AuthSession) => {
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    if (data.user) {
      setUser(data.user);
      setBarber(null);
    }
    if (data.barber) {
      setBarber(data.barber);
      setUser(null);
    }
    setSalon(data.salon ?? null);
  }, []);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      const data = res.data.data;
      if (data.barber) {
        setBarber(data.barber);
        setUser(null);
        setSalon(null);
      } else {
        setUser(data.user);
        setSalon(data.salon);
        setBarber(null);
      }
    } catch (err) {
      console.warn('session refresh failed', errorMessage(err));
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setSalon(null);
      setBarber(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (identifier: string, password: string): Promise<AuthSession> => {
    const res = await api.post('/auth/login', { identifier, password });
    applySession(res.data.data);
    toast.success('Welcome back!');
    return res.data.data as AuthSession;
  }, [applySession]);

  const register = useCallback(async (payload: Record<string, unknown>): Promise<AuthSession> => {
    const res = await api.post('/auth/register', payload);
    applySession(res.data.data);
    toast.success('Account created successfully!');
    return res.data.data as AuthSession;
  }, [applySession]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setSalon(null);
    setBarber(null);
  }, []);

  const role = (barber ? 'barber' : (user?.role ?? null)) as 'manager' | 'admin' | 'barber' | null;

  const value = useMemo(
    () => ({ user, salon, barber, role: role as 'manager' | 'admin' | 'barber' | null, loading, login, register, logout, refresh, applySession }),
    [user, salon, barber, role, loading, login, register, logout, refresh, applySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}