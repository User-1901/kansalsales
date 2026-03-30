import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '../api/axios';

// ── DATA TYPES FOR AUTHENTICATION ───────────────────────────────────────────
// Represents a logged-in user
export interface User {
  id: string;           // Unique user ID
  email: string;        // User's email address (used for login)
  displayName: string;  // User's display name (shown in UI)
  role: 'user' | 'admin';  // Either regular user or admin
}

// ── AUTHENTICATION STATE ────────────────────────────────────────────────────
// This holds all auth-related state that the app needs
interface AuthState {
  user: User | null;    // Current logged-in user (null if not logged in)
  cartCount: number;    // Total number of items in cart (for navbar badge)
}

// ── EXPOSED FUNCTIONS AND STATE ────────────────────────────────────────────
// This is what components can access from AuthContext
interface AuthContextValue extends AuthState {
  login: (user: User) => void;          // Call this after successful login
  logout: () => void;                   // Call this to log out user
  setCartCount: (n: number) => void;    // Update cart count in navbar
  isLoading: boolean;                   // True while checking if user is still logged in
}

// ── CREATE CONTEXT FOR GLOBAL STATE ────────────────────────────────────────
// This is where all authentication state lives (global across the app)
export const AuthContext = createContext<AuthContextValue | null>(null);

// ── AUTH PROVIDER COMPONENT ────────────────────────────────────────────────
// Wrap the entire app with this component to make authentication available everywhere
export function AuthProvider({ children }: { children: ReactNode }) {
  // STATE VARIABLES
  const [state, setState] = useState<AuthState>({ user: null, cartCount: 0 });
  const [isLoading, setIsLoading] = useState(true);  // Show loading while checking session

  // ── VERIFY SESSION ON APP LOAD ──────────────────────────────────────────
  // When app first loads, check if user is already logged in
  // This allows users to stay logged in when they refresh the page
  useEffect(() => {
    const verifySession = async () => {
      try {
        // API Call: Check if there's a valid JWT token in cookies
        const res = await api.get('/api/auth/me');
        
        // If we get here, user has valid token - set them as logged in
        if (res.data.user) {
          setState((s) => ({ ...s, user: res.data.user }));
        }
      } catch {
        // If API call fails, user is not logged in - stay logged out
        // This is expected for guests
      } finally {
        // Stop loading spinner - we've finished checking
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);  // Only run once on app initialization

  // ── LOGIN FUNCTION ──────────────────────────────────────────────────────
  // Call this when a user successfully logs in
  const login = (user: User) => setState((s) => ({ ...s, user }));
  
  // ── LOGOUT FUNCTION ─────────────────────────────────────────────────────
  // Call this when user logs out
  const logout = () => setState((s) => ({ ...s, user: null }));
  
  // ── SET CART COUNT FUNCTION ────────────────────────────────────────────
  // Updates the cart count shown in the navbar
  const setCartCount = (n: number) => setState((s) => ({ ...s, cartCount: n }));

  // ── PROVIDE CONTEXT TO ALL CHILDREN ────────────────────────────────────
  // Make authentication state available to any component that needs it
  return (
    <AuthContext.Provider value={{ ...state, login, logout, setCartCount, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── HOOK TO USE AUTHENTICATION IN COMPONENTS ──────────────────────────────
// Use this hook in any component to access authentication state
// Example: const { user, login, logout } = useAuth();
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
