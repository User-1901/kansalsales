import { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: User | null;
  cartCount: number;
}

interface AuthContextValue extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  setCartCount: (n: number) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, cartCount: 0 });

  const login = (user: User) => setState((s) => ({ ...s, user }));
  const logout = () => setState((s) => ({ ...s, user: null }));
  const setCartCount = (n: number) => setState((s) => ({ ...s, cartCount: n }));

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setCartCount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
