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
      .then((res) => setProducts(res.data))
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
