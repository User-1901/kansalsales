import { Link } from 'react-router-dom';

export default function CheckoutPage() {
  return (
    <div className="page-container" style={{ maxWidth: 560, paddingTop: 64, textAlign: 'center' }}>
      <div className="card" style={{ padding: '48px 32px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚧</div>
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>Coming Soon</h1>
        <p style={{ color: 'var(--gray-600)', marginBottom: 28 }}>
          Our payment gateway is being set up. Check back soon to complete your purchase.
        </p>
        <Link to="/cart" className="btn btn-primary" style={{ textDecoration: 'none', padding: '10px 28px' }}>
          Back to Cart
        </Link>
      </div>
    </div>
  );
}
