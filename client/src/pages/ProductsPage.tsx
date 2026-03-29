import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard, { Product } from '../components/ProductCard';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get('search') ?? '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback((search: string) => {
    setLoading(true);
    api
      .get('/api/products', { params: search ? { search } : {} })
      .then((res) => {
        // Transform snake_case from server to camelCase for client
        const transformed = res.data.map((p: Record<string, unknown>) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          stockStatus: p.stock_status,
          categoryId: p.category_id,
          imageUrls: p.image_urls,
          quantityAvailable: p.quantity_available,
        }));
        setProducts(transformed);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // Debounce search input → update URL param
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = inputValue.trim();
      setSearchParams(trimmed ? { search: trimmed } : {}, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, setSearchParams]);

  // Fetch when URL param changes
  useEffect(() => {
    fetchProducts(searchParams.get('search') ?? '');
  }, [searchParams, fetchProducts]);

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: 16 }}>Products</h1>

      <div className="form-group" style={{ maxWidth: 400, marginBottom: 8 }}>
        <label htmlFor="product-search">Search products</label>
        <input
          id="product-search"
          type="search"
          placeholder="Search by name or description…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-muted">No products found.</p>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
