import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import CartPage from '../pages/CartPage';
import api from '../api/axios';
import { vi, Mock } from 'vitest';

vi.mock('../api/axios');

describe('CartPage', () => {
  const setCartCountMock = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  function renderCartPage(user = null) {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: null, cartCount: 0, isLoading: false, login: vi.fn(), logout: vi.fn(), setCartCount: setCartCountMock }}>
          <CartPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }

  it('renders guest prompt when not logged in', async () => {
    renderCartPage(null);
    expect(await screen.findByText(/Log in/i)).toBeInTheDocument();
  });

  it('loads cart from sessionStorage for guest', async () => {
    sessionStorage.setItem('guestCart', JSON.stringify([
      { productId: '1', name: 'Test Product', price: '10.00', quantity: 2 }
    ]));
    
    renderCartPage(null);
    
    expect(await screen.findByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Total: $20.00')).toBeInTheDocument();
    expect(setCartCountMock).toHaveBeenCalledWith(2);
  });

  it('loads cart from api for authenticated user', async () => {
    (api.get as Mock).mockResolvedValueOnce({
      data: { items: [{ productId: '2', name: 'User Product', price: '15.00', quantity: 1 }] }
    });

    renderCartPage({ id: '1', email: 'test@example.com', displayName: 'User', role: 'user' } as any);

    expect(await screen.findByText('User Product')).toBeInTheDocument();
    expect(screen.queryByText(/Log in/i)).not.toBeInTheDocument();
    expect(screen.getByText('Total: $15.00')).toBeInTheDocument();
    expect(setCartCountMock).toHaveBeenCalledWith(1);
  });

  it('updates quantity and recalculates total (guest)', async () => {
    sessionStorage.setItem('guestCart', JSON.stringify([
      { productId: '1', name: 'Test Product', price: '10.00', quantity: 1 }
    ]));
    
    renderCartPage(null);
    
    expect(await screen.findByText('Total: $10.00')).toBeInTheDocument();
    
    const increaseBtn = screen.getByRole('button', { name: '+' });
    await userEvent.click(increaseBtn);

    expect(await screen.findByText('Total: $20.00')).toBeInTheDocument();
    
    vi.advanceTimersByTime(2500);

    const updatedStorage = JSON.parse(sessionStorage.getItem('guestCart') || '[]');
    expect(updatedStorage[0].quantity).toBe(2);
  });

  it('updates quantity and syncs to API via debounce (auth)', async () => {
    (api.get as Mock).mockResolvedValueOnce({
      data: { items: [{ productId: '2', name: 'User Product', price: '15.00', quantity: 1 }] }
    });
    (api.put as Mock).mockResolvedValueOnce({});

    renderCartPage({ id: '1', email: 'test@example.com', displayName: 'User', role: 'user' } as any);
    
    expect(await screen.findByText('Total: $15.00')).toBeInTheDocument();
    
    const increaseBtn = screen.getByRole('button', { name: '+' });
    await userEvent.click(increaseBtn);

    expect(await screen.findByText('Total: $30.00')).toBeInTheDocument();
    
    expect(api.put).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2500);
    expect(api.put).toHaveBeenCalledWith('/api/cart/items/2', { quantity: 2 });
  });

  it('removes item from cart', async () => {
    sessionStorage.setItem('guestCart', JSON.stringify([
      { productId: '1', name: 'Test Product', price: '10.00', quantity: 1 }
    ]));
    
    renderCartPage(null);
    
    expect(await screen.findByText('Test Product')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: 'Remove' });
    await userEvent.click(removeBtn);

    expect(screen.queryByText('Test Product')).not.toBeInTheDocument();
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();

    const updatedStorage = JSON.parse(sessionStorage.getItem('guestCart') || '[]');
    expect(updatedStorage.length).toBe(0);
  });
});
