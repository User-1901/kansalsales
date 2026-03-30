import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

// ── NAVIGATION BAR COMPONENT ────────────────────────────────────────────────
// Top sticky header with:
// - Brand logo and name (link to home)
// - Navigation links (Home, Products, Categories, Contact)
// - Shopping cart icon with item count badge
// - User auth section (Login button or user name + Logout button)

export default function NavBar() {
  // ── AUTHENTICATION & ROUTING ────────────────────────────────────────────
  const { user, cartCount, logout } = useAuth();  // Current user, cart items, logout function
  const navigate = useNavigate();  // Navigate to pages after logout

  // ── LOGOUT HANDLER ──────────────────────────────────────────────────────
  // Called when user clicks "Logout" button
  async function handleLogout() {
    try {
      // POST to server to clear session
      await api.post('/api/auth/logout');
    } catch {
      // If API fails, still log out locally
    }
    // Clear auth state and redirect to home
    logout();
    navigate('/');
  }

  // ── RENDER NAVBAR ───────────────────────────────────────────────────────
  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'sticky',  // Stay at top when scrolling
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
      {/* ── BRAND LOGO ── */}
      <Link
        to="/"
        style={{
          fontWeight: 700,
          fontSize: 20,
          color: 'var(--green-dark)',
          marginRight: 'auto',  // Push right side items to right edge
          textDecoration: 'none',
          letterSpacing: '-0.3px',
        }}
      >
        🌿 Kansal Sales
      </Link>

      {/* ── NAVIGATION LINKS & USER SECTION ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        
        {/* Navigation buttons */}
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

        {/* Shopping Cart icon with badge */}
        <Link
          to="/cart"
          aria-label={`Cart (${cartCount} items)`}
          style={{
            position: 'relative',  // For positioning cart badge
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--gray-800)',
            fontWeight: 500,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          🛒 Cart
          
          {/* Cart item count badge — shows only if cartCount > 0 */}
          {cartCount > 0 && (
            <span
              data-testid="cart-badge"
              style={{
                position: 'absolute',  // Placed in top-right corner
                top: 0,
                right: 2,
                background: 'var(--green)',  // Green circle
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
              {cartCount}  {/* Number of items in cart */}
            </span>
          )}
        </Link>

        {/* ── USER AUTHENTICATION SECTION ── */}
        {user ? (
          // ── LOGGED-IN USER ──
          <>
            {/* Display user's name */}
            <span
              data-testid="display-name"
              style={{ fontSize: 14, color: 'var(--gray-600)', padding: '0 8px' }}
            >
              {user.displayName}
            </span>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ fontSize: 14, padding: '6px 14px' }}
            >
              Logout
            </button>
          </>
        ) : (
          // ── GUEST USER (NOT LOGGED IN) ──
          // Show Login button
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
