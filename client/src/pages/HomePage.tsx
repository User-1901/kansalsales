import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard, { Product } from '../components/ProductCard';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/products')
      .then((res) => setProducts(res.data.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--green-dark) 0%, var(--green-light) 100%)',
          color: '#fff',
          padding: '72px 24px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: '0 0 12px', fontSize: 40, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Welcome to Kansal Sales
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: 18, opacity: 0.9 }}>
          Fresh groceries &amp; dairy products delivered to your door
        </p>
        <Link
          to="/products"
          style={{
            background: '#fff',
            color: 'var(--green-dark)',
            padding: '12px 28px',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            fontSize: 15,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Shop Now
        </Link>
      </section>

      {/* Featured Products */}
      <div className="page-container">
        <h2 style={{ marginBottom: 4 }}>Featured Products</h2>
        <p style={{ color: 'var(--gray-600)', marginTop: 0 }}>
          A selection of our freshest items
        </p>

        {loading ? (
          <p>Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-muted">No products available right now.</p>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {!loading && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link to="/products" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              View All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
