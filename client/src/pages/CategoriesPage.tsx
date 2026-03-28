import { useEffect, useState } from 'react';
import api from '../api/axios';
import ProductCard, { Product } from '../components/ProductCard';

interface Category {
  id: string;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProds, setLoadingProds] = useState(false);

  useEffect(() => {
    api
      .get('/api/categories')
      .then((res) => setCategories(res.data))
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  function handleCategoryClick(id: string) {
    if (selectedId === id) {
      setSelectedId(null);
      setProducts([]);
      return;
    }
    setSelectedId(id);
    setLoadingProds(true);
    api
      .get('/api/products', { params: { category: id } })
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProds(false));
  }

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: 8 }}>Categories</h1>
      <p style={{ color: 'var(--gray-600)', marginTop: 0 }}>
        Select a category to browse products
      </p>

      {loadingCats ? (
        <p>Loading categories...</p>
      ) : (
        <div className="flex flex-wrap gap-8" style={{ gap: 10, marginBottom: 28 }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              style={{
                padding: '8px 18px',
                borderRadius: 20,
                border: '2px solid',
                borderColor: selectedId === cat.id ? 'var(--green)' : 'var(--gray-200)',
                background: selectedId === cat.id ? 'var(--green-pale)' : '#fff',
                color: selectedId === cat.id ? 'var(--green-dark)' : 'var(--gray-800)',
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

      {selectedId && (
        <>
          {loadingProds ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-muted">No products found in this category.</p>
          ) : (
            <div className="product-grid">
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
