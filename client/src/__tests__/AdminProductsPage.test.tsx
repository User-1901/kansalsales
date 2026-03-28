import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import api from '../api/axios';

vi.mock('../api/axios');

describe('AdminProductsPage', () => {
  const mockCategories = [{ id: 'c1', name: 'Electronics' }];
  const mockProducts = [{
    id: 'p1',
    name: 'Laptop',
    description: 'A fast laptop',
    price: '999.99',
    stock_status: 'in_stock',
    category_id: 'c1',
    image_urls: ['http://example.com/lap.jpg']
  }];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/categories') return Promise.resolve({ data: mockCategories });
      if (url === '/api/products') return Promise.resolve({ data: mockProducts });
      return Promise.reject(new Error('not found'));
    });
  });

  function renderPage() {
    render(
      <MemoryRouter>
        <AdminProductsPage />
      </MemoryRouter>
    );
  }

  it('renders products and categories', async () => {
    renderPage();
    expect(await screen.findByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText('$999.99')).toBeInTheDocument();
  });

  it('adds a new product', async () => {
    renderPage();
    await screen.findByText('Laptop');
    
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} });
    
    // Form is ready
    await userEvent.type(screen.getByLabelText('Name'), 'Phone');
    await userEvent.type(screen.getByLabelText('Price'), '499.99');
    await userEvent.type(screen.getByLabelText('Image URLs (comma separated)'), 'http://img.com');
    
    await userEvent.click(screen.getByRole('button', { name: 'Add Product' }));
    
    expect(api.post).toHaveBeenCalledWith('/api/products', {
      name: 'Phone',
      description: '',
      price: '499.99',
      categoryId: null,
      stockStatus: 'in_stock',
      imageUrls: ['http://img.com']
    });
  });

  it('loads product into form for editing and confirms update', async () => {
    renderPage();
    await screen.findByText('Laptop');
    
    const editBtn = screen.getByRole('button', { name: 'Edit' });
    await userEvent.click(editBtn);
    
    expect(screen.getByRole('heading', { name: 'Edit Product' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Laptop');
    
    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.type(screen.getByLabelText('Name'), 'Gaming Laptop');
    
    vi.mocked(api.put).mockResolvedValueOnce({ data: {} });
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    
    // Context dialog confirmation
    expect(screen.getByText('Are you sure you want to save changes to "Gaming Laptop"?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    
    expect(api.put).toHaveBeenCalledWith('/api/products/p1', expect.objectContaining({ name: 'Gaming Laptop' }));
  });

  it('deletes a product after confirmation', async () => {
    renderPage();
    await screen.findByText('Laptop');
    
    const deleteBtn = screen.getByRole('button', { name: 'Delete' });
    await userEvent.click(deleteBtn);
    
    expect(screen.getByText('Are you sure you want to delete product "Laptop"?')).toBeInTheDocument();
    
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    
    expect(api.delete).toHaveBeenCalledWith('/api/products/p1');
  });
});
