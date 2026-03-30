import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// ── SHIPPING FORM DATA STRUCTURE ────────────────────────────────────────────
interface ShippingInfo {
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
}

// ── CART ITEM STRUCTURE ─────────────────────────────────────────────────────
interface CartItem {
  productId: string;
  quantity: number;
  product_id?: string;  // From API response
  name?: string;
  price?: string;
  discount_percentage?: number;  // Discount percentage if any
}

// ── CHECKOUT PAGE COMPONENT ────────────────────────────────────────────────
// Complete checkout flow:
// 1. Load user's cart from database
// 2. Show shipping form and cart summary
// 3. Create order via API
// 4. Open Razorpay payment gateway
// 5. Verify payment signature
// 6. Show order confirmation

export default function CheckoutPage() {
  // ── AUTH & ROUTING ──────────────────────────────────────────────────────
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── CART STATE ──────────────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState<Array<any>>([]);        // Items in cart
  const [cartTotal, setCartTotal] = useState(0);                     // Total price
  const [loadingCart, setLoadingCart] = useState(true);              // Loading cart from API

  // ── SHIPPING FORM STATE ─────────────────────────────────────────────────
  const [shipping, setShipping] = useState<ShippingInfo>({
    shipping_name: user?.displayName || '',
    shipping_email: user?.email || '',
    shipping_phone: '',
    shipping_address: '',
    shipping_city: '',
    shipping_postal_code: '',
  });

  // ── PAYMENT PROCESSING STATE ────────────────────────────────────────────
  const [processing, setProcessing] = useState(false);               // Creating order
  const [paymentError, setPaymentError] = useState('');              // Payment error message

  // ── LOAD CART ON PAGE LOAD ─────────────────────────────────────────────
  // Fetch cart items from user's database cart, including product discount info
  useEffect(() => {
    async function loadCart() {
      try {
        const res = await api.get('/api/cart');
        const items = res.data.items || [];
        
        // Fetch product details to get discount info for each item
        const enrichedItems = await Promise.all(
          items.map(async (item: any) => {
            try {
              const productRes = await api.get(`/api/products/${item.product_id}`);
              return {
                ...item,
                discount_percentage: productRes.data.discount_percentage || 0,
              };
            } catch {
              return item;
            }
          })
        );
        
        setCartItems(enrichedItems);
        
        // Calculate total with discounts
        const total = enrichedItems.reduce((sum: number, item: any) => {
          const originalPrice = parseFloat(item.price);
          const discount = item.discount_percentage || 0;
          const discountedPrice = discount > 0
            ? originalPrice - (originalPrice * discount / 100)
            : originalPrice;
          return sum + (discountedPrice * item.quantity);
        }, 0);
        setCartTotal(total);
      } catch (error) {
        console.error('Failed to load cart:', error);
        setPaymentError('Failed to load cart');
      } finally {
        setLoadingCart(false);
      }
    }

    if (user) {
      loadCart();
    }
  }, [user]);

  // ── REDIRECT IF NOT LOGGED IN ──────────────────────────────────────────
  if (!user) {
    return (
      <div className="page-container" style={{ maxWidth: 600, paddingTop: 48 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h2 style={{ marginTop: 0 }}>Login Required</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: 24 }}>
            Please log in to proceed with checkout.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary"
            style={{ padding: '10px 28px' }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ── REDIRECT IF CART IS EMPTY ──────────────────────────────────────────
  if (!loadingCart && cartItems.length === 0) {
    return (
      <div className="page-container" style={{ maxWidth: 600, paddingTop: 48 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
          <h2 style={{ marginTop: 0 }}>Your Cart is Empty</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: 24 }}>
            Add some products to your cart before checking out.
          </p>
          <button
            onClick={() => navigate('/products')}
            className="btn btn-primary"
            style={{ padding: '10px 28px' }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ── HANDLE FORM INPUT CHANGE ────────────────────────────────────────────
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setShipping(prev => ({ ...prev, [name]: value }));
  }

  // ── HANDLE PAYMENT (RAZORPAY) ────────────────────────────────────────────
  async function handlePayment() {
    // Validate shipping form
    if (!shipping.shipping_name || !shipping.shipping_email || !shipping.shipping_phone ||
        !shipping.shipping_address || !shipping.shipping_city || !shipping.shipping_postal_code) {
      setPaymentError('Please fill in all shipping details');
      return;
    }

    setProcessing(true);
    setPaymentError('');

    try {
      // ── STEP 1: CREATE ORDER VIA BACKEND ──────────────────────────────
      const checkoutRes = await api.post('/api/checkout', {
        shippingInfo: shipping,
        cartItems: cartItems.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
        })),
      });

      const { razorpay_key, razorpay_order_id, amount } = checkoutRes.data;

      // ── STEP 2: INITIALIZE RAZORPAY ───────────────────────────────────
      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;

      script.onload = async () => {
        // Razorpay options
        const options: any = {
          key: razorpay_key,
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          order_id: razorpay_order_id,
          
          // Payment successful
          handler: async function (response: any) {
            try {
              // ── STEP 3: VERIFY PAYMENT SIGNATURE ──────────────────────
              const verifyRes = await api.post('/api/checkout/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              // ── STEP 4: SHOW SUCCESS AND REDIRECT ─────────────────────
              alert('✅ Payment successful! Your order has been confirmed.');
              navigate(`/orders/${verifyRes.data.order.id}`, { replace: true });
            } catch (err) {
              setPaymentError('Payment verification failed. Please contact support.');
            } finally {
              setProcessing(false);
            }
          },

          // Payment failed
          prefill: {
            name: shipping.shipping_name,
            email: shipping.shipping_email,
            contact: shipping.shipping_phone,
          },

          // Payment modal theme
          theme: {
            color: 'var(--green)',
          },
        };

        // Open Razorpay payment modal
        const razorpayInstance = new (window as any).Razorpay(options);
        razorpayInstance.open();
      };

      document.body.appendChild(script);
    } catch (error: any) {
      setPaymentError(error.response?.data?.error || 'Failed to create order. Please try again.');
      setProcessing(false);
    }
  }

  // ── RENDER CHECKOUT PAGE ────────────────────────────────────────────────
  return (
    <div className="page-container" style={{ maxWidth: 900, paddingTop: 32 }}>
      <h1 style={{ marginBottom: 32 }}>Checkout</h1>

      {/* Error message */}
      {paymentError && <div className="alert alert-error">{paymentError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        
        {/* ── LEFT COLUMN: SHIPPING FORM ── */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 20 }}>Shipping Address</h2>

          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="shipping_name">Full Name</label>
            <input
              id="shipping_name"
              type="text"
              name="shipping_name"
              value={shipping.shipping_name}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="shipping_email">Email</label>
            <input
              id="shipping_email"
              type="email"
              name="shipping_email"
              value={shipping.shipping_email}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="shipping_phone">Phone Number</label>
            <input
              id="shipping_phone"
              type="tel"
              name="shipping_phone"
              placeholder="10-digit mobile number"
              value={shipping.shipping_phone}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Address */}
          <div className="form-group">
            <label htmlFor="shipping_address">Street Address</label>
            <textarea
              id="shipping_address"
              name="shipping_address"
              placeholder="House No., Building Name, Street"
              rows={3}
              value={shipping.shipping_address}
              onChange={handleInputChange}
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* City */}
          <div className="form-group">
            <label htmlFor="shipping_city">City</label>
            <input
              id="shipping_city"
              type="text"
              name="shipping_city"
              value={shipping.shipping_city}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Postal Code */}
          <div className="form-group">
            <label htmlFor="shipping_postal_code">Postal Code</label>
            <input
              id="shipping_postal_code"
              type="text"
              name="shipping_postal_code"
              placeholder="6-digit PIN code"
              value={shipping.shipping_postal_code}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        {/* ── RIGHT COLUMN: ORDER SUMMARY ── */}
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 20 }}>Order Summary</h2>

            {/* Loading cart */}
            {loadingCart ? (
              <p>Loading cart...</p>
            ) : (
              <>
                {/* Cart items list */}
                <div style={{ marginBottom: 20 }}>
                  {cartItems.map(item => {
                    const originalPrice = parseFloat(item.price || '0');
                    const discount = item.discount_percentage || 0;
                    const discountedPrice = discount > 0
                      ? originalPrice - (originalPrice * discount / 100)
                      : originalPrice;
                    
                    return (
                      <div
                        key={item.product_id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '12px 0',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                          <div style={{ fontSize: 13, color: 'var(--gray-600)', display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span>₹{discountedPrice.toFixed(2)}</span>
                            {discount > 0 && (
                              <>
                                <span style={{ textDecoration: 'line-through' }}>₹{originalPrice.toFixed(2)}</span>
                                <span style={{ background: '#dc2626', color: '#fff', padding: '2px 6px', borderRadius: 2, fontSize: 11, fontWeight: 700 }}>
                                  -{discount}%
                                </span>
                              </>
                            )}
                            <span>× {item.quantity}</span>
                          </div>
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          ₹{(discountedPrice * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, marginBottom: 12 }} />

                {/* Total */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 20,
                  }}
                >
                  <span>Total Amount:</span>
                  <span style={{ color: 'var(--green-dark)' }}>₹{cartTotal.toFixed(2)}</span>
                </div>

                {/* Pay button */}
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 600 }}
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Proceed to Payment'}
                </button>

                {/* Security info */}
                <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 6 }}>
                  <div style={{ fontSize: 13, color: 'var(--green-dark)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>🔒</span>
                    <span>Secured by Razorpay. Your card details are safe.</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
