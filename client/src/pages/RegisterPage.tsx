import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

interface FieldErrors {
  email?: string;
  displayName?: string;
  password?: string;
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'A valid email address is required.';
    }
    if (!displayName.trim()) {
      errors.displayName = 'Display name is required.';
    }
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/api/auth/register', { email, displayName, password });
      setSuccess(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string; errors?: FieldErrors } } })?.response?.status;
      const data = (err as { response?: { data?: { message?: string; errors?: FieldErrors } } })?.response?.data;
      if (status === 409) {
        setFieldErrors({ email: 'This email is already registered.' });
      } else if (data?.errors) {
        setFieldErrors(data.errors);
      } else {
        setGlobalError(data?.message ?? 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="page-container" style={{ maxWidth: 420, paddingTop: 48 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ marginTop: 0 }}>Registration Successful!</h2>
          <p style={{ color: 'var(--gray-600)' }}>
            Please check your email to verify your account.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 420, paddingTop: 48 }}>
      <div className="card" style={{ padding: 32 }}>
        <h1 style={{ marginTop: 0, marginBottom: 24, fontSize: 24 }}>Create Account</h1>

        {globalError && <div className="alert alert-error">{globalError}</div>}

        <form onSubmit={handleSubmit} noValidate>
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
            {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            {fieldErrors.displayName && (
              <span className="form-error">{fieldErrors.displayName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {fieldErrors.password && (
              <span className="form-error">{fieldErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--gray-600)' }}>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
