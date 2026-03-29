import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  stockStatus: 'in_stock' | 'out_of_stock';
  categoryId?: string | null;
  imageUrls?: string[];
  quantityAvailable?: number;
}

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const navigate = useNavigate();
  const { user, cartCount, setCartCount } = useAuth();
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  function openQuantitySelector() {
    setShowQuantitySelector(true);
    setSelectedQuantity(1);
  }

  function closeQuantitySelector() {
    setShowQuantitySelector(false);
    setSelectedQuantity(1);
  }

  function increaseQuantity() {
    const maxAvailable = product.quantityAvailable || 1;
    if (selectedQuantity < maxAvailable) {
      setSelectedQuantity(selectedQuantity + 1);
    }
  }

  function decreaseQuantity() {
    if (selectedQuantity > 1) {
      setSelectedQuantity(selectedQuantity - 1);
    }
  }

  async function handleAddToCart() {
    if (user) {
      try {
        await api.post('/api/cart/items', { productId: product.id, quantity: selectedQuantity });
        setCartCount(cartCount + selectedQuantity);
      } catch {
        // silently fail — could show a toast in a future iteration
      }
    } else {
      // Guest: store in sessionStorage
      const raw = sessionStorage.getItem('guestCart');
      const cart: Array<{ productId: string; name: string; price: string; quantity: number }> =
        raw ? JSON.parse(raw) : [];
      const existing = cart.find((i) => i.productId === product.id);
      if (existing) {
        existing.quantity += selectedQuantity;
      } else {
        cart.push({ productId: product.id, name: product.name, price: product.price, quantity: selectedQuantity });
      }
      sessionStorage.setItem('guestCart', JSON.stringify(cart));
      setCartCount(cartCount + selectedQuantity);
    }
    closeQuantitySelector();
  }

  const inStock = product.stockStatus === 'in_stock';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
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
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div 
          onClick={() => navigate(`/products/${product.id}`)}
          style={{ fontWeight: 600, fontSize: 15, cursor: 'pointer', color: '#0f172a' }}
        >
          {product.name}
        </div>
        <div style={{ color: 'var(--green-dark)', fontWeight: 700, fontSize: 16 }}>
          ₹{parseFloat(product.price).toFixed(2)}
        </div>
        <span className={`badge ${inStock ? 'badge-green' : 'badge-red'}`}>
          {inStock ? 'In Stock' : 'Out of Stock'}
        </span>

        {!showQuantitySelector ? (
          <button
            className="btn btn-primary"
            style={{ marginTop: 'auto', paddingTop: 8, paddingBottom: 8 }}
            onClick={openQuantitySelector}
            disabled={!inStock}
          >
            Add to Cart
          </button>
        ) : (
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Quantity Selector */}
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

            {/* Buttons */}
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
