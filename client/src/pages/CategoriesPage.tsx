import { useEffect, useState } from 'react';
import api from '../api/axios';
import ProductCard, { Product } from '../components/ProductCard';

// ── CATEGORY DATA STRUCTURE ─────────────────────────────────────────────────
// Represents a product category (e.g., "Dairy", "Vegetables")
interface Category {
  id: string;   // Unique category identifier
  name: string; // Display name of category
}

// ── CATEGORIES PAGE COMPONENT ───────────────────────────────────────────────
// Shows all product categories as clickable buttons
// When user clicks a category, fetches and displays products in that category
// Clicking same category again deselects it and clears products

export default function CategoriesPage() {
  // ── STATE FOR CATEGORIES ────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);  // All available categories
  const [loadingCats, setLoadingCats] = useState(true);          // Loading categories from API

  // ── STATE FOR PRODUCTS ──────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);  // Which category is selected (null if none)
  const [products, setProducts] = useState<Product[]>([]);            // Products in selected category
  const [loadingProds, setLoadingProds] = useState(false);            // Loading products from API

  // ── FETCH ALL CATEGORIES ON PAGE LOAD ───────────────────────────────────
  // Get list of all available categories (Dairy, Vegetables, etc.)
  useEffect(() => {
    api
      .get('/api/categories')  // GET /api/categories → returns Category[]
      .then((res) => setCategories(res.data))
      .catch(() => {})  // If fails, categories stay empty
      .finally(() => setLoadingCats(false));  // Stop loading spinner
  }, []);

  // ── HANDLE CATEGORY CLICK ───────────────────────────────────────────────
  // When user clicks a category:
  // 1. If already selected → deselect and clear products
  // 2. If new category → fetch and show products in that category
  function handleCategoryClick(id: string) {
    if (selectedId === id) {
      // ── DESELECT CATEGORY ──
      setSelectedId(null);
      setProducts([]);
      return;
    }

    // ── SELECT NEW CATEGORY & FETCH PRODUCTS ──
    setSelectedId(id);
    setLoadingProds(true);

    // GET /api/products?category=id → filter products by category
    api
      .get('/api/products', { params: { category: id } })
      .then((res) => {
        // Transform snake_case from server to camelCase for client
        // Server returns: stock_status, category_id, image_urls, quantity_available
        // Client expects: stockStatus, categoryId, imageUrls, quantityAvailable
        const transformed = res.data.map((p: Record<string, unknown>) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          stockStatus: p.stock_status,      // "In Stock" | "Out of Stock"
          categoryId: p.category_id,        // Category ID
          imageUrls: p.image_urls,          // Product images
          quantityAvailable: p.quantity_available,  // How many in stock
        }));
        setProducts(transformed);
      })
      .catch(() => setProducts([]))  // If fails, show "no products"
      .finally(() => setLoadingProds(false));  // Stop loading spinner
  }

  // ── RENDER PAGE ─────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <h1 style={{ marginBottom: 8 }}>Categories</h1>
      <p style={{ color: 'var(--gray-600)', marginTop: 0 }}>
        Select a category to browse products
      </p>

      {/* Show loading message while fetching categories */}
      {loadingCats ? (
        <p>Loading categories...</p>
      ) : (
        <div className="flex flex-wrap gap-8" style={{ gap: 10, marginBottom: 28 }}>
          {/* Category buttons — user clicks to select and view products */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              style={{
                padding: '8px 18px',
                borderRadius: 20,  // Rounded pill-shaped button
                border: '2px solid',
                // Green border if selected, gray if not
                borderColor: selectedId === cat.id ? 'var(--green)' : 'var(--gray-200)',
                // Light green background if selected, white if not
                background: selectedId === cat.id ? 'var(--green-pale)' : '#fff',
                // Dark green text if selected, gray if not
                color: selectedId === cat.id ? 'var(--green-dark)' : 'var(--gray-800)',
                // Bold text if selected
                fontWeight: selectedId === cat.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Show products when a category is selected */}
      {selectedId && (
        <>
          {loadingProds ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-muted">No products found in this category.</p>
          ) : (
            <div className="product-grid">
              {/* Display products grid */}
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
