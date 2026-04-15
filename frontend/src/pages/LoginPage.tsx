import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// ── LOGIN PAGE COMPONENT ────────────────────────────────────────────────────
// User sign-in form with email and password
// Submitting the form calls /api/auth/login with credentials
// On success, updates AuthContext and redirects to admin dashboard or home
// Admin users go to /admin, regular users go to home page

export default function LoginPage() {
  // ── AUTHENTICATION & ROUTING ────────────────────────────────────────────
  const { login } = useAuth();           // Update global auth state after login
  const navigate = useNavigate();         // Navigate to different pages

  // ── FORM STATE ──────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');        // User email input
  const [password, setPassword] = useState('');  // User password input
  const [error, setError] = useState('');        // Error message to display
  const [loading, setLoading] = useState(false); // Show "Signing in..." during API call

  // ── FORM SUBMISSION HANDLER ─────────────────────────────────────────────
  // Called when user clicks "Sign In" button
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();  // Prevent default form submission/page reload
    setError('');        // Clear previous errors

    // Validate that both fields are filled
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    // ── MAKE LOGIN API CALL ──────────────────────────────────────────────
    setLoading(true);
    try {
      // POST to server: POST /api/auth/login with { email, password }
      // Server verifies credentials and returns user object + JWT cookie
      const res = await api.post('/api/auth/login', { email, password });
      const loggedInUser = res.data.user;  // { id, email, displayName, role }

      // Update AuthContext with logged-in user
      login(loggedInUser);

      // Redirect based on user role:
      // - Admin users → /admin (admin dashboard)
      // - Regular users → / (home page)
      navigate(loggedInUser.role === 'admin' ? '/admin' : '/');
    } catch (err: unknown) {
      // Handle login error - show error message to user
      // Try to get error message from API response, fallback to generic message
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      // Stop loading spinner
      setLoading(false);
    }
  }

  // ── RENDER LOGIN FORM ───────────────────────────────────────────────────
  return (
    <div
      className="page-container"
      style={{ maxWidth: 420, paddingTop: 48 }}
    >
      {/* Card container with padding */}
      <div className="card" style={{ padding: 32 }}>
        <h1 style={{ marginTop: 0, marginBottom: 24, fontSize: 24 }}>Sign In</h1>

        {/* Error alert — shown if login fails */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Login form */}
        <form onSubmit={handleSubmit} noValidate>
          
          {/* Email input field */}
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password input field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Forgot password link */}
          <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 16 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              Forgot password?
            </Link>
          </div>

          {/* Sign In button — disabled while loading */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Link to registration page for new users */}
        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--gray-600)' }}>
          Don't have an account?{' '}
          <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
