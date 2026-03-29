import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

interface CartItem {
  productId: string;
  name: string;
  price: string;
  quantity: number;
}

export default function CartPage() {
  const { user, setCartCount } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api
        .get('/api/cart')
        .then((res) => {
          const data = res.data;
          const cartItems: CartItem[] = data.items ?? [];
          setItems(cartItems);
          setCartCount(cartItems.reduce((s, i) => s + i.quantity, 0));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      const raw = sessionStorage.getItem('guestCart');
      const cart: CartItem[] = raw ? JSON.parse(raw) : [];
      setItems(cart);
      setCartCount(cart.reduce((s, i) => s + i.quantity, 0));
      setLoading(false);
    }
  }, [user, setCartCount]);

  function updateQuantity(productId: string, newQty: number) {
    if (newQty < 1) return;
    
    // Update UI immediately
    const updated = items.map((i) =>
      i.productId === productId ? { ...i, quantity: newQty } : i
    );
    setItems(updated);
    setCartCount(updated.reduce((s, i) => s + i.quantity, 0));

    // Save to backend/storage immediately
    if (user) {
      api.put(`/api/cart/items/${productId}`, { quantity: newQty }).catch(() => {});
    } else {
      const raw = sessionStorage.getItem('guestCart');
      const cart: CartItem[] = raw ? JSON.parse(raw) : [];
      sessionStorage.setItem(
        'guestCart',
        JSON.stringify(cart.map((i) => (i.productId === productId ? { ...i, quantity: newQty } : i)))
      );
    }
  }

  function removeItem(productId: string) {
    const next = items.filter((i) => i.productId !== productId);
    setItems(next);
    setCartCount(next.reduce((s, i) => s + i.quantity, 0));
    if (user) {
      api.delete(`/api/cart/items/${productId}`).catch(() => {});
    } else {
      const raw = sessionStorage.getItem('guestCart');
      const cart: CartItem[] = raw ? JSON.parse(raw) : [];
      sessionStorage.setItem(
        'guestCart',
        JSON.stringify(cart.filter((i) => i.productId !== productId))
      );
    }
  }

  const total = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: 16 }}>Your Cart</h1>

      {!user && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <Link to="/login">Log in</Link> to save your cart permanently.
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: 18, color: 'var(--gray-400)' }}>Your cart is empty.</p>
          <Link to="/products" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td>₹{parseFloat(item.price).toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          disabled={item.quantity <= 1}
                          style={{
                            width: 32,
                            height: 32,
                            padding: 0,
                            border: '1px solid #cbd5e1',
                            background: item.quantity <= 1 ? '#f1f5f9' : '#fff',
                            borderRadius: 4,
                            fontSize: 18,
                            fontWeight: 700,
                            color: item.quantity <= 1 ? '#cbd5e1' : '#334155',
                            cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span style={{ minWidth: 30, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                        <button
                          style={{
                            width: 32,
                            height: 32,
                            padding: 0,
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                            borderRadius: 4,
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#334155',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 10px', fontSize: 13 }}
                        onClick={() => removeItem(item.productId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 24,
              marginTop: 20,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700 }}>
              Total: ₹{total.toFixed(2)}
            </span>
            <Link
              to="/checkout"
              className="btn btn-primary"
              style={{ textDecoration: 'none', padding: '10px 24px', fontSize: 15 }}
            >
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
