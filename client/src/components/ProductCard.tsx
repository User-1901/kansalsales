import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// ── PRODUCT DATA STRUCTURE ──────────────────────────────────────────────────
// Represents a single product that can be displayed and added to cart
export interface Product {
  id: string;                           // Unique product identifier
  name: string;                         // Product name (e.g., "Amul Milk")
  description?: string;                 // Detailed product description
  price: string;                        // Price as string (e.g., "45.50")
  stockStatus: 'in_stock' | 'out_of_stock';  // Current availability status
  categoryId?: string | null;           // Which category this product belongs to
  imageUrls?: string[];                 // Array of product images (URLs)
  quantityAvailable?: number;           // How many units in stock
  discount_percentage?: number;         // Discount percentage (if any)
}

interface Props {
  product: Product;
}

// ── PRODUCT CARD COMPONENT ──────────────────────────────────────────────────
// Reusable card showing a single product with image, name, price, stock status
// Clicking on product navigates to detail page (/products/:id)
// Clicking "Add to Cart" shows quantity selector then adds to user/guest cart

export default function ProductCard({ product }: Props) {
  // ── ROUTING & AUTHENTICATION CONTEXT ────────────────────────────────────
  const navigate = useNavigate();                         // Router navigation
  const { user, cartCount, setCartCount } = useAuth();   // Current user & cart info

  // ── QUANTITY SELECTOR STATE ─────────────────────────────────────────────
  // Initially hidden, shows when user clicks "Add to Cart"
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);  // Show/hide counter
  const [selectedQuantity, setSelectedQuantity] = useState(1);  // How many to add (1-max available)

  // ── SHOW/HIDE QUANTITY SELECTOR UI ──────────────────────────────────────
  function openQuantitySelector() {
    setShowQuantitySelector(true);
    setSelectedQuantity(1);  // Reset to 1 when opening
  }

  function closeQuantitySelector() {
    setShowQuantitySelector(false);
    setSelectedQuantity(1);  // Reset to 1 when closing without adding
  }

  // ── QUANTITY BUTTONS (+/-) ──────────────────────────────────────────────
  // Increase quantity (max = quantityAvailable)
  function increaseQuantity() {
    const maxAvailable = product.quantityAvailable || 1;
    if (selectedQuantity < maxAvailable) {
      setSelectedQuantity(selectedQuantity + 1);
    }
  }

  // Decrease quantity (min = 1)
  function decreaseQuantity() {
    if (selectedQuantity > 1) {
      setSelectedQuantity(selectedQuantity - 1);
    }
  }

  // ── ADD TO CART HANDLER ─────────────────────────────────────────────────
  // Branches based on whether user is logged in or guest
  async function handleAddToCart() {
    if (user) {
      // ── LOGGED-IN USER: Save to database via API ──
      try {
        // POST to backend: add selected quantity to user's cart
        await api.post('/api/cart/items', { productId: product.id, quantity: selectedQuantity });
        // Update cart count in header/navbar
        setCartCount(cartCount + selectedQuantity);
      } catch {
        // If API call fails, don't show error (could add toast notification later)
      }
    } else {
      // ── GUEST USER: Save to browser sessionStorage ──
      // Get existing guest cart from sessionStorage (or empty array if none)
      const raw = sessionStorage.getItem('guestCart');
      const cart: Array<{ productId: string; name: string; price: string; quantity: number }> =
        raw ? JSON.parse(raw) : [];
      
      // Check if product already in cart
      const existing = cart.find((i) => i.productId === product.id);
      
      if (existing) {
        // Product exists: increase quantity
        existing.quantity += selectedQuantity;
      } else {
        // New product: add to cart with initial quantity
        cart.push({ productId: product.id, name: product.name, price: product.price, quantity: selectedQuantity });
      }
      
      // Save updated cart back to sessionStorage
      sessionStorage.setItem('guestCart', JSON.stringify(cart));
      // Update cart count in header
      setCartCount(cartCount + selectedQuantity);
    }
    
    // Hide quantity selector after adding
    closeQuantitySelector();
  }

  // ── DISPLAY STATE ───────────────────────────────────────────────────────
  const inStock = product.stockStatus === 'in_stock';

  // ── RENDER PRODUCT CARD ─────────────────────────────────────────────────
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Product image — click to go to detail page */}
      <div 
        onClick={() => navigate(`/products/${product.id}`)}
        style={{ cursor: 'pointer' }}
      >
        {product.imageUrls && product.imageUrls.length > 0 && (
          <img
            src={product.imageUrls[0]}
            alt={product.name}
            style={{ width: '100%', height: 160, objectFit: 'cover' }}
          />
        )}
      </div>

      {/* Product info section */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        
        {/* Product name — click to go to detail page */}
        <div 
          onClick={() => navigate(`/products/${product.id}`)}
          style={{ fontWeight: 600, fontSize: 15, cursor: 'pointer', color: '#0f172a' }}
        >
          {product.name}
        </div>

        {/* Product price — formatted with currency symbol and 2 decimals */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color: 'var(--green-dark)', fontWeight: 700, fontSize: 16 }}>
            ₹{product.discount_percentage && product.discount_percentage > 0
              ? (parseFloat(product.price) - (parseFloat(product.price) * product.discount_percentage / 100)).toFixed(2)
              : parseFloat(product.price).toFixed(2)}
          </div>
          {product.discount_percentage && product.discount_percentage > 0 && (
            <>
              <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: 13 }}>
                ₹{parseFloat(product.price).toFixed(2)}
              </span>
              <span style={{ background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                -{product.discount_percentage}%
              </span>
            </>
          )}
        </div>

        {/* Stock status badge — green="In Stock" / red="Out of Stock" */}
        <span className={`badge ${inStock ? 'badge-green' : 'badge-red'}`}>
          {inStock ? 'In Stock' : 'Out of Stock'}
        </span>

        {/* ── CART ACTION BUTTONS ── */}
        
        {!showQuantitySelector ? (
          // ── INITIAL STATE: "Add to Cart" button ──
          <button
            className="btn btn-primary"
            style={{ marginTop: 'auto', paddingTop: 8, paddingBottom: 8 }}
            onClick={openQuantitySelector}
            disabled={!inStock}  // Disable button if product is out of stock
          >
            Add to Cart
          </button>
        ) : (
          // ── QUANTITY SELECTOR STATE: Counter + Add/Cancel buttons ──
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            
            {/* Quantity selector UI */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '8px',
                background: '#f1f5f9',
                borderRadius: 6,
              }}
            >
              {/* Minus button */}
              <button
                onClick={decreaseQuantity}
                disabled={selectedQuantity <= 1}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#334155',
                  cursor: selectedQuantity <= 1 ? 'not-allowed' : 'pointer',
                  opacity: selectedQuantity <= 1 ? 0.5 : 1,
                }}
              >
                −
              </button>

              {/* Current quantity display */}
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  minWidth: 30,
                  textAlign: 'center',
                  color: '#0f172a',
                }}
              >
                {selectedQuantity}
              </span>

              {/* Plus button */}
              <button
                onClick={increaseQuantity}
                disabled={selectedQuantity >= (product.quantityAvailable || 1)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#334155',
                  cursor: selectedQuantity >= (product.quantityAvailable || 1) ? 'not-allowed' : 'pointer',
                  opacity: selectedQuantity >= (product.quantityAvailable || 1) ? 0.5 : 1,
                }}
              >
                +
              </button>
            </div>

            {/* Action buttons: Confirm Add or Cancel */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-primary"
                onClick={handleAddToCart}
                style={{ flex: 1, paddingTop: 8, paddingBottom: 8, fontSize: 14 }}
              >
                Add {selectedQuantity} to Cart
              </button>
              <button
                onClick={closeQuantitySelector}
                style={{
                  padding: '8px 12px',
                  background: '#e2e8f0',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
