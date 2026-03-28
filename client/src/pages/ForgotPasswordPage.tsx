import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 420, paddingTop: 48 }}>
      <div className="card" style={{ padding: 32 }}>
        {submitted ? (
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
          <>
            <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 24 }}>Forgot Password</h1>
            <p style={{ color: 'var(--gray-600)', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
              Enter your email and we'll send you a reset link.
            </p>

            {error && <div className="alert alert-error">{error}</div>}

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
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: 15 }}
                disabled={loading || !email}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--gray-600)' }}>
              Remember your password? <Link to="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
