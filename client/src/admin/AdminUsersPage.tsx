import { useState, useEffect, FormEvent } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  email_verified: boolean;
  created_at: string;
}

interface FieldErrors { email?: string; displayName?: string; password?: string; }

const EMPTY = { email: '', displayName: '', password: '' };

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirm, setConfirm] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({
    isOpen: false, message: '', onConfirm: () => {},
  });

  async function fetchAdmins() {
    try {
      const r = await api.get('/api/admins');
      setAdmins(r.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAdmins(); }, []);

  function set(field: keyof typeof EMPTY) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError('');
    setSaving(true);
    try {
      await api.post('/api/admins', {
        email: form.email,
        displayName: form.displayName,
        password: form.password,
      });
      setForm(EMPTY);
      setShowForm(false);
      await fetchAdmins();
    } catch (err: unknown) {
      const res = (err as { response?: { status?: number; data?: { error?: string; errors?: FieldErrors } } })?.response;
      if (res?.status === 409) setGlobalError('An account with this email already exists.');
      else if (res?.data?.errors) setFieldErrors(res.data.errors);
      else setGlobalError(res?.data?.error ?? 'Failed to create admin.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(admin: AdminUser) {
    setConfirm({
      isOpen: true,
      message: `Remove admin access for "${admin.display_name}" (${admin.email})? This will delete their account.`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, isOpen: false }));
        try {
          await api.delete(`/api/admins/${admin.id}`);
          await fetchAdmins();
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to remove admin.';
          setGlobalError(msg);
        }
      },
    });
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Admin Accounts</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Manage who has admin access to this panel
          </p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setForm(EMPTY); setFieldErrors({}); setGlobalError(''); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          {showForm ? '✕ Cancel' : '+ Add Admin'}
        </button>
      </div>

      {globalError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          {globalError}
        </div>
      )}

      {/* Add admin form */}
      {showForm && (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: '24px 28px', marginBottom: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: '#0f172a' }}>New Admin Account</h2>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label htmlFor="a-name">Display Name *</label>
                <input id="a-name" type="text" value={form.displayName} onChange={set('displayName')} required placeholder="e.g. Raju Admin" />
                {fieldErrors.displayName && <span className="form-error">{fieldErrors.displayName}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="a-email">Email Address *</label>
                <input id="a-email" type="email" value={form.email} onChange={set('email')} required placeholder="admin@example.com" />
                {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
              </div>
            </div>
            <div className="form-group" style={{ maxWidth: 360 }}>
              <label htmlFor="a-pass">Password * <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>(min 8 characters)</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  id="a-pass"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  required
                  placeholder="Strong password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" disabled={saving} style={{
                padding: '10px 22px', background: '#2563eb', color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Creating…' : 'Create Admin'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Created</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#dbeafe', color: '#1d4ed8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14, flexShrink: 0,
                      }}>
                        {admin.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                          {admin.display_name}
                          {admin.id === currentUser?.id && (
                            <span style={{ marginLeft: 8, fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#475569', fontSize: 14 }}>{admin.email}</td>
                  <td style={{ color: '#94a3b8', fontSize: 13 }}>
                    {new Date(admin.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    {admin.id !== currentUser?.id ? (
                      <button
                        onClick={() => handleDelete(admin)}
                        style={{
                          padding: '5px 12px', background: '#fef2f2', color: '#dc2626',
                          border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
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
