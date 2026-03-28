import { useState, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Reset failed. The link may have expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div className="page-container" style={{ maxWidth: 420, paddingTop: 48 }}>
      <div className="card" style={{ padding: 32 }}>
        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 24 }}>Reset Password</h1>
        <p style={{ color: 'var(--gray-600)', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
          Enter your new password below.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
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
