import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import type { User } from '../contexts/AuthContext';

// Suppress the alert call made by AdminLayout on access denied
beforeEach(() => {
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

interface RenderOptions {
  user?: User | null;
}

function renderAdminLayout({ user = null }: RenderOptions = {}) {
  const login = vi.fn();
  const logout = vi.fn();
  const setCartCount = vi.fn();

  render(
    <MemoryRouter initialEntries={['/admin']}>
      <AuthContext.Provider value={{ user, cartCount: 0, isLoading: false, login, logout, setCartCount }}>
        <Routes>
          <Route path="/" element={<div data-testid="home-page">Home</div>} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<div data-testid="admin-content">Admin Content</div>} />
          </Route>
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('AdminLayout', () => {
  it('renders Outlet content when user is admin', () => {
    const admin: User = { id: '1', email: 'admin@example.com', displayName: 'Admin', role: 'admin' };
    renderAdminLayout({ user: admin });

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
  });

  it("redirects to / when user is not admin (role = 'user')", () => {
    const regularUser: User = { id: '2', email: 'user@example.com', displayName: 'Bob', role: 'user' };
    renderAdminLayout({ user: regularUser });

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('redirects to / when user is null (not logged in)', () => {
    renderAdminLayout({ user: null });

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });
});
