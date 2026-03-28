import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ContactPage from '../pages/ContactPage';
import api from '../api/axios';

vi.mock('../api/axios');

describe('ContactPage', () => {
  function renderContactPage() {
    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders contact form and Telegram link with correct attributes', () => {
    renderContactPage();
    
    expect(screen.getByRole('heading', { name: /contact us/i })).toBeInTheDocument();
    
    const telegramLink = screen.getByRole('link', { name: /join our telegram community/i });
    expect(telegramLink).toBeInTheDocument();
    expect(telegramLink).toHaveAttribute('href', 'https://t.me/+CTrROqUmKkM4MTJl');
    expect(telegramLink).toHaveAttribute('target', '_blank');
    expect(telegramLink).toHaveAttribute('rel', 'noopener noreferrer');

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty/invalid fields', async () => {
    renderContactPage();
    
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('A valid email address is required.')).toBeInTheDocument();
    expect(screen.getByText('Message is required.')).toBeInTheDocument();
  });

  it('submits successfully and shows confirmation message', async () => {
    renderContactPage();
    
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} } as any);

    await userEvent.type(screen.getByLabelText(/your name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/message/i), 'Hello world!');

    await userEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(api.post).toHaveBeenCalledWith('/api/contact', {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello world!'
    });

    expect(await screen.findByText('Your message has been sent. We will get back to you soon.')).toBeInTheDocument();
  });
});
