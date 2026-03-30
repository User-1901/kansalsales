import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

// ── FORGOT PASSWORD PAGE COMPONENT ──────────────────────────────────────────
// Password reset request form
// User enters email address, backend sends password reset link to email
// Shows confirmation message after successful submission

export default function ForgotPasswordPage() {
  // ── FORM STATE ──────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');           // Email input field
  const [submitted, setSubmitted] = useState(false); // Form submitted successfully
  const [loading, setLoading] = useState(false);     // API call in progress
  const [error, setError] = useState('');            // Error message

  // ── FORM SUBMISSION HANDLER ──────────────────────────────────────────────
  // Called when user clicks "Send Reset Link" button
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();  // Prevent page reload
    setError('');        // Clear previous errors

    // ── SEND PASSWORD RESET REQUEST ──────────────────────────────────────
    setLoading(true);
    try {
      // POST /api/auth/forgot-password with { email }
      // Backend will check if email exists and send reset link via email
      await api.post('/api/auth/forgot-password', { email });
      
      // Success! Show confirmation message
      setSubmitted(true);
    } catch {
      // If API call fails, show error
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── RENDER PAGE ──────────────────────────────────────────────────────────
  return (
    <div className="page-container" style={{ maxWidth: 420, paddingTop: 48 }}>
      <div className="card" style={{ padding: 32 }}>
        {submitted ? (
          // ── CONFIRMATION SCREEN ──
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h2 style={{ margin: '0 0 12px', fontSize: 22 }}>Check your email</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>
              If <strong>{email}</strong> is registered, we've sent a password reset link. Check your inbox (and spam folder).
            </p>
            <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          // ── PASSWORD RESET FORM ──
          <>
            <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 24 }}>Forgot Password</h1>
            <p style={{ color: 'var(--gray-600)', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
              Enter your email and we'll send you a reset link.
            </p>

            {/* Error alert */}
            {error && <div className="alert alert-error">{error}</div>}

            {/* Reset request form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>

              {/* Submit button — disabled while loading or email empty */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: 15 }}
                disabled={loading || !email}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            {/* Link back to login for users who remember password */}
            <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--gray-600)' }}>
              Remember your password? <Link to="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
