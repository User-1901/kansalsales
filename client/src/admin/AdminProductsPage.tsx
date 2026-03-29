import { useState, useEffect, useRef, FormEvent } from 'react';
import api from '../api/axios';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface Category { id: string; name: string; }
interface Product {
  id: string; name: string; description: string;
  price: string; stock_status: string; category_id: string; image_urls: string[]; quantity_available?: number;
}

const EMPTY_FORM = { name: '', description: '', price: '', categoryId: '', stockStatus: 'in_stock', quantity: '0' };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Image state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // existing URLs when editing
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirm, setConfirm] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({
    isOpen: false, message: '', onConfirm: () => {},
  });

  async function fetchData() {
    try {
      const [p, c] = await Promise.all([api.get('/api/products'), api.get('/api/categories')]);
      setProducts(p.data);
      setCategories(c.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFiles([]);
    setImagePreviews([]);
    setError('');
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      categoryId: p.category_id || '',
      stockStatus: p.stock_status || 'in_stock',
      quantity: String(p.quantity_available || 0),
    });
    setImageFiles([]);
    setImagePreviews(p.image_urls); // show existing images
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFiles([]);
    setImagePreviews([]);
    setError('');
    setSuccess('');
  }

  function set(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setImageFiles(prev => [...prev, ...files]);
    // Generate local previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setImagePreviews(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  function removeImage(index: number) {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    // If it's a new file (index >= existing URLs count when editing), remove from files too
    const existingCount = editingId
      ? (products.find(p => p.id === editingId)?.image_urls.length ?? 0)
      : 0;
    if (index >= existingCount) {
      setImageFiles(prev => prev.filter((_, i) => i !== (index - existingCount)));
    }
  }

  async function uploadFiles(): Promise<string[]> {
    const urls: string[] = [];
    for (const file of imageFiles) {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      urls.push(res.data.url);
    }
    return urls;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.price) { setError('Name and price are required.'); return; }

    setSaving(true);
    setUploading(imageFiles.length > 0);
    setError('');
    setSuccess('');

    try {
      // Upload new files first
      const newUrls = imageFiles.length > 0 ? await uploadFiles() : [];
      setUploading(false);

      // Combine: existing previews that are real URLs (not blob/data) + new uploaded URLs
      const existingUrls = imagePreviews.filter(p => p.startsWith('http') || p.startsWith('/uploads'));
      const allImageUrls = [...existingUrls, ...newUrls];

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: form.price,
        category_id: form.categoryId || null,
        quantity_available: parseInt(form.quantity) || 0,
        stock_status: parseInt(form.quantity) === 0 ? 'out_of_stock' : 'in_stock',
        image_urls: allImageUrls,
      };

      if (editingId) {
        // Direct save without confirmation for better UX
        try {
          await api.put(`/api/products/${editingId}`, payload);
          setSuccess(`✅ "${form.name}" updated successfully!`);
          await fetchData();
          setTimeout(() => closeForm(), 1500);
        } catch (apiErr: unknown) {
          const errorMsg = apiErr instanceof Error ? apiErr.message : 'Failed to update product';
          setError(`Error: ${errorMsg}`);
        }
      } else {
        try {
          await api.post('/api/products', payload);
          setSuccess(`✅ "${form.name}" added successfully!`);
          await fetchData();
          setTimeout(() => closeForm(), 1500);
        } catch (apiErr: unknown) {
          const errorMsg = apiErr instanceof Error ? apiErr.message : 'Failed to add product';
          setError(`Error: ${errorMsg}`);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save product';
      setError(`Error: ${errorMsg}`);
      console.error(err);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  function handleDelete(p: Product) {
    setConfirm({
      isOpen: true,
      message: `Delete "${p.name}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, isOpen: false }));
        try { await api.delete(`/api/products/${p.id}`); await fetchData(); }
        catch { /* ignore */ }
      },
    });
  }

  const isBusy = saving || uploading;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Products</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            {products.length} product{products.length !== 1 ? 's' : ''} in catalog
          </p>
        </div>
        <button onClick={openAdd} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 18px', background: '#16a34a', color: '#fff',
          border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>
          + Add Product
        </button>
      </div>

      {/* Form panel */}
      {showForm && (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: '24px 28px', marginBottom: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              {editingId ? '✏️ Edit Product' : '➕ Add New Product'}
            </h2>
            <button onClick={closeForm} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label htmlFor="p-name">Product Name *</label>
                <input id="p-name" type="text" value={form.name} onChange={set('name')} required placeholder="e.g. Full Cream Milk" />
              </div>
              <div className="form-group">
                <label htmlFor="p-price">Price (₹) *</label>
                <input id="p-price" type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required placeholder="0.00" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="p-desc">Description</label>
              <textarea id="p-desc" rows={3} value={form.description} onChange={set('description')} placeholder="Short product description…" style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label htmlFor="p-cat">Category</label>
                <select id="p-cat" value={form.categoryId} onChange={set('categoryId')}>
                  <option value="">— No Category —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="p-qty">Quantity Available *</label>
                <input id="p-qty" type="number" min="0" value={form.quantity} onChange={set('quantity')} required placeholder="0" />
              </div>
            </div>

            {/* ── Image upload ── */}
            <div className="form-group">
              <label>Product Images</label>

              {/* Preview grid */}
              {imagePreviews.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                  {imagePreviews.map((src, i) => (
                    <div key={i} style={{ position: 'relative', width: 90, height: 90 }}>
                      <img
                        src={src}
                        alt=""
                        style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        style={{
                          position: 'absolute', top: -6, right: -6,
                          width: 22, height: 22, borderRadius: '50%',
                          background: '#dc2626', color: '#fff', border: 'none',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px',
                  background: '#f8fafc', color: '#334155',
                  border: '2px dashed #cbd5e1', borderRadius: 8,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#16a34a'; (e.currentTarget as HTMLButtonElement).style.color = '#16a34a'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#cbd5e1'; (e.currentTarget as HTMLButtonElement).style.color = '#334155'; }}
              >
                📁 Choose Images
              </button>
              <span style={{ marginLeft: 10, fontSize: 12, color: '#94a3b8' }}>
                JPG, PNG, WEBP, GIF — max 5MB each
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" disabled={isBusy} style={{
                padding: '10px 22px', background: '#16a34a', color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14,
                cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.7 : 1,
              }}>
                {uploading ? 'Uploading images…' : saving ? (editingId ? 'Saving changes…' : 'Adding…') : editingId ? '💾 Save Changes' : '➕ Add Product'}
              </button>
              <button type="button" onClick={closeForm} style={{
                padding: '10px 18px', background: '#f1f5f9', color: '#475569',
                border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <p style={{ margin: 0, fontSize: 15 }}>No products yet. Add your first product above.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty Available</th>
                <th>Category</th>
                <th>Status</th>
                <th style={{ width: 130 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const cat = categories.find(c => c.id === p.category_id);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {p.image_urls[0]
                          ? <img src={p.image_urls[0]} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                          : <div style={{ width: 44, height: 44, background: '#f1f5f9', borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
                        }
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{p.name}</div>
                          {p.description && (
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#15803d' }}>₹{parseFloat(p.price).toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: '#334155' }}>{p.quantity_available || 0}</td>
                    <td style={{ color: cat ? '#334155' : '#94a3b8', fontSize: 13 }}>{cat ? cat.name : 'None'}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: p.stock_status === 'in_stock' ? '#dcfce7' : '#fee2e2',
                        color: p.stock_status === 'in_stock' ? '#15803d' : '#b91c1c',
                      }}>
                        {p.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(p)} style={{
                          padding: '5px 12px', background: '#f1f5f9', color: '#334155',
                          border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}>Edit</button>
                        <button onClick={() => handleDelete(p)} style={{
                          padding: '5px 12px', background: '#fef2f2', color: '#dc2626',
                          border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmationDialog
        isOpen={confirm.isOpen}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(c => ({ ...c, isOpen: false }))}
      />
    </div>
  );
}
