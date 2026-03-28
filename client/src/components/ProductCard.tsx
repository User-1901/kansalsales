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
}

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { user, cartCount, setCartCount } = useAuth();

  async function handleAddToCart() {
    if (user) {
      try {
        await api.post('/api/cart/items', { productId: product.id, quantity: 1 });
        setCartCount(cartCount + 1);
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
        existing.quantity += 1;
      } else {
        cart.push({ productId: product.id, name: product.name, price: product.price, quantity: 1 });
      }
      sessionStorage.setItem('guestCart', JSON.stringify(cart));
      setCartCount(cartCount + 1);
    }
  }

  const inStock = product.stockStatus === 'in_stock';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      {product.imageUrls && product.imageUrls.length > 0 && (
        <img
          src={product.imageUrls[0]}
          alt={product.name}
          style={{ width: '100%', height: 160, objectFit: 'cover' }}
        />
      )}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{product.name}</div>
        <div style={{ color: 'var(--green-dark)', fontWeight: 700, fontSize: 16 }}>
          ${parseFloat(product.price).toFixed(2)}
        </div>
        <span className={`badge ${inStock ? 'badge-green' : 'badge-red'}`}>
          {inStock ? 'In Stock' : 'Out of Stock'}
        </span>
        <button
          className="btn btn-primary"
          style={{ marginTop: 'auto', paddingTop: 8, paddingBottom: 8 }}
          onClick={handleAddToCart}
          disabled={!inStock}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
