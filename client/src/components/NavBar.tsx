import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

export default function NavBar() {
  const { user, cartCount, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // ignore
    }
    logout();
    navigate('/');
  }

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        height: 'var(--nav-height)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
      }}
    >
      {/* Brand */}
      <Link
        to="/"
        style={{
          fontWeight: 700,
          fontSize: 20,
          color: 'var(--green-dark)',
          marginRight: 'auto',
          textDecoration: 'none',
          letterSpacing: '-0.3px',
        }}
      >
        🌿 Kansal Sales
      </Link>

      {/* Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[
          { to: '/', label: 'Home' },
          { to: '/products', label: 'Products' },
          { to: '/categories', label: 'Categories' },
          { to: '/contact', label: 'Contact' },
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--gray-800)',
              fontWeight: 500,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            {label}
          </Link>
        ))}

        {/* Cart */}
        <Link
          to="/cart"
          aria-label={`Cart (${cartCount} items)`}
          style={{
            position: 'relative',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--gray-800)',
            fontWeight: 500,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          🛒 Cart
          {cartCount > 0 && (
            <span
              data-testid="cart-badge"
              style={{
                position: 'absolute',
                top: 0,
                right: 2,
                background: 'var(--green)',
                color: '#fff',
                borderRadius: '50%',
                width: 18,
                height: 18,
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {cartCount}
            </span>
          )}
        </Link>

        {/* Auth */}
        {user ? (
          <>
            <span
              data-testid="display-name"
              style={{ fontSize: 14, color: 'var(--gray-600)', padding: '0 8px' }}
            >
              {user.displayName}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ fontSize: 14, padding: '6px 14px' }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="btn btn-primary"
            style={{ fontSize: 14, padding: '6px 14px', textDecoration: 'none' }}
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
