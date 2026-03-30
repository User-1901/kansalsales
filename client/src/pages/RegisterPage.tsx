import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

// ── FIELD ERROR STRUCTURE ───────────────────────────────────────────────────
// Stores validation errors for individual form fields
interface FieldErrors {
  email?: string;           // Email validation error
  displayName?: string;     // Display name validation error
  password?: string;        // Password validation error
}

// ── REGISTER PAGE COMPONENT ─────────────────────────────────────────────────
// New user sign-up form with email, display name, and password
// Validates input locally before sending to server
// On success, shows confirmation message and link to login page
// Handles duplicate email errors from backend

export default function RegisterPage() {
  // ── FORM INPUT STATE ────────────────────────────────────────────────────
  const [email, setEmail] = useState('');             // User email
  const [displayName, setDisplayName] = useState(''); // Display name (visible to others)
  const [password, setPassword] = useState('');       // User password

  // ── ERROR STATE ─────────────────────────────────────────────────────────
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({}); // Per-field validation errors
  const [globalError, setGlobalError] = useState('');  // General error message
  const [success, setSuccess] = useState(false);       // Registration successful
  const [loading, setLoading] = useState(false);       // API call in progress

  // ── FORM VALIDATION ─────────────────────────────────────────────────────
  // Check that all fields are valid before allowing submission
  // Validation rules:
  // - Email: must be valid format (has @, has .)
  // - Display Name: cannot be empty
  // - Password: must be at least 8 characters
  function validate(): boolean {
    const errors: FieldErrors = {};

    // Check email format with regex
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'A valid email address is required.';
    }

    // Check display name is not empty
    if (!displayName.trim()) {
      errors.displayName = 'Display name is required.';
    }

    // Check password length (minimum 8 characters for security)
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    // Store errors to display to user
    setFieldErrors(errors);
    // Return true only if no errors found
    return Object.keys(errors).length === 0;
  }

  // ── FORM SUBMISSION HANDLER ─────────────────────────────────────────────
  // Called when user clicks "Create Account" button
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();  // Prevent page reload
    setGlobalError('');  // Clear previous errors

    // Validate all fields first
    if (!validate()) return;

    // ── MAKE REGISTRATION API CALL ──────────────────────────────────────
    setLoading(true);
    try {
      // POST to server: POST /api/auth/register with { email, displayName, password }
      // Server will hash the password and create user in database
      await api.post('/api/auth/register', { email, displayName, password });
      
      // All good! Show success screen
      setSuccess(true);
    } catch (err: unknown) {
      // Handle registration errors from server
      const status = (err as { response?: { status?: number; data?: { message?: string; errors?: FieldErrors } } })?.response?.status;
      const data = (err as { response?: { data?: { message?: string; errors?: FieldErrors } } })?.response?.data;

      // HTTP 409: Email already registered (conflict)
      if (status === 409) {
        setFieldErrors({ email: 'This email is already registered.' });
      }
      // Server sent specific field errors
      else if (data?.errors) {
        setFieldErrors(data.errors);
      }
      // General error message
      else {
        setGlobalError(data?.message ?? 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────
  // Show confirmation and link to login after successful registration
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

  // ── RENDER REGISTRATION FORM ────────────────────────────────────────────
  return (
    <div className="page-container" style={{ maxWidth: 420, paddingTop: 48 }}>
      <div className="card" style={{ padding: 32 }}>
        <h1 style={{ marginTop: 0, marginBottom: 24, fontSize: 24 }}>Create Account</h1>

        {/* Global error message (if registration fails) */}
        {globalError && <div className="alert alert-error">{globalError}</div>}

        {/* Registration form */}
        <form onSubmit={handleSubmit} noValidate>
          
          {/* Email input */}
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

          {/* Display name input */}
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

          {/* Password input */}
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

          {/* Submit button — disabled while loading */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        {/* Link to login for existing users */}
        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--gray-600)' }}>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
