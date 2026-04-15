import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard, { Product } from '../components/ProductCard';

// ── PRODUCTS PAGE COMPONENT ─────────────────────────────────────────────────
// Displays all available products with search functionality
// Users can search by product name or description, results update URL param
// Each product shown as a ProductCard component (with add to cart button)

export default function ProductsPage() {
  // ── STATE VARIABLES ─────────────────────────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();  // Get/set URL query params (?search=...)
  
  // Search input field value (users type here)
  const [inputValue, setInputValue] = useState(searchParams.get('search') ?? '');
  
  // List of products to display (after filtering by search)
  const [products, setProducts] = useState<Product[]>([]);
  
  // Loading state (show spinner while fetching from server)
  const [loading, setLoading] = useState(true);

  // ── FETCH PRODUCTS FROM SERVER ──────────────────────────────────────────
  // Gets all products, optionally filtered by search term
  // useCallback prevents infinite render loops by memoizing function reference
  const fetchProducts = useCallback((search: string) => {
    setLoading(true);
    
    // Call backend API: GET /api/products?search=...
    api
      .get('/api/products', { params: search ? { search } : {} })
      .then((res) => {
        // Transform snake_case API data to camelCase for JavaScript convention
        // Server returns: stock_status, category_id, image_urls, quantity_available
        // Client expects: stockStatus, categoryId, imageUrls, quantityAvailable
        const transformed = res.data.map((p: Record<string, unknown>) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          stockStatus: p.stock_status,                  // "In Stock" | "Out of Stock"
          categoryId: p.category_id,                    // Category ID (for filtering)
          imageUrls: p.image_urls,                      // Array of image URLs
          quantityAvailable: p.quantity_available,      // How many in stock
          discount_percentage: p.discount_percentage,    // Discount percentage (if any)
        }));
        setProducts(transformed);
      })
      .catch(() => setProducts([]))  // If API fails, show empty list
      .finally(() => setLoading(false));  // Hide loading spinner
  }, []);

  // ── DEBOUNCED SEARCH TEXT INPUT ─────────────────────────────────────────
  // User types in search box → wait 300ms → update URL query param
  // This prevents too many API calls while user is still typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = inputValue.trim();
      // Update URL: /products?search=coffee or /products (no param if empty)
      setSearchParams(trimmed ? { search: trimmed } : {}, { replace: true });
    }, 300);
    
    // Cleanup: clear timeout if user types again before 300ms passes
    return () => clearTimeout(timer);
  }, [inputValue, setSearchParams]);

  // ── FETCH WHEN SEARCH PARAM CHANGES ─────────────────────────────────────
  // When URL query param changes (from search input above), fetch products
  // This separates search logic: input → URL param → API call
  useEffect(() => {
    fetchProducts(searchParams.get('search') ?? '');
  }, [searchParams, fetchProducts]);

  // ── RENDER PRODUCTS PAGE ────────────────────────────────────────────────
  return (
    <div className="page-container">
      <h1 style={{ marginBottom: 16 }}>Products</h1>

      {/* Search input box */}
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

      {/* Show loading message while fetching */}
      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-muted">No products found.</p>
      ) : (
        <div className="product-grid">
          {/* Each card has add-to-cart button */}
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
