import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage';
import api from '../api/axios';

vi.mock('../api/axios');

describe('LoginPage', () => {
  const loginMock = vi.fn();
  const setCartCountMock = vi.fn();
  const logoutMock = vi.fn();

  function renderLoginPage() {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{
          user: null,
          cartCount: 0,
          isLoading: false,
          login: loginMock,
          logout: logoutMock,
          setCartCount: setCartCountMock
        }}>
          <LoginPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderLoginPage();
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error on empty submission', async () => {
    renderLoginPage();
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitBtn);

    expect(screen.getByText('Email and password are required.')).toBeInTheDocument();
  });

  it('calls api and logs in on success', async () => {
    renderLoginPage();
    
    vi.mocked(api.post).mockResolvedValueOnce({ data: { user: { id: '1', displayName: 'Test', email: 'test@example.com', role: 'user' } } } as any);

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    expect(loginMock).toHaveBeenCalledWith({ id: '1', displayName: 'Test', email: 'test@example.com', role: 'user' });
  });

  it('shows error on failure', async () => {
    renderLoginPage();
    
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } }
    });

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });
});
