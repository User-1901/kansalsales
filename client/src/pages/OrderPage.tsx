import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// ── ORDER DETAILS PAGE ──────────────────────────────────────────────────────
// Shows order confirmation and details after payment
// Displays order number, items, total, and shipping address

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── FETCH ORDER DETAILS ON PAGE LOAD ────────────────────────────────────
  useEffect(() => {
    async function fetchOrder() {
      if (!orderId || !user) return;

      try {
        const res = await api.get(`/api/orders/${orderId}`);
        setOrder(res.data.order);
        setItems(res.data.items || []);
      } catch (err) {
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, user]);

  // ── SHOW LOADING ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-container" style={{ maxWidth: 600, paddingTop: 48 }}>
        <p style={{ textAlign: 'center' }}>Loading order details...</p>
      </div>
    );
  }

  // ── SHOW ERROR ──────────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="page-container" style={{ maxWidth: 600, paddingTop: 48 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
          <h2 style={{ marginTop: 0 }}>Order Not Found</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: 24 }}>
            {error || 'Could not retrieve order details'}
          </p>
          <Link to="/products" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ── RENDER ORDER CONFIRMATION ───────────────────────────────────────────
  return (
    <div className="page-container" style={{ maxWidth: 700, paddingTop: 32 }}>
      {/* Success header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>Thank You for Your Order!</h1>
        <p style={{ color: 'var(--gray-600)', fontSize: 15 }}>
          Your payment has been received and your order is being processed.
        </p>
      </div>

      {/* Order summary card */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 4 }}>Order Number</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{order.id.slice(0, 8).toUpperCase()}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 4 }}>Status</div>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: order.status === 'paid' ? 'var(--green-dark)' : 'var(--gray-800)',
            }}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 20 }} />

        {/* Order items */}
        <div>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Items in Your Order</h3>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.product_name}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                  ₹{parseFloat(item.product_price).toFixed(2)} × {item.quantity}
                </div>
              </div>
              <div style={{ fontWeight: 600 }}>
                ₹{parseFloat(item.line_total).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '16px 0',
          fontSize: 18,
          fontWeight: 700,
          borderTop: '2px solid #e2e8f0',
          marginTop: 12,
        }}>
          <span>Total Amount</span>
          <span style={{ color: 'var(--green-dark)' }}>₹{parseFloat(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      {/* Shipping address card */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Shipping Address</h3>
        <div style={{ color: 'var(--gray-800)', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{order.shipping_name}</div>
          <div>{order.shipping_address}</div>
          <div>{order.shipping_city} - {order.shipping_postal_code}</div>
          <div style={{ marginTop: 8 }}>{order.shipping_email}</div>
          <div>{order.shipping_phone}</div>
        </div>
      </div>

      {/* Next steps */}
      <div style={{ background: 'var(--green-pale)', border: '1px solid #86efac', borderRadius: 6, padding: 16, marginBottom: 20 }}>
        <h4 style={{ marginTop: 0, marginBottom: 8, color: 'var(--green-dark)' }}>What's next?</h4>
        <ul style={{ marginTop: 0, marginBottom: 0, paddingLeft: 20, color: 'var(--green-dark)' }}>
          <li style={{ marginBottom: 4 }}>You'll receive an order confirmation email shortly</li>
          <li style={{ marginBottom: 4 }}>We'll prepare your items for shipment</li>
          <li>Your tracking details will be sent once items are dispatched</li>
        </ul>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/products" className="btn btn-primary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', padding: '10px' }}>
          Continue Shopping
        </Link>
        <Link to="/" className="btn btn-secondary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', padding: '10px' }}>
          Go to Home
        </Link>
      </div>
    </div>
  );
}
