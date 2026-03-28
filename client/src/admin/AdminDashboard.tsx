import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function AdminDashboard() {
  const [productCount, setProductCount] = useState<number | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);

  useEffect(() => {
    api.get('/api/products').then(r => setProductCount(r.data.length)).catch(() => {});
    api.get('/api/categories').then(r => setCategoryCount(r.data.length)).catch(() => {});
  }, []);

  const stats = [
    { label: 'Total Products', value: productCount, icon: '📦', link: '/admin/products', color: '#2563eb' },
    { label: 'Categories', value: categoryCount, icon: '🏷️', link: '/admin/categories', color: '#7c3aed' },
  ];

  return (
    <div>
      <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, color: '#0f172a' }}>Dashboard</h1>
      <p style={{ margin: '0 0 32px', color: '#64748b', fontSize: 15 }}>Welcome back. Here's an overview of your store.</p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
        {stats.map(s => (
          <Link key={s.label} to={s.link} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: '24px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'box-shadow 0.15s, transform 0.15s',
              cursor: 'pointer',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {s.value === null ? '—' : s.value}
              </div>
              <div style={{ fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Quick Actions</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/admin/products" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', background: '#2563eb', color: '#fff',
          borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none',
        }}>
          📦 Manage Products
        </Link>
        <Link to="/admin/categories" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', background: '#7c3aed', color: '#fff',
          borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none',
        }}>
          🏷️ Manage Categories
        </Link>
        <a href="/" target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', background: '#f1f5f9', color: '#334155',
          border: '1px solid #e2e8f0',
          borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none',
        }}>
          🌐 View Store ↗
        </a>
      </div>
    </div>
  );
}
