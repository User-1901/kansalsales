import { useState, useEffect, FormEvent } from 'react';
import api from '../api/axios';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface Category { id: string; name: string; }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirm, setConfirm] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({
    isOpen: false, message: '', onConfirm: () => {},
  });

  async function fetchCategories() {
    try { const r = await api.get('/api/categories'); setCategories(r.data); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchCategories(); }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try { await api.post('/api/categories', { name: newName.trim() }); setNewName(''); await fetchCategories(); }
    catch { /* ignore */ }
    finally { setAdding(false); }
  }

  function startRename(cat: Category) {
    setRenamingId(cat.id);
    setRenameValue(cat.name);
  }

  function cancelRename() { setRenamingId(null); setRenameValue(''); }

  function submitRename(cat: Category) {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === cat.name) { cancelRename(); return; }
    setConfirm({
      isOpen: true,
      message: `Rename "${cat.name}" to "${trimmed}"?`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, isOpen: false }));
        try { await api.put(`/api/categories/${cat.id}`, { name: trimmed }); await fetchCategories(); }
        catch { /* ignore */ }
        cancelRename();
      },
    });
  }

  function handleDelete(cat: Category) {
    setConfirm({
      isOpen: true,
      message: `Delete category "${cat.name}"? Products in this category will become uncategorised.`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, isOpen: false }));
        try { await api.delete(`/api/categories/${cat.id}`); await fetchCategories(); }
        catch { /* ignore */ }
      },
    });
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Categories</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</p>
      </div>

      {/* Add category */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Add New Category</h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Category name (e.g. Dairy, Grains…)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
            style={{
              flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0',
              borderRadius: 8, fontSize: 14, outline: 'none', color: '#0f172a',
            }}
            onFocus={e => (e.target.style.borderColor = '#16a34a')}
            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
          />
          <button type="submit" disabled={adding || !newName.trim()} style={{
            padding: '10px 20px', background: '#16a34a', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14,
            cursor: adding || !newName.trim() ? 'not-allowed' : 'pointer',
            opacity: adding || !newName.trim() ? 0.6 : 1,
          }}>
            {adding ? 'Adding…' : '+ Add'}
          </button>
        </form>
      </div>

      {/* Categories list */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
            <p style={{ margin: 0, fontSize: 15 }}>No categories yet. Add one above.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td>
                    {renamingId === cat.id ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="text"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') submitRename(cat); if (e.key === 'Escape') cancelRename(); }}
                          style={{
                            padding: '6px 10px', border: '1.5px solid #16a34a',
                            borderRadius: 6, fontSize: 14, outline: 'none', width: 200,
                          }}
                        />
                        <button onClick={() => submitRename(cat)} style={{
                          padding: '5px 12px', background: '#16a34a', color: '#fff',
                          border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}>Save</button>
                        <button onClick={cancelRename} style={{
                          padding: '5px 10px', background: '#f1f5f9', color: '#475569',
                          border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                        }}>Cancel</button>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>🏷️ {cat.name}</span>
                    )}
                  </td>
                  <td>
                    {renamingId !== cat.id && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => startRename(cat)} style={{
                          padding: '5px 12px', background: '#f1f5f9', color: '#334155',
                          border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}>Rename</button>
                        <button onClick={() => handleDelete(cat)} style={{
                          padding: '5px 12px', background: '#fef2f2', color: '#dc2626',
                          border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
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
