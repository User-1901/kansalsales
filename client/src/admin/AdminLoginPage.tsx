import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in as admin → redirect
  if (user?.role === 'admin') {
    navigate('/admin', { replace: true });
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const loggedInUser = res.data.user;
      if (loggedInUser.role !== 'admin') {
        setError('This account does not have admin access.');
        return;
      }
      login(loggedInUser);
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Invalid credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#1e293b',
        borderRadius: 16,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        border: '1px solid #334155',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            Kansal Sales
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f8fafc' }}>
            Admin Sign In
          </h1>
        </div>

        {error && (
          <div style={{
            background: '#450a0a',
            border: '1px solid #7f1d1d',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0f172a',
                border: '1.5px solid #334155',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#3b82f6')}
              onBlur={e => (e.target.style.borderColor = '#334155')}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0f172a',
                border: '1.5px solid #334155',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#3b82f6')}
              onBlur={e => (e.target.style.borderColor = '#334155')}
            />
            <div style={{ textAlign: 'right', marginTop: 6 }}>
              <a href="/forgot-password" style={{ fontSize: 12, color: '#60a5fa' }}>Forgot password?</a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#1e40af' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#475569' }}>
          Not an admin?{' '}
          <a href="/" style={{ color: '#60a5fa' }}>Go to store</a>
        </p>
      </div>
    </div>
  );
}
