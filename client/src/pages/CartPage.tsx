import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// ── Data Types ──────────────────────────────────────────────────────────────
// Defines structure of items in the shopping cart
interface CartItem {
  productId: string;   // ID of the product
  name: string;        // Product name
  price: string;       // Original price per unit
  quantity: number;    // How many items of this product
  discount_percentage?: number;  // Discount percentage if any
}

// ── SHOPPING CART PAGE ──────────────────────────────────────────────────────
// Shows user's shopping cart, allows quantity changes and item removal
// Supports both logged-in users (database cart) and guests (sessionStorage cart)
export default function CartPage() {
  // Get current user info and cart manipulation function
  const { user, setCartCount } = useAuth();
  
  // STATE VARIABLES
  const [items, setItems] = useState<CartItem[]>([]);    // List of items in cart
  const [loading, setLoading] = useState(true);           // Show loading spinner while fetching

  // ── LOAD CART DATA ON PAGE MOUNT ────────────────────────────────────────
  // Checks if user is logged in and loads either server cart or guest cart
  useEffect(() => {
    async function loadCartWithDiscounts() {
      const cartData: CartItem[] = [];
      
      if (user) {
        // Logged-in user: Fetch cart from database via API
        try {
          const res = await api.get('/api/cart');
          const items = res.data.items ?? [];
          
          // Fetch product details to get discount info
          for (const item of items) {
            try {
              const productRes = await api.get(`/api/products/${item.product_id}`);
              cartData.push({
                productId: item.product_id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                discount_percentage: productRes.data.discount_percentage || 0,
              });
            } catch {
              // If product fetch fails, use item as is
              cartData.push({
                productId: item.product_id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
              });
            }
          }
        } catch (err) {
          console.log('Failed to load cart', err);
        }
      } else {
        // Guest user: Load cart from sessionStorage (temporary browser storage)
        const raw = sessionStorage.getItem('guestCart');
        const cart: CartItem[] = raw ? JSON.parse(raw) : [];
        
        // Fetch product details to get discount info
        for (const item of cart) {
          try {
            const productRes = await api.get(`/api/products/${item.productId}`);
            cartData.push({
              ...item,
              discount_percentage: productRes.data.discount_percentage || 0,
            });
          } catch {
            // If product fetch fails, use item as is
            cartData.push(item);
          }
        }
      }
      
      setItems(cartData);
      setCartCount(cartData.reduce((s, i) => s + i.quantity, 0));
      setLoading(false);
    }

    loadCartWithDiscounts();
  }, [user, setCartCount]);

  // ── UPDATE ITEM QUANTITY ────────────────────────────────────────────────
  // Changes quantity of a product in the cart
  function updateQuantity(productId: string, newQty: number) {
    // Don't allow quantity less than 1
    if (newQty < 1) return;
    
    // Update the UI immediately for better user experience
    const updated = items.map((i) =>
      i.productId === productId ? { ...i, quantity: newQty } : i
    );
    setItems(updated);
    // Update total cart count in navbar
    setCartCount(updated.reduce((s, i) => s + i.quantity, 0));

    // Save changes to backend/storage
    if (user) {
      // Logged-in: Save to database
      api.put(`/api/cart/items/${productId}`, { quantity: newQty }).catch(() => {});
    } else {
      // Guest: Save to sessionStorage
      const raw = sessionStorage.getItem('guestCart');
      const cart: CartItem[] = raw ? JSON.parse(raw) : [];
      sessionStorage.setItem(
        'guestCart',
        JSON.stringify(cart.map((i) => (i.productId === productId ? { ...i, quantity: newQty } : i)))
      );
    }
  }

  // ── REMOVE ITEM FROM CART ───────────────────────────────────────────────
  // Deletes a product from the cart completely
  function removeItem(productId: string) {
    // Filter out the item and update state
    const next = items.filter((i) => i.productId !== productId);
    setItems(next);
    // Update total cart count in navbar
    setCartCount(next.reduce((s, i) => s + i.quantity, 0));
    
    // Delete from backend/storage
    if (user) {
      // Logged-in: Delete from database
      api.delete(`/api/cart/items/${productId}`).catch(() => {});
    } else {
      // Guest: Remove from sessionStorage
      const raw = sessionStorage.getItem('guestCart');
      const cart: CartItem[] = raw ? JSON.parse(raw) : [];
      sessionStorage.setItem(
        'guestCart',
        JSON.stringify(cart.filter((i) => i.productId !== productId))
      );
    }
  }

  // ── CALCULATE CART TOTAL WITH DISCOUNTS ────────────────────────────────
  // Sum of (discounted_price × quantity) for all items
  const total = items.reduce((sum, i) => {
    const originalPrice = parseFloat(i.price);
    const discount = i.discount_percentage || 0;
    const discountedPrice = discount > 0 
      ? originalPrice - (originalPrice * discount / 100)
      : originalPrice;
    return sum + discountedPrice * i.quantity;
  }, 0);

  // ── LOADING STATE ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-container">
        <p>Loading...</p>
      </div>
    );
  }

  // ── RENDER CART PAGE ────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <h1 style={{ marginBottom: 16 }}>Your Cart</h1>

      {/* Show info message to guest users to encourage login */}
      {!user && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <Link to="/login">Log in</Link> to save your cart permanently.
        </div>
      )}

      {/* Show empty cart message if no items */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: 18, color: 'var(--gray-400)' }}>Your cart is empty.</p>
          <Link to="/products" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          {/* Cart items table */}
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
                {items.map((item) => {
                  const originalPrice = parseFloat(item.price);
                  const discount = item.discount_percentage || 0;
                  const discountedPrice = discount > 0 
                    ? originalPrice - (originalPrice * discount / 100)
                    : originalPrice;
                  
                  return (
                    <tr key={item.productId}>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: '#16a34a' }}>₹{discountedPrice.toFixed(2)}</span>
                          {discount > 0 && (
                            <>
                              <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: 13 }}>
                                ₹{originalPrice.toFixed(2)}
                              </span>
                              <span style={{ background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                -{discount}%
                              </span>
                            </>
                          )}
                        </div>
                      </td>
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
                      <td style={{ fontWeight: 700 }}>₹{(discountedPrice * item.quantity).toFixed(2)}</td>
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
                  );
                })}
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
