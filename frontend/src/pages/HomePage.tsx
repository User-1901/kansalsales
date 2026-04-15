import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard, { Product } from '../components/ProductCard';

// ── HOME PAGE COMPONENT ─────────────────────────────────────────────────────
// Main landing page showing:
// - Welcome banner/hero section
// - Featured products (top 6 products)
// - "Shop Now" button to browse all products
export default function HomePage() {
  // STATE VARIABLES
  const [products, setProducts] = useState<Product[]>([]);    // Featured products to display
  const [loading, setLoading] = useState(true);               // Show loading state while fetching

  // ── LOAD FEATURED PRODUCTS ON PAGE MOUNT ────────────────────────────────
  // Fetches products from API and shows first 6 as "Featured Products"
  useEffect(() => {
    api
      .get('/api/products')  // API Call: Get all products
      .then((res) => {
        // Transform API response from snake_case to camelCase (matching the Product interface)
        const transformed = res.data.map((p: Record<string, unknown>) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          stockStatus: p.stock_status,           // Convert snake_case to camelCase
          categoryId: p.category_id,
          imageUrls: p.image_urls,
          quantityAvailable: p.quantity_available,
          discount_percentage: p.discount_percentage,   // Include discount percentage
        }));
        // Only show first 6 products as "Featured"
        setProducts(transformed.slice(0, 6));
      })
      .catch(() => {}) // Silently fail if API error
      .finally(() => setLoading(false));  // Stop loading spinner
  }, []);

  return (
    <div>
      {/* HERO SECTION - Welcome banner with green gradient background */}
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
        {/* "Shop Now" button that navigates to products page */}
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

      {/* FEATURED PRODUCTS SECTION */}
      <div className="page-container">
        <h2 style={{ marginBottom: 4 }}>Featured Products</h2>
        <p style={{ color: 'var(--gray-600)', marginTop: 0 }}>
          A selection of our freshest items
        </p>

        {/* Show loading message while fetching products */}
        {loading ? (
          <p>Loading...</p>
        ) : products.length === 0 ? (
          /* Show message if no products available */
          <p className="text-muted">No products available right now.</p>
        ) : (
          /* Display products in a grid layout */
          <div className="product-grid">
            {/* Each card is clickable and shows product details */}
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* "View All Products" button - shown when not loading */}
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
