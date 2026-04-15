import { useState, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

// ── RESET PASSWORD PAGE COMPONENT ───────────────────────────────────────────
// Password reset form accessed via link in email
// URL contains ?token=... which identifies user and proves email was verified
// User enters new password twice (must match)
// On success, password updated and user redirected to login

export default function ResetPasswordPage() {
  // ── GET RESET TOKEN FROM URL ─────────────────────────────────────────────
  // URL format: /reset-password?token=abc123xyz
  // Token sent in reset email by ForgotPasswordPage
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  // ── FORM STATE ──────────────────────────────────────────────────────────
  const [password, setPassword] = useState('');       // New password input
  const [confirm, setConfirm] = useState('');         // Password confirmation input
  const [error, setError] = useState('');             // Error message
  const [success, setSuccess] = useState(false);      // Password reset successful
  const [loading, setLoading] = useState(false);      // API call in progress

  // ── INVALID TOKEN CHECK ──────────────────────────────────────────────────
  // If no token in URL, show error (invalid or expired reset link)
  if (!token) {
    return (
      <div className="page-container" style={{ maxWidth: 420, paddingTop: 48 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
          <h2 style={{ marginTop: 0 }}>Invalid Link</h2>
          <p style={{ color: 'var(--gray-600)' }}>This reset link is missing or invalid.</p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  // ── FORM SUBMISSION HANDLER ──────────────────────────────────────────────
  // Called when user clicks "Update Password" button
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();  // Prevent page reload
    setError('');        // Clear previous errors

    // ── VALIDATION ──────────────────────────────────────────────────────
    // Password must be at least 8 characters
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    // Passwords must match
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    // ── SEND RESET REQUEST ──────────────────────────────────────────────
    setLoading(true);
    try {
      // POST /api/auth/reset-password with { token, password }
      // Server will verify token and update user's password
      await api.post('/api/auth/reset-password', { token, password });
      
      // Success! Show confirmation screen
      setSuccess(true);
    } catch (err: unknown) {
      // Handle errors (token expired, database error, etc.)
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Reset failed. The link may have expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────
  // Show confirmation and link to login after successful password reset
  if (success) {
    return (
      <div className="page-container" style={{ maxWidth: 420, paddingTop: 48 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ marginTop: 0 }}>Password Updated</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: 24 }}>
            Your password has been reset successfully.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ── RENDER PASSWORD RESET FORM ───────────────────────────────────────────
  return (
    <div className="page-container" style={{ maxWidth: 420, paddingTop: 48 }}>
      <div className="card" style={{ padding: 32 }}>
        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 24 }}>Reset Password</h1>
        <p style={{ color: 'var(--gray-600)', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
          Enter your new password below.
        </p>

        {/* Error alert */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Password reset form */}
        <form onSubmit={handleSubmit} noValidate>
          
          {/* New password input */}
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="At least 8 characters"
            />
          </div>

          {/* Confirm password input */}
          <div className="form-group">
            <label htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Repeat your new password"
            />
          </div>

          {/* Submit button — disabled while sending */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
