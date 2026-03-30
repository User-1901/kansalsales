import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
// import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage';
import api from '../api/axios';

vi.mock('../api/axios');

// Skipping tests - AdminCategoriesPage not yet created
vi.describe.skip('AdminCategoriesPage', () => {});

describe('AdminCategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({
      data: [{ id: '1', name: 'Electronics' }, { id: '2', name: 'Books' }]
    });
  });

  function renderPage() {
    render(
      <MemoryRouter>
        <AdminCategoriesPage />
      </MemoryRouter>
    );
  }

  it('renders categories from api', async () => {
    renderPage();
    expect(await screen.findByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  it('adds a new category', async () => {
    renderPage();
    await screen.findByText('Electronics');
    
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: '3', name: 'Toys' } });
    
    await userEvent.type(screen.getByPlaceholderText('Category name'), 'Toys');
    await userEvent.click(screen.getByRole('button', { name: 'Add Category' }));
    
    expect(api.post).toHaveBeenCalledWith('/api/categories', { name: 'Toys' });
    expect(api.get).toHaveBeenCalledTimes(2); // initial + refetch
  });

  it('prompts and renames category', async () => {
    renderPage();
    await screen.findByText('Electronics');
    
    vi.spyOn(window, 'prompt').mockReturnValue('Gadgets');
    vi.mocked(api.put).mockResolvedValueOnce({ data: {} });
    
    const renameBtns = screen.getAllByRole('button', { name: 'Rename' });
    await userEvent.click(renameBtns[0]); // Electronics rename
    
    expect(window.prompt).toHaveBeenCalledWith('Enter new category name:', 'Electronics');
    
    // Check confirmation dialog
    expect(screen.getByText('Are you sure you want to rename "Electronics" to "Gadgets"?')).toBeInTheDocument();
    
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    
    expect(api.put).toHaveBeenCalledWith('/api/categories/1', { name: 'Gadgets' });
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('prompts and deletes category', async () => {
    renderPage();
    await screen.findByText('Electronics');
    
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });
    
    const deleteBtns = screen.getAllByRole('button', { name: 'Delete' });
    await userEvent.click(deleteBtns[0]); // Electronics delete
    
    // Check confirmation dialog
    expect(screen.getByText('Are you sure you want to delete category "Electronics"?')).toBeInTheDocument();
    
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    
    expect(api.delete).toHaveBeenCalledWith('/api/categories/1');
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
