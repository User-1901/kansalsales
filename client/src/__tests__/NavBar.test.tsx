import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import NavBar from '../components/NavBar';
import type { User } from '../contexts/AuthContext';

interface RenderOptions {
  user?: User | null;
  cartCount?: number;
}

function renderNavBar({ user = null, cartCount = 0 }: RenderOptions = {}) {
  const logout = vi.fn();
  const login = vi.fn();
  const setCartCount = vi.fn();

  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user, cartCount, isLoading: false, login, logout, setCartCount }}>
        <NavBar />
      </AuthContext.Provider>
    </MemoryRouter>,
  );

  return { logout };
}

describe('NavBar', () => {
  it('renders all nav links when logged out', () => {
    renderNavBar();

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /categories/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cart/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });

  it('shows Login link when user is null', () => {
    renderNavBar({ user: null });

    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });

  it("shows user's displayName and Logout button when logged in", () => {
    const user: User = { id: '1', email: 'test@example.com', displayName: 'Alice', role: 'user' };
    renderNavBar({ user });

    expect(screen.getByTestId('display-name')).toHaveTextContent('Alice');
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
  });

  it('shows cart badge with count when cartCount > 0', () => {
    renderNavBar({ cartCount: 3 });

    expect(screen.getByTestId('cart-badge')).toHaveTextContent('3');
  });

  it('does not show cart badge when cartCount is 0', () => {
    renderNavBar({ cartCount: 0 });

    expect(screen.queryByTestId('cart-badge')).not.toBeInTheDocument();
  });
});
