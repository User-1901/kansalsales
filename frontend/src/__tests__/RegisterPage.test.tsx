import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
import api from '../api/axios';

vi.mock('../api/axios');

describe('RegisterPage', () => {
  function renderRegisterPage() {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders register form', () => {
    renderRegisterPage();
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation errors for invalid/empty inputs', async () => {
    renderRegisterPage();
    
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('A valid email address is required.')).toBeInTheDocument();
    expect(screen.getByText('Display name is required.')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
  });

  it('submits successfully and shows success message', async () => {
    renderRegisterPage();
    
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} } as any);

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/display name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(api.post).toHaveBeenCalledWith('/api/auth/register', {
      email: 'test@example.com',
      displayName: 'Test User',
      password: 'password123'
    });

    expect(await screen.findByText('Registration Successful!')).toBeInTheDocument();
  });

  it('handles duplicate email (409) conflict', async () => {
    renderRegisterPage();
    
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { status: 409, data: {} }
    });

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/display name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('This email is already registered.')).toBeInTheDocument();
  });
});
